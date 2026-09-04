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
// This is the post/rail species — see picketSpeciesFor below for why
// picket needs its own function now, not just a reuse of this one.
function postRailSpeciesFor(material: string | null | undefined): Species {
  if (material && /pine/i.test(material)) return "pine";
  return "cedar";
}

// Picket species — split out from post/rail (2026-09) to support a
// mixed option: pine posts/rails with cedar pickets (cheaper structure,
// nicer-looking face — a real, requested combination, not a hypothetical
// one). Checked as an exact literal, not a /pine/i regex, so it doesn't
// fall into the plain-pine branch below; every other material value
// (plain pine, plain cedar, legacy free text) still picks its picket
// species exactly the same way it picks post/rail species.
function picketSpeciesFor(material: string | null | undefined): Species {
  if (material === "wood_pine_cedar_picket") return "cedar";
  if (material && /pine/i.test(material)) return "pine";
  return "cedar";
}

// Anything 7ft or taller prices as the 8-ft category (the only "tall"
// category this app has real product data for); everything else,
// including legacy/undefined heights, falls back to 6-ft — same
// graceful-fallback spirit as postRailSpeciesFor/picketSpeciesFor.
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
// (postRailSpecies, picketSpecies, height) — post and picket are both
// species- AND height-specific products (a 6-ft post isn't long enough
// to bury for an 8-ft fence; 8-ft pickets are a different product than
// 6-ft ones), so each group needs its own matching post/picket. The two
// species are tracked separately (not one shared "species" like before)
// specifically to support the pine-post/cedar-picket mixed option — post
// and picket are priced and looked up independently, they just happen to
// usually be the same species. Rail follows POST/RAIL species only (a
// picket-species change never changes which rail gets bought) and isn't
// height-specific (same 8-ft board either way; only the per-section
// quantity changes with height). Concrete and fasteners are fully
// shared — no species or height variant exists for hardware/consumables.
// A store is only offered as an option if it can price EVERY group's
// post/picket, the rail for every post/rail species used, and both
// shared types — missing any one of those means it can't fulfill the
// full list. Sorted cheapest-total-first.
// Gates deliberately do NOT shrink the picket/rail/post linear-footage
// math above — that math sums each line's total length and has no
// concept of "this segment has a 4ft/8ft gap in it," and teaching it
// that is real, error-prone work (post-spacing near a gate opening
// isn't just "subtract the width") for a feature the user explicitly
// asked to start simple. The safe direction to be wrong in is over-
// counting, not under-counting: treating the gate's span as if it were
// solid fence means the picket/rail total already includes enough
// lumber to build a matching gate panel, so the ONLY thing actually
// missing is the hardware to hang it. That's what gets added below —
// nothing is subtracted.
//
// No single-SKU "double gate kit" was found to actually exist at
// either retailer (checked live) — a double gate is modeled as what it
// really is: two independently-hinged leaves (2x the single-gate
// hardware kit) plus one cane bolt to anchor the inactive leaf into
// the ground, using two real, separately verified products rather than
// one fabricated one.
type GateType = "single" | "double";

export async function calculateEstimate(
  lines: { length: number; material: string | null; height: number | null }[],
  gates: { type: GateType }[] = [],
) {
  type Group = { postRailSpecies: Species; picketSpecies: Species; height: HeightCategory; length: number };
  const groups = new Map<string, Group>();
  const railSpeciesUsed = new Set<Species>();
  for (const line of lines) {
    const postRailSpecies = postRailSpeciesFor(line.material);
    const picketSpecies = picketSpeciesFor(line.material);
    const height = heightCategoryFor(line.height);
    railSpeciesUsed.add(postRailSpecies);
    const key = `${postRailSpecies}-${picketSpecies}-${height}`;
    const existing = groups.get(key);
    if (existing) {
      existing.length += line.length || 0;
    } else {
      groups.set(key, { postRailSpecies, picketSpecies, height, length: line.length || 0 });
    }
  }
  const groupList = Array.from(groups.values());

  const singleGateCount = gates.filter((g) => g.type === "single").length;
  const doubleGateCount = gates.filter((g) => g.type === "double").length;
  const needsHardwareKit = singleGateCount + doubleGateCount > 0;
  const needsCaneBolt = doubleGateCount > 0;

  const allProducts = await db
    .select()
    .from(products)
    .where(inArray(products.type, ["post", "rail", "picket", "concrete", "fasteners", "gate"]));

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

      // Gate hardware — only required if this project actually has
      // gates, same "only require what's needed" rule as species/height
      // groups below. Species/height-agnostic (steel hardware).
      const hardwareKit = needsHardwareKit
        ? cheapest(storeProducts.filter((p) => p.type === "gate" && p.gateComponent === "hardware_kit"))
        : null;
      if (needsHardwareKit && !hardwareKit) return null;
      const caneBolt = needsCaneBolt
        ? cheapest(storeProducts.filter((p) => p.type === "gate" && p.gateComponent === "cane_bolt"))
        : null;
      if (needsCaneBolt && !caneBolt) return null;

      // Rail — post/rail-species-specific, one per species actually used
      // (never picket species — a picket-species change never changes
      // which rail gets bought).
      const railBySpecies = new Map<Species, Product>();
      for (const species of Array.from(railSpeciesUsed)) {
        const rail = cheapest(storeProducts.filter((p) => p.type === "rail" && p.material === species));
        if (!rail) return null; // can't rail this species here
        railBySpecies.set(species, rail);
      }

      // Post — postRailSpecies + height specific. Picket — picketSpecies
      // + height specific. Looked up independently now (not a shared
      // "species" key) so a group can mix pine post with cedar picket;
      // keyed by their own (species, height) pair rather than the full
      // group key, so two groups that happen to share a post species (or
      // a picket species) reuse one lookup instead of repeating it.
      const postByKey = new Map<string, Product>();
      const picketByKey = new Map<string, Product>();
      for (const group of groupList) {
        const postKey = `${group.postRailSpecies}-${group.height}`;
        if (!postByKey.has(postKey)) {
          const post = cheapest(
            storeProducts.filter((p) => p.type === "post" && p.material === group.postRailSpecies && p.forHeight === group.height),
          );
          if (!post) return null; // can't fulfill this post species+height here
          postByKey.set(postKey, post);
        }
        const picketKey = `${group.picketSpecies}-${group.height}`;
        if (!picketByKey.has(picketKey)) {
          const picket = cheapest(
            storeProducts.filter((p) => p.type === "picket" && p.material === group.picketSpecies && p.forHeight === group.height),
          );
          if (!picket) return null; // can't fulfill this picket species+height here
          picketByKey.set(picketKey, picket);
        }
      }

      // Quantities.
      let totalConcreteQty = 0;
      let totalFastenerSections = 0;
      const materials: ReturnType<typeof materialLine>[] = [];

      for (const group of groupList) {
        const sections = sectionsFor(group.length);
        const postQty = sections + 1;
        const picketQty = sections * 16;
        const railQty = sections * RAILS_PER_SECTION[group.height];

        totalConcreteQty += postQty; // one bag per post
        totalFastenerSections += sections;

        materials.push(materialLine(postByKey.get(`${group.postRailSpecies}-${group.height}`)!, postQty));
        materials.push(materialLine(picketByKey.get(`${group.picketSpecies}-${group.height}`)!, picketQty));
        materials.push(materialLine(railBySpecies.get(group.postRailSpecies)!, railQty));
      }

      materials.push(materialLine(concrete, totalConcreteQty));
      materials.push(materialLine(fasteners, Math.ceil(totalFastenerSections / 3)));

      // One hardware kit per leaf: 1 for a single gate, 2 for a double
      // (each leaf hangs and latches independently). One cane bolt per
      // double gate, to anchor its inactive leaf.
      if (hardwareKit) {
        materials.push(materialLine(hardwareKit, singleGateCount + doubleGateCount * 2));
      }
      if (caneBolt) {
        materials.push(materialLine(caneBolt, doubleGateCount));
      }

      const totalCost = toCents(materials.reduce((sum, m) => sum + m.totalCost, 0));

      return { store, materials, totalCost };
    })
    .filter((option): option is NonNullable<typeof option> => option !== null)
    .sort((a, b) => a.totalCost - b.totalCost);

  if (options.length === 0) {
    const combos = groupList
      .map((g) =>
        g.postRailSpecies === g.picketSpecies
          ? `${g.postRailSpecies} picket/post at ${g.height}ft`
          : `${g.postRailSpecies} post + ${g.picketSpecies} picket at ${g.height}ft`,
      )
      .join(", ");
    const gateNote = needsHardwareKit
      ? `, gate hardware kit${needsCaneBolt ? " + cane bolt" : ""}`
      : "";
    throw new Error(
      `No store has product data for every required combination (${combos}, plus rail per species and shared concrete/fasteners${gateNote}). Run 'npm run db:seed' or add products for these.`,
    );
  }

  return { options };
}
