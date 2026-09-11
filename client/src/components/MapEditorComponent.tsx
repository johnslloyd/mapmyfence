import { useEffect, useState, useRef, Fragment } from "react";
import { MapContainer, TileLayer, Marker, Polyline, GeoJSON, useMapEvents, useMap, Tooltip, CircleMarker } from "react-leaflet";
import { LatLng, LatLngBounds, Icon, DivIcon } from "leaflet";
import { Button } from "@/components/ui/button";
import { Undo2, Save, Trash2, Ruler, Search, Loader2, MapPinned, AlertTriangle, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useParcelLookup } from "@/hooks/use-projects";
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

const editIcon = new Icon({
  iconUrl, iconRetinaUrl, shadowUrl,
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], tooltipAnchor: [16, -28], shadowSize: [41, 41],
  className: 'leaflet-edit-marker'
});

// Hover-only delete affordance for a line point while editing — a
// small red × badge, anchored so it sits up-and-right of the point's
// own pin rather than on top of it. Desktop-only by design (hover has
// no touch equivalent); this was an explicit, deliberate tradeoff, not
// an oversight — see the pin marker's own eventHandlers below.
// 26px (up from an earlier 18px pass) with real Lucide glyph data — a
// plain "×" character read as thin/inconsistent at a glance; this is
// Lucide's exact X path (lucide-react's x.js), same "confirmed exact
// glyph, not hand-approximated" discipline this app's favicon was built
// with, not a redrawn approximation. iconAnchor scaled to keep the same
// real gap above the point marker's own pin (12px) and the same 4px
// horizontal offset the original 18px version used.
const deletePointIcon = new DivIcon({
  className: "",
  html: `<div style="background:#ef4444;border-radius:9999px;width:26px;height:26px;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4);cursor:pointer;"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></div>`,
  iconSize: [26, 26],
  iconAnchor: [-4, 38],
});

// Hover-only "square this corner" affordance — an interior vertex only
// (needs two adjacent segments to form a corner at all; an endpoint has
// just one). Anchored up-and-LEFT (mirrored from deletePointIcon's
// up-and-right) so the two never overlap when both show on the same
// hovered point. Same desktop-only-by-design reasoning as delete.
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
  iconAnchor: [30, 38],
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

const GATE_LABEL: Record<string, string> = { single: "Single Gate", double: "Double Gate" };
// Real-world opening widths, not arbitrary pixel sizes — a single gate
// is a standard 3-4ft walk-through opening, a double gate (two hinged
// leaves) is roughly double that. Used to size the gate's visual span
// as an actual fraction of the segment's real length (via
// LatLng.distanceTo(), same as every other real distance in this app),
// so it reads as genuinely wider on the map, not just a bigger icon.
const GATE_WIDTH_FEET: Record<string, number> = { single: 4, double: 8 };

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

function FenceLine({ points, color, weight, isEditing, onPointDragEnd, onLineClick, onEndpointClick, onDeletePoint, onSquareCorner, gates = [], placingGate, onSegmentClick }: { points: any[], color: string, weight: number, isEditing?: boolean, onPointDragEnd?: (index: number, newLatLng: LatLng) => void, onLineClick?: () => void, onEndpointClick?: (index: number) => void, onDeletePoint?: (index: number) => void, onSquareCorner?: (index: number) => void, gates?: { type: string; segmentIndex: number; position: number }[], placingGate?: boolean, onSegmentClick?: (segmentIndex: number, latlng: LatLng) => void }) {
  // Hover-only delete-point affordance (desktop only — see
  // deletePointIcon's own comment). Tracked here, not per-Marker state,
  // since only one point can be hovered at a time.
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
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
        <Polyline
          positions={[p1, p2]}
          pathOptions={placingGate ? { color: "#f59e0b", weight: weight + 2, dashArray: "8 6" } : { color, weight }}
          eventHandlers={placingGate && onSegmentClick ? { click: (e: any) => onSegmentClick(i, e.latlng) } : { click: onLineClick }}
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
            icon={isEditing ? editIcon : defaultIcon}
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
                }
              },
              mouseover: () => isEditing && setHoveredIdx(idx),
              mouseout: () => setHoveredIdx((current) => (current === idx ? null : current)),
            }}
          >
            <Tooltip permanent direction="top" offset={[0, -20]} className="bg-transparent border-none shadow-none font-bold text-primary">
              {idx + 1}
            </Tooltip>
          </Marker>
          {/* Delete-this-point affordance — only while editing, only on
              hover, and only when the line would still have >= 2 points
              left afterward (a line can't be shorter than that; removing
              the whole thing is the sidebar's trash-icon job instead). */}
          {isEditing && onDeletePoint && hoveredIdx === idx && points.length > 2 && (
            <Marker
              position={[p.lat, p.lng]}
              icon={deletePointIcon}
              interactive={true}
              eventHandlers={{
                click: () => onDeletePoint(idx),
                mouseover: () => setHoveredIdx(idx),
                mouseout: () => setHoveredIdx((current) => (current === idx ? null : current)),
              }}
            />
          )}
          {/* "Square this corner" affordance — interior vertices only
              (idx 0 and the last point are endpoints, with only one
              adjacent segment, so there's no corner to square there).
              Same hover-only, desktop-only-by-design pattern as delete. */}
          {isEditing && onSquareCorner && hoveredIdx === idx && idx > 0 && idx < points.length - 1 && (
            <Marker
              position={[p.lat, p.lng]}
              icon={squareCornerIcon}
              interactive={true}
              eventHandlers={{
                click: () => onSquareCorner(idx),
                mouseover: () => setHoveredIdx(idx),
                mouseout: () => setHoveredIdx((current) => (current === idx ? null : current)),
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

export function MapEditorComponent({ initialCenter, initialAddress, onSave, isSaving, existingLines = [], isMobile, selectedLineId = null, onLineSelect = () => {}, editingLine = null, onLineUpdate = () => {}, isDrawing = false, onCancelDrawing = () => {}, controlsPosition = 'left', placingGateType = null, onGatePlaced = () => {}, onDeletePoint = () => {}, isPro = false, readOnly = false }: MapEditorProps) {
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
  // Persistent (non-toast) guidance for when the address can't be located —
  // null once there's no unresolved issue. The toast alone used to be the
  // only feedback: it disappears in a few seconds and leaves the user with
  // a map that (before the DEFAULT_CENTER fix above) wasn't even
  // interactive and, either way, no obvious next step. This banner stays
  // up, keeps the failed address visible, and gives them a search box
  // right there to retry — see the render block near the bottom of this
  // component.
  const [geocodeIssue, setGeocodeIssue] = useState<{ address: string; message: string } | null>(null);

  // True whenever a click on the map places a point — a new line, an
  // extension of an existing one, or a gate snapped to a segment. Drives
  // the crosshair cursor (see index.css's .cursor-crosshair-map) so the
  // one place a user's attention actually is — the map surface, right at
  // their mouse — signals the click means something different than
  // panning. Deliberately excludes plain editingLine dragging: that's a
  // drag interaction, not click-to-place, so the default cursor is
  // already correct there.
  const isPlacingPoint = isDrawing || isExtending || !!placingGateType;

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
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=us&q=${encodeURIComponent(searchAddress)}&limit=1`);
      const results = await response.json();
      if (results.length > 0) {
        const { lat, lon } = results[0];
        // Same Pro/Mapbox-aware ceiling as FitBoundsOnLoad's maxZoom
        // below — a brand-new property (no line yet, so this path runs
        // instead of that one) shouldn't land at a more conservative
        // zoom than the same property would get after its first line
        // is saved and the page reloads.
        const closeZoom = useMapboxImagery ? MAPBOX_NATIVE_ZOOM : 20;
        handleAddressFound(parseFloat(lat), parseFloat(lon), zoomToState ? 8 : closeZoom);
        setGeocodeIssue(null);
      } else {
        toast({ title: "Address not found", description: "The provided address could not be located.", variant: "destructive" });
        setGeocodeIssue({
          address: searchAddress,
          message: "Try adding more detail (city, state, ZIP) — or search a nearby address and pan/zoom to your property.",
        });
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      toast({ title: "Search Error", description: "An error occurred while searching.", variant: "destructive" });
      setGeocodeIssue({
        address: searchAddress,
        message: "Something went wrong searching for that address. Try again, or pan/zoom the map manually to find your property.",
      });
    } finally {
      setIsSearching(false);
    }
  };
  
  const onManualSearch = () => handleSearch(address, false);

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
            toast({
              title: "No property line found here",
              description: "Property line lookup currently only covers Mississippi. Pan the map to center on the property first.",
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
  
  const MobileContent = () => (
    <div className="space-y-3 p-4 pt-0">
      <div className="flex items-center justify-between bg-secondary/50 rounded-lg px-3 py-2 border border-border/50">
        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Length</span>
        <span className="text-lg font-mono font-bold text-foreground">{totalDistance.toFixed(1)} <span className="text-xs text-muted-foreground">ft</span></span>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="icon" onClick={handleUndo} disabled={points.length === 0} title="Undo last point"><Undo2 className="h-4 w-4" /></Button>
        <Button variant="outline" size="icon" onClick={handleClear} disabled={points.length === 0} className="text-destructive hover:text-destructive" title="Clear all"><Trash2 className="h-4 w-4" /></Button>
        <Button className="flex-1 gap-2 bg-primary hover:bg-primary/90" onClick={handleSave} disabled={points.length < 2 || isSaving}><Save className="h-4 w-4" />{isSaving ? "Saving..." : "Save Line"}</Button>
      </div>
    </div>
  );

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
        <style>{`.leaflet-edit-marker { filter: hue-rotate(120deg); }`}</style>
        {(isDrawing || isExtending) && <MapEvents onMapClick={handleMapClick} />}
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
        
        {existingLines.map(line => (
          <FenceLine
            key={line.id}
            points={line.coordinates}
            color={selectedLineId === line.id && !editingLine ? 'red' : 'blue'}
            weight={selectedLineId === line.id && !editingLine ? 5 : 3}
            onLineClick={() => onLineSelect(line.id)}
            gates={line.id === editingLine?.id ? [] : (line.gates || [])}
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

      {isDrawing && !editingLine && (
        <Card className={cn("absolute top-4 z-40 bg-panel/95 text-panel-foreground backdrop-blur shadow-xl border-border/50 rounded-lg", isMobile ? "left-4 right-4 w-auto" : `${controlsPosition === 'left' ? 'left-4' : 'right-4'} w-full max-w-md lg:w-96 p-4`)}>
          <h3 className={cn("font-display font-bold text-lg flex items-center gap-2", isMobile ? "mb-0 p-4" : "mb-4")}><Ruler className="w-5 h-5 text-primary" /> New Fence Line</h3>
          {isMobile ? <MobileContent /> : <DesktopContent />}
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
          top-left/top-right). */}
      {geocodeIssue && (
        <Card className="absolute top-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-md bg-panel/95 text-panel-foreground backdrop-blur shadow-xl border-border/50 rounded-lg p-4 space-y-3">
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
      
      {isExtending && (
        <div className="absolute bottom-16 left-4 z-40">
          <Button onClick={() => setIsExtending(false)}>Finish Extending</Button>
        </div>
      )}

      <div className="absolute bottom-4 left-4 z-40 bg-background/80 backdrop-blur px-3 py-1.5 rounded-full text-xs font-medium border shadow-sm">
        {placingGateType
          ? `Click on the highlighted line to place the ${placingGateType} gate`
          : isExtending
          ? "Click on the map to extend the line"
          : editingLine
          ? "Drag points to edit the line or click an endpoint to extend"
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
          : "Select a line to edit or create a new one"}
      </div>

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
        <Button
          size="sm"
          variant="secondary"
          className="gap-2 shadow-sm bg-background/90 backdrop-blur"
          onClick={handleShowPropertyLine}
          disabled={parcelLookup.isPending}
          title="Looks up the property line at the center of the map (Mississippi only for now)"
        >
          {parcelLookup.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPinned className="h-4 w-4" />}
          Show property line
        </Button>
      </div>
    </div>
  );
}