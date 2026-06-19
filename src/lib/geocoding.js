const PHOTON_ENDPOINT = "https://photon.komoot.io/api";
const NOMINATIM_REVERSE_ENDPOINT = "https://nominatim.openstreetmap.org/reverse";
const NOMINATIM_SEARCH_ENDPOINT = "https://nominatim.openstreetmap.org/search";

// Photon bbox order: minLon,minLat,maxLon,maxLat
const NEPAL_BBOX = "80.0,26.3,88.3,30.5";
const NEPAL_BIAS = { lat: 28.4, lon: 84.1 };

function formatPhotonLabel(feature) {
  const p = feature?.properties || {};
  const parts = [];
  if (p.name) parts.push(p.name);
  if (p.street && p.street !== p.name) parts.push(p.street);
  const locality = p.city || p.town || p.village || p.suburb;
  if (locality && !parts.includes(locality)) parts.push(locality);
  if (p.state && !parts.includes(p.state)) parts.push(p.state);
  if (p.country && !parts.includes(p.country)) parts.push(p.country);
  return parts.filter(Boolean).join(", ");
}

function photonLang(language) {
  // Photon supports: en, de, fr, it, default. `default` returns local-language names.
  if (language === "np") return "default";
  return "en";
}

function nominatimLang(language) {
  return language === "np" ? "ne,en" : "en";
}

export async function searchPlaces(query, { signal, language = "en" } = {}) {
  const q = String(query || "").trim();
  if (q.length < 2) return [];
  const params = new URLSearchParams({
    q,
    lang: photonLang(language),
    limit: "6",
    bbox: NEPAL_BBOX,
    lat: String(NEPAL_BIAS.lat),
    lon: String(NEPAL_BIAS.lon)
  });
  const res = await fetch(`${PHOTON_ENDPOINT}?${params.toString()}`, { signal });
  if (!res.ok) throw new Error(`Photon error ${res.status}`);
  const data = await res.json();
  const features = Array.isArray(data?.features) ? data.features : [];
  return features
    .map((feature, idx) => {
      const coords = feature?.geometry?.coordinates;
      const lng = Array.isArray(coords) ? Number(coords[0]) : NaN;
      const lat = Array.isArray(coords) ? Number(coords[1]) : NaN;
      return {
        id: `${feature?.properties?.osm_type ?? "x"}-${feature?.properties?.osm_id ?? idx}`,
        label: formatPhotonLabel(feature),
        lat,
        lng
      };
    })
    .filter((item) => item.label && Number.isFinite(item.lat) && Number.isFinite(item.lng));
}

/**
 * Look up the map extent of a Nepal administrative area (province or district)
 * by name. The backend's province/district records carry no geometry, so we
 * resolve a name → centre + bounding box through Nominatim purely to drive the
 * map camera (fly / fit) when the user picks from the dropdowns — never to set
 * the saved coordinates (those always come from the pin).
 *
 * @param {string} name   English area name, e.g. "Taplejung" or "Koshi".
 * @param {"province"|"district"} kind
 * @returns {Promise<{ lat:number, lng:number, bounds:[[number,number],[number,number]]|null }|null>}
 */
export async function geocodeAdminArea(name, kind, { signal, language = "en" } = {}) {
  const trimmed = String(name || "").trim();
  if (!trimmed) return null;
  // Qualify the query so "Taplejung" matches the district, not a same-named
  // town. Nominatim rejects (400) a free-form `q` combined with structured
  // params like `country`, so the country lives inside `q` instead.
  const qualifier = kind === "province" ? "Province" : "District";
  const params = new URLSearchParams({
    format: "jsonv2",
    q: `${trimmed} ${qualifier}, Nepal`,
    limit: "1",
    "accept-language": nominatimLang(language)
  });
  const res = await fetch(`${NOMINATIM_SEARCH_ENDPOINT}?${params.toString()}`, {
    signal,
    headers: { Accept: "application/json" }
  });
  if (!res.ok) throw new Error(`Nominatim search error ${res.status}`);
  const data = await res.json();
  const hit = Array.isArray(data) ? data[0] : null;
  if (!hit) return null;
  const lat = Number(hit.lat);
  const lng = Number(hit.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  // Nominatim boundingbox: [minLat, maxLat, minLon, maxLon] (strings) →
  // Leaflet bounds [[south, west], [north, east]].
  const bb = Array.isArray(hit.boundingbox) ? hit.boundingbox.map(Number) : null;
  const bounds =
    bb && bb.length === 4 && bb.every(Number.isFinite)
      ? [[bb[0], bb[2]], [bb[1], bb[3]]]
      : null;
  return { lat, lng, bounds };
}

export async function reverseGeocode(lat, lng, { signal, language = "en" } = {}) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error("Invalid coordinates");
  }
  const params = new URLSearchParams({
    format: "jsonv2",
    lat: String(lat),
    lon: String(lng),
    zoom: "18",
    "accept-language": nominatimLang(language)
  });
  const res = await fetch(`${NOMINATIM_REVERSE_ENDPOINT}?${params.toString()}`, {
    signal,
    headers: { Accept: "application/json" }
  });
  if (!res.ok) throw new Error(`Nominatim error ${res.status}`);
  const data = await res.json();
  return {
    displayName: typeof data?.display_name === "string" ? data.display_name : "",
    raw: data
  };
}
