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
  if (!res.ok) return { found: false };

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
  return { found: false };
}
