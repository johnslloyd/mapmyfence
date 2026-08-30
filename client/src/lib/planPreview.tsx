// Extracted from PropertyOverview.tsx (2026-08-30) so Properties.tsx's
// list cards can reuse the same illustration instead of re-deriving it —
// one source of truth for "what a fence line's plan-preview diagram
// looks like," same reasoning as pulling STORE_LABELS/consolidateMaterials
// into lib/estimates.ts.

// Normalizes a set of fence lines' real lat/lng points into a small SVG
// viewBox, preserving relative shape (not true-to-scale — this is a
// diagram, the same illustrative spirit as the homepage hero, just
// drawn from real coordinates instead of invented ones). Independent
// x/y scaling to fill the frame, same simplification the homepage
// illustration already makes — a real to-scale rendering would need the
// same cos(latitude) correction the app's actual distance math uses,
// which matters for accurate FEET, not for "does this look like the
// yard's rough shape."
export function buildPlanPreview(fenceLines: { coordinates: { lat: number; lng: number }[]; gates?: { segmentIndex: number; position: number }[] }[]) {
  const allPoints = fenceLines.flatMap((l) => l.coordinates);
  if (allPoints.length === 0) return null;

  const lats = allPoints.map((p) => p.lat);
  const lngs = allPoints.map((p) => p.lng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const latRange = maxLat - minLat || 1;
  const lngRange = maxLng - minLng || 1;
  const W = 160, H = 116, PAD = 16;
  // Zoom out: shrink the normalized shape toward the frame's center
  // before mapping to pixels, so the fence reads as a shape ON a map
  // rather than a shape that fills the whole card edge-to-edge. 0.6
  // means the fence's own bounding box only spans 60% of the padded
  // inset area (was 100% — every line touched an edge).
  const ZOOM = 0.6;

  const project = (lat: number, lng: number): [number, number] => {
    const fx = 0.5 + ((lng - minLng) / lngRange - 0.5) * ZOOM;
    // lat increases northward; SVG y increases downward — flip it.
    const fy = 0.5 + ((1 - (lat - minLat) / latRange) - 0.5) * ZOOM;
    return [PAD + fx * (W - PAD * 2), PAD + fy * (H - PAD * 2)];
  };

  return fenceLines.map((line) => {
    const points = line.coordinates.map((c) => project(c.lat, c.lng));
    const gates = (line.gates || [])
      .map((g) => {
        const p1 = line.coordinates[g.segmentIndex];
        const p2 = line.coordinates[g.segmentIndex + 1];
        if (!p1 || !p2) return null;
        return project(p1.lat + (p2.lat - p1.lat) * g.position, p1.lng + (p2.lng - p1.lng) * g.position);
      })
      .filter((p): p is [number, number] => p !== null);
    return { points, gates };
  });
}

// The illustration itself — a small thumbnail (160x116 viewBox, see
// buildPlanPreview). Scales to whatever frame it's placed in via
// `w-full h-full` on the <svg>, so callers control the actual pixel
// size purely through the wrapping container's classes.
export function PlanThumbnail({ fenceLines }: { fenceLines: any[] }) {
  const lines = buildPlanPreview(fenceLines);
  return (
    <svg viewBox="0 0 160 116" className="w-full h-full block">
      <g stroke="hsl(var(--border))" strokeWidth="1">
        <line x1="12" y1="8" x2="12" y2="108" /><line x1="53" y1="8" x2="53" y2="108" /><line x1="94" y1="8" x2="94" y2="108" /><line x1="148" y1="8" x2="148" y2="108" />
        <line x1="8" y1="8" x2="152" y2="8" /><line x1="8" y1="38" x2="152" y2="38" /><line x1="8" y1="68" x2="152" y2="68" /><line x1="8" y1="98" x2="152" y2="98" />
      </g>
      {lines ? (
        lines.map((line, i) => (
          <g key={i}>
            {line.points.length > 1 && (
              <path
                d={`M ${line.points.map(([x, y]) => `${x},${y}`).join(" L ")}`}
                stroke="hsl(var(--primary))"
                strokeWidth="1.6"
                strokeDasharray="1 5"
                strokeLinecap="round"
                fill="none"
              />
            )}
            {line.points.map(([x, y], idx) => (
              <circle key={idx} cx={x} cy={y} r="2.6" fill="hsl(var(--primary))" />
            ))}
            {line.gates.map(([x, y], idx) => (
              <circle key={idx} cx={x} cy={y} r="2.3" fill="#f59e0b" stroke="white" strokeWidth="1" />
            ))}
          </g>
        ))
      ) : (
        <text x="80" y="60" textAnchor="middle" fontSize="9" fill="hsl(var(--muted-foreground))" fontFamily="var(--font-sans)">
          Nothing drawn
        </text>
      )}
    </svg>
  );
}
