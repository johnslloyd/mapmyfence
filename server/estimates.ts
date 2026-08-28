import { db } from "./db";
import { products } from "@shared/schema";
import { inArray } from "drizzle-orm";

const POST_SPACING = 8; // feet

// Avoid floating-point cents (e.g. 4.48 * 208 = 931.8400000000001).
const toCents = (n: number) => Math.round(n * 100) / 100;

type Species = "pine" | "cedar";
type HeightCategory = 6 | 8;

// Real-world construction guidance: privacy fences taller than 6 ft
// typically get a 4th horizontal rail for structural support, not just
// 3. The rail board itself doesn't change length with height — only how
// many are needed per section.
const RAILS_PER_SECTION: Record<HeightCategory, number> = { 6: 3, 8: 4 };

function sectionsFor(length: number) {
  return Math.ceil(length / POST_SPACING);
}

// Any material mentioning "pine" prices as pine; every other value
// (cedar, legacy free-text like "wood" or "Cedar", or a material this
// app doesn't price yet like vinyl/iron) falls back to cedar pricing —
// the same generic-wood-fence simplification this app has always made,
// just resolved per line now. NOT a claim that vinyl/iron "is cedar".
function speciesFor(material: string | null | undefined): Species {
  if (material && /pine/i.test(material)) return "pine";
  return "cedar";
}

// Anything 7ft or taller prices as the 8-ft category (the only "tall"
// category this app has real product data for); everything else,
// including legacy/undefined heights, falls back to 6-ft — same
// graceful-fallback spirit as speciesFor.
function heightCategoryFor(height: number | null | undefined): HeightCategory {
  return height && height >= 7 ? 8 : 6;
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
// complete, independently-priced option PER STORE, not a single
// cherry-picked-cheapest list spanning stores. Lines are grouped by
// (species, height) — post and picket are both species- AND
// height-specific products (a 6-ft post isn't long enough to bury for
// an 8-ft fence; 8-ft pickets are a different product than 6-ft ones),
// so each group needs its own matching post/picket. Rail is
// species-specific but not height-specific (same 8-ft board either
// way; only the per-section quantity changes with height). Concrete
// and fasteners are fully shared — no species or height variant exists
// for hardware/consumables. A store is only offered as an option if it
// can price EVERY group's post/picket, the rail for every species used,
// and both shared types — missing any one of those means it can't
// fulfill the full list. Sorted cheapest-total-first.
export async function calculateEstimate(
  lines: { length: number; material: string | null; height: number | null }[],
) {
  type Group = { species: Species; height: HeightCategory; length: number };
  const groups = new Map<string, Group>();
  const speciesUsed = new Set<Species>();
  for (const line of lines) {
    const species = speciesFor(line.material);
    const height = heightCategoryFor(line.height);
    speciesUsed.add(species);
    const key = `${species}-${height}`;
    const existing = groups.get(key);
    if (existing) {
      existing.length += line.length || 0;
    } else {
      groups.set(key, { species, height, length: line.length || 0 });
    }
  }
  const groupList = Array.from(groups.values());

  const allProducts = await db
    .select()
    .from(products)
    .where(inArray(products.type, ["post", "rail", "picket", "concrete", "fasteners"]));

  const byStore = new Map<string, Product[]>();
  for (const product of allProducts) {
    if (!byStore.has(product.store)) byStore.set(product.store, []);
    byStore.get(product.store)!.push(product);
  }

  const cheapest = (candidates: Product[]) =>
    candidates.length === 0 ? null : candidates.reduce((a, b) => (b.price < a.price ? b : a));

  const options = Array.from(byStore.entries())
    .map(([store, storeProducts]) => {
      // Shared, quantity-only types (no species/height variant).
      const concrete = cheapest(storeProducts.filter((p) => p.type === "concrete"));
      const fasteners = cheapest(storeProducts.filter((p) => p.type === "fasteners"));
      if (!concrete || !fasteners) return null;

      // Rail — species-specific, one per species actually used.
      const railBySpecies = new Map<Species, Product>();
      for (const species of Array.from(speciesUsed)) {
        const rail = cheapest(storeProducts.filter((p) => p.type === "rail" && p.material === species));
        if (!rail) return null; // can't rail this species here
        railBySpecies.set(species, rail);
      }

      // Post + picket — species AND height specific, one pair per group.
      const postByGroup = new Map<string, Product>();
      const picketByGroup = new Map<string, Product>();
      for (const group of groupList) {
        const key = `${group.species}-${group.height}`;
        const post = cheapest(
          storeProducts.filter((p) => p.type === "post" && p.material === group.species && p.forHeight === group.height),
        );
        const picket = cheapest(
          storeProducts.filter((p) => p.type === "picket" && p.material === group.species && p.forHeight === group.height),
        );
        if (!post || !picket) return null; // can't fulfill this species+height combo here
        postByGroup.set(key, post);
        picketByGroup.set(key, picket);
      }

      // Quantities.
      let totalConcreteQty = 0;
      let totalFastenerSections = 0;
      const materials: ReturnType<typeof materialLine>[] = [];

      for (const group of groupList) {
        const key = `${group.species}-${group.height}`;
        const sections = sectionsFor(group.length);
        const postQty = sections + 1;
        const picketQty = sections * 16;
        const railQty = sections * RAILS_PER_SECTION[group.height];

        totalConcreteQty += postQty; // one bag per post
        totalFastenerSections += sections;

        materials.push(materialLine(postByGroup.get(key)!, postQty));
        materials.push(materialLine(picketByGroup.get(key)!, picketQty));
        materials.push(materialLine(railBySpecies.get(group.species)!, railQty));
      }

      materials.push(materialLine(concrete, totalConcreteQty));
      materials.push(materialLine(fasteners, Math.ceil(totalFastenerSections / 3)));

      const totalCost = toCents(materials.reduce((sum, m) => sum + m.totalCost, 0));

      return { store, materials, totalCost };
    })
    .filter((option): option is NonNullable<typeof option> => option !== null)
    .sort((a, b) => a.totalCost - b.totalCost);

  if (options.length === 0) {
    const combos = groupList.map((g) => `${g.species} picket/post at ${g.height}ft`).join(", ");
    throw new Error(
      `No store has product data for every required combination (${combos}, plus rail per species and shared concrete/fasteners). Run 'npm run db:seed' or add products for these.`,
    );
  }

  return { options };
}
