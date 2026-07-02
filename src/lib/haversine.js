// Great-circle distance between two lat/lng points in kilometres.
// Used for the homepage for-you grid's proximity ranking and the
// /events nearest sort. Both surfaces share this helper so the
// rounding/precision stays consistent.

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

export function haversineKm(lat1, lon1, lat2, lon2) {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

// Convenience: returns null when either coordinate is missing/invalid so
// callers can skip the row instead of branching themselves.
export function distanceKmOrNull(origin, lat, lng) {
  if (!origin) return null;
  const a = Number(lat);
  const b = Number(lng);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return haversineKm(origin.lat, origin.lng, a, b);
}
