import "dotenv/config";
import { db } from "../server/db";
import { products } from "../shared/schema";

async function main() {
  console.log("Seeding database...");

  await db.delete(products);

  const sampleProducts = [
    {
      name: "5/8-in x 5-1/2-in x 6-ft Western Red Cedar Dog Ear Fence Picket",
      type: "picket",
      store: "lowes" as const,
      price: 4.48,
      unit: "per picket",
      url: "https://www.lowes.com/pd/Severe-Weather-Common-5-8-in-x-5-1-2-in-x-6-ft-Actual-5-8-in-x-5-1-2-in-x-6-ft-Western-Red-Cedar-Dog-Ear-Fence-Picket/1000",
      sku: "1000",
    },
    {
      name: "2-in x 4-in x 8-ft #2 Prime Ground Contact Wood Pressure Treated Lumber",
      type: "rail",
      store: "lowes" as const,
      price: 6.98,
      unit: "per 8-ft rail",
      url: "https://www.lowes.com/pd/2-in-x-4-in-x-8-ft-2-Prime-Ground-Contact-Wood-Pressure-Treated-Lumber/1000",
      sku: "1000",
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