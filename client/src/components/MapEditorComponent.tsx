import { useEffect, useState, useRef, Fragment } from "react";
import { MapContainer, TileLayer, Marker, Polyline, GeoJSON, useMapEvents, useMap, Tooltip, CircleMarker } from "react-leaflet";
import { LatLng, LatLngBounds, Icon, DivIcon } from "leaflet";
import { Button } from "@/components/ui/button";
import { Undo2, Save, Trash2, Ruler, Search, Loader2, MapPinned, AlertTriangle, X, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useParcelLookup } from "@/hooks/use-projects";
import { GATE_LABEL, GATE_WIDTH_FEET } from "@/lib/gates";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

const iconUrl = "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png";
const iconRetinaUrl = "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png";
const shadowUrl = "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png";

const defaultIcon = new Icon({
  iconUrl, iconRetinaUrl, shadowUrl,
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], tooltipAnchor: [16, -28], shadowSize: [41, 41]
});

// Esri's World_Imagery tile cache runs out of real detail at zoom 19 for
// most areas (confirmed by fetching actual tiles: z19 returns real imagery,
// z20+ returns a literal "Map data not yet available" placeholder image,
// not a 404 — so it fails silently rather than erroring). Tried swapping to
// USGS's free NAIP-based layer for better quality — at two test locations
// it was no sharper at matched zoom levels and its own real ceiling was
// z16, shallower than Esri's. Kept Esri.
//
// TILE_NATIVE_ZOOM: the real resolution ceiling. Setting this as
// maxNativeZoom keeps Leaflet from ever requesting tiles past z19 (which
// would hit Esri's placeholder image) — past this it just upscales the z19
// tile instead of fetching a new one.
// MAP_MAX_ZOOM: how far the UI actually lets someone zoom. Deliberately set
// higher than TILE_NATIVE_ZOOM — being able to zoom in for fine placement
// of fence points matters more here than avoiding the resulting blur past
// z19. This is a conscious tradeoff, not the old bug (the bug was these two
// numbers being mismatched *by accident*, with no one having decided it).
const TILE_NATIVE_ZOOM = 19;
const MAP_MAX_ZOOM = 22;

// Pro-only, higher-resolution satellite imagery (2026-09-10) — direct
// answer to "the map is subpar," which the user identified as image
// clarity specifically, not geocoding. `mapbox/satellite-streets-v12`
// is Mapbox's own combined satellite-imagery-plus-street-labels style —
// picked instead of plain `satellite-v9` (imagery only) specifically so
// it replaces BOTH of Esri's two layers below (imagery + the separate
// World_Transportation labels overlay) with one tile fetch, not because
// it needed extra justification beyond "it's the documented style for
// exactly this combination."
//
// HONESTY NOTE, matching this file's own "fetch real tiles before
// trusting a service's name" discipline elsewhere: this URL/style and
// MAPBOX_NATIVE_ZOOM are built from Mapbox's own public documentation,
// NOT verified against real fetched tiles the way Esri's ceiling above
// was — there was no real access token available to test against while
// building this. Confirm live once VITE_MAPBOX_TOKEN is set: load a
// real Pro-account map, check the actual tiles look sharp past z19, and
// adjust MAPBOX_NATIVE_ZOOM if Mapbox's real ceiling in this app's
// usual test regions differs from the documented 22.
const MAPBOX_STYLE = "mapbox/satellite-streets-v12";
const MAPBOX_NATIVE_ZOOM = 22;
const MAPBOX_ATTRIBUTION = '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

// Fallback for when there's no geocoded point yet — a brand-new project,
// or one whose address failed to geocode (see the initialAddress effect
// below). `initialCenter` is undefined in every real call site today
// (Editor.tsx has no lat/lng to give it — geocoding happens client-side,
// not at project-creation time), so without this the MapContainer's
// `center` prop was always `undefined`. That's not just "no imagery
// visible" — Leaflet never receives a valid initial view, so the map
// genuinely never finishes initializing: confirmed live that even a
// directly-dispatched click on the map's own registered Leaflet handler
// did nothing when this happened. Continental-US centroid, zoomed out,
// so the map is always interactive regardless of whether geocoding ever
// succeeds; a successful geocode immediately recenters it via setView.
const DEFAULT_CENTER: [number, number] = [39.8283, -98.5795];
const DEFAULT_ZOOM = 4;

// Real state's-edge coordinates (Mississippi's actual southernmost,
// northernmost, westernmost, easternmost points), padded outward by a
// few tenths of a degree so a property genuinely near a border isn't
// wrongly hidden — not a precise state-line polygon lookup, just a
// cheap client-side box to decide whether "Show property line" is even
// worth offering at all. This is deliberately approximate (a rectangle,
// not the real jagged border), same spirit as this file's other
// "close enough at the relevant scale" approximations (squareCorner's
// local-planar geometry) — false positives near a border are possible
// and handled by the lookup itself just returning "not found," false
// negatives (hiding it for a real MS property) are the one thing worth
// avoiding, hence the padding.
const MS_BOUNDS = { minLat: 29.9, maxLat: 35.1, minLng: -91.8, maxLng: -87.9 };
function isLikelyInMississippi(lat: number, lng: number): boolean {
  return lat >= MS_BOUNDS.minLat && lat <= MS_BOUNDS.maxLat && lng >= MS_BOUNDS.minLng && lng <= MS_BOUNDS.maxLng;
}

// Real finding (2026-09-14) while building the disambiguation prompt
// below: a plain street address with no city/state ("12141 N Shady
// Tree Ln") doesn't actually come back as multiple candidates to pick
// between — confirmed live against Nominatim's real API — it comes
// back as exactly ONE, confident-looking, silently WRONG match (a
// Tennessee street with that exact name and house-number range genuinely
// exists in OpenStreetMap's data, but a bare, state-less query matched
// an unrelated Idaho street instead, at the ROAD level — it couldn't
// even place the house number, just returned the street). A results-
// count check alone can't catch this; it needs to also know whether the
// INPUT itself was specific enough to trust a single answer.
const US_STATE_ABBREVIATIONS = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"];
const US_STATE_NAMES = ["Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming"];
const US_STATE_ABBR_REGEX = new RegExp(`\\b(${US_STATE_ABBREVIATIONS.join("|")})\\b`, "i");
// A bare street address (no city/state/ZIP) is exactly the shape that
// let the Idaho/Tennessee mixup through — a ZIP code or a real state
// name/abbreviation is a cheap, honest signal that the search was
// actually narrowed down, not a guess at "is this really Tennessee."
//
// A real bug caught live while verifying this, not shipped: the ZIP
// check first used a bare `\b\d{5}\b`, which matched "12141" — the
// HOUSE NUMBER at the very start of "12141 N Shady Tree Ln" — as if it
// were a trailing ZIP, marking the exact address this was built for as
// "specific enough" and silently reproducing the bug this was supposed
// to fix. A real ZIP is the LAST token in a normal US address; end-
// anchoring the regex (`$`, allowing only trailing whitespace after it)
// fixes this without needing to parse the address into real fields.
function looksSpecificEnoughToTrust(input: string): boolean {
  if (/\d{5}(-\d{4})?\s*$/.test(input.trim())) return true;
  if (US_STATE_ABBR_REGEX.test(input)) return true;
  const lower = input.toLowerCase();
  return US_STATE_NAMES.some((name) => lower.includes(name.toLowerCase()));
}

// Drag-handle marker for an editing-mode point (2026-09-13) — real
// visual differentiation from a plain numbered pin, not just the old
// `.leaflet-edit-marker { filter: hue-rotate(120deg) }` rule this
// replaces (a CSS filter alone recolors the same teardrop image but
// doesn't change its SHAPE, so nothing about it actually read as
// "this one drags" — direct feedback that dragging a point wasn't
// discoverable). Lucide's exact `Move` glyph (lucide-react's move.js —
// literal 4-way arrows), same "confirmed exact glyph, not hand-
// approximated" discipline as deletePointIcon/squareCornerIcon below.
// `hsl(var(--primary))`, this app's real ink-navy token — same reason
// squareCornerIcon uses it, not an arbitrary color.
//
// Same iconSize/iconAnchor as defaultIcon (25x41, tip at [12,41])
// DELIBERATELY — deletePointIcon/squareCornerIcon's own offsets below,
// and the shared point-number Tooltip's offset, are all tuned relative
// to that exact tip position. The circle sits at the BOTTOM of that
// same 25x41 box (not centered in it) so its own visual anchor lands
// on the exact same spot the old pin's tip did — every other icon
// anchored off this one needed zero recalculation.
const dragHandleIcon = new DivIcon({
  className: "leaflet-drag-handle",
  html: `<div style="position:relative;width:25px;height:41px;"><div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);background:hsl(var(--primary));border-radius:9999px;width:24px;height:24px;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4);"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"/><path d="m15 19-3 3-3-3"/><path d="m19 9 3 3-3 3"/><path d="M2 12h20"/><path d="m5 9-3 3 3 3"/><path d="m9 5 3-3 3 3"/></svg></div></div>`,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
});

// Selected variant (2026-09-14) — same circle, plus a visible accent
// ring so "this is the point the delete/square-corner badges below
// belong to" reads clearly at a glance, now that those badges appear
// on a deliberate click rather than a passing hover (see FenceLine's
// own `selectedIdx` comment). Same box/anchor as `dragHandleIcon` —
// only the ring is added via `box-shadow`, which doesn't affect layout,
// so nothing else needed re-anchoring for this variant.
const dragHandleIconSelected = new DivIcon({
  className: "leaflet-drag-handle",
  html: `<div style="position:relative;width:25px;height:41px;"><div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);background:hsl(var(--primary));border-radius:9999px;width:24px;height:24px;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 0 0 3px hsl(var(--accent)), 0 1px 3px rgba(0,0,0,0.4);"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"/><path d="m15 19-3 3-3-3"/><path d="m19 9 3 3-3 3"/><path d="M2 12h20"/><path d="m5 9-3 3 3 3"/><path d="m9 5 3-3 3 3"/></svg></div></div>`,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
});

// Select-only (not hover — see FenceLine's `selectedIdx` comment)
// delete affordance for a line point while editing — a small red ×
// badge, anchored so it sits up-and-right of the point's own drag
// handle rather than on top of it. Desktop-only by design (a
// click-to-select has no less discoverable touch equivalent here yet);
// this was an explicit, deliberate tradeoff, not an oversight — see the
// pin marker's own eventHandlers below.
// 26px (up from an earlier 18px pass) with real Lucide glyph data — a
// plain "×" character read as thin/inconsistent at a glance; this is
// Lucide's exact X path (lucide-react's x.js), same "confirmed exact
// glyph, not hand-approximated" discipline this app's favicon was built
// with, not a redrawn approximation.
//
// Anchor widened 2026-09-14, direct feedback: this badge and
// `dragHandleIcon`'s own circle footprint (bottom-anchored, roughly
// [-12,+12] x [-24,0] relative to the point) genuinely overlapped —
// the drag-handle redesign made the handle itself much wider than the
// old teardrop pin this offset was originally tuned against. Pushed
// further right (x starts at +18, clearing the handle's +12 edge) and
// further up (y starts at -52, clearing the handle's -24 top edge),
// each with a real few-px gap rather than sitting flush.
const deletePointIcon = new DivIcon({
  className: "",
  html: `<div style="background:#ef4444;border-radius:9999px;width:26px;height:26px;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4);cursor:pointer;"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></div>`,
  iconSize: [26, 26],
  iconAnchor: [-18, 52],
});

// Select-only "square this corner" affordance — an interior vertex only
// (needs two adjacent segments to form a corner at all; an endpoint has
// just one). Anchored up-and-LEFT (mirrored from deletePointIcon's
// up-and-right) so the two never overlap when both show on the same
// selected point. Same desktop-only-by-design reasoning as delete, and
// the same 2026-09-14 anchor-widening to clear the drag handle.
//
// Lucide's exact CornerRightDown path (lucide-react's corner-right-
// down.js) — reads as "turn/adjust" more clearly than the plain "∟"
// character the first pass used, which also rendered inconsistently
// across fonts. `hsl(var(--primary))` (this app's own ink navy), not
// the arbitrary blue the first pass used — ties the badge to the real
// theme token instead of an unrelated hardcoded color. Needs the
// `hsl()` wrapper, not a bare `var(--primary)` — this app's CSS
// variables store raw HSL components ("218 55% 19%"), not complete
// color values (see index.css); a bare `var()` here is invalid CSS and
// silently resolves to transparent, the exact same class of bug this
// file's `-border` token issue already hit once before, caught live by
// checking computed background color, not assumed correct.
const squareCornerIcon = new DivIcon({
  className: "",
  html: `<div style="background:hsl(var(--primary));border-radius:9999px;width:26px;height:26px;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4);cursor:pointer;"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="10 15 15 20 20 15"/><path d="M4 4h7a4 4 0 0 1 4 4v12"/></svg></div>`,
  iconSize: [26, 26],
  iconAnchor: [42, 52],
});

const postIcon = {
  path: "M-1,-1 L1,-1 L1,1 L-1,1 Z",
  fillColor: "white",
  fillOpacity: 1,
  strokeColor: "black",
  strokeWeight: 1,
  scale: 1,
};

const FEET_PER_METER = 3.28084;
const POST_SPACING_FEET = 8;

function getIntermediatePoints(p1: LatLng, p2: LatLng): LatLng[] {
  const distanceMeters = p1.distanceTo(p2);
  const distanceFeet = distanceMeters * FEET_PER_METER;
  const numPosts = Math.floor(distanceFeet / POST_SPACING_FEET) -1;

  if (numPosts <= 0) return [];

  const intermediatePoints: LatLng[] = [];
  const latStep = (p2.lat - p1.lat) / (numPosts + 1);
  const lngStep = (p2.lng - p1.lng) / (numPosts + 1);

  for (let i = 1; i <= numPosts; i++) {
    intermediatePoints.push(
      new LatLng(p1.lat + latStep * i, p1.lng + lngStep * i)
    );
  }
  return intermediatePoints;
}

// Projects a click point onto the straight segment p1->p2 and returns
// how far along it (0 = at p1, 1 = at p2), clamped to the segment. Flat
// lat/lng math, not a great-circle calc — fine here since this only
// decides where a gate MARKER snaps to on screen, unlike the real
// length/distance calculations elsewhere in this app (which correctly
// use LatLng.distanceTo()) that actually feed into pricing.
function projectFraction(p1: LatLng, p2: LatLng, click: LatLng): number {
  const dx = p2.lng - p1.lng;
  const dy = p2.lat - p1.lat;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return 0.5;
  const t = ((click.lng - p1.lng) * dx + (click.lat - p1.lat) * dy) / lenSq;
  return Math.min(1, Math.max(0, t));
}

// "Square this corner" (2026-09-10) — moves ONLY the point AFTER the
// vertex (`next`), swinging it around the vertex so the outgoing
// segment becomes exactly perpendicular to the incoming one, at the
// SAME distance from the vertex it already was (only its bearing
// changes, not its length). `prev` and the vertex itself never move —
// deliberately one-sided rather than splitting the correction across
// both neighbors, so the effect of clicking is predictable: "the shape
// up through this point is trusted; the next point swings into a right
// angle from here," not two points moving at once for one click.
//
// Real, local-planar geometry, not a naive lat/lng slope comparison —
// same reasoning this app already applies elsewhere (see
// handleUpdateLine's length recompute, PropertySatelliteImage's aspect
// math): a degree of longitude is shorter than a degree of latitude by
// cos(latitude), so treating raw (lat, lng) deltas as a square grid
// would compute the wrong angle away from the equator. Correcting by
// cos(latitude) turns this into flat, ordinary 2D vector math, which is
// exactly what's needed at fence-line scale (tens to low hundreds of
// feet — nowhere near where Earth's curvature itself would matter,
// unlike this file's actual distance/pricing calculations, which
// correctly use LatLng.distanceTo() instead of this local
// approximation).
//
// Two perpendicular directions always exist (rotate the incoming
// bearing +90° or -90°); picks whichever is closer to the corner's
// CURRENT outgoing direction, so a near-square corner snaps to exactly
// 90° without flipping to the opposite side of the incoming segment.
function squareCorner(
  prev: { lat: number; lng: number },
  vertex: { lat: number; lng: number },
  next: { lat: number; lng: number },
): { lat: number; lng: number } {
  const cosLat = Math.cos((vertex.lat * Math.PI) / 180);
  // Local planar (x, y) relative to the vertex — degrees, not meters,
  // but degrees scaled so a unit of x and a unit of y represent the
  // same real-world distance, which is all vector/angle math needs.
  const toXY = (p: { lat: number; lng: number }) => ({
    x: (p.lng - vertex.lng) * cosLat,
    y: p.lat - vertex.lat,
  });

  const prevXY = toXY(prev);
  const nextXY = toXY(next);
  const nextDist = Math.hypot(nextXY.x, nextXY.y);
  if (nextDist === 0) return next; // degenerate (shouldn't happen) — leave it alone

  // Direction of travel arriving AT the vertex (prev -> vertex), i.e.
  // the reverse of prevXY (which points vertex -> prev).
  const inLen = Math.hypot(prevXY.x, prevXY.y);
  if (inLen === 0) return next; // degenerate coincident points — nothing to be perpendicular to
  const dirIn = { x: -prevXY.x / inLen, y: -prevXY.y / inLen };

  // The two candidate perpendicular directions (rotate dirIn by ±90°).
  const rotA = { x: -dirIn.y, y: dirIn.x };
  const rotB = { x: dirIn.y, y: -dirIn.x };

  // Pick whichever candidate the CURRENT outgoing direction is already
  // closer to (larger dot product with the current, unnormalized
  // nextXY — direction only, magnitude doesn't affect which is larger),
  // so a near-90° corner snaps without flipping sides.
  const dotA = rotA.x * nextXY.x + rotA.y * nextXY.y;
  const dotB = rotB.x * nextXY.x + rotB.y * nextXY.y;
  const chosen = dotA >= dotB ? rotA : rotB;

  const newXY = { x: chosen.x * nextDist, y: chosen.y * nextDist };
  return {
    lat: vertex.lat + newXY.y,
    lng: vertex.lng + newXY.x / cosLat,
  };
}

// GATE_LABEL/GATE_WIDTH_FEET moved to lib/gates.ts (2026-09-14) — this
// file's own copy was a duplicate of EditFenceLineCard.tsx's, and the
// same real-world opening widths (a single gate's standard 3-4ft
// walk-through opening, a double gate roughly double that) now also
// surface on that card's "+ Add" buttons, not just here. Used below to
// size the gate's visual span as an actual fraction of the segment's
// real length (via LatLng.distanceTo(), same as every other real
// distance in this app), so it reads as genuinely wider on the map,
// not just a bigger icon.

function GateMarker({ gate, points }: { gate: { type: string; segmentIndex: number; position: number }, points: any[] }) {
  const p1 = points[gate.segmentIndex];
  const p2 = points[gate.segmentIndex + 1];
  // Defensive only — segmentIndex should always resolve against the
  // line's current points, but a line with fewer points than when the
  // gate was placed (shouldn't happen in the current UI, which has no
  // point-delete) would otherwise crash the map render.
  if (!p1 || !p2) return null;
  const centerLat = p1.lat + (p2.lat - p1.lat) * gate.position;
  const centerLng = p1.lng + (p2.lng - p1.lng) * gate.position;
  const segLengthFeet = new LatLng(p1.lat, p1.lng).distanceTo(new LatLng(p2.lat, p2.lng)) * FEET_PER_METER;
  const isDouble = gate.type === "double";
  const widthFeet = GATE_WIDTH_FEET[gate.type] ?? GATE_WIDTH_FEET.single;
  // Half-width as a fraction of the segment, capped at 45% each side so
  // a short segment never renders a span past its own endpoints.
  const halfFraction = segLengthFeet > 0 ? Math.min(0.45, widthFeet / 2 / segLengthFeet) : 0.05;
  const dLat = (p2.lat - p1.lat) * halfFraction;
  const dLng = (p2.lng - p1.lng) * halfFraction;
  const endA: [number, number] = [centerLat - dLat, centerLng - dLng];
  const endB: [number, number] = [centerLat + dLat, centerLng + dLng];
  return (
    <>
      {/* react-leaflet's <Tooltip> binds to whatever Layer it's nested
          INSIDE (context.overlayContainer) — a standalone sibling
          Tooltip with just a `position` silently never attaches to the
          map at all (context.overlayContainer is null, so react-leaflet's
          own binding effect no-ops). Nesting it inside this Polyline
          fixes that; the explicit `position` prop still overrides where
          it actually shows, same as it would standalone. */}
      <Polyline positions={[endA, endB]} pathOptions={{ color: "#f59e0b", weight: isDouble ? 6 : 4, dashArray: "5 4" }}>
        <Tooltip position={[centerLat, centerLng]} direction="top" offset={[0, -10]} permanent className="bg-transparent border-none shadow-none">
          <span className="font-bold text-xs" style={{ color: "#f59e0b", textShadow: "0 0 3px black" }}>{GATE_LABEL[gate.type] || "Gate"}</span>
        </Tooltip>
      </Polyline>
      <CircleMarker center={endA} radius={5} color="white" weight={2} fillColor="#f59e0b" fillOpacity={1} />
      <CircleMarker center={endB} radius={5} color="white" weight={2} fillColor="#f59e0b" fillOpacity={1} />
    </>
  );
}

function FenceLine({ points, color, weight, isEditing, onPointDragEnd, onLineClick, onEndpointClick, onDeletePoint, onSquareCorner, gates = [], placingGate, onSegmentClick, isExtending }: { points: any[], color: string, weight: number, isEditing?: boolean, onPointDragEnd?: (index: number, newLatLng: LatLng) => void, onLineClick?: () => void, onEndpointClick?: (index: number) => void, onDeletePoint?: (index: number) => void, onSquareCorner?: (index: number) => void, gates?: { type: string; segmentIndex: number; position: number }[], placingGate?: boolean, onSegmentClick?: (segmentIndex: number, latlng: LatLng) => void, isExtending?: boolean }) {
  // Which point's delete/square-corner badges are showing — a CLICK
  // selection, not a hover (2026-09-14, direct feedback). Hover was the
  // original design, but it fought the drag handle directly: nudging
  // the cursor toward the handle to grab it could brush past the
  // hover-triggered badges first, and the badges could flicker in/out
  // while just aiming. A deliberate click is a real, stable choice —
  // it stays showing until you click elsewhere, so there's time to
  // actually reach for a badge without it vanishing. Tracked here (one
  // per LINE, not per-Marker) since only one point can be selected at
  // a time.
  //
  // `isExtending` (passed down only for the editingLine render) hides
  // both badges regardless of selection — clicking an ENDPOINT selects
  // it here AND still fires the existing (unchanged, pending its own
  // redesign — see CLAUDE.md) click-to-extend trigger, swapping the
  // whole map into "click to extend" mode. A delete badge sitting on
  // that same point while the pill and a "Finish Extending" button are
  // telling you to click the map instead would just be visual clutter,
  // not a real option worth keeping on screen.
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  // Whole-line hover highlight (2026-09-13), direct feedback that an
  // unselected line wasn't obviously clickable — nothing distinguished a
  // "just sitting there" line from an interactive one until you actually
  // clicked it. Tracked once per LINE, not per segment: hovering any one
  // segment highlights every segment, so the whole line reads as one
  // clickable thing rather than several independent ones. Only meaningful
  // pre-edit — the `isEditing` (orange) render of this same component
  // never sets this, since it's already unambiguously the active line.
  const [isHovered, setIsHovered] = useState(false);
  const segments = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = new LatLng(points[i].lat, points[i].lng);
    const p2 = new LatLng(points[i + 1].lat, points[i + 1].lng);
    const intermediate = getIntermediatePoints(p1, p2);
    const segmentLength = p1.distanceTo(p2) * FEET_PER_METER;
    const midPoint = new LatLng((p1.lat + p2.lat) / 2, (p1.lng + p2.lng) / 2);

    segments.push(
      <Fragment key={`segment-${i}`}>
        {/* react-leaflet's <Tooltip> binds to whatever Layer it's nested
            INSIDE (context.overlayContainer) — as a standalone sibling
            (the previous shape here) it silently never attaches to the
            map at all, so this "run" length badge had never actually
            been rendering. Nesting it inside this Polyline fixes that;
            the explicit `position` prop still overrides where it shows,
            same as it would standalone. Styled like the homepage hero
            illustration (accent fill, primary border/text, mono font)
            rather than plain white shadowed text, so a "run" reads as a
            deliberate, named piece of the fence, not a generic label. */}
        {/* Invisible, much-wider "hit area" polyline (2026-09-14) — direct
            feedback that clicking a line to select it required an
            unreasonably precise click, since a real Leaflet SVG path's
            click target is exactly as wide as its visible stroke (3px,
            here). Rather than thickening the visible line itself (which
            would change its look at rest, not just its click tolerance),
            a separate transparent line with a much larger `weight` carries
            every event handler instead — a standard Leaflet technique for
            widening a thin line's hit-test area without touching its
            appearance. `opacity: 0` still receives pointer events (Leaflet
            doesn't set `pointer-events: none` on interactive layers), so
            this is invisible but fully clickable/hoverable. */}
        <Polyline
          positions={[p1, p2]}
          pathOptions={{ color: "#000", weight: 20, opacity: 0 }}
          eventHandlers={
            placingGate && onSegmentClick
              ? { click: (e: any) => onSegmentClick(i, e.latlng) }
              : {
                  click: onLineClick,
                  mouseover: () => !isEditing && setIsHovered(true),
                  mouseout: () => setIsHovered(false),
                }
          }
        />
        <Polyline
          positions={[p1, p2]}
          pathOptions={
            placingGate
              ? { color: "#f59e0b", weight: weight + 2, dashArray: "8 6" }
              : { color, weight: isHovered && !isEditing ? weight + 3 : weight }
          }
          interactive={false}
        >
          <Tooltip position={midPoint} permanent direction="center" className="bg-transparent border-none shadow-none">
            <span className="inline-block rounded px-2 py-0.5 font-mono text-xs font-semibold bg-accent/95 text-primary border border-primary shadow-sm">
              {segmentLength.toFixed(1)} ft
            </span>
          </Tooltip>
        </Polyline>
        {intermediate.map((post, postIdx) => (
          <CircleMarker key={`post-${i}-${postIdx}`} center={post} radius={3} color="white" weight={1} fillColor="black" />
        ))}
      </Fragment>
    );
  }

  return (
    <>
      {segments}
      {gates.map((gate, idx) => (
        <GateMarker key={`gate-${idx}`} gate={gate} points={points} />
      ))}
      {points.map((p, idx) => (
        <Fragment key={p.id || `marker-${idx}`}>
          <Marker
            position={[p.lat, p.lng]}
            icon={isEditing ? (selectedIdx === idx ? dragHandleIconSelected : dragHandleIcon) : defaultIcon}
            draggable={isEditing}
            eventHandlers={{
              dragend: (e) => {
                if (isEditing && onPointDragEnd) {
                  onPointDragEnd(idx, e.target.getLatLng());
                }
              },
              click: () => {
                if (isEditing && onEndpointClick && (idx === 0 || idx === points.length - 1)) {
                  onEndpointClick(idx);
                } else if (onLineClick && !isEditing) {
                  onLineClick();
                  return;
                }
                // Click-to-select (2026-09-14) — toggles the delete/
                // square-corner badges on for THIS point, off for
                // whichever other point had them. Endpoints also still
                // fire onEndpointClick above (unchanged, pending a real
                // redesign of that trigger — see CLAUDE.md); selecting
                // them here too is harmless even though extend mode's
                // own UI takes over immediately after.
                if (isEditing) {
                  setSelectedIdx((current) => (current === idx ? null : idx));
                }
              },
            }}
          >
            <Tooltip permanent direction="top" offset={[0, -20]} className="bg-transparent border-none shadow-none font-bold text-primary">
              {idx + 1}
            </Tooltip>
          </Marker>
          {/* Delete-this-point affordance — only while editing, only on
              the SELECTED point (a click, not a hover — see
              `selectedIdx`'s own comment), and only when the line would
              still have >= 2 points left afterward (a line can't be
              shorter than that; removing the whole thing is the
              sidebar's trash-icon job instead). */}
          {isEditing && !isExtending && onDeletePoint && selectedIdx === idx && points.length > 2 && (
            <Marker
              position={[p.lat, p.lng]}
              icon={deletePointIcon}
              interactive={true}
              eventHandlers={{
                click: () => {
                  onDeletePoint(idx);
                  setSelectedIdx(null);
                },
              }}
            />
          )}
          {/* "Square this corner" affordance — interior vertices only
              (idx 0 and the last point are endpoints, with only one
              adjacent segment, so there's no corner to square there).
              Same select-only, desktop-only-by-design pattern as delete. */}
          {isEditing && !isExtending && onSquareCorner && selectedIdx === idx && idx > 0 && idx < points.length - 1 && (
            <Marker
              position={[p.lat, p.lng]}
              icon={squareCornerIcon}
              interactive={true}
              eventHandlers={{
                click: () => onSquareCorner(idx),
              }}
            />
          )}
        </Fragment>
      ))}
    </>
  );
}


// Centers/fits the map on the project's own fence line(s) once, on
// load — not on the geocoded address point, which is often imprecise
// and (previously) just centered the whole browser window rather than
// the actually-visible left portion of it. Rendered as a MapContainer
// CHILD specifically so `useMap()` hands back an already-fully-ready
// Leaflet map instance — react-leaflet only renders MapContainer's
// children once its internal map instance exists (see MapContainer's
// own source), which sidesteps a real timing gap the parent's own
// `mapRef` ref has: react-leaflet populates that ref via a state update
// that lags a render behind the map's actual creation, so a plain
// parent-level effect reading `mapRef.current` right after mount can
// still see `null` — confirmed by logging it before landing on this
// fix. The right-hand panel is DOCKED (a real flex sibling that shrinks
// the map, not a floating overlay) whenever there's at least one line
// to show — see Editor.tsx's `isPanelDocked` — so bias the fit padding
// heavily to the right on desktop: fitBounds keeps the whole bounds
// inside the given margins, so a bigger right-side margin pushes the
// fence's visual center left, into the space that's actually visible
// once the panel eats the right ~480–560px. On mobile the panel is a
// full-screen sheet, not a width-eating column, so no bias is needed.
// Only fires once — guarded by the ref — so it doesn't fight a user's
// own pan/zoom on every later edit, just on initial load (and,
// incidentally, the moment a brand-new project's first line is saved).
//
// `maxZoom` is passed in rather than hardcoded to TILE_NATIVE_ZOOM
// (2026-09-10) — that cap exists specifically because Esri's real
// resolution ceiling is z19; a Pro account on Mapbox imagery has a
// higher real ceiling (MAPBOX_NATIVE_ZOOM), so capping its auto-fit at
// 19 regardless of plan would waste the sharper detail it's actually
// paying for. The caller passes whichever ceiling matches the tile
// layer actually in use.
function FitBoundsOnLoad({ existingLines, isMobile, maxZoom }: { existingLines: ExistingLine[]; isMobile?: boolean; maxZoom: number }) {
  const map = useMap();
  const hasFitRef = useRef(false);
  useEffect(() => {
    if (hasFitRef.current) return;
    const allPoints = existingLines.flatMap((l) => l.coordinates);
    if (allPoints.length === 0) return;
    hasFitRef.current = true;
    // Leaflet computes fitBounds' zoom from the container's CURRENT
    // measured size — right at mount that can still be 0x0 (layout
    // hasn't settled yet), which makes it "fit" by zooming out to
    // nearly the whole world instead of the fence line. invalidateSize()
    // forces a fresh measurement, and requestAnimationFrame pushes this
    // past the browser's first layout/paint pass so that measurement is
    // actually correct.
    requestAnimationFrame(() => {
      map.invalidateSize();
      const bounds = new LatLngBounds(allPoints.map((p) => [p.lat, p.lng] as [number, number]));
      const rightPadding = isMobile ? 40 : 520;
      map.fitBounds(bounds, {
        paddingTopLeft: [40, 40],
        paddingBottomRight: [rightPadding, 40],
        maxZoom,
      });
    });
  }, [existingLines, isMobile, map, maxZoom]);
  return null;
}

function MapEvents({ onMapClick }: { onMapClick: (e: any) => void }) {
  useMapEvents({ click: onMapClick });
  return null;
}

// Reports the map's current center up to the parent, so it can decide
// whether "Show property line" is even worth offering (2026-09-14,
// direct feedback — that button used to render unconditionally on
// every map, everywhere, for a feature that only ever works in
// Mississippi). Always mounted (not gated like MapEvents above, which
// only cares about clicks while drawing/extending) — visibility needs
// to track panning at all times. `useMapEvents` returns the real map
// instance the same way `useMap()` does; the mount-time effect below
// covers the initial center, since `moveend` only fires on a later,
// real pan/zoom.
function MapCenterTracker({ onCenterChange }: { onCenterChange: (center: LatLng) => void }) {
  const map = useMapEvents({ moveend: () => onCenterChange(map.getCenter()) });
  useEffect(() => {
    onCenterChange(map.getCenter());
  }, [map]);
  return null;
}

function AddressSearchInput({ value, onValueChange, onSearch, isSearching, autoFocus }: { value: string, onValueChange: (value: string) => void, onSearch: () => void, isSearching: boolean, autoFocus?: boolean }) {
  return (
    <div className="flex gap-2">
      <Input autoFocus={autoFocus} placeholder="Enter property address..." value={value} onChange={(e) => onValueChange(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onSearch()} disabled={isSearching} className="text-sm" />
      <Button size="icon" onClick={onSearch} disabled={isSearching || !value.trim()} variant="outline">
        {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
      </Button>
    </div>
  );
}

interface Point { lat: number; lng: number; id: number; }
interface GateInfo { type: string; segmentIndex: number; position: number; }
interface ExistingLine { id: number; coordinates: { lat: number, lng: number }[]; gates?: GateInfo[]; }
interface MapEditorProps {
  initialCenter?: [number, number];
  initialAddress?: string;
  onSave: (points: Point[], length: number) => void;
  isSaving: boolean;
  existingLines?: ExistingLine[];
  isMobile?: boolean;
  selectedLineId?: number | null;
  onLineSelect?: (id: number | null) => void;
  editingLine?: any | null;
  onLineUpdate?: (line: any) => void;
  isDrawing?: boolean;
  onCancelDrawing?: () => void;
  // Starts a brand-new line (2026-09-14) — powers the status pill's own
  // "Create a Fence Line" CTA for a project with zero lines yet (see
  // `showingStartPrompt`), so the one real affordance that starts
  // drawing at all is visible on the map itself, on every device, with
  // nothing extra to open. Editor.tsx's old NewProjectInstructions
  // component rendered this same button through a desktop-only floating
  // panel (and, briefly, mobile's Sheet) — removed once this made both
  // paths fully redundant.
  onStartDrawing?: () => void;
  controlsPosition?: 'left' | 'right';
  // Gate placement — see EditFenceLineCard's Gates section. Active only
  // while editingLine is set: 'single' | 'double' puts the editing
  // line's segments into a clickable, highlighted "place it here" mode;
  // null means normal editing (drag points / extend).
  placingGateType?: 'single' | 'double' | null;
  onGatePlaced?: (segmentIndex: number, position: number) => void;
  // Deletes a single point from the line currently being edited — see
  // FenceLine's hover-only delete-point affordance. The actual
  // coordinate-splicing (and any gate-segmentIndex fallout) happens in
  // Editor.tsx, which owns editingLine and the gate mutations; this
  // component just forwards the raw "user clicked delete on point N"
  // event, the same shape as onGatePlaced above.
  onDeletePoint?: (index: number) => void;
  // Gates the Mapbox satellite-streets tile layer above — see
  // MAPBOX_STYLE's own comment. Free accounts (or a Pro account before
  // VITE_MAPBOX_TOKEN is set) fall through to the existing Esri stack
  // unchanged, never a broken/blank map.
  isPro?: boolean;
  // QuotePlanView.tsx (2026-09-11) — a customer's read-only view of
  // their own fence plan, no login, reusing this component AS-IS
  // rather than a stripped-down clone: every real edit affordance here
  // (dragging, hover delete-point/square-corner, gate placement) is
  // already gated behind `isEditing`/`editingLine` matching a specific
  // line, so passing `editingLine={null}` and no callbacks already
  // makes everything else correctly inert with zero new code. The ONE
  // thing that doesn't automatically become correct on its own is the
  // persistent bottom status bar's default text ("Select a line to
  // edit or create a new one") — written for an editing context that
  // genuinely doesn't exist on that page (there's no sidebar to select
  // a line INTO, no drawing flow to start). This is the only thing
  // `readOnly` changes.
  readOnly?: boolean;
}

export function MapEditorComponent({ initialCenter, initialAddress, onSave, isSaving, existingLines = [], isMobile, selectedLineId = null, onLineSelect = () => {}, editingLine = null, onLineUpdate = () => {}, isDrawing = false, onCancelDrawing = () => {}, onStartDrawing, controlsPosition = 'left', placingGateType = null, onGatePlaced = () => {}, onDeletePoint = () => {}, isPro = false, readOnly = false }: MapEditorProps) {
  // A Pro account with no token set yet (VITE_MAPBOX_TOKEN unset —
  // see the migration/env-setup note in CLAUDE.md) still gets the
  // normal free Esri map, never a broken one.
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
  const useMapboxImagery = isPro && !!mapboxToken;
  const [points, setPoints] = useState<Point[]>([]);
  const [totalDistance, setTotalDistance] = useState(0);
  const mapRef = useRef<any>(null);
  const { toast } = useToast();
  const [address, setAddress] = useState(initialAddress || "");
  const [isSearching, setIsSearching] = useState(false);
  const [isExtending, setIsExtending] = useState(false);
  const [extendingFrom, setExtendingFrom] = useState<'start' | 'end' | null>(null);
  const [parcel, setParcel] = useState<{
    parcelId: string;
    ownerName: string | null;
    siteAddress: string | null;
    geometry?: GeoJSON.Polygon | GeoJSON.MultiPolygon | any;
  } | null>(null);
  const parcelLookup = useParcelLookup();
  // Drives whether "Show property line" even renders — see
  // isLikelyInMississippi's own comment and MapCenterTracker below.
  // Starts null (unknown) rather than defaulting to visible, so there's
  // no flash-then-hide the instant the map actually reports its center.
  const [mapCenter, setMapCenter] = useState<LatLng | null>(null);
  const showsParcelFeature = !!mapCenter && isLikelyInMississippi(mapCenter.lat, mapCenter.lng);
  // Persistent (non-toast) guidance for when the address can't be located —
  // null once there's no unresolved issue. The toast alone used to be the
  // only feedback: it disappears in a few seconds and leaves the user with
  // a map that (before the DEFAULT_CENTER fix above) wasn't even
  // interactive and, either way, no obvious next step. This banner stays
  // up, keeps the failed address visible, and gives them a search box
  // right there to retry — see the render block near the bottom of this
  // component.
  const [geocodeIssue, setGeocodeIssue] = useState<{ address: string; message: string } | null>(null);
  // Real, reported problem (2026-09-14) this app's own "second geocoding
  // failure mode" note above always flagged as the actual fix, deferred
  // until now: a plain street address with no city/state ("12141 N
  // Shady Tree Ln") can genuinely match several real places nationwide
  // — Nominatim doesn't pick the one you meant, it just returns SOME
  // result, and this app used to trust `results[0]` blindly regardless.
  // Now `handleSearch` asks for up to 5 matches instead of 1; if more
  // than one comes back, nothing auto-navigates — this holds the real
  // candidates (each one's own `display_name`, which names its actual
  // city/state, disambiguating "Idaho" from "Tennessee" at a glance)
  // until the user picks the right one. `zoomToState` is carried along
  // so picking a candidate zooms exactly the way a single unambiguous
  // match already would have.
  const [geocodeCandidates, setGeocodeCandidates] = useState<{ zoomToState: boolean; results: { lat: number; lon: number; display_name: string }[] } | null>(null);

  // True whenever a click on the map places a point — a new line, an
  // extension of an existing one, or a gate snapped to a segment. Drives
  // the crosshair cursor (see index.css's .cursor-crosshair-map) so the
  // one place a user's attention actually is — the map surface, right at
  // their mouse — signals the click means something different than
  // panning. Deliberately excludes plain editingLine dragging: that's a
  // drag interaction, not click-to-place, so the default cursor is
  // already correct there.
  const isPlacingPoint = isDrawing || isExtending || !!placingGateType;

  // Drives the status pill's own "Create a Fence Line" CTA below
  // (2026-09-14, direct feedback) — a brand-new project used to get a
  // whole separate floating card ("Create your first fence line...")
  // on top of the map, which on mobile could sit right under a
  // property-creation toast, covering the header. Folded the CTA
  // directly into the persistent status pill instead of a second
  // element — one thing on screen, not two saying almost the same
  // thing on top of each other.
  const showingStartPrompt = !isDrawing && !editingLine && !readOnly && existingLines.length === 0 && !!onStartDrawing;

  // Same fix, same day, for the NEXT step (2026-09-14) — reported live
  // with a screenshot: mid-drawing, the "New Fence Line" card (Total
  // Length, Undo, Delete, Save Line) sat at this same mobile `top-4`
  // spot as the centered pill above it, and the pill's own progressive
  // instruction text painted right over the card's title — the exact
  // overlap shape `showingStartPrompt` above already fixed once,
  // recurring one step later in the same flow. Desktop's side-anchored
  // card never had this problem (see its own render condition just
  // above) and is untouched; this only applies on mobile.
  const showingDrawingPrompt = isDrawing && !editingLine && isMobile;

  // MapContainer's own `className` prop only applies once, at the
  // initial imperative L.map(...) construction — react-leaflet doesn't
  // re-render it on later prop changes (confirmed live: the class was
  // simply never there on a later check), same shape as the ResizeObserver
  // effect below needing to reach into the container directly rather than
  // relying on React's normal prop diffing for this imperatively-owned
  // element.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.getContainer().classList.toggle("cursor-crosshair-map", isPlacingPoint);
  }, [isPlacingPoint]);

  // A brief one-time pulse around the map's edge right as a NEW line's
  // drawing session starts (see index.css's fence-draw-hint keyframes) —
  // connects "I clicked Create a Fence Line" to "now look at the map"
  // more directly than text alone in a corner card. Scoped to isDrawing
  // specifically (not isExtending/gate-placement, which a user reaches
  // via more advanced, already-familiar flows). Re-fires every time a
  // NEW line's drawing starts, not just the very first ever — cheap and
  // harmless to repeat, unlike the INSTRUCTIONS card, which genuinely
  // only shows once per project.
  const [showDrawHint, setShowDrawHint] = useState(false);
  useEffect(() => {
    if (!isDrawing) {
      setShowDrawHint(false);
      return;
    }
    setShowDrawHint(true);
    const timer = setTimeout(() => setShowDrawHint(false), 2000);
    return () => clearTimeout(timer);
  }, [isDrawing]);

  // Leaflet sizes its tile grid off the container's dimensions at mount
  // time (or the last invalidateSize() call) — it doesn't notice a
  // CSS-driven resize on its own. The editor's right-hand panel switches
  // between a floating overlay and a docked column that shrinks this
  // map's flex container, so watch the container directly rather than
  // threading a "did the layout change" prop down from Editor.tsx —
  // this also covers the mobile sidebar sheet and plain window resizes
  // for free.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const container = map.getContainer();
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // Only geocode-and-center from the address when there are no fence
    // lines yet (a brand new project has no better data to center on).
    // Once real lines exist, the effect below fits the map to THEM
    // instead — real drawn points are strictly better than a geocoded
    // address point, and running both would just have this one's
    // setView race against (and sometimes win over) the bounds fit.
    if (initialAddress && existingLines.length === 0) {
      setAddress(initialAddress);
      handleSearch(initialAddress, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAddress]);


  useEffect(() => {
    if (!editingLine) {
      setIsExtending(false);
      setExtendingFrom(null);
    }
  }, [editingLine]);

  const handleSearch = async (searchAddress: string, zoomToState: boolean) => {
    if (!searchAddress.trim()) return;
    setIsSearching(true);
    try {
      // countrycodes=us: this app is entirely US-focused (retailer pricing,
      // MS-only parcel lookups) — restricting the geocoder to the US stops
      // it fuzzy-matching junk/placeholder text to a real but wildly wrong
      // location on another continent. Confirmed live: without this,
      // "1234 Fake St" silently "succeeded" and zoomed to a residential
      // block in Xi'an, China with no error shown at all (Nominatim's
      // match-confidence fields aren't reliable enough to filter on — a
      // real address like "200 E Capitol St, Jackson, MS" scored a LOWER
      // importance than that bogus China match). This narrows the blast
      // radius to "wrong US location" instead of "wrong continent," but
      // doesn't eliminate bad fuzzy matches entirely — Nominatim gives no
      // trustworthy signal to do that with.
      // limit=5, not 1 — a plain street address with no city/state
      // ("12141 N Shady Tree Ln") can genuinely match several real
      // places nationwide, and used to silently trust whichever one
      // Nominatim ranked first regardless of whether that was even
      // close to right. See geocodeCandidates' own comment for the
      // real fix this enables.
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=us&q=${encodeURIComponent(searchAddress)}&limit=5`);
      const rawResults = await response.json();
      // De-duplicate by display_name — Nominatim can return more than
      // one raw entry (different OSM object types) for what's really
      // the SAME place, which would otherwise show a disambiguation
      // prompt for an address that was never actually ambiguous.
      const seenNames = new Set<string>();
      const results = rawResults.filter((r: any) => {
        if (seenNames.has(r.display_name)) return false;
        seenNames.add(r.display_name);
        return true;
      });
      const closeZoom = useMapboxImagery ? MAPBOX_NATIVE_ZOOM : 20;
      if (results.length === 1 && looksSpecificEnoughToTrust(searchAddress)) {
        // Only auto-navigate when BOTH the API gave one answer AND the
        // input itself had enough in it (a ZIP or a real state) to trust
        // that answer — a single result for a bare, state-less query
        // still gets the confirmation prompt below, since that's exactly
        // the shape of query that silently matched Idaho instead of
        // Tennessee.
        const { lat, lon } = results[0];
        // Same Pro/Mapbox-aware ceiling as FitBoundsOnLoad's maxZoom
        // below — a brand-new property (no line yet, so this path runs
        // instead of that one) shouldn't land at a more conservative
        // zoom than the same property would get after its first line
        // is saved and the page reloads.
        handleAddressFound(parseFloat(lat), parseFloat(lon), zoomToState ? 8 : closeZoom);
        setGeocodeIssue(null);
        setGeocodeCandidates(null);
      } else if (results.length >= 1) {
        // Either genuinely ambiguous (more than one real place matched)
        // or a single result the input itself didn't earn enough trust
        // for — either way, hold off on navigating anywhere until the
        // user actually confirms which real place they meant.
        setGeocodeCandidates({
          zoomToState,
          results: results.map((r: any) => ({ lat: parseFloat(r.lat), lon: parseFloat(r.lon), display_name: r.display_name })),
        });
        setGeocodeIssue(null);
      } else {
        toast({ title: "Address not found", description: "The provided address could not be located.", variant: "destructive" });
        setGeocodeIssue({
          address: searchAddress,
          message: "Try adding more detail (city, state, ZIP) — or search a nearby address and pan/zoom to your property.",
        });
        setGeocodeCandidates(null);
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      toast({ title: "Search Error", description: "An error occurred while searching.", variant: "destructive" });
      setGeocodeIssue({
        address: searchAddress,
        message: "Something went wrong searching for that address. Try again, or pan/zoom the map manually to find your property.",
      });
      setGeocodeCandidates(null);
    } finally {
      setIsSearching(false);
    }
  };
  
  const onManualSearch = () => handleSearch(address, false);

  // Commits to whichever real candidate the user picked from
  // geocodeCandidates — same zoom logic handleSearch's own single-match
  // branch already uses, just triggered by a click instead of an
  // automatic "only one result" case.
  const handlePickCandidate = (lat: number, lon: number) => {
    if (!geocodeCandidates) return;
    const closeZoom = useMapboxImagery ? MAPBOX_NATIVE_ZOOM : 20;
    handleAddressFound(lat, lon, geocodeCandidates.zoomToState ? 8 : closeZoom);
    setGeocodeCandidates(null);
  };

  useEffect(() => {
    if (points.length < 2) {
      setTotalDistance(0);
      return;
    }
    let dist = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = new LatLng(points[i].lat, points[i].lng);
      const p2 = new LatLng(points[i + 1].lat, points[i + 1].lng);
      dist += p1.distanceTo(p2);
    }
    setTotalDistance(dist * FEET_PER_METER);
  }, [points]);

  const handleMapClick = (e: any) => {
    if (isExtending && editingLine) {
      const newPoint = { lat: e.latlng.lat, lng: e.latlng.lng, id: Date.now() };
      const newCoords = extendingFrom === 'start' ? [newPoint, ...editingLine.coordinates] : [...editingLine.coordinates, newPoint];
      onLineUpdate({ ...editingLine, coordinates: newCoords });
    } else if (isDrawing) {
      const newPoint: Point = { lat: e.latlng.lat, lng: e.latlng.lng, id: Date.now() };
      setPoints([...points, newPoint]);
    }
  };
  
  const handleUndo = () => setPoints(points.slice(0, -1));
  const handleClear = () => { setPoints([]); onCancelDrawing(); };

  const handleShowPropertyLine = () => {
    if (!mapRef.current) return;
    const center = mapRef.current.getCenter();
    parcelLookup.mutate(
      { lat: center.lat, lng: center.lng },
      {
        onSuccess: (result) => {
          if (result.found) {
            setParcel(result);
          } else {
            setParcel(null);
            // No longer blames "we only cover Mississippi" here — the
            // button itself is now gated to only appear when the map's
            // center is already within Mississippi (see
            // isLikelyInMississippi), so reaching this toast means the
            // STATE wasn't the problem. What's actually true: either
            // this exact spot isn't centered on a real parcel, or it's
            // a genuine gap in the underlying data.
            toast({
              title: "No property line found here",
              description: "Try panning so the property is centered under the map — or this spot may not be in the available parcel data yet.",
            });
          }
        },
      },
    );
  };
  
  const handleSave = () => {
    if (points.length < 2) return;
    let calculatedDist = 0;
    for (let i = 0; i < points.length - 1; i++) {
      calculatedDist += new LatLng(points[i].lat, points[i].lng).distanceTo(new LatLng(points[i + 1].lat, points[i + 1].lng));
    }
    onSave(points, calculatedDist * FEET_PER_METER);
    setPoints([]);
  };

  const handleAddressFound = (lat: number, lng: number, zoom: number) => {
    if (mapRef.current) mapRef.current.setView([lat, lng], zoom);
  };
  
  const handlePointDragEnd = (index: number, newLatLng: LatLng) => {
    const newCoords = [...editingLine.coordinates];
    newCoords[index] = { ...newCoords[index], lat: newLatLng.lat, lng: newLatLng.lng };
    onLineUpdate({ ...editingLine, coordinates: newCoords });
  };

  // "Square this corner" — index is an interior vertex (FenceLine's own
  // hover affordance only renders this for one); moves ONLY index+1,
  // see squareCorner()'s own comment for why. Same shape as
  // handlePointDragEnd above — a pure coordinate change, so it's
  // handled directly here rather than forwarded up to Editor.tsx the
  // way gate placement/point deletion are (those need extra bookkeeping
  // — segmentIndex shifting, gate blocking — that only Editor.tsx owns;
  // this doesn't touch segment topology at all, so there's nothing for
  // it to coordinate with).
  const handleSquareCorner = (index: number) => {
    const coords = editingLine.coordinates;
    if (index <= 0 || index >= coords.length - 1) return; // defensive — FenceLine already only offers this for interior points
    const newNext = squareCorner(coords[index - 1], coords[index], coords[index + 1]);
    const newCoords = [...coords];
    newCoords[index + 1] = { ...newCoords[index + 1], lat: newNext.lat, lng: newNext.lng };
    onLineUpdate({ ...editingLine, coordinates: newCoords });
  };

  const handleGateSegmentClick = (segmentIndex: number, latlng: LatLng) => {
    if (!editingLine) return;
    const p1 = new LatLng(editingLine.coordinates[segmentIndex].lat, editingLine.coordinates[segmentIndex].lng);
    const p2 = new LatLng(editingLine.coordinates[segmentIndex + 1].lat, editingLine.coordinates[segmentIndex + 1].lng);
    const position = projectFraction(p1, p2, latlng);
    onGatePlaced(segmentIndex, position);
  };

  const handleEndpointClick = (index: number) => {
    if (!editingLine) return;
    if (index === 0) {
      setExtendingFrom('start');
    } else {
      setExtendingFrom('end');
    }
    setIsExtending(true);
  };

  const DesktopContent = () => (
    <div className="space-y-4">
      <div className="bg-secondary/50 rounded-lg p-3 text-center border border-border/50">
        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Length</span>
        <div className="text-2xl font-mono font-bold text-foreground">{totalDistance.toFixed(1)} <span className="text-base text-muted-foreground">ft</span></div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="icon" onClick={handleUndo} disabled={points.length === 0} title="Undo last point"><Undo2 className="h-4 w-4" /></Button>
        <Button variant="outline" size="icon" onClick={handleClear} disabled={points.length === 0} className="text-destructive hover:text-destructive" title="Clear all"><Trash2 className="h-4 w-4" /></Button>
        <Button className="flex-1 gap-2 bg-primary hover:bg-primary/90" onClick={handleSave} disabled={points.length < 2 || isSaving}><Save className="h-4 w-4" />{isSaving ? "Saving..." : "Save Line"}</Button>
      </div>
    </div>
  );
  
  // MobileContent (Total Length + Undo/Clear/Save Line) removed
  // (2026-09-14) — mobile's drawing prompt now builds its own trimmed
  // button row directly inline (see `showingDrawingPrompt`'s render
  // block), dropping Total Length and Clear-all on purpose. This
  // component has no other caller left (desktop uses `DesktopContent`
  // in its own, still-separate, side-anchored card above).

  return (
    <div className="relative w-full h-full min-h-[500px]">
      <MapContainer ref={mapRef} center={initialCenter ?? DEFAULT_CENTER} zoom={initialCenter ? 12 : DEFAULT_ZOOM} maxZoom={MAP_MAX_ZOOM} scrollWheelZoom={true} className="w-full h-full z-0">
        {useMapboxImagery ? (
          // Pro-only path — see MAPBOX_STYLE's comment above for why this
          // one style replaces both Esri layers below (imagery + labels)
          // instead of needing its own separate labels overlay.
          <TileLayer
            key="mapbox"
            url={`https://api.mapbox.com/styles/v1/${MAPBOX_STYLE}/tiles/256/{z}/{x}/{y}?access_token=${mapboxToken}`}
            attribution={MAPBOX_ATTRIBUTION}
            maxZoom={MAP_MAX_ZOOM}
            maxNativeZoom={MAPBOX_NATIVE_ZOOM}
            tileSize={256}
          />
        ) : (
          <>
            <TileLayer
              key="esri-imagery"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution='&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
              maxZoom={MAP_MAX_ZOOM}
              maxNativeZoom={TILE_NATIVE_ZOOM}
            />
            {/* Hybrid overlay: transparent street name labels on top of the satellite
                imagery above. (Esri also has a Reference/World_Boundaries_and_Places
                layer that looks similar on paper, but it's country/state/county
                boundaries and place names, not street labels — verified by fetching
                real tiles before choosing between them.) */}
            <TileLayer
              key="esri-labels"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}"
              attribution='&copy; Esri'
              maxZoom={MAP_MAX_ZOOM}
            />
          </>
        )}
        {/* Grab/grabbing cursor on the drag-handle marker — needs
            `!important` the same reason the crosshair-while-drawing
            cursor does (see index.css's own comment): Leaflet sets
            cursor directly on `.leaflet-interactive`/draggable markers
            itself, which a plain unweighted rule here would lose to. */}
        <style>{`.leaflet-drag-handle { cursor: grab !important; } .leaflet-drag-handle:active { cursor: grabbing !important; }`}</style>
        {(isDrawing || isExtending) && <MapEvents onMapClick={handleMapClick} />}
        <MapCenterTracker onCenterChange={setMapCenter} />
        <FitBoundsOnLoad existingLines={existingLines} isMobile={isMobile} maxZoom={useMapboxImagery ? MAPBOX_NATIVE_ZOOM : TILE_NATIVE_ZOOM} />

        {parcel && parcel.geometry && (
          // key forces a remount on a new lookup — react-leaflet's GeoJSON
          // doesn't re-render its layer when the `data` prop changes.
          <GeoJSON
            key={parcel.parcelId}
            data={parcel.geometry as any}
            pathOptions={{ color: "#facc15", weight: 3, fillOpacity: 0.05, dashArray: "6 4" }}
          >
            <Tooltip sticky>
              {parcel.siteAddress || "Property line"}
              {parcel.ownerName ? ` — ${parcel.ownerName}` : ""}
            </Tooltip>
          </GeoJSON>
        )}
        
        {/* A real, pre-existing bug surfaced while building the new
            drag-handle marker (2026-09-13): the line currently being
            edited was rendering HERE too — the plain, non-draggable
            blue copy, fully underneath the separate orange `isEditing`
            FenceLine below — at the exact same coordinates. The old
            default/edit icons were similar-enough blue pins that the
            resulting z-fighting was invisible; the new drag-handle
            circle made it obvious (Leaflet's marker z-index is
            assigned by screen Y position, not render order, so which
            copy actually ends up on top — and therefore which one
            actually receives clicks/drags — was arbitrary per point).
            Skipping the currently-editing line here entirely, not just
            hiding its gates (the narrower fix this used to be), removes
            the duplicate outright rather than leaving two full copies
            fighting for the same pixels. */}
        {existingLines.filter(line => line.id !== editingLine?.id).map(line => (
          <FenceLine
            key={line.id}
            points={line.coordinates}
            color={selectedLineId === line.id ? 'red' : 'blue'}
            weight={selectedLineId === line.id ? 5 : 3}
            onLineClick={() => onLineSelect(line.id)}
            gates={line.gates || []}
          />
        ))}

        {editingLine && (
           <FenceLine
             points={editingLine.coordinates}
             color="orange"
             weight={5}
             isEditing={true}
             onPointDragEnd={handlePointDragEnd}
             onEndpointClick={handleEndpointClick}
             onDeletePoint={onDeletePoint}
             onSquareCorner={handleSquareCorner}
             gates={editingLine.gates || []}
             placingGate={!!placingGateType}
             onSegmentClick={handleGateSegmentClick}
             isExtending={isExtending}
           />
        )}
        
        {points.length > 0 && (
           <FenceLine
             points={points}
             color="var(--primary)"
             weight={4}
           />
        )}

      </MapContainer>

      {showDrawHint && (
        <div className="absolute inset-0 z-30 pointer-events-none rounded-lg fence-draw-hint" />
      )}

      {/* Desktop only (2026-09-14) — on mobile this card sat at this same
          `top-4` spot as the centered status pill below, and a real
          user report showed the pill's own text painting over this
          card's title, same overlap shape as the INSTRUCTIONS card
          this file already fixed the same day. Desktop's version is
          side-anchored (`left-4`/`right-4`, controlsPosition), never
          shares the pill's centered spot, and was never reported
          broken — left exactly as-is. Mobile's equivalent content now
          lives inside the pill stack itself, see `showingDrawingPrompt`
          below. */}
      {isDrawing && !editingLine && !isMobile && (
        <Card className={cn("absolute top-4 z-40 bg-panel/95 text-panel-foreground backdrop-blur shadow-xl border-border/50 rounded-lg", `${controlsPosition === 'left' ? 'left-4' : 'right-4'} w-full max-w-md lg:w-96 p-4`)}>
          <h3 className="font-display font-bold text-lg flex items-center gap-2 mb-4"><Ruler className="w-5 h-5 text-primary" /> New Fence Line</h3>
          <DesktopContent />
        </Card>
      )}

      {/* Persistent geocode-failure guidance. This is the case that used
          to strand a user: a project created with an address that
          doesn't geocode landed them on a map with only a transient
          toast and (before the DEFAULT_CENTER fix above) no way to even
          interact with the map, let alone fix the address.
          Deliberately NOT suppressed while the "New Fence Line" card is
          showing (2026-09-11) — that card used to have its own
          redundant address search box (removed: a property's address
          is already entered once at creation, asking again here made
          no sense), which is what the suppression existed for in the
          first place. Without that box, drawing mode has no other way
          to fix a bad address, so this banner staying up is what
          prevents the exact stranding this was built to fix. Screen
          position keeps them from visually colliding regardless (this
          banner is top-center; the New Fence Line card is anchored
          top-left/top-right).

          Moved up here from a small bottom-left pill (2026-09-13),
          direct feedback that the instructions were easy to lose track
          of down there among everything else happening on screen. Both
          this banner and the pill below now share ONE top-center
          stack — a flex column, not two independently-positioned
          elements with a hand-tuned pixel gap — so they can never
          overlap regardless of how tall the banner's message gets; the
          wrapper has no fixed width (sized to its widest child, capped
          by the banner's own max-w-md), so — unlike a full `inset-x-0`
          span — it never blocks map clicks outside its own visible
          footprint, no `pointer-events-none` dance required. */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-3">
        {/* Address-disambiguation picker (2026-09-14) — shares this same
            top-center stack; mutually exclusive with geocodeIssue below
            (one means "found something to check," the other means
            "found nothing at all"), so there's never a risk of both
            showing at once. Each button's own label is the candidate's
            real `display_name` — Nominatim's own full "street, city,
            state" string — which is exactly what actually disambiguates
            "12141 N Shady Tree Ln" in Tennessee from the same street
            address in Idaho; no separate explanation text needed beyond
            that. Covers TWO real cases with one UI: genuinely multiple
            candidates to pick between, AND (see looksSpecificEnoughToTrust's
            own comment) a single result the input itself didn't earn
            enough trust for — the heading and framing adapt, but the
            underlying "here's what we found, you pick" interaction is
            identical either way. */}
        {geocodeCandidates && (
          <Card className="w-[calc(100vw-2rem)] max-w-md bg-panel/95 text-panel-foreground backdrop-blur shadow-xl border-border/50 rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">
                  {geocodeCandidates.results.length === 1 ? "Is this the right address?" : "Which one did you mean?"}
                </p>
                {geocodeCandidates.results.length === 1 && (
                  <p className="text-xs text-muted-foreground">
                    That search didn't include a city or state, so we want to confirm before centering the map here.
                  </p>
                )}
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 -mt-1 -mr-1 shrink-0"
                onClick={() => setGeocodeCandidates(null)}
                aria-label="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {geocodeCandidates.results.map((c, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePickCandidate(c.lat, c.lon)}
                  className="w-full text-left text-sm rounded-md border border-border/60 px-3 py-2 hover:bg-primary/5 hover:border-primary/40 transition-colors"
                >
                  {c.display_name}
                </button>
              ))}
            </div>
            {/* Same reasoning as geocodeIssue's own search box below —
                dismissing this card with no way to search again would
                just reproduce the exact "stranded with an interactive
                but un-navigable map" gap that banner was originally
                built to close. "Add a city and state" is the literal,
                actionable fix for exactly what got someone here. */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Not it? Add a city and state and search again:</p>
              <AddressSearchInput value={address} onValueChange={setAddress} onSearch={onManualSearch} isSearching={isSearching} />
            </div>
          </Card>
        )}
        {geocodeIssue && (
          <Card className="w-[calc(100vw-2rem)] max-w-md bg-panel/95 text-panel-foreground backdrop-blur shadow-xl border-border/50 rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 text-destructive shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Couldn't locate "{geocodeIssue.address}"</p>
                  <p className="text-xs text-muted-foreground">{geocodeIssue.message}</p>
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 -mt-1 -mr-1 shrink-0"
                onClick={() => setGeocodeIssue(null)}
                aria-label="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
            <AddressSearchInput value={address} onValueChange={setAddress} onSearch={onManualSearch} isSearching={isSearching} autoFocus />
          </Card>
        )}

        {/* The main "what does this map want from me right now" hint —
            enlarged and given more breathing room in the same pass that
            moved it up here (2026-09-13, direct feedback), since a
            bigger target at top-center is also easier to actually read
            than a small pill tucked in a corner.

            For a brand-new project, this now carries its OWN "Create a
            Fence Line" button rather than just naming the action
            (2026-09-14, direct feedback) — a separate floating card
            used to own that button, which meant a new property showed
            TWO things stacked near the top of the map saying almost the
            same thing (worse on mobile, where the card was full-width
            right under this centered pill and could also sit under a
            property-creation toast). Folded into one element instead:
            still `bg-panel/95 backdrop-blur` for the same visual
            family, just `rounded-2xl` and a column layout in this one
            case, since a single `rounded-full` pill can't hold a full
            sentence and a button without looking cramped. */}
        {showingStartPrompt ? (
          <div className="bg-panel/95 text-panel-foreground backdrop-blur px-5 py-4 rounded-2xl border border-border/50 shadow-xl text-center flex flex-col items-center gap-3 max-w-[calc(100vw-2rem)] sm:max-w-sm">
            <p className="text-sm font-medium">To get started, create a new fence line on the map.</p>
            <Button onClick={onStartDrawing} className="gap-2">
              <Plus className="w-4 h-4" /> Create a Fence Line
            </Button>
          </div>
        ) : showingDrawingPrompt ? (
          // Same merge as showingStartPrompt just above, one step later
          // in the flow. Trimmed further than that first merge, per
          // direct feedback right after it shipped: Total Length and
          // the Clear-all/delete button dropped entirely rather than
          // folded in — on a small screen, the progressive text plus
          // Undo/Save Line is everything actually needed while placing
          // points; the running length and a destructive "clear
          // everything" action aren't worth the extra height. Undo
          // stays (a real, still-relevant drawing action); Save Line
          // is the one this request specifically asked to move in,
          // mirroring `showingStartPrompt`'s single-button shape.
          <div className="bg-panel/95 text-panel-foreground backdrop-blur px-5 py-4 rounded-2xl border border-border/50 shadow-xl text-center flex flex-col items-center gap-3 w-[calc(100vw-2rem)] sm:max-w-sm">
            <p className="text-sm font-medium">
              {points.length === 0
                ? "Click on the map to place your first fence post"
                : points.length === 1
                ? "Click to add your next post"
                : "Click to add another post, or click your first post again to finish"}
            </p>
            <div className="flex gap-2 w-full">
              <Button variant="outline" size="icon" onClick={handleUndo} disabled={points.length === 0} title="Undo last point"><Undo2 className="h-4 w-4" /></Button>
              <Button className="flex-1 gap-2 bg-primary hover:bg-primary/90" onClick={handleSave} disabled={points.length < 2 || isSaving}><Save className="h-4 w-4" />{isSaving ? "Saving..." : "Save Line"}</Button>
            </div>
          </div>
        ) : (
        <div className="bg-panel/95 text-panel-foreground backdrop-blur px-5 py-3 rounded-full text-sm font-medium border border-border/50 shadow-xl text-center">
          {placingGateType
            ? `Click on the highlighted line to place the ${placingGateType} gate`
            : isExtending
            ? "Click on the map to extend the line"
            : editingLine
            ? "Drag a point to move it, click one for more options, or click an endpoint to extend the line"
            : isDrawing
            // Progressive, not a static message regardless of progress —
            // matches NewFenceLineCard's own "click the first point again
            // to finish" promise once there's an actual line to close.
            ? points.length === 0
              ? "Click on the map to place your first fence post"
              : points.length === 1
              ? "Click to add your next post"
              : "Click to add another post, or click your first post again to finish"
            : readOnly
            ? "Viewing only — pan and zoom to look around"
            // Defensive fallback only — every real non-readOnly caller
            // passes onStartDrawing (Editor.tsx does), so a zero-line
            // project always takes the `showingStartPrompt` branch
            // above instead of reaching this text at all.
            : existingLines.length === 0
            ? 'Click "Create a Fence Line" to get started'
            // Plain-language rewrite (2026-09-14, direct feedback) —
            // named the actual action (click) instead of the abstract
            // verb ("select"), which didn't say HOW to select anything.
            : "Click a fence line to select and edit it, or draw a new one"}
        </div>
        )}
      </div>

      {isExtending && (
        <div className="absolute bottom-16 left-4 z-40">
          <Button onClick={() => setIsExtending(false)}>Finish Extending</Button>
        </div>
      )}

      {/* Gated on `showsParcelFeature` (2026-09-14, direct feedback) —
          this used to render unconditionally on every project's map
          regardless of where it actually is, for a feature that only
          ever works in Mississippi. `|| parcel` keeps "Hide property
          line" reachable even if a result is already showing and the
          map then gets panned just outside the box — the user should
          still be able to dismiss what's already on screen. */}
      {(showsParcelFeature || parcel) && (
        <div className="absolute bottom-4 right-4 z-40 flex gap-2">
          {parcel && (
            <Button
              size="sm"
              variant="secondary"
              className="shadow-sm bg-background/90 backdrop-blur"
              onClick={() => setParcel(null)}
            >
              Hide property line
            </Button>
          )}
          {showsParcelFeature && (
            <Button
              size="sm"
              variant="secondary"
              className="gap-2 shadow-sm bg-background/90 backdrop-blur"
              onClick={handleShowPropertyLine}
              disabled={parcelLookup.isPending}
              title="Looks up the property line at the center of the map (Mississippi only, for now)"
            >
              {parcelLookup.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPinned className="h-4 w-4" />}
              Show property line
            </Button>
          )}
        </div>
      )}
    </div>
  );
}