// Single source of truth for gate type labels and real-world widths,
// pulled out (2026-09-14) of two places that had each defined their own
// copy of GATE_LABEL — EditFenceLineCard.tsx (the "+ Add" buttons and
// the list of already-placed gates) and MapEditorComponent.tsx (the
// actual rendered gate marker's span). GATE_WIDTH_FEET already lived
// only in MapEditorComponent.tsx, sizing the marker's real on-map
// span — see CLAUDE.md's "Gates on wooden fences" section for why
// these specific numbers (a real single/double gate's typical
// opening). Surfacing them on the buttons too, not just the rendered
// marker, was direct feedback: nothing told a user how wide a "single"
// vs. "double" gate actually is before they placed one.
export const GATE_LABEL: Record<string, string> = { single: "Single Gate", double: "Double Gate" };
export const GATE_WIDTH_FEET: Record<string, number> = { single: 4, double: 8 };
