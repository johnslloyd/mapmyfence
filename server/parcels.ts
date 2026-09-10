// Free, live parcel-boundary lookup. Mississippi only for now (see CLAUDE.md
// "Parcel boundaries" section for why Tennessee/Arkansas aren't wired up yet).
//
// Source: Mississippi's statewide Cadastral Framework, a public ArcGIS
// MapServer maintained by MARIS/MDEQ — no API key, no account. The state is
// split across two layers (west/east); we don't know which one covers a
// given point ahead of time, so both are queried and whichever actually
// contains the point wins.
const MS_PARCELS_BASE =
  "https://gis.mississippi.edu/server/rest/services/Cadastral/MS_Parcels_August_2024/MapServer";
const MS_LAYER_IDS = [1, 2] as const; // West, East

const FETCH_TIMEOUT_MS = 10_000;

export type ParcelLookupResult =
  | {
      found: true;
      source: "mississippi";
      parcelId: string;
      ownerName: string | null;
      siteAddress: string | null;
      geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
    }
  | { found: false };

// Thrown by lookupParcel when the upstream service itself couldn't be
// reached at all (both layers failed) — deliberately distinct from a
// genuine, successful "checked, no parcel here" result. Found live
// (2026-09-10): gis.mississippi.edu was completely unreachable (TLS
// handshake completes, then the connection resets — not a 404/403, a
// real outage of the whole host; a second host on the same
// infrastructure, maris.mississippi.edu, failed identically, and the
// one alternate URL that turned up in a search, www.maris.state.ms.us,
// doesn't even resolve in DNS — a dead domain, not a live fallback).
// Before this distinction existed, an outage like this silently
// returned {found: false} — indistinguishable from a real "no parcel
// at this point," which is exactly backwards for an app that already
// has a stated policy (see CLAUDE.md's Before You Dig section) of never
// silently guessing without saying so.
export class ParcelServiceUnavailableError extends Error {}

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function queryMsLayer(
  layerId: number,
  lat: number,
  lng: number,
): Promise<ParcelLookupResult> {
  const params = new URLSearchParams({
    geometry: `${lng},${lat}`,
    geometryType: "esriGeometryPoint",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "PARNO,OWNNAME,SITEADD",
    returnGeometry: "true",
    f: "geojson",
  });

  const res = await fetchWithTimeout(`${MS_PARCELS_BASE}/${layerId}/query?${params}`);
  // A non-OK response from the service itself is "couldn't check," not
  // "checked, no parcel here" — throwing (instead of resolving with
  // found: false) lets lookupParcel below tell those two cases apart.
  if (!res.ok) throw new Error(`MS parcel layer ${layerId} returned ${res.status}`);

  const data = await res.json();
  const feature = data?.features?.[0];
  if (!feature?.geometry) return { found: false };

  return {
    found: true,
    source: "mississippi",
    parcelId: feature.properties?.PARNO?.trim() ?? "unknown",
    ownerName: feature.properties?.OWNNAME?.trim() || null,
    siteAddress: feature.properties?.SITEADD?.trim() || null,
    geometry: feature.geometry,
  };
}

export async function lookupParcel(lat: number, lng: number): Promise<ParcelLookupResult> {
  const results = await Promise.allSettled(
    MS_LAYER_IDS.map((id) => queryMsLayer(id, lat, lng)),
  );

  for (const result of results) {
    if (result.status === "fulfilled" && result.value.found) {
      return result.value;
    }
  }

  // At least one layer resolved successfully (even if found: false) —
  // a real, trustworthy answer: this point genuinely isn't on a parcel.
  if (results.some((r) => r.status === "fulfilled")) {
    return { found: false };
  }

  // BOTH layers rejected — the service itself couldn't be reached at
  // all, not "checked, no parcel here." See ParcelServiceUnavailableError's
  // own comment above.
  console.error(
    "MS parcel lookup: both layers failed —",
    results.map((r) => (r.status === "rejected" ? r.reason?.message ?? r.reason : null)),
  );
  throw new ParcelServiceUnavailableError(
    "Mississippi's parcel data service is currently unreachable. Try again later.",
  );
}
