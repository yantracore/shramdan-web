"use client";

import { CompassOutlined, EnvironmentOutlined, ExportOutlined } from "@ant-design/icons";
import IssueMapBlock from "@/components/IssueMapBlock";

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

// Directions link — origin omitted so Google Maps routes from the viewer's own
// current location to this campaign's spot. Coords win over the text address.
function buildDirectionsLink(addressText, latitude, longitude) {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }
  if (addressText) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addressText)}`;
  }
  return null;
}

export function IssueLocationCard({
  issue,
  addressText,
  latitude,
  longitude,
  content,
  language = "en"
}) {
  const address = addressText ?? issue?.addressText;
  const lat = Number(latitude ?? issue?.latitude);
  const lng = Number(longitude ?? issue?.longitude);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

  if (!address && !hasCoords) return null;

  const mapsLink = buildMapsLink(address, lat, lng);
  const directionsLink = buildDirectionsLink(address, lat, lng);
  const mapIssue = hasCoords
    ? {
        id: issue?.id ?? "self",
        title: issue?.title,
        status: issue?.status,
        category: issue?.category,
        addressText: address,
        latitude: lat,
        longitude: lng,
        voteCount: issue?.voteCount
      }
    : null;

  return (
    <section className="public-issue-location-card" id="issue-location">
      <div className="public-issue-location-header">
        <h2>{content.detail.locationTitle}</h2>
        <div className="public-issue-location-links">
          {directionsLink ? (
            <a
              className="public-issue-location-open-link"
              href={directionsLink}
              rel="noreferrer"
              target="_blank"
            >
              <CompassOutlined /> {content.detail.getDirections}
            </a>
          ) : null}
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
      </div>
      {address ? (
        <p className="public-issue-location-address">
          <EnvironmentOutlined /> {address}
        </p>
      ) : null}
      {mapIssue ? (
        <div className="public-issue-location-map">
          <IssueMapBlock
            issues={[mapIssue]}
            content={content}
            language={language}
            height={612}
            interactive
            showPopup={false}
            enableFullscreen
            fullscreenLabel={content?.detail?.fullscreenOpen || "Open fullscreen map"}
            exitFullscreenLabel={content?.detail?.fullscreenClose || "Close fullscreen map"}
          />
        </div>
      ) : null}
    </section>
  );
}
