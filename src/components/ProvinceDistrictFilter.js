"use client";

// ProvinceDistrictFilter — side-by-side Province + District selects.
//
// Behaviour:
//   • Both selects are ALWAYS visible, side-by-side in the flex filter bar.
//   • Province selected  → district dropdown narrows to that province's districts.
//   • District selected  → province field auto-fills from the district's provinceId.
//   • Province cleared   → district also clears; all districts shown again.
//   • District cleared   → province stays; full district list for that province shown.
//   • Nothing selected   → all provinces + ALL districts (flat list, grouped by province).
//   • Language prop      → labels re-derive on every render (no stale labels on switch).
//
// Renders as a React.Fragment so the two <div.public-issues-filter-field> elements
// sit directly inside the parent flex row, flush with the other filter fields.
//
// Props:
//   provinceId   string|null   — controlled
//   districtId   string|null   — controlled
//   onChange     ({ provinceId, districtId }) → void
//   language     "np" | "en"
//   disabled     boolean
//   labels       optional overrides: { provinceLabel, provincePlaceholder,
//                                      districtLabel, districtPlaceholder }

import { Select } from "antd";
import { Fragment, useEffect, useMemo, useState } from "react";
import {
  fetchProvinces,
  fetchDistricts,
  provincesToOptions,
  districtsToOptions
} from "@/lib/geographyApi";

// Labels derived fresh from `language` on every render — no stale copy on lang switch.
function getLabels(language, overrides) {
  const base =
    language === "en"
      ? {
          provinceLabel: "Province",
          provincePlaceholder: "All Provinces",
          districtLabel: "District",
          districtPlaceholder: "All Districts"
        }
      : {
          provinceLabel: "प्रदेश",
          provincePlaceholder: "सबै प्रदेश",
          districtLabel: "जिल्ला",
          districtPlaceholder: "सबै जिल्ला"
        };
  return { ...base, ...(overrides || {}) };
}

export function ProvinceDistrictFilter({
  provinceId = null,
  districtId = null,
  onChange,
  language = "np",
  disabled = false,
  labels: labelOverrides
}) {
  // Labels always fresh — language switch triggers re-derive automatically.
  const L = getLabels(language, labelOverrides);

  // --- data ---
  const [provinces, setProvinces] = useState([]);
  const [allDistricts, setAllDistricts] = useState([]);   // full flat list
  const [provDistricts, setProvDistricts] = useState([]); // filtered by province
  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingAllDistricts, setLoadingAllDistricts] = useState(true);
  const [loadingProvDistricts, setLoadingProvDistricts] = useState(false);

  // Fetch provinces + all districts once on mount (cached in geographyApi).
  useEffect(() => {
    let cancelled = false;

    fetchProvinces()
      .then((list) => { if (!cancelled) setProvinces(list); })
      .catch(() => { if (!cancelled) setProvinces([]); })
      .finally(() => { if (!cancelled) setLoadingProvinces(false); });

    fetchDistricts(null)
      .then((list) => { if (!cancelled) setAllDistricts(list); })
      .catch(() => { if (!cancelled) setAllDistricts([]); })
      .finally(() => { if (!cancelled) setLoadingAllDistricts(false); });

    return () => { cancelled = true; };
  }, []);

  // Fetch province-scoped districts when province is selected.
  useEffect(() => {
    if (!provinceId) {
      setProvDistricts([]);
      return;
    }
    let cancelled = false;
    setLoadingProvDistricts(true);
    fetchDistricts(provinceId)
      .then((list) => { if (!cancelled) setProvDistricts(list); })
      .catch(() => { if (!cancelled) setProvDistricts([]); })
      .finally(() => { if (!cancelled) setLoadingProvDistricts(false); });
    return () => { cancelled = true; };
  }, [provinceId]);

  // --- options ---
  const provinceOptions = useMemo(
    () => provincesToOptions(provinces, language),
    [provinces, language]
  );

  // District options: use province-scoped list when a province is chosen,
  // otherwise the full flat list grouped by province name for readability.
  const districtOptions = useMemo(() => {
    if (provinceId) {
      return districtsToOptions(provDistricts, language);
    }
    // Group all districts by province for the "all" state.
    if (provinces.length === 0 || allDistricts.length === 0) {
      return districtsToOptions(allDistricts, language);
    }
    const provMap = new Map(provinces.map((p) => [p.id, p]));
    const groups = new Map();
    allDistricts.forEach((d) => {
      // Backend district has `provinceName` (string) but not `provinceId`.
      // Build group key from provinceName directly; fall back to provinceId lookup.
      const prov = d.provinceId ? provMap.get(d.provinceId) : null;
      const groupLabel =
        prov
          ? language === "en"
            ? (prov.name || prov.localName)
            : (prov.localName || prov.name)
          : d.provinceName || "";
      if (!groups.has(groupLabel)) groups.set(groupLabel, []);
      groups.get(groupLabel).push(d);
    });
    return Array.from(groups.entries()).map(([label, dists]) => ({
      label,
      options: districtsToOptions(dists, language)
    }));
  }, [provinceId, provDistricts, allDistricts, provinces, language]);

  // --- handlers ---
  const handleProvinceChange = (value) => {
    // Clearing province also clears district.
    onChange?.({ provinceId: value || null, districtId: null });
  };

  const handleDistrictChange = (value) => {
    if (!value) {
      // District cleared — keep province.
      onChange?.({ provinceId, districtId: null });
      return;
    }
    const dist = allDistricts.find((d) => d.id === value);

    // Backend currently returns `provinceName` (string) on district objects
    // but NOT `provinceId` (UUID). Once the backend adds `provinceId` to the
    // district response, `dist.provinceId` will take priority automatically.
    let inferredProvince = dist?.provinceId || provinceId;
    if (!inferredProvince && dist?.provinceName && provinces.length > 0) {
      const matched = provinces.find(
        (p) => p.name === dist.provinceName || p.localName === dist.provinceName
      );
      inferredProvince = matched?.id || null;
    }

    onChange?.({ provinceId: inferredProvince || null, districtId: value });
  };

  const districtLoading = loadingAllDistricts || loadingProvDistricts;

  return (
    <Fragment>
      {/* Province */}
      <div className="public-issues-filter-field">
        <label
          className="public-issues-filter-label"
          htmlFor="filter-province"
        >
          {L.provinceLabel}
        </label>
        <Select
          id="filter-province"
          allowClear
          disabled={disabled || loadingProvinces}
          loading={loadingProvinces}
          onChange={handleProvinceChange}
          options={provinceOptions}
          placeholder={L.provincePlaceholder}
          value={provinceId || undefined}
          style={{ minWidth: 140 }}
        />
      </div>

      {/* District — always visible */}
      <div className="public-issues-filter-field">
        <label
          className="public-issues-filter-label"
          htmlFor="filter-district"
        >
          {L.districtLabel}
        </label>
        <Select
          id="filter-district"
          allowClear
          disabled={disabled || districtLoading}
          loading={districtLoading}
          onChange={handleDistrictChange}
          options={districtOptions}
          placeholder={L.districtPlaceholder}
          value={districtId || undefined}
          style={{ minWidth: 140 }}
          // Show grouped list when no province is selected
          optionFilterProp="label"
          showSearch
        />
      </div>
    </Fragment>
  );
}
