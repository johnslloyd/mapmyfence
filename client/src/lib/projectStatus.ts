// Project status labels/colors, shared by every place a project's raw
// `status` value reaches the UI (Properties.tsx, PropertyOverview.tsx).
// Narrowed 2026-09-13 to just the statuses that can actually happen —
// see shared/schema.ts's `status` column comment for the full reasoning.
// "scheduled" added 2026-09-16 (scheduling MVP slice 1) — same rule:
// only a real, app-driven transition earns a value here (this one's set
// by hand via the "Mark as Scheduled" button, not inferred, but it's a
// deliberate business action either way, unlike the dropped
// in-progress/completed values which were never set by anything at
// all). Kept as a display-label map rather than renaming the stored
// enum value itself, same "stored value != shown text" pattern as
// MATERIAL_LABELS — no data migration needed for a wording change.
export const STATUS_LABELS: Record<string, string> = {
  planning: "Planning",
  quoting: "Quote Sent",
  scheduled: "Scheduled",
};

export const STATUS_BADGE_CLASS: Record<string, string> = {
  planning: "bg-gray-100 text-gray-700",
  quoting: "bg-blue-100 text-blue-700",
  scheduled: "bg-primary/10 text-primary",
};

// Same colors, translucent — for a badge floating over a photo
// (Properties.tsx's card, over the satellite image) rather than sitting
// on a flat card background. Kept as a separate map instead of string-
// munging STATUS_BADGE_CLASS's `bg-*`/90` at each call site.
export const STATUS_BADGE_CLASS_TRANSLUCENT: Record<string, string> = {
  planning: "bg-gray-100/90 text-gray-700",
  quoting: "bg-blue-100/90 text-blue-700",
  scheduled: "bg-primary/10 text-primary",
};
