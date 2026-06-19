"use client";

import "leaflet/dist/leaflet.css";
import {
  AimOutlined,
  CloseOutlined,
  EnvironmentOutlined,
  FullscreenOutlined,
  LoadingOutlined,
  SearchOutlined
} from "@ant-design/icons";
import L from "leaflet";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents
} from "react-leaflet";
import { ProvinceDistrictFilter } from "@/components/ProvinceDistrictFilter";
import { geocodeAdminArea, reverseGeocode, searchPlaces } from "@/lib/geocoding";
import {
  getDistrictById,
  getProvinceById,
  resolveLocation
} from "@/lib/geographyApi";
import { isInsideNepal } from "@/lib/nepalBorder";

// Shown when a pin lands outside Nepal and no localized label was supplied
// (e.g. the admin form's built-in EN defaults).
const OUTSIDE_NEPAL_FALLBACK = "Pick a spot inside Nepal — tap within the border.";

const NEPAL_BOUNDS = [
  [26.3, 80.0],
  [30.5, 88.3]
];
const NEPAL_MAX_BOUNDS = [
  [24.5, 78.0],
  [32.0, 90.0]
];
const SEARCH_DEBOUNCE_MS = 300;
const REVERSE_DEBOUNCE_MS = 450;
// Pin → province/district resolution. Slightly longer than the address reverse
// so a quick series of pin nudges only fires one boundaries lookup.
const REGION_DEBOUNCE_MS = 550;
const LOCATE_ZOOM = 16;

let cachedPinIcon = null;
function getPickerPinIcon() {
  if (cachedPinIcon) return cachedPinIcon;
  cachedPinIcon = L.divIcon({
    className: "location-picker-pin",
    html: '<span class="location-picker-pin-shadow" aria-hidden="true"></span><span class="location-picker-pin-dot" aria-hidden="true"></span>',
    iconSize: [28, 36],
    iconAnchor: [14, 32]
  });
  return cachedPinIcon;
}

function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    const zoom = Number.isFinite(target.zoom)
      ? target.zoom
      : Math.max(map.getZoom(), 14);
    map.flyTo([target.lat, target.lng], zoom, { duration: 0.6 });
  }, [map, target]);
  return null;
}

// Fits the map camera to a bounding box — used when the user picks a province
// or district from the dropdowns (province → wide fit, district → tighter).
function FitBounds({ target }) {
  const map = useMap();
  useEffect(() => {
    if (!target?.bounds) return;
    try {
      map.fitBounds(target.bounds, {
        padding: [24, 24],
        maxZoom: target.maxZoom ?? 13,
        animate: true,
        duration: 0.6
      });
    } catch {
      // Malformed bounds — ignore; the dropdown value still stands.
    }
  }, [map, target]);
  return null;
}

function MapClickHandler({ onClick }) {
  useMapEvents({
    click(event) {
      onClick({ lat: event.latlng.lat, lng: event.latlng.lng });
    }
  });
  return null;
}

// Reports whether the cursor is currently over Nepal, so the picker can flip
// the map cursor to "not-allowed" outside the border (you can only pin inside).
function MapCursorGate({ onHover }) {
  useMapEvents({
    mousemove(event) {
      onHover(isInsideNepal(event.latlng.lat, event.latlng.lng));
    },
    mouseout() {
      onHover(true);
    }
  });
  return null;
}

function InvalidateOnResize({ trigger }) {
  const map = useMap();
  useEffect(() => {
    const id = window.setTimeout(() => map.invalidateSize(), 250);
    return () => window.clearTimeout(id);
  }, [trigger, map]);
  return null;
}

export default function IssueLocationPicker({
  value,
  onChange,
  onAddressSuggestion,
  onLocationError,
  language = "en",
  labels,
  height = 360
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [reverseLoading, setReverseLoading] = useState(false);
  const [regionResolving, setRegionResolving] = useState(false);
  const [flyTarget, setFlyTarget] = useState(null);
  const [fitTarget, setFitTarget] = useState(null);
  const [cursorBlocked, setCursorBlocked] = useState(false);
  const cursorBlockedRef = useRef(false);

  const searchAbortRef = useRef(null);
  const reverseAbortRef = useRef(null);
  const searchDebounceRef = useRef(null);
  const reverseDebounceRef = useRef(null);
  const regionDebounceRef = useRef(null);
  const regionSeqRef = useRef(0);
  const addressCbRef = useRef(onAddressSuggestion);
  const errorCbRef = useRef(onLocationError);
  // Latest value/onChange read inside async callbacks without re-subscribing.
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    addressCbRef.current = onAddressSuggestion;
  }, [onAddressSuggestion]);

  useEffect(() => {
    errorCbRef.current = onLocationError;
  }, [onLocationError]);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const lat = value && Number.isFinite(value.lat) ? Number(value.lat) : null;
  const lng = value && Number.isFinite(value.lng) ? Number(value.lng) : null;
  const hasPosition = lat !== null && lng !== null;
  const provinceId = value?.provinceId || null;
  const districtId = value?.districtId || null;

  // Merge a patch into the location value, preserving the other keys
  // (lat/lng vs provinceId/districtId live on the same object).
  const emit = useCallback((patch) => {
    onChangeRef.current?.({ ...(valueRef.current || {}), ...patch });
  }, []);

  const outsideNepalMessage = labels?.outsideNepal || OUTSIDE_NEPAL_FALLBACK;

  // Flip the not-allowed cursor only when the inside/outside state changes, so
  // mousemove doesn't trigger a render on every pixel.
  const handleHover = useCallback((inside) => {
    const blocked = !inside;
    if (cursorBlockedRef.current !== blocked) {
      cursorBlockedRef.current = blocked;
      setCursorBlocked(blocked);
    }
  }, []);

  useEffect(() => {
    if (searchDebounceRef.current) {
      window.clearTimeout(searchDebounceRef.current);
    }
    const q = searchQuery.trim();
    if (q.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clearing derived UI state when input goes empty
      setSearchResults([]);
      setSearching(false);
      return undefined;
    }
    setSearching(true);
    searchDebounceRef.current = window.setTimeout(() => {
      if (searchAbortRef.current) searchAbortRef.current.abort();
      const ctrl = new AbortController();
      searchAbortRef.current = ctrl;
      searchPlaces(q, { signal: ctrl.signal, language })
        .then((results) => {
          setSearchResults(results);
          setSearching(false);
        })
        .catch((err) => {
          if (err?.name !== "AbortError") {
            setSearchResults([]);
            setSearching(false);
          }
        });
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery, language]);

  // Pin moved → suggest a human-readable address (reverse geocode).
  useEffect(() => {
    if (!hasPosition) return undefined;
    if (reverseDebounceRef.current) {
      window.clearTimeout(reverseDebounceRef.current);
    }
    reverseDebounceRef.current = window.setTimeout(() => {
      if (reverseAbortRef.current) reverseAbortRef.current.abort();
      const ctrl = new AbortController();
      reverseAbortRef.current = ctrl;
      setReverseLoading(true);
      reverseGeocode(lat, lng, { signal: ctrl.signal, language })
        .then((result) => {
          if (result.displayName) addressCbRef.current?.(result.displayName);
          setReverseLoading(false);
        })
        .catch((err) => {
          if (err?.name !== "AbortError") setReverseLoading(false);
        });
    }, REVERSE_DEBOUNCE_MS);
    return () => {
      if (reverseDebounceRef.current) window.clearTimeout(reverseDebounceRef.current);
    };
  }, [hasPosition, lat, lng, language]);

  // Pin moved → re-resolve province + district from the coordinates. This is
  // authoritative: it overrides whatever the user may have picked from the
  // dropdowns, because the dropdowns are only a navigation convenience.
  useEffect(() => {
    if (!hasPosition) return undefined;
    if (regionDebounceRef.current) {
      window.clearTimeout(regionDebounceRef.current);
    }
    const seq = (regionSeqRef.current += 1);
    regionDebounceRef.current = window.setTimeout(() => {
      setRegionResolving(true);
      resolveLocation(lat, lng)
        .then(({ province, district }) => {
          if (seq !== regionSeqRef.current) return; // a newer pin won
          const prev = valueRef.current || {};
          const nextProvince = province?.id || null;
          const nextDistrict = district?.id || null;
          if (
            nextProvince !== (prev.provinceId || null) ||
            nextDistrict !== (prev.districtId || null)
          ) {
            emit({ provinceId: nextProvince, districtId: nextDistrict });
          }
          setRegionResolving(false);
        })
        .catch(() => {
          // Outside Nepal / region not seeded — leave the region as-is.
          if (seq === regionSeqRef.current) setRegionResolving(false);
        });
    }, REGION_DEBOUNCE_MS);
    return () => {
      if (regionDebounceRef.current) window.clearTimeout(regionDebounceRef.current);
    };
  }, [hasPosition, lat, lng, emit]);

  useEffect(
    () => () => {
      if (searchAbortRef.current) searchAbortRef.current.abort();
      if (reverseAbortRef.current) reverseAbortRef.current.abort();
      if (regionDebounceRef.current) window.clearTimeout(regionDebounceRef.current);
    },
    []
  );

  useEffect(() => {
    if (!isFullscreen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event) => {
      if (event.key === "Escape") setIsFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [isFullscreen]);

  const handleMapClick = useCallback(
    (point) => {
      // Pins must sit on Nepali soil — reject taps outside the border.
      if (!isInsideNepal(point.lat, point.lng)) {
        errorCbRef.current?.(outsideNepalMessage);
        return;
      }
      errorCbRef.current?.(null);
      emit({
        lat: Number(point.lat.toFixed(6)),
        lng: Number(point.lng.toFixed(6))
      });
      setShowSearchDropdown(false);
    },
    [emit, outsideNepalMessage]
  );

  const handleMarkerDragEnd = useCallback(
    (event) => {
      const ll = event.target.getLatLng();
      // Dragged past the border → drop the pin and warn, rather than save a
      // coordinate the backend would reject anyway.
      if (!isInsideNepal(ll.lat, ll.lng)) {
        errorCbRef.current?.(outsideNepalMessage);
        emit({ lat: undefined, lng: undefined });
        return;
      }
      errorCbRef.current?.(null);
      emit({
        lat: Number(ll.lat.toFixed(6)),
        lng: Number(ll.lng.toFixed(6))
      });
    },
    [emit, outsideNepalMessage]
  );

  const handleSearchSelect = (suggestion) => {
    setSearchQuery(suggestion.label);
    setShowSearchDropdown(false);
    setFlyTarget({ lat: suggestion.lat, lng: suggestion.lng, zoom: LOCATE_ZOOM });
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchDropdown(false);
  };

  const handleUseMyLocation = () => {
    if (typeof window === "undefined" || !navigator?.geolocation) {
      errorCbRef.current?.(labels.locationUnsupported);
      return;
    }
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const point = {
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6))
        };
        if (!isInsideNepal(point.lat, point.lng)) {
          errorCbRef.current?.(outsideNepalMessage);
          setDetecting(false);
          return;
        }
        errorCbRef.current?.(null);
        emit(point);
        setFlyTarget({ ...point, zoom: LOCATE_ZOOM });
        setDetecting(false);
      },
      () => {
        errorCbRef.current?.(labels.locationDenied);
        setDetecting(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  };

  // Fly/fit the map to a named province or district. Geometry is not in the
  // API, so we resolve the name → centre + bbox through the geocoding service.
  const flyToArea = useCallback(
    (name, kind) => {
      geocodeAdminArea(name, kind, { language })
        .then((area) => {
          if (!area) return;
          if (area.bounds) {
            setFitTarget({
              // Fresh array each call so an identical reselect still re-fires.
              bounds: area.bounds.map((corner) => [...corner]),
              maxZoom: kind === "district" ? 12 : 9
            });
          } else {
            setFlyTarget({ lat: area.lat, lng: area.lng, zoom: kind === "district" ? 11 : 8 });
          }
        })
        .catch(() => {
          // Geocoding miss — the dropdown value still stands, map just stays put.
        });
    },
    [language]
  );

  // Dropdown change = "take me to this region so I can place the pin here".
  // It's navigation, not a location: store the ids, fly the camera, and clear
  // the old pin so no stray red marker lingers in the new view. The next map
  // tap drops a fresh pin and re-resolves the region authoritatively.
  const handleRegionChange = ({ provinceId: nextProvince, districtId: nextDistrict }) => {
    const prev = valueRef.current || {};
    errorCbRef.current?.(null);
    emit({
      provinceId: nextProvince || null,
      districtId: nextDistrict || null,
      lat: undefined,
      lng: undefined
    });
    if (nextDistrict && nextDistrict !== (prev.districtId || null)) {
      getDistrictById(nextDistrict).then((d) => {
        if (d?.name) flyToArea(d.name, "district");
      });
    } else if (nextProvince && nextProvince !== (prev.provinceId || null)) {
      getProvinceById(nextProvince).then((p) => {
        if (p?.name) flyToArea(p.name, "province");
      });
    }
  };

  const wrapClass = [
    "location-picker-wrap",
    isFullscreen ? "location-picker-wrap--fullscreen" : "",
    cursorBlocked ? "location-picker-wrap--blocked" : ""
  ]
    .filter(Boolean)
    .join(" ");
  const wrapStyle = isFullscreen ? undefined : { height };

  return (
    <div className="location-picker-card">
      <div className="location-picker-region">
        <ProvinceDistrictFilter
          provinceId={provinceId}
          districtId={districtId}
          language={language}
          labels={labels?.region}
          onChange={handleRegionChange}
        />
        {regionResolving ? (
          <span className="location-picker-region-status" role="status">
            <LoadingOutlined aria-hidden="true" />{" "}
            <span>{labels?.region?.resolving || labels?.searchLoading}</span>
          </span>
        ) : null}
      </div>

      <div className={wrapClass} style={wrapStyle}>
        <MapContainer
          bounds={NEPAL_BOUNDS}
          maxBounds={NEPAL_MAX_BOUNDS}
          maxBoundsViscosity={0.6}
          minZoom={6}
          scrollWheelZoom
          dragging
          doubleClickZoom
          touchZoom
          keyboard
          zoomControl
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onClick={handleMapClick} />
          <MapCursorGate onHover={handleHover} />
          <FlyTo target={flyTarget} />
          <FitBounds target={fitTarget} />
          <InvalidateOnResize trigger={isFullscreen} />
          {hasPosition ? (
            <Marker
              position={[lat, lng]}
              draggable
              icon={getPickerPinIcon()}
              eventHandlers={{ dragend: handleMarkerDragEnd }}
            />
          ) : null}
        </MapContainer>

        <div className="location-picker-search">
          <div className="location-picker-search-input-wrap">
            <SearchOutlined
              className="location-picker-search-icon"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => setShowSearchDropdown(true)}
              onBlur={() =>
                window.setTimeout(() => setShowSearchDropdown(false), 150)
              }
              placeholder={labels.searchPlaceholder}
              className="location-picker-search-input"
              aria-label={labels.searchPlaceholder}
            />
            {searchQuery ? (
              <button
                type="button"
                className="location-picker-search-clear"
                onClick={handleClearSearch}
                aria-label={labels.searchClear}
              >
                <CloseOutlined aria-hidden="true" />
              </button>
            ) : null}
          </div>
          {showSearchDropdown && searchQuery.trim().length >= 2 ? (
            <ul className="location-picker-suggestions" role="listbox">
              {searching ? (
                <li className="location-picker-suggestions-empty">
                  <LoadingOutlined /> <span>{labels.searchLoading}</span>
                </li>
              ) : searchResults.length === 0 ? (
                <li className="location-picker-suggestions-empty">
                  {labels.searchEmpty}
                </li>
              ) : (
                searchResults.map((suggestion) => (
                  <li key={suggestion.id}>
                    <button
                      type="button"
                      className="location-picker-suggestion"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleSearchSelect(suggestion)}
                    >
                      <EnvironmentOutlined aria-hidden="true" />
                      <span>{suggestion.label}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          ) : null}
        </div>

        <button
          type="button"
          className="location-picker-locate-btn"
          onClick={handleUseMyLocation}
          disabled={detecting}
          aria-label={labels.useMyLocation}
        >
          {detecting ? <LoadingOutlined /> : <AimOutlined aria-hidden="true" />}
          <span>{detecting ? labels.detecting : labels.useMyLocation}</span>
        </button>

        <button
          type="button"
          className="location-picker-fullscreen-btn"
          onClick={() => setIsFullscreen((v) => !v)}
          aria-label={isFullscreen ? labels.exitFullscreen : labels.fullscreen}
          aria-pressed={isFullscreen}
        >
          {isFullscreen ? (
            <CloseOutlined aria-hidden="true" />
          ) : (
            <FullscreenOutlined aria-hidden="true" />
          )}
        </button>
      </div>

      <div className="location-picker-status">
        {hasPosition ? (
          <span className="location-picker-coords">
            <EnvironmentOutlined aria-hidden="true" />
            <span>
              {lat.toFixed(5)}, {lng.toFixed(5)}
            </span>
            {reverseLoading ? (
              <span className="location-picker-coords-loading">
                <LoadingOutlined />
              </span>
            ) : null}
          </span>
        ) : (
          <span className="location-picker-hint">{labels.hint}</span>
        )}
      </div>
    </div>
  );
}
