// Shared between the editor's compact MaterialEstimates panel and the
// dedicated ShoppingList page — both render the same server-computed
// line items, just at different levels of detail.

export const STORE_LABELS: Record<string, string> = {
  lowes: "Lowe's",
  home_depot: "Home Depot",
};

// Buying order, not alphabetical: structural first (post + the concrete
// that sets it), then the rail that spans between posts, then the
// pickets that face it, then hardware last.
export const MATERIAL_TYPE_LABELS: Record<string, string> = {
  post: "Posts",
  concrete: "Concrete",
  rail: "Rails",
  picket: "Pickets",
  fasteners: "Fasteners",
  panel: "Panels",
  gate: "Gates",
};
export const MATERIAL_TYPE_ORDER = ["post", "concrete", "rail", "picket", "fasteners", "panel", "gate"];

export interface MaterialLine {
  id: number;
  name: string;
  type: string;
  store: string;
  price: number;
  unit: string | null;
  url: string | null;
  sku: string | null;
  quantity: number;
  totalCost: number;
}

// calculateEstimate (server/estimates.ts) can legitimately list the SAME
// product twice within one store's materials array — e.g. a project with
// both a pine-6ft and a pine-8ft line needs pine rail for each
// (species, height) group separately, since each group's quantity is
// computed independently, but rail itself isn't height-specific. That's
// correct pricing, but wrong to show as two separate rows to a shopper —
// they just need to buy the combined quantity once. Consolidate by
// product id, summing quantity and cost, before rendering anywhere.
export function consolidateMaterials(materials: MaterialLine[]): MaterialLine[] {
  const byId = new Map<number, MaterialLine>();
  for (const item of materials) {
    const existing = byId.get(item.id);
    if (existing) {
      existing.quantity += item.quantity;
      existing.totalCost = Math.round((existing.totalCost + item.totalCost) * 100) / 100;
    } else {
      byId.set(item.id, { ...item });
    }
  }
  return Array.from(byId.values());
}
