import "dotenv/config";
import { db } from "../server/db";
import { products } from "../shared/schema";

async function main() {
  console.log("Seeding database...");

  await db.delete(products);

  // All nine entries below were verified LIVE on 2026-08-27/28 — loaded the
  // actual product page (both Lowe's and Home Depot's bot protection let
  // this app's browser tool through this session, unlike earlier attempts
  // this project's history that got 403/"Access Denied") and read the real
  // name, price, and stock status directly off the page. This replaces two
  // earlier rounds of guessing:
  //   - The original picket/rail/post/concrete/gate Lowe's entries were
  //     seeded with placeholder or unverified SKUs. Checking them live this
  //     time found post (1000049931) resolved to a light switch, gate
  //     (1000371193) to an area rug, and concrete (3057343) to a cabinet
  //     hardware knob — three more broken links than were ever caught
  //     before, on top of the picket/rail bug fixed earlier. The old
  //     picket/rail entries themselves turned out to be the RIGHT product
  //     but no longer sold / temporarily out of stock — swapped for
  //     in-stock equivalents rather than left pointing at dead listings.
  //   - The Home Depot entries added for cross-retailer pricing were
  //     best-effort from search snippets (Home Depot blocked direct access
  //     at the time). Re-checked live now: picket/rail/post were already
  //     correct (prices adjusted to the exact live figures), but concrete
  //     (313478684) was a dead product ID — fixed to the real one.
  // Prices are each product's standard listed price, not a temporary sale
  // price (e.g. Lowe's concrete showed a $7.17 promo through Sep 9 off a
  // $7.97 regular price — used $7.97). Checked from a Memphis, TN store
  // context, this project's usual test region — pricing can vary by
  // location. Still worth a periodic spot-check; retailers change/
  // discontinue SKUs regularly, which is exactly what broke the old data.
  // Picket rows are tagged by wood species (material: "pine" | "cedar") —
  // calculateEstimate picks the right one per fence line. Post/rail/
  // concrete/fasteners are the same pressure-treated commodity lumber
  // regardless of picket species, so they're left untagged (material:
  // null) and shared across both. Pine and fasteners entries verified
  // live the same way as the rest of this file (see note above) —
  // Lowe's/Home Depot's own site search, then the actual product page
  // loaded and read directly, from the same Memphis, TN store context.
  const sampleProducts = [
    {
      name: "5/8-in x 5-1/2-in x 6-ft Unfinished Cedar Dog Ear Fence Picket",
      type: "picket",
      store: "lowes" as const,
      price: 3.58,
      unit: "per picket",
      url: "https://www.lowes.com/pd/Severe-Weather-Common-5-8-in-x-5-1-2-in-x-6-ft-Actual-0-625-in-x-5-5-in-x-6-ft-Cedar-Dog-Ear-Wood-Fence-Picket/3556636",
      sku: "3556636",
      material: "cedar" as const,
    },
    {
      name: "5/8-in x 5-1/2-in x 6-ft Pressure Treated Southern Yellow Pine Dog Ear Fence Picket",
      type: "picket",
      store: "lowes" as const,
      price: 2.18,
      unit: "per picket",
      url: "https://www.lowes.com/pd/Severe-Weather-5-8-in-x-5-1-2-in-x-6-ft-Pressure-Treated-Southern-Yellow-Pine-Dog-Ear-Fence-Picket/5013086547",
      sku: "5013086547",
      material: "pine" as const,
    },
    {
      name: "Deck Plus #10 x 3-in Wood to Wood Deck Screws (310-Per Box)",
      type: "fasteners",
      store: "lowes" as const,
      price: 29.98,
      unit: "per box (~310 screws)",
      url: "https://www.lowes.com/pd/Deck-Plus-10-x-3-in-Ceramic-Deck-Screws-5-lb/1000318525",
      sku: "1000318525",
    },
    {
      name: "2-in x 4-in x 8-ft #2 Prime Above Ground Pressure Treated Southern Yellow Pine Lumber",
      type: "rail",
      store: "lowes" as const,
      price: 4.68,
      unit: "per 8-ft rail",
      url: "https://www.lowes.com/pd/Severe-Weather-Common-2-in-x-4-in-x-8-ft-Actual-1-5-in-x-3-5-in-x-8-ft-2-Prime-Treated-Lumber/4564608",
      sku: "4564608",
    },
    {
      name: "4-in x 4-in x 8-ft #2 Ground Contact Pressure Treated Southern Yellow Pine Post",
      type: "post",
      store: "lowes" as const,
      price: 10.48,
      unit: "per post",
      url: "https://www.lowes.com/pd/Severe-Weather-Common-4-in-x-4-in-x-8-ft-Actual-3-5-in-x-3-5-in-x-8-ft-2-Treated-Lumber/50121083",
      sku: "50121083",
    },
    {
      name: "Sakrete 50-lb Fast Setting Concrete Mix",
      type: "concrete",
      store: "lowes" as const,
      price: 7.97,
      unit: "per bag",
      url: "https://www.lowes.com/pd/Sakrete-50-lb-Fast-Setting-Concrete-Mix/3338802",
      sku: "3338802",
    },
    {
      name: "YARDLINK 4-ft H x 3-ft W Black Powder-Coated Steel No Dig Fence Gate",
      type: "gate",
      store: "lowes" as const,
      price: 58.98,
      unit: "per gate",
      url: "https://www.lowes.com/pd/No-Dig-Common-4-3-ft-x-1-63-ft-Actual-4-3-ft-x-1-63-ft-Black-Powder-Coated-Steel-Decorative-Metal-Fence-Gate/4744229",
      sku: "4744229",
    },
    {
      name: "Alta Forest Products 5/8-in x 5-1/2-in x 6-ft American Western Red Cedar Dog-Ear Fence Picket",
      type: "picket",
      store: "home_depot" as const,
      price: 4.28,
      unit: "per picket",
      url: "https://www.homedepot.com/p/Alta-Forest-Products-5-8-in-x-5-1-2-in-x-6-ft-American-Western-Red-Cedar-Dog-Ear-Fence-Picket-63023/205757688",
      sku: "63023",
      material: "cedar" as const,
    },
    {
      name: "5/8 in. x 5-1/2 in. x 6 ft. Pressure-Treated Pine Dog-Eared Wood Fence Picket",
      type: "picket",
      store: "home_depot" as const,
      price: 2.28,
      unit: "per picket",
      url: "https://www.homedepot.com/p/5-8-in-x-5-1-2-in-x-6-ft-Pressure-Treated-Pine-Dog-Eared-Wood-Fence-Picket-102560/202319053",
      sku: "202319053",
      material: "pine" as const,
    },
    {
      name: "Everbilt #10 x 3-in Star Drive Exterior Wood Screws (347-Piece Box)",
      type: "fasteners",
      store: "home_depot" as const,
      price: 45.96,
      unit: "per box (~347 screws)",
      url: "https://www.homedepot.com/p/Everbilt-10-x-3-in-Star-Drive-Flat-Head-Exterior-Wood-Screws-5-lbs-Box-347-Piece-117357/316219999",
      sku: "316219999",
    },
    {
      name: "WeatherShield 2-in x 4-in x 8-ft #2 Prime Ground Contact Pressure-Treated Southern Yellow Pine Lumber",
      type: "rail",
      store: "home_depot" as const,
      price: 4.78,
      unit: "per 8-ft rail",
      url: "https://www.homedepot.com/p/WeatherShield-2-in-x-4-in-x-8-ft-2-Prime-Ground-Contact-Pressure-Treated-Southern-Yellow-Pine-Lumber-291224/301836994",
      sku: "291224",
    },
    {
      name: "4-in x 4-in x 8-ft #2 Ground Contact Pressure-Treated Southern Yellow Pine Wood Post",
      type: "post",
      store: "home_depot" as const,
      price: 10.48,
      unit: "per post",
      url: "https://www.homedepot.com/p/4-in-x-4-in-x-8-ft-2-Ground-Contact-Pressure-Treated-Southern-Yellow-Pine-Wood-Post-194354/205220341",
      sku: "194354",
    },
    {
      name: "Quikrete 50-lb Fast-Setting Concrete Mix",
      type: "concrete",
      store: "home_depot" as const,
      price: 7.97,
      unit: "per bag",
      url: "https://www.homedepot.com/p/Quikrete-50-lb-Fast-Setting-Concrete-Mix-100450/100318521",
      sku: "100318521",
    },
  ];

  await db.insert(products).values(sampleProducts);

  console.log("Database seeded successfully!");
  process.exit(0);
}

main().catch((error) => {
  console.error("Error seeding database:", error);
  process.exit(1);
});
