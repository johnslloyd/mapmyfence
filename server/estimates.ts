import { db } from "./db";
import { products } from "@shared/schema";
import { inArray } from "drizzle-orm";

const POST_SPACING = 8; // feet

// Avoid floating-point cents (e.g. 4.48 * 208 = 931.8400000000001).
const toCents = (n: number) => Math.round(n * 100) / 100;

// Material types required to build a standard picket fence, and how many
// of each a given number of 8-ft sections needs.
const REQUIRED_TYPES = ["post", "concrete", "rail", "picket"] as const;

function quantitiesFor(totalLength: number) {
  const numSections = Math.ceil(totalLength / POST_SPACING);
  return {
    post: numSections + 1,
    concrete: numSections + 1, // one bag per post
    rail: numSections * 3,
    picket: numSections * 16,
  };
}

// A homeowner shops at ONE store, not a mix — so this returns one
// complete, independently-priced option PER STORE (that store's own
// cheapest post/rail/picket/concrete), not a single cherry-picked-cheapest
// list spanning stores. A store is only included if it has pricing for
// every required type; a store missing even one type can't fulfill the
// list, so it's silently excluded rather than shown incomplete. Sorted
// cheapest-total-first.
export async function calculateEstimate(totalLength: number) {
  const quantities = quantitiesFor(totalLength);

  const allProducts = await db
    .select()
    .from(products)
    .where(inArray(products.type, REQUIRED_TYPES));

  const byStore = new Map<string, typeof allProducts>();
  for (const product of allProducts) {
    if (!byStore.has(product.store)) byStore.set(product.store, []);
    byStore.get(product.store)!.push(product);
  }

  const options = Array.from(byStore.entries())
    .map(([store, storeProducts]) => {
      // Within this one store, still use the cheapest listing per type
      // (a store can carry more than one product for the same type).
      const cheapestByType = new Map<string, (typeof storeProducts)[number]>();
      for (const type of REQUIRED_TYPES) {
        const candidates = storeProducts.filter((p) => p.type === type);
        if (candidates.length === 0) continue;
        const cheapest = candidates.reduce((a, b) => (b.price < a.price ? b : a));
        cheapestByType.set(type, cheapest);
      }

      const missingTypes = REQUIRED_TYPES.filter((type) => !cheapestByType.has(type));
      if (missingTypes.length > 0) return null; // this store can't fulfill the full list

      const materials = REQUIRED_TYPES.map((type) => {
        const product = cheapestByType.get(type)!;
        const quantity = quantities[type];
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
      });

      const totalCost = toCents(materials.reduce((sum, m) => sum + m.totalCost, 0));

      return { store, materials, totalCost };
    })
    .filter((option): option is NonNullable<typeof option> => option !== null)
    .sort((a, b) => a.totalCost - b.totalCost);

  if (options.length === 0) {
    throw new Error(
      `No store has product data for all required types (${REQUIRED_TYPES.join(", ")}). Run 'npm run db:seed' or add products for these types.`,
    );
  }

  return { options };
}
