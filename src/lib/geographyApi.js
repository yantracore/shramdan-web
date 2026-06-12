// Geography reference data — provinces and districts of Nepal.
//
// Both endpoints are public (no auth required) and return stable reference
// data that never changes mid-session, so we cache the results for the
// lifetime of the browser tab with a simple module-level promise.
//
// Endpoints:
//   GET /api/v1/provinces          → array of { id, name, nameNp, ... }
//   GET /api/v1/districts          → array of { id, name, nameNp, provinceId, ... }
//   GET /api/v1/districts?provinceId=<uuid> → filtered to one province

import { getJson } from "@/lib/apiClient";

// Module-level caches — survives re-renders but resets on page navigation
// (acceptable; data is stable so a cold fetch is cheap).
let provincesPromise = null;
let districtsAllPromise = null;
const districtsByProvincePromise = new Map();

function getResponseArray(response) {
  // Backend wraps arrays in { success, data: [...] } or returns the array directly.
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.items)) return response.data.items;
  return [];
}

/**
 * Fetch all provinces. Results are cached for the tab's lifetime.
 * @returns {Promise<Array<{id: string, name: string, nameNp: string}>>}
 */
export function fetchProvinces() {
  if (!provincesPromise) {
    provincesPromise = getJson("/provinces")
      .then(getResponseArray)
      .catch((err) => {
        provincesPromise = null;
        throw err;
      });
  }
  return provincesPromise;
}

/**
 * Fetch districts, optionally scoped to a province.
 * Caches per-province (and separately for "all") for the tab's lifetime.
 * @param {string|null} provinceId
 * @returns {Promise<Array<{id: string, name: string, nameNp: string, provinceId: string}>>}
 */
export function fetchDistricts(provinceId = null) {
  const cacheKey = provinceId ?? "__all__";

  if (provinceId) {
    if (!districtsByProvincePromise.has(cacheKey)) {
      districtsByProvincePromise.set(
        cacheKey,
        getJson("/districts", { params: { provinceId } })
          .then(getResponseArray)
          .catch((err) => {
            districtsByProvincePromise.delete(cacheKey);
            throw err;
          })
      );
    }
    return districtsByProvincePromise.get(cacheKey);
  }

  // All districts (no province filter)
  if (!districtsAllPromise) {
    districtsAllPromise = getJson("/districts")
      .then(getResponseArray)
      .catch((err) => {
        districtsAllPromise = null;
        throw err;
      });
  }
  return districtsAllPromise;
}

/**
 * Resolve a province object by id from the cached list.
 * @param {string} provinceId
 * @returns {Promise<{id: string, name: string, nameNp: string}|null>}
 */
export async function getProvinceById(provinceId) {
  if (!provinceId) return null;
  const list = await fetchProvinces();
  return list.find((p) => p.id === provinceId) ?? null;
}

/**
 * Resolve a district object by id from the cached list.
 * @param {string} districtId
 * @returns {Promise<{id: string, name: string, nameNp: string, provinceId: string}|null>}
 */
export async function getDistrictById(districtId) {
  if (!districtId) return null;
  const list = await fetchDistricts();
  return list.find((d) => d.id === districtId) ?? null;
}

/**
 * Build Ant Design Select option arrays from province/district lists.
 * Backend returns `localName` for the Nepali/local name field.
 */
export function provincesToOptions(provinces, language = "np") {
  return provinces.map((p) => ({
    value: p.id,
    label: language === "np" ? (p.localName || p.name) : (p.name || p.localName)
  }));
}

export function districtsToOptions(districts, language = "np") {
  return districts.map((d) => ({
    value: d.id,
    label: language === "np" ? (d.localName || d.name) : (d.name || d.localName)
  }));
}
