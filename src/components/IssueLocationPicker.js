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
import { reverseGeocode, searchPlaces } from "@/lib/geocoding";

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

function MapClickHandler({ onClick }) {
  useMapEvents({
    click(event) {
      onClick({ lat: event.latlng.lat, lng: event.latlng.lng });
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
  const [flyTarget, setFlyTarget] = useState(null);

  const searchAbortRef = useRef(null);
  const reverseAbortRef = useRef(null);
  const searchDebounceRef = useRef(null);
  const reverseDebounceRef = useRef(null);
  const addressCbRef = useRef(onAddressSuggestion);
  const errorCbRef = useRef(onLocationError);

  useEffect(() => {
    addressCbRef.current = onAddressSuggestion;
  }, [onAddressSuggestion]);

  useEffect(() => {
    errorCbRef.current = onLocationError;
  }, [onLocationError]);

  const lat = value && Number.isFinite(value.lat) ? Number(value.lat) : null;
  const lng = value && Number.isFinite(value.lng) ? Number(value.lng) : null;
  const hasPosition = lat !== null && lng !== null;

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

  useEffect(
    () => () => {
      if (searchAbortRef.current) searchAbortRef.current.abort();
      if (reverseAbortRef.current) reverseAbortRef.current.abort();
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
      onChange?.({
        lat: Number(point.lat.toFixed(6)),
        lng: Number(point.lng.toFixed(6))
      });
      setShowSearchDropdown(false);
    },
    [onChange]
  );

  const handleMarkerDragEnd = useCallback(
    (event) => {
      const ll = event.target.getLatLng();
      onChange?.({
        lat: Number(ll.lat.toFixed(6)),
        lng: Number(ll.lng.toFixed(6))
      });
    },
    [onChange]
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
        onChange?.(point);
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

  const wrapClass = [
    "location-picker-wrap",
    isFullscreen ? "location-picker-wrap--fullscreen" : ""
  ]
    .filter(Boolean)
    .join(" ");
  const wrapStyle = isFullscreen ? undefined : { height };

  return (
    <div className="location-picker-card">
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
          <FlyTo target={flyTarget} />
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
