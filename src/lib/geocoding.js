const PHOTON_ENDPOINT = "https://photon.komoot.io/api";
const NOMINATIM_REVERSE_ENDPOINT = "https://nominatim.openstreetmap.org/reverse";

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
