"use client";

import { EnvironmentOutlined, ExportOutlined } from "@ant-design/icons";

function buildOsmEmbedUrl(latitude, longitude) {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const delta = 0.005;
  const bbox = [lng - delta, lat - delta, lng + delta, lat + delta]
    .map((n) => n.toFixed(6))
    .join(",");
  const marker = `${lat.toFixed(6)},${lng.toFixed(6)}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${marker}`;
}

function buildMapsLink(addressText, latitude, longitude) {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }
  if (addressText) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressText)}`;
  }
  return null;
}

export function IssueLocationCard({ addressText, latitude, longitude, content }) {
  if (!addressText && latitude == null && longitude == null) return null;

  const embedUrl = buildOsmEmbedUrl(latitude, longitude);
  const mapsLink = buildMapsLink(addressText, latitude, longitude);

  return (
    <section className="public-issue-location-card" id="issue-location">
      <div className="public-issue-location-header">
        <h2>{content.detail.locationTitle}</h2>
        {mapsLink ? (
          <a
            className="public-issue-location-open-link"
            href={mapsLink}
            rel="noreferrer"
            target="_blank"
          >
            {content.detail.openInMaps} <ExportOutlined />
          </a>
        ) : null}
      </div>
      {addressText ? (
        <p className="public-issue-location-address">
          <EnvironmentOutlined /> {addressText}
        </p>
      ) : null}
      {embedUrl ? (
        <div className="public-issue-location-map">
          <iframe
            title={content.detail.locationTitle}
            src={embedUrl}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      ) : null}
    </section>
  );
}
