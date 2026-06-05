"use client";

import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import { CloseOutlined, FullscreenOutlined } from "@ant-design/icons";
import L from "leaflet";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";

const NEPAL_BOUNDS = [
  [26.3, 80.0],
  [30.5, 88.3]
];

const NEPAL_MAX_BOUNDS = [
  [24.5, 78.0],
  [32.0, 90.0]
];

const STATUS_PIN_CLASS = {
  live: "event-pin--live",
  upcoming: "event-pin--upcoming",
  past: "event-pin--past"
};

const NP_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
const pinIconCache = new Map();

function getPinIcon(status) {
  const key = status || "upcoming";
  if (pinIconCache.has(key)) return pinIconCache.get(key);
  const cls = STATUS_PIN_CLASS[key] || STATUS_PIN_CLASS.upcoming;
  const icon = L.divIcon({
    className: `issue-pin ${cls}`,
    html: '<span class="issue-pin-dot" aria-hidden="true"></span>',
    iconSize: [22, 22],
    iconAnchor: [11, 22],
    popupAnchor: [0, -22]
  });
  pinIconCache.set(key, icon);
  return icon;
}

function createClusterIcon(cluster) {
  const count = cluster.getChildCount();
  let sizeClass = "issue-cluster--sm";
  if (count >= 25) sizeClass = "issue-cluster--lg";
  else if (count >= 10) sizeClass = "issue-cluster--md";
  return L.divIcon({
    html: `<span class="issue-cluster-inner">${count}</span>`,
    className: `issue-cluster ${sizeClass}`,
    iconSize: L.point(40, 40, true)
  });
}

function FitView({ focus }) {
  const map = useMap();
  useEffect(() => {
    if (focus) {
      map.setView([focus.lat, focus.lng], focus.zoom ?? 15, { animate: false });
    } else {
      map.fitBounds(NEPAL_BOUNDS, { padding: [12, 12], animate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);
  return null;
}

function InvalidateOnResize({ trigger }) {
  const map = useMap();
  useEffect(() => {
    const id = window.setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => window.clearTimeout(id);
  }, [trigger, map]);
  return null;
}

function toLocalDigits(value, language) {
  const str = String(value ?? "");
  if (language !== "np") return str;
  return str.replace(/\d/g, (d) => NP_DIGITS[Number(d)]);
}

function formatScheduleLine(event, status, statusLabel, language) {
  const iso =
    status === "past"
      ? event.completedAt || event.scheduledAt
      : event.scheduledAt;
  if (!iso) return statusLabel;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return statusLabel;
  try {
    if (language === "np") {
      const formatter = new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short"
      });
      return `${statusLabel} · ${toLocalDigits(formatter.format(date), "np")}`;
    }
    const formatter = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric"
    });
    return `${statusLabel} · ${formatter.format(date)}`;
  } catch {
    return statusLabel;
  }
}

function EventMarker({ entry, interactive, showPopup, t, language }) {
  const { event, status } = entry;
  const lat = Number(event.latitude);
  const lng = Number(event.longitude);
  const statusLabel = t?.statusLabels?.[status] || status || "";
  const meta = formatScheduleLine(event, status, statusLabel, language);
  const markerLabel = event.title || event.addressText || statusLabel || "Map marker";

  return (
    <Marker
      position={[lat, lng]}
      icon={getPinIcon(status)}
      title={markerLabel}
      alt={markerLabel}
      keyboard
    >
      {interactive && showPopup ? (
        <Popup>
          <div className="issue-map-popup">
            <div className="issue-map-popup-meta">
              <span
                className={`issue-map-popup-status event-map-popup-status--${status || "upcoming"}`}
              >
                {meta}
              </span>
            </div>
            {event.title ? (
              <Link
                href={`/events/${event.slug ?? event.id}`}
                className="issue-map-popup-title"
              >
                {event.title}
              </Link>
            ) : null}
            {event.addressText ? (
              <p className="issue-map-popup-address">{event.addressText}</p>
            ) : null}
            {event.id ? (
              <div className="issue-map-popup-footer">
                <Link
                  href={`/events/${event.slug ?? event.id}`}
                  className="issue-map-popup-link"
                >
                  {t?.viewDetail || "View"} →
                </Link>
              </div>
            ) : null}
          </div>
        </Popup>
      ) : null}
    </Marker>
  );
}

export default function EventMap({
  entries,
  height = 480,
  interactive = true,
  showPopup = true,
  t,
  language = "en",
  cluster = true,
  enableFullscreen = false,
  fullscreenLabel = "Fullscreen",
  exitFullscreenLabel = "Exit fullscreen"
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!isFullscreen) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") setIsFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isFullscreen]);

  const validEntries = useMemo(
    () =>
      (entries || []).filter((entry) => {
        const lat = Number(entry?.event?.latitude);
        const lng = Number(entry?.event?.longitude);
        return Number.isFinite(lat) && Number.isFinite(lng);
      }),
    [entries]
  );

  const focus = useMemo(() => {
    if (validEntries.length !== 1) return null;
    const only = validEntries[0].event;
    return {
      lat: Number(only.latitude),
      lng: Number(only.longitude),
      zoom: 15
    };
  }, [validEntries]);

  const useCluster = cluster && validEntries.length > 1;

  const markers = validEntries.map((entry) => (
    <EventMarker
      key={entry.event.id ?? `${entry.event.latitude},${entry.event.longitude}`}
      entry={entry}
      interactive={interactive}
      showPopup={showPopup}
      t={t}
      language={language}
    />
  ));

  const wrapClass = [
    "issue-map-wrap",
    interactive ? "" : "issue-map-wrap--static",
    isFullscreen ? "issue-map-wrap--fullscreen" : ""
  ]
    .filter(Boolean)
    .join(" ");

  const wrapStyle = isFullscreen ? undefined : { height: `${height}px` };

  return (
    <div className={wrapClass} style={wrapStyle}>
      <MapContainer
        bounds={focus ? undefined : NEPAL_BOUNDS}
        center={focus ? [focus.lat, focus.lng] : undefined}
        zoom={focus ? focus.zoom : undefined}
        maxBounds={NEPAL_MAX_BOUNDS}
        maxBoundsViscosity={0.6}
        minZoom={6}
        scrollWheelZoom={interactive}
        dragging={interactive}
        doubleClickZoom={interactive}
        touchZoom={interactive}
        boxZoom={interactive}
        keyboard={interactive}
        zoomControl={interactive}
        attributionControl={interactive}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitView focus={focus} />
        <InvalidateOnResize trigger={isFullscreen} />
        {useCluster ? (
          <MarkerClusterGroup
            chunkedLoading
            showCoverageOnHover={false}
            spiderfyOnMaxZoom={interactive}
            maxClusterRadius={50}
            iconCreateFunction={createClusterIcon}
          >
            {markers}
          </MarkerClusterGroup>
        ) : (
          markers
        )}
      </MapContainer>
      {enableFullscreen ? (
        <button
          type="button"
          className="issue-map-fullscreen-btn"
          aria-label={isFullscreen ? exitFullscreenLabel : fullscreenLabel}
          aria-pressed={isFullscreen}
          onClick={() => setIsFullscreen((v) => !v)}
        >
          {isFullscreen ? (
            <CloseOutlined aria-hidden="true" />
          ) : (
            <FullscreenOutlined aria-hidden="true" />
          )}
        </button>
      ) : null}
    </div>
  );
}
