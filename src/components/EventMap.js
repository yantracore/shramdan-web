"use client";

import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import { CloseOutlined, FullscreenOutlined } from "@ant-design/icons";
import L from "leaflet";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { IssueMarker, MapArrowGlyph, MapPinGlyph } from "./IssueMap";
import { IssueMapThumb } from "@/components/IssueMapThumb";
import { campaignStatusLabel } from "@/lib/campaignStatus";

const NEPAL_BOUNDS = [
  [26.3, 80.0],
  [30.5, 88.3]
];

const NEPAL_MAX_BOUNDS = [
  [24.5, 78.0],
  [32.0, 90.0]
];

const STATUS_PIN_CLASS = {
  open: "issue-pin--open",
  draft: "issue-pin--draft",
  scheduled: "issue-pin--scheduled",
  active: "issue-pin--active",
  completed: "issue-pin--completed",
  paused: "issue-pin--paused"
};

const NP_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
const pinIconCache = new Map();

function getPinIcon(status) {
  const key = status || "scheduled";
  if (pinIconCache.has(key)) return pinIconCache.get(key);
  const cls = STATUS_PIN_CLASS[key] || STATUS_PIN_CLASS.scheduled;
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

// Depends on the focus COORDS, not the (per-render) focus object: the map now
// lives through marker swaps (funnel filter switches), so a stage with one
// marker must still zoom in and leaving it must re-fit Nepal — but swapping
// between multi-marker sets keeps the user's pan/zoom untouched.
function FitView({ focus }) {
  const map = useMap();
  const lat = focus?.lat;
  const lng = focus?.lng;
  const zoom = focus?.zoom;
  useEffect(() => {
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      map.setView([lat, lng], zoom ?? 15, { animate: false });
    } else {
      map.fitBounds(NEPAL_BOUNDS, { padding: [12, 12], animate: false });
    }
  }, [map, lat, lng, zoom]);
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

function ClosePopupOnOutsideClick() {
  const map = useMap();
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (map.getContainer() && !map.getContainer().contains(e.target)) {
        map.closePopup();
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [map]);
  return null;
}

function toLocalDigits(value, language) {
  const str = String(value ?? "");
  if (language !== "np") return str;
  return str.replace(/\d/g, (d) => NP_DIGITS[Number(d)]);
}

// Just the date piece ("Jun 24" / "२४ जुन") — the status word lives in the
// badge over the image, so the eyebrow stays the "when" without repeating it.
function formatEventDate(event, status, language) {
  const iso =
    status === "completed"
      ? event.completedAt || event.scheduledAt
      : event.scheduledAt;
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  try {
    if (language === "np") {
      const formatter = new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short"
      });
      return toLocalDigits(formatter.format(date), "np");
    }
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric"
    }).format(date);
  } catch {
    return null;
  }
}

import { getIssueCoverImageUrl } from "@/lib/adminUtils";

function EventMarker({ entry, interactive, showPopup, t, language }) {
  const { event, status } = entry;
  const lat = Number(event.latitude);
  const lng = Number(event.longitude);
  const statusLabel = campaignStatusLabel(String(status).toUpperCase(), language);
  const dateLabel = formatEventDate(event, status, language);
  const markerLabel = event.title || event.addressText || statusLabel || "Map marker";
  const coverUrl = getIssueCoverImageUrl(event);

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
          <div className="map-pop">
            <div className="map-pop-media">
              {coverUrl ? (
                <img className="map-pop-img" src={coverUrl} alt="" />
              ) : Number.isFinite(lat) && Number.isFinite(lng) ? (
                <IssueMapThumb latitude={lat} longitude={lng} alt="" />
              ) : (
                <span className="map-pop-img map-pop-img--empty" aria-hidden="true" />
              )}
              <span className="map-pop-scrim" aria-hidden="true" />
              <span
                className={`map-pop-badge map-pop-badge--${status || "scheduled"}`}
              >
                <span className="map-pop-badge-dot" aria-hidden="true" />
                {statusLabel}
              </span>
              {dateLabel ? (
                <span className="map-pop-eyebrow">{dateLabel}</span>
              ) : null}
            </div>
            <div className="map-pop-body">
              {event.title ? (
                <Link
                  href={`/events/${event.slug ?? event.id}`}
                  className="map-pop-title"
                >
                  {event.title}
                </Link>
              ) : null}
              {event.addressText ? (
                <p className="map-pop-loc">
                  <MapPinGlyph />
                  <span>{event.addressText}</span>
                </p>
              ) : null}
              {event.id ? (
                <div className="map-pop-foot map-pop-foot--solo">
                  <Link
                    href={`/events/${event.slug ?? event.id}`}
                    className="map-pop-cta"
                  >
                    <span>{t?.viewDetail || "View"}</span>
                    <MapArrowGlyph />
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </Popup>
      ) : null}
    </Marker>
  );
}

export default function EventMap({
  entries,
  issues,
  issuesContent,
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

  // The home map mixes scheduled events with raw issues so the overview shows
  // the full picture, not just the small promoted subset. Issues reuse the
  // shared IssueMarker (same pin/cluster CSS) and link to /issues.
  const validIssues = useMemo(
    () =>
      (issues || []).filter((issue) => {
        const lat = Number(issue?.latitude);
        const lng = Number(issue?.longitude);
        return Number.isFinite(lat) && Number.isFinite(lng);
      }),
    [issues]
  );

  const focus = useMemo(() => {
    if (validEntries.length + validIssues.length !== 1) return null;
    const only = validEntries[0]?.event ?? validIssues[0];
    if (!only) return null;
    return {
      lat: Number(only.latitude),
      lng: Number(only.longitude),
      zoom: 15
    };
  }, [validEntries, validIssues]);

  const useCluster = cluster && validEntries.length + validIssues.length > 1;

  const markers = [
    ...validEntries.map((entry) => (
      <EventMarker
        key={`event-${entry.event.id ?? `${entry.event.latitude},${entry.event.longitude}`}`}
        entry={entry}
        interactive={interactive}
        showPopup={showPopup}
        t={t}
        language={language}
      />
    )),
    ...validIssues.map((issue) => (
      <IssueMarker
        key={`issue-${issue.id ?? `${issue.latitude},${issue.longitude}`}`}
        issue={issue}
        interactive={interactive}
        showPopup={showPopup}
        content={issuesContent}
        language={language}
      />
    ))
  ];

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
        <ClosePopupOnOutsideClick />
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
