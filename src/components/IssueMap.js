"use client";

import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import L from "leaflet";
import Link from "next/link";
import { useEffect, useMemo } from "react";
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
  OPEN: "issue-pin--open",
  EVENT_SCHEDULED: "issue-pin--scheduled",
  COMPLETED: "issue-pin--completed"
};

const NP_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
const pinIconCache = new Map();

function getPinIcon(status) {
  const key = status || "OPEN";
  if (pinIconCache.has(key)) return pinIconCache.get(key);
  const cls = STATUS_PIN_CLASS[key] || STATUS_PIN_CLASS.OPEN;
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

function toLocalDigits(value, language) {
  const str = String(value ?? "");
  if (language !== "np") return str;
  return str.replace(/\d/g, (d) => NP_DIGITS[Number(d)]);
}

function IssueMarker({ issue, interactive, showPopup, content, language }) {
  const lat = Number(issue.latitude);
  const lng = Number(issue.longitude);
  const statusLabel =
    content?.statusLabels?.[issue.status] || issue.status || "";
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

  return (
    <Marker position={[lat, lng]} icon={getPinIcon(issue.status)}>
      {interactive && showPopup ? (
        <Popup>
          <div className="issue-map-popup">
            <div className="issue-map-popup-meta">
              <span
                className={`issue-map-popup-status issue-map-popup-status--${issue.status || "OPEN"}`}
              >
                {statusLabel}
              </span>
              {categoryLabel ? (
                <span className="issue-map-popup-category">
                  {categoryLabel}
                </span>
              ) : null}
            </div>
            {issue.title ? (
              <Link
                href={`/issues/${issue.id}`}
                className="issue-map-popup-title"
              >
                {issue.title}
              </Link>
            ) : null}
            {issue.addressText ? (
              <p className="issue-map-popup-address">{issue.addressText}</p>
            ) : null}
            {issue.id && (issue.title || issue.voteCount != null) ? (
              <div className="issue-map-popup-footer">
                <span className="issue-map-popup-votes">{voteText}</span>
                <Link
                  href={`/issues/${issue.id}`}
                  className="issue-map-popup-link"
                >
                  {content?.card?.viewDetail || "View"} →
                </Link>
              </div>
            ) : null}
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
  cluster = true
}) {
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

  return (
    <div
      className={`issue-map-wrap${interactive ? "" : " issue-map-wrap--static"}`}
      style={{ height: `${height}px` }}
    >
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
    </div>
  );
}
