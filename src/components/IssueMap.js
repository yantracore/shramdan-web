"use client";

import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import { CloseOutlined, FullscreenOutlined } from "@ant-design/icons";
import L from "leaflet";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { getIssueCoverImageUrl, localizeIssue } from "@/lib/adminUtils";
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

// API issue status -> the technical lifecycle status used everywhere (one vocab).
function visualStatus(apiStatus) {
  if (apiStatus === "EVENT_DRAFT") return "draft";
  if (apiStatus === "EVENT_SCHEDULED") return "scheduled";
  if (apiStatus === "EVENT_ACTIVE" || apiStatus === "ACTIVE") return "active";
  if (apiStatus === "COMPLETED") return "completed";
  return "open";
}

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
  const key = status || "open";
  if (pinIconCache.has(key)) return pinIconCache.get(key);
  const cls = STATUS_PIN_CLASS[key] || STATUS_PIN_CLASS.open;
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
    // Fit on mount only — re-centering on every change would fight user pan/zoom.
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

// ── Shared glyphs + supporter stack for the floating map card ─────────────────
// Exported so EventMarker reuses the exact same pin/arrow/avatar treatment and
// the two map popups stay visually identical.

export function MapPinGlyph() {
  return (
    <svg
      className="map-pop-pin-ico"
      viewBox="0 0 24 24"
      width="12"
      height="12"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M12 2a7 7 0 0 0-7 7c0 4.6 6.1 12.2 6.4 12.5a.8.8 0 0 0 1.2 0C12.9 21.2 19 13.6 19 9a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"
      />
    </svg>
  );
}

export function MapArrowGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 12h13M12.5 6l6 6-6 6"
      />
    </svg>
  );
}

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, #21a08a, #0e5f4c)",
  "linear-gradient(135deg, #f5a524, #d97706)",
  "linear-gradient(135deg, #2f7ed8, #1d4ed8)",
  "linear-gradient(135deg, #e5679a, #b4318f)",
  "linear-gradient(135deg, #34b27b, #0f766e)"
];

function avatarSeed(value) {
  const str = String(value ?? "");
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// An issue carries only a vote *count*, never real supporter avatars — so these
// are deterministic gradient discs (stable per issue, never random) that read as
// "a group of people behind this" without inventing identities. The count text
// beside them carries the real number.
export function SupporterStack({ seed, count }) {
  const shown = Math.min(3, Number(count) || 0);
  if (shown <= 0) return null;
  const base = avatarSeed(seed);
  return (
    <span className="map-pop-avatars" aria-hidden="true">
      {Array.from({ length: shown }).map((_, i) => (
        <span
          key={i}
          className="map-pop-avatar"
          style={{ backgroundImage: AVATAR_GRADIENTS[(base + i) % AVATAR_GRADIENTS.length] }}
        >
          <svg viewBox="0 0 24 24" width="10" height="10" aria-hidden="true">
            <path
              fill="rgba(255,255,255,0.92)"
              d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-3.3 0-8 1.66-8 5v1h16v-1c0-3.34-4.7-5-8-5z"
            />
          </svg>
        </span>
      ))}
    </span>
  );
}

export function IssueMarker({ issue: rawIssue, interactive, showPopup, content, language }) {
  const issue = localizeIssue(rawIssue, language);
  const lat = Number(issue.latitude);
  const lng = Number(issue.longitude);
  const statusLabel = campaignStatusLabel(
    visualStatus(issue.status).toUpperCase(),
    language
  );
  const categoryLabel =
    content?.categoryLabels?.[issue.category] || issue.category || "";
  const votes = Number(issue.voteCount) || 0;
  const voteText =
    votes === 1
      ? content?.card?.supportersOne || "1 supporter"
      : (content?.card?.supportersMany || "{n} supporters").replace(
          "{n}",
          toLocalDigits(votes, language)
        );

  const markerLabel = issue.title || issue.addressText || statusLabel || "Map marker";
  const coverUrl = getIssueCoverImageUrl(rawIssue);

  return (
    <Marker
      position={[lat, lng]}
      icon={getPinIcon(visualStatus(issue.status))}
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
                className={`map-pop-badge map-pop-badge--${visualStatus(issue.status)}`}
              >
                <span className="map-pop-badge-dot" aria-hidden="true" />
                {statusLabel}
              </span>
              {categoryLabel ? (
                <span className="map-pop-eyebrow">{categoryLabel}</span>
              ) : null}
            </div>
            <div className="map-pop-body">
              {issue.title ? (
                <Link
                  href={`/issues/${issue.slug ?? issue.id}`}
                  className="map-pop-title"
                >
                  {issue.title}
                </Link>
              ) : null}
              {issue.addressText ? (
                <p className="map-pop-loc">
                  <MapPinGlyph />
                  <span>{issue.addressText}</span>
                </p>
              ) : null}
              {issue.id ? (
                <div
                  className={`map-pop-foot${votes > 0 ? "" : " map-pop-foot--solo"}`}
                >
                  {votes > 0 ? (
                    <div className="map-pop-people">
                      <SupporterStack
                        seed={issue.id ?? issue.slug ?? markerLabel}
                        count={votes}
                      />
                      <span className="map-pop-count">{voteText}</span>
                    </div>
                  ) : null}
                  <Link
                    href={`/issues/${issue.slug ?? issue.id}`}
                    className="map-pop-cta"
                  >
                    <span>{content?.card?.viewDetail || "View"}</span>
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

export default function IssueMap({
  issues,
  height = 480,
  interactive = true,
  showPopup = true,
  content,
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
    if (validIssues.length !== 1) return null;
    const only = validIssues[0];
    return {
      lat: Number(only.latitude),
      lng: Number(only.longitude),
      zoom: 15
    };
  }, [validIssues]);

  const useCluster = cluster && validIssues.length > 1;

  const markers = validIssues.map((issue) => (
    <IssueMarker
      key={issue.id ?? `${issue.latitude},${issue.longitude}`}
      issue={issue}
      interactive={interactive}
      showPopup={showPopup}
      content={content}
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
