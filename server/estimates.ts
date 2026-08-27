import { db } from "./db";
import { products } from "@shared/schema";
import { asc, eq } from "drizzle-orm";

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

export async function calculateEstimate(totalLength: number) {
  const quantities = quantitiesFor(totalLength);

  // For each required type, use the cheapest product currently on file.
  // (Multiple stores can carry the same type — see products table.)
  const cheapestByType = await Promise.all(
    REQUIRED_TYPES.map((type) =>
      db
        .select()
        .from(products)
        .where(eq(products.type, type))
        .orderBy(asc(products.price))
        .limit(1)
        .then((rows) => rows[0]),
    ),
  );

  const missingTypes = REQUIRED_TYPES.filter((_, i) => !cheapestByType[i]);
  if (missingTypes.length > 0) {
    throw new Error(
      `No product data available for: ${missingTypes.join(", ")}. Run 'npm run db:seed' or add products for these types.`,
    );
  }

  const materials = REQUIRED_TYPES.map((type, i) => {
    const product = cheapestByType[i]!;
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

  return { materials, totalCost };
}
