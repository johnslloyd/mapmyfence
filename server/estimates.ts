import { db } from "./db";
import { products } from "@shared/schema";
import { inArray } from "drizzle-orm";

const POST_SPACING = 8; // feet

// Avoid floating-point cents (e.g. 4.48 * 208 = 931.8400000000001).
const toCents = (n: number) => Math.round(n * 100) / 100;

// Types needed regardless of which wood species the pickets are — the
// structural framing (posts, rails, concrete) and fasteners are the same
// pressure-treated commodity lumber either way. Picket is handled
// separately below since IT is species-specific.
const SHARED_TYPES = ["post", "concrete", "rail", "fasteners"] as const;

function sectionsFor(length: number) {
  return Math.ceil(length / POST_SPACING);
}

function sharedQuantitiesFor(totalLength: number) {
  const numSections = sectionsFor(totalLength);
  return {
    post: numSections + 1,
    concrete: numSections + 1, // one bag per post
    rail: numSections * 3,
    // ~300-350 exterior wood screws per box (both seeded products are in
    // that range) is enough for roughly 3 sections (~24 linear ft) of
    // picket-to-rail and rail-to-post fastening — a rule-of-thumb
    // coverage estimate, same spirit as "one bag of concrete per post".
    fasteners: Math.ceil(numSections / 3),
  };
}

function picketQuantityFor(length: number) {
  return sectionsFor(length) * 16;
}

type Species = "pine" | "cedar";

// Any fence line whose material mentions "pine" prices as pine; every
// other value (cedar, legacy free-text like "wood" or "Cedar", or a
// material this app doesn't price yet like vinyl/iron) falls back to the
// cedar picket pricing — the same generic-wood-fence simplification this
// app has always made, just now made explicit per line instead of
// applying uniformly to the whole project. Vinyl/iron are NOT actually
// priced as cedar wood in any real sense; this is a placeholder, not a
// claim about their true material.
function speciesFor(material: string | null | undefined): Species {
  if (material && /pine/i.test(material)) return "pine";
  return "cedar";
}

type Product = typeof products.$inferSelect;

function materialLine(product: Product, quantity: number) {
  const totalCost = toCents(product.price * quantity);
  return {
    id: product.id,
    name: product.name,
    type: product.type,
    store: product.store,
    price: product.price,
    unit: product.unit,
    url: product.url,
    sku: product.sku,
    quantity,
    totalCost,
  };
}

// A homeowner shops at ONE store, not a mix — so this returns one
// complete, independently-priced option PER STORE (that store's own
// cheapest post/rail/concrete/fasteners, and its own pine and/or cedar
// picket depending on what the project's lines actually use), not a
// single cherry-picked-cheapest list spanning stores. A store is only
// included if it has pricing for every required type AND every wood
// species this project's lines actually use — missing any one of those
// means it can't fulfill the full list, so it's silently excluded rather
// than shown incomplete. Sorted cheapest-total-first.
export async function calculateEstimate(
  lines: { length: number; material: string | null }[],
) {
  const totalLength = lines.reduce((sum, l) => sum + (l.length || 0), 0);
  const shared = sharedQuantitiesFor(totalLength);

  // How much length is in each wood species — a project can mix pine and
  // cedar lines, and each needs its own picket quantity/product.
  const lengthBySpecies = new Map<Species, number>();
  for (const line of lines) {
    const species = speciesFor(line.material);
    lengthBySpecies.set(species, (lengthBySpecies.get(species) || 0) + (line.length || 0));
  }

  const allProducts = await db
    .select()
    .from(products)
    .where(inArray(products.type, [...SHARED_TYPES, "picket"]));

  const byStore = new Map<string, Product[]>();
  for (const product of allProducts) {
    if (!byStore.has(product.store)) byStore.set(product.store, []);
    byStore.get(product.store)!.push(product);
  }

  const options = Array.from(byStore.entries())
    .map(([store, storeProducts]) => {
      // Shared framing types — cheapest listing per type, within this store.
      const cheapestShared = new Map<string, Product>();
      for (const type of SHARED_TYPES) {
        const candidates = storeProducts.filter((p) => p.type === type);
        if (candidates.length === 0) continue;
        cheapestShared.set(type, candidates.reduce((a, b) => (b.price < a.price ? b : a)));
      }
      const missingShared = SHARED_TYPES.filter((type) => !cheapestShared.has(type));
      if (missingShared.length > 0) return null; // can't fulfill the full list here

      // Species-specific pickets — this store needs a priced picket for
      // EVERY species this project's lines actually use.
      const cheapestPicketBySpecies = new Map<Species, Product>();
      for (const species of Array.from(lengthBySpecies.keys())) {
        const candidates = storeProducts.filter((p) => p.type === "picket" && p.material === species);
        if (candidates.length === 0) return null; // can't price this species here
        cheapestPicketBySpecies.set(species, candidates.reduce((a, b) => (b.price < a.price ? b : a)));
      }

      const materials = [
        ...SHARED_TYPES.map((type) => materialLine(cheapestShared.get(type)!, shared[type])),
        ...Array.from(lengthBySpecies.entries()).map(([species, speciesLength]) =>
          materialLine(cheapestPicketBySpecies.get(species)!, picketQuantityFor(speciesLength)),
        ),
      ];

      const totalCost = toCents(materials.reduce((sum, m) => sum + m.totalCost, 0));

      return { store, materials, totalCost };
    })
    .filter((option): option is NonNullable<typeof option> => option !== null)
    .sort((a, b) => a.totalCost - b.totalCost);

  if (options.length === 0) {
    const neededTypes = [...SHARED_TYPES, ...Array.from(lengthBySpecies.keys()).map((s) => `picket (${s})`)];
    throw new Error(
      `No store has product data for all required types (${neededTypes.join(", ")}). Run 'npm run db:seed' or add products for these types.`,
    );
  }

  return { options };
}
