import type { OrganizationRate } from "@shared/schema";

// Same labels client/src/lib/estimates.ts's MATERIAL_LABELS already
// uses for the DIYer-facing badges — duplicated here (client code
// isn't reachable from the server bundle) so both the blocking error
// on POST /api/projects/:id/quotes and the read-only preview on
// GET /api/projects/:id/quote-preview name missing rates in this app's
// own vocabulary instead of a raw material value.
export const MATERIAL_LABELS: Record<string, string> = {
  wood_pine: "Pine",
  wood_cedar: "Cedar",
  wood_pine_cedar_picket: "Pine (Cedar Pickets)",
};

export interface MissingRate {
  material: string;
  height: number;
  label: string;
}

export interface QuotePricingResult {
  totalLinearFeet: number;
  materialSubtotal: number;
  missingRates: MissingRate[];
}

// The business's own rate-per-(material, height), summed across a
// project's fence lines — the actual pricing logic behind both a real
// quote SEND (POST /api/projects/:id/quotes) and the read-only PREVIEW
// the editor's sidebar shows a Pro/org member before they ever send
// anything (GET /api/projects/:id/quote-preview). Pulled into its own
// function specifically so those two call sites can't drift apart —
// see server/routes.ts for both.
//
// Deliberately does NOT fall back to a "close enough" material the way
// the DIY estimate's legacy-value-defaults-to-cedar behavior does — an
// unset or unrecognized (material, height) is reported in
// `missingRates` rather than guessed at, since guessing here risks a
// contractor's actual money, not just a DIYer's shopping list.
export function calculateQuotePricing(
  fenceLines: { material: string | null; height: number | null; length: number | null }[],
  rates: OrganizationRate[]
): QuotePricingResult {
  const totalLinearFeet = fenceLines.reduce((acc, line) => acc + (line.length || 0), 0);

  const rateFor = (material: string | null, height: number | null) => {
    const h = Math.round(height ?? 0);
    return rates.find((r) => r.material === material && r.height === h)?.ratePerFoot;
  };

  const missingByKey = new Map<string, MissingRate>();
  let materialSubtotal = 0;
  for (const line of fenceLines) {
    const height = Math.round(line.height ?? 0);
    const rate = rateFor(line.material, line.height);
    if (rate === undefined) {
      const material = line.material || "";
      const key = `${material}-${height}`;
      if (!missingByKey.has(key)) {
        missingByKey.set(key, {
          material,
          height,
          label: MATERIAL_LABELS[material] || material || "that material",
        });
      }
    } else {
      materialSubtotal += rate * (line.length || 0);
    }
  }

  return { totalLinearFeet, materialSubtotal, missingRates: Array.from(missingByKey.values()) };
}
