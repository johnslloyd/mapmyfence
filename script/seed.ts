import "dotenv/config";
import { db } from "../server/db";
import { products } from "../shared/schema";

async function main() {
  console.log("Seeding database...");

  await db.delete(products);

  // Every entry below was verified LIVE — loaded the actual product page
  // (both Lowe's and Home Depot's bot protection have let this app's
  // browser tool through this session, unlike earlier attempts in this
  // project's history that got 403/"Access Denied") and read the real
  // name, price, and stock status directly off the page, from a Memphis,
  // TN store context (this project's usual test region). This has gone
  // through several rounds — a hardcoded price list, then real Lowe's
  // products (one entry, picket, had a placeholder sku/URL of literally
  // "1000" and resolved to a light switch), then Home Depot for
  // cross-retailer pricing, then a full re-check that found THREE MORE
  // broken Lowe's links nobody had caught (post → light switch, gate →
  // area rug, concrete → cabinet hardware) and one dead Home Depot
  // product ID. Bot-blocking has been inconsistent across sessions —
  // if a future check gets blocked again, say so explicitly rather than
  // silently falling back to guessed data; that inconsistency is exactly
  // what let this many links break unnoticed before.
  //
  // Full species x height matrix, added to make "Wood: Pine" vs
  // "Wood: Cedar" and 6-ft vs 8-ft height both genuinely affect pricing:
  //   - picket and post are tagged by BOTH material (pine|cedar) and
  //     forHeight (6|8) — a post long enough to bury for a 6-ft fence
  //     isn't long enough for an 8-ft one, and 8-ft pickets are a
  //     different (often thicker-profile) product, not just a longer
  //     6-ft one.
  //   - rail is tagged by material only — the horizontal 2x4x8 board
  //     itself doesn't change length with fence height, only how many
  //     are needed per section (see RAILS_PER_SECTION in
  //     server/estimates.ts).
  //   - concrete/fasteners/gate stay untagged — genuinely no species or
  //     height variant exists for hardware/consumables.
  // One real, honest gap found while sourcing this: Lowe's does not
  // stock a 10-ft CEDAR 4x4 post at all (checked twice, two different
  // search phrasings) — only 6-ft and 8-ft cedar 4x4 lengths exist
  // there. Home Depot does carry one. This is a genuine market
  // difference, not a data gap — calculateEstimate's existing
  // "only offer a store if it can fulfill everything" rule means Lowe's
  // is correctly excluded as an option for any project with an 8-ft
  // cedar line, while Home Depot still works.
  const sampleProducts = [
    // ---- Lowe's ----
    {
      name: "5/8-in x 5-1/2-in x 6-ft Unfinished Cedar Dog Ear Fence Picket",
      type: "picket",
      store: "lowes" as const,
      price: 3.58,
      unit: "per picket",
      url: "https://www.lowes.com/pd/Severe-Weather-Common-5-8-in-x-5-1-2-in-x-6-ft-Actual-0-625-in-x-5-5-in-x-6-ft-Cedar-Dog-Ear-Wood-Fence-Picket/3556636",
      sku: "3556636",
      material: "cedar" as const,
      forHeight: 6,
    },
    {
      name: "5/8-in x 6-in x 8-ft Unfinished Cedar Dog Ear Fence Picket",
      type: "picket",
      store: "lowes" as const,
      price: 5.78,
      unit: "per picket",
      url: "https://www.lowes.com/pd/Common-5-8-in-x-6-in-x-8-ft-Actual-0-625-in-x-5-5-in-x-8-ft-Cedar-Dog-Ear-Wood-Fence-Picket/1000179357",
      sku: "1000179357",
      material: "cedar" as const,
      forHeight: 8,
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
      forHeight: 6,
    },
    {
      name: "1-in x 6-in x 8-ft Pressure Treated Southern Yellow Pine Dog Ear Fence Picket",
      type: "picket",
      store: "lowes" as const,
      price: 3.58,
      unit: "per picket",
      url: "https://www.lowes.com/pd/Severe-Weather-1-in-x-6-in-W-x-8-ft-H-Pressure-Treated-Southern-Yellow-Pine-Dog-Ear-Fence-Picket/5002097981",
      sku: "5002097981",
      material: "pine" as const,
      forHeight: 8,
    },
    {
      name: "4-in x 4-in x 8-ft Cedar Green Lumber",
      type: "post",
      store: "lowes" as const,
      price: 49.98,
      unit: "per post",
      url: "https://www.lowes.com/pd/Top-Choice-4-in-x-4-in-x-8-ft-Cedar-Lumber-Common-3-5-in-x-3-5-in-x-8-ft-Actual/1000510451",
      sku: "1000510451",
      material: "cedar" as const,
      forHeight: 6,
    },
    // No 10-ft cedar 4x4 post exists at Lowe's — see note above. This
    // means Lowe's is correctly excluded for cedar+8ft projects; only
    // Home Depot carries that combination.
    {
      name: "4-in x 4-in x 8-ft #2 Ground Contact Pressure Treated Southern Yellow Pine Post",
      type: "post",
      store: "lowes" as const,
      price: 10.48,
      unit: "per post",
      url: "https://www.lowes.com/pd/Severe-Weather-Common-4-in-x-4-in-x-8-ft-Actual-3-5-in-x-3-5-in-x-8-ft-2-Treated-Lumber/50121083",
      sku: "50121083",
      material: "pine" as const,
      forHeight: 6,
    },
    {
      name: "4-in x 4-in x 10-ft #2 Ground Contact Pressure Treated Southern Yellow Pine Post",
      type: "post",
      store: "lowes" as const,
      price: 17.28,
      unit: "per post",
      url: "https://www.lowes.com/pd/Severe-Weather-Common-4-in-x-4-in-x-10-ft-Actual-3-5-in-x-3-5-in-x-10-ft-2-Treated-Lumber/4222509",
      sku: "4222509",
      material: "pine" as const,
      forHeight: 8,
    },
    {
      name: "2-in x 4-in x 8-ft Cedar Green Lumber",
      type: "rail",
      store: "lowes" as const,
      price: 23.98,
      unit: "per 8-ft rail",
      url: "https://www.lowes.com/pd/Cedar/1000512633",
      sku: "1000512633",
      material: "cedar" as const,
    },
    {
      name: "2-in x 4-in x 8-ft #2 Prime Above Ground Pressure Treated Southern Yellow Pine Lumber",
      type: "rail",
      store: "lowes" as const,
      price: 4.68,
      unit: "per 8-ft rail",
      url: "https://www.lowes.com/pd/Severe-Weather-Common-2-in-x-4-in-x-8-ft-Actual-1-5-in-x-3-5-in-x-8-ft-2-Prime-Treated-Lumber/4564608",
      sku: "4564608",
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
      name: "Sakrete 50-lb Fast Setting Concrete Mix",
      type: "concrete",
      store: "lowes" as const,
      price: 7.97,
      unit: "per bag",
      url: "https://www.lowes.com/pd/Sakrete-50-lb-Fast-Setting-Concrete-Mix/3338802",
      sku: "3338802",
    },
    // The old row here ("YARDLINK ... No Dig Fence Gate") was a
    // standalone pre-fab steel gate — wrong fit for a wood privacy
    // fence's BOM (breaks the species-consistency work above) and,
    // worse, was never actually wired into calculateEstimate at all
    // (type: "gate" existed in the schema but nothing read it). Replaced
    // with real gate HARDWARE (hinges/latch, and a cane bolt for double
    // gates) that attaches to a gate panel built from the fence's own
    // rail/picket lumber — see server/estimates.ts's comment above
    // calculateEstimate for why that's the right split. Both verified
    // live at Lowe's (Memphis, TN store context); Home Depot blocked
    // this session's browser tool on every gate-hardware search
    // attempted (same inconsistent bot-protection documented elsewhere
    // in this file) — so gate hardware is Lowe's-only for now. That's
    // honest, not silently guessed: a project with a gate simply won't
    // offer Home Depot as a store option until HD gate data is sourced
    // (same "only offer what a store can fully price" rule already
    // governs the cedar+8ft-post case above).
    {
      name: "National Hardware 8-in Black Gate Hardware Kit",
      type: "gate",
      store: "lowes" as const,
      price: 29.98,
      unit: "per gate leaf",
      url: "https://www.lowes.com/pd/National-Hardware-8-11-20-in-Gate-Hardware-Kit/50414160",
      sku: "674922",
      gateComponent: "hardware_kit" as const,
    },
    {
      name: "National Hardware 18-in Black Gate Cane Bolt",
      type: "gate",
      store: "lowes" as const,
      price: 19.48,
      unit: "per double gate",
      url: "https://www.lowes.com/pd/National-Hardware-N166-019-Cane-Bolt-in-Black-1-2-in-x-8-in/5005330913",
      sku: "4103316",
      gateComponent: "cane_bolt" as const,
    },

    // ---- Home Depot ----
    {
      name: "Alta Forest Products 5/8-in x 5-1/2-in x 6-ft American Western Red Cedar Dog-Ear Fence Picket",
      type: "picket",
      store: "home_depot" as const,
      price: 4.28,
      unit: "per picket",
      url: "https://www.homedepot.com/p/Alta-Forest-Products-5-8-in-x-5-1-2-in-x-6-ft-American-Western-Red-Cedar-Dog-Ear-Fence-Picket-63023/205757688",
      sku: "63023",
      material: "cedar" as const,
      forHeight: 6,
    },
    {
      name: "Alta Forest Products 5/8-in x 5-1/2-in x 8-ft American Western Red Cedar Dog-Ear Fence Picket",
      type: "picket",
      store: "home_depot" as const,
      price: 6.48,
      unit: "per picket",
      url: "https://www.homedepot.com/p/Alta-Forest-Products-5-8-in-x-5-1-2-in-x-8-ft-American-Western-Red-Cedar-Dog-Ear-Fence-Picket-63027/205757690",
      sku: "205757690",
      material: "cedar" as const,
      forHeight: 8,
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
      forHeight: 6,
    },
    {
      name: "3/4 in. x 5-1/2 in. x 8 ft. Pressure-Treated Pine Dog-Eared Wood Fence Picket",
      type: "picket",
      store: "home_depot" as const,
      price: 3.58,
      unit: "per picket",
      url: "https://www.homedepot.com/p/3-4-in-x-5-1-2-in-x-8-ft-Pressure-Treated-Pine-Dog-Eared-Wood-Fence-Picket-102582/203091053",
      sku: "203091053",
      material: "pine" as const,
      forHeight: 8,
    },
    {
      name: "4 in. x 4 in. x 8 ft. Rough Green Western Red Cedar Lumber",
      type: "post",
      store: "home_depot" as const,
      price: 49.98,
      unit: "per post",
      url: "https://www.homedepot.com/p/4-in-x-4-in-x-8-ft-Rough-Green-Western-Red-Cedar-Lumber-635251/202636959",
      sku: "202636959",
      material: "cedar" as const,
      forHeight: 6,
    },
    {
      name: "4 in. x 4 in. x 10 ft. Western Red Cedar Timber",
      type: "post",
      store: "home_depot" as const,
      price: 45.98,
      unit: "per post",
      url: "https://www.homedepot.com/p/4-in-x-4-in-x-10-ft-Western-Red-Cedar-Timber-RCT204410/203819871",
      sku: "203819871",
      material: "cedar" as const,
      forHeight: 8,
    },
    {
      name: "4-in x 4-in x 8-ft #2 Ground Contact Pressure-Treated Southern Yellow Pine Wood Post",
      type: "post",
      store: "home_depot" as const,
      price: 10.48,
      unit: "per post",
      url: "https://www.homedepot.com/p/4-in-x-4-in-x-8-ft-2-Ground-Contact-Pressure-Treated-Southern-Yellow-Pine-Wood-Post-194354/205220341",
      sku: "194354",
      material: "pine" as const,
      forHeight: 6,
    },
    {
      name: "4 in. x 4 in. x 10 ft. #2 Pressure-Treated Ground Contact Southern Pine Wood Post",
      type: "post",
      store: "home_depot" as const,
      price: 17.28,
      unit: "per post",
      url: "https://www.homedepot.com/p/4-in-x-4-in-x-10-ft-2-Pressure-Treated-Ground-Contact-Southern-Pine-Wood-Post-4220254/100025396",
      sku: "100025396",
      material: "pine" as const,
      forHeight: 8,
    },
    {
      name: "2 in. x 4 in. x 8 ft. Rough Green Western Red Cedar Lumber",
      type: "rail",
      store: "home_depot" as const,
      price: 23.98,
      unit: "per 8-ft rail",
      url: "https://www.homedepot.com/p/2-in-x-4-in-x-8-ft-Rough-Green-Western-Red-Cedar-Lumber-702145/202594092",
      sku: "202594092",
      material: "cedar" as const,
    },
    {
      name: "WeatherShield 2-in x 4-in x 8-ft #2 Prime Ground Contact Pressure-Treated Southern Yellow Pine Lumber",
      type: "rail",
      store: "home_depot" as const,
      price: 4.78,
      unit: "per 8-ft rail",
      url: "https://www.homedepot.com/p/WeatherShield-2-in-x-4-in-x-8-ft-2-Prime-Ground-Contact-Pressure-Treated-Southern-Yellow-Pine-Lumber-291224/301836994",
      sku: "291224",
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
