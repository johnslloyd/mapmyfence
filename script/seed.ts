import "dotenv/config";
import { db } from "../server/db";
import { products } from "../shared/schema";

async function main() {
  console.log("Seeding database...");

  await db.delete(products);

  // NOTE on picket/rail: the previous entries both used a placeholder
  // sku/URL of literally "1000" — never swapped for a real product page,
  // which is why the picket link resolved to an unrelated product (a
  // light switch) instead of a fence picket. Replaced below with the
  // closest-matching live listing found via web search. IMPORTANT: Lowe's
  // blocks both this app's web-fetch tool and its browser tool (bot
  // protection returns 403 / "Access Denied"), the same way Shelby County
  // TN's GIS site blocks us with Cloudflare — so unlike the rest of this
  // seed file, these two entries were NOT verified by loading the actual
  // page and confirming the product/price. They're a best-effort match on
  // product title/spec from search results only. Spot-check both before
  // trusting the price, and swap in a directly-copied URL if you have one.
  const sampleProducts = [
    {
      name: "5/8-in x 5-1/2-in x 6-ft Western Red Cedar Dog Ear Fence Picket",
      type: "picket",
      store: "lowes" as const,
      price: 4.48,
      unit: "per picket",
      url: "https://www.lowes.com/pd/5-8-in-x-5-1-2-in-x-6-ft-Western-Red-Cedar-Dog-Ear-Fence-Picket/5002727165",
      sku: "5002727165",
    },
    {
      name: "2-in x 4-in x 8-ft #2 Prime Ground Contact Wood Pressure Treated Lumber",
      type: "rail",
      store: "lowes" as const,
      price: 6.98,
      unit: "per 8-ft rail",
      url: "https://www.lowes.com/pd/Severe-Weather-2-4-8-TC-TREATED-2-PRIME/5014119401",
      sku: "5014119401",
    },
    {
      name: "4-in x 4-in x 8-ft #2 Ground Contact Wood Pressure Treated Post",
      type: "post",
      store: "lowes" as const,
      price: 13.98,
      unit: "per post",
      url: "https://www.lowes.com/pd/Common-4-in-x-4-in-x-8-ft-Actual-3-5-in-x-3-5-in-x-8-ft-2-Ground-Contact-Wood-Pressure-Treated-Post/1000049931",
      sku: "1000049931",
    },
    {
      name: "QUIKRETE 50-lb Fast Setting Concrete Mix",
      type: "concrete",
      store: "lowes" as const,
      price: 7.28,
      unit: "per bag",
      url: "https://www.lowes.com/pd/QUIKRETE-50-lb-Fast-Setting-Concrete-Mix/3057343",
      sku: "3057343",
    },
    {
        name: "4-ft Black Steel Fence Gate",
        type: "gate",
        store: "lowes" as const,
        price: 124.00,
        unit: "per gate",
        url: "https://www.lowes.com/pd/YARDLINK-4-ft-Black-Steel-Fence-Gate/1000371193",
        sku: "1000371193",
    }
  ];

  await db.insert(products).values(sampleProducts);

  console.log("Database seeded successfully!");
  process.exit(0);
}

main().catch((error) => {
  console.error("Error seeding database:", error);
  process.exit(1);
});