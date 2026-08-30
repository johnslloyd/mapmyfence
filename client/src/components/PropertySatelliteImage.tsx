import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin } from "lucide-react";

// Extracted from PropertyOverview.tsx (2026-08-30) so Properties.tsx's
// list cards can show the same real satellite image, not just the
// Dossier rail — one source of truth for the geocode + Esri export URL
// logic, same reasoning as the planPreview.tsx extraction.
//
// Esri's World_Imagery MapServer has a plain "export" REST operation
// that returns a single static image for a bounding box — no key, no
// Leaflet/tile-grid needed, and `server.arcgisonline.com` is already an
// allowed img-src origin in server/index.ts's CSP (MapEditorComponent
// already loads tiles from it). Verified live via curl before wiring
// this up: a real bbox near a real test address returned a real,
// correctly-framed satellite JPEG, not a placeholder.
const SAT_IMG_W = 560;
const SAT_IMG_H = 420;
// Real-world width shown, in meters (~660ft). Bigger than it sounds:
// Esri's export endpoint 500s ("Error: bytes") on a bbox tighter than
// roughly 100m in its shorter dimension — confirmed live by curling a
// span sweep against a real address (0.0005° failed, 0.001° succeeded).
// 200m clears that floor with real margin while still reading as "this
// yard and its block," not a whole neighborhood.
const SAT_SPAN_M = 200;

function buildSatelliteUrl(lat: number, lng: number) {
  const aspect = SAT_IMG_W / SAT_IMG_H;
  // A degree of longitude is shorter than a degree of latitude by
  // cos(latitude) — the same correction this app's real distance math
  // already applies elsewhere (see CLAUDE.md's fence-line-length fix).
  // Skipping it here would stretch the image east-west.
  const lngHalfDeg = (SAT_SPAN_M / 2) / (111320 * Math.cos((lat * Math.PI) / 180));
  const latHalfDeg = (SAT_SPAN_M / 2) / 111320 / aspect;
  const bbox = [lng - lngHalfDeg, lat - latHalfDeg, lng + lngHalfDeg, lat + latHalfDeg].join(",");
  return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=${bbox}&bboxSR=4326&size=${SAT_IMG_W},${SAT_IMG_H}&format=jpg&f=image`;
}

// Geocodes the property's own address (Nominatim, the same
// countrycodes=us US-scoping MapEditorComponent's handleSearch uses,
// and for the same reason — see that file for the full "why") to center
// a static satellite image. Deliberately independent of any project's
// fence-line coordinates: a property can have zero fence lines drawn
// yet still have a real address, and this image is meant to represent
// the PROPERTY, not any one project's progress.
export function PropertySatelliteImage({
  address,
  flush = false,
}: {
  address: string | null | undefined;
  // Dossier's rail shows this inset (its own rounded corners + border,
  // sitting inside the rail's own padding). Properties.tsx's cards want
  // it flush against the card's own top edge instead — the card's own
  // overflow-hidden + rounded-2xl already handles rounding, and a
  // second inner border/radius right at that edge would look like a
  // nested double-frame. `flush` drops the image's own rounding/border
  // for that usage; the property-card treatment is otherwise identical.
  flush?: boolean;
}) {
  const [state, setState] = useState<{ status: "idle" | "loading" | "ready" | "error"; url?: string }>({
    status: address ? "loading" : "idle",
  });
  const frameClass = flush ? "w-full aspect-[4/3] bg-panel" : "w-full aspect-[4/3] rounded-lg overflow-hidden border border-border bg-panel";
  const emptyFrameClass = flush
    ? "w-full aspect-[4/3] bg-panel flex flex-col items-center justify-center gap-1.5 text-center px-4"
    : "w-full aspect-[4/3] rounded-lg border border-dashed border-border bg-panel flex flex-col items-center justify-center gap-1.5 text-center px-4";

  useEffect(() => {
    if (!address) {
      setState({ status: "idle" });
      return;
    }
    let cancelled = false;
    setState({ status: "loading" });
    (async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&countrycodes=us&q=${encodeURIComponent(address)}&limit=1`
        );
        const results = await res.json();
        if (cancelled) return;
        if (!results.length) {
          setState({ status: "error" });
          return;
        }
        const lat = parseFloat(results[0].lat);
        const lng = parseFloat(results[0].lon);
        setState({ status: "ready", url: buildSatelliteUrl(lat, lng) });
      } catch {
        if (!cancelled) setState({ status: "error" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [address]);

  if (state.status === "ready" && state.url) {
    return (
      <div className={frameClass}>
        <img src={state.url} alt="Satellite view of the property" className="w-full h-full object-cover block" />
      </div>
    );
  }

  if (state.status === "loading") {
    return <Skeleton className={flush ? "w-full aspect-[4/3]" : "w-full aspect-[4/3] rounded-lg"} />;
  }

  return (
    <div className={emptyFrameClass}>
      <MapPin className="w-4 h-4 text-muted-foreground" />
      <span className="text-[11px] text-muted-foreground leading-snug">
        {state.status === "error" ? "Couldn't locate this address" : "Add an address to see a satellite view"}
      </span>
    </div>
  );
}
