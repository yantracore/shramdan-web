// Lightweight static-map thumbnail. Renders one OpenStreetMap raster tile
// (no leaflet, no client-side JS) plus a precisely-positioned pin overlay
// at the issue's coordinate. Used on /issues cards where no cover photo
// exists — replaces the bare PictureOutlined placeholder so every card
// carries a sense of place.
//
// Tile math: convert lon/lat → tile (x, y) at zoom z, then place the
// pin at the fractional pixel offset inside the tile. The tile is
// rendered at the container's full width/height, so the pin position
// is expressed as a percentage of 256px.

import Image from "next/image";

const TILE_SIZE = 256;
const DEFAULT_ZOOM = 14;

function lonLatToTilePx(lon, lat, zoom) {
  const n = Math.pow(2, zoom);
  const xCoord = ((lon + 180) / 360) * n;
  const latRad = (lat * Math.PI) / 180;
  const yCoord =
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  const xTile = Math.floor(xCoord);
  const yTile = Math.floor(yCoord);
  const xPx = (xCoord - xTile) * TILE_SIZE;
  const yPx = (yCoord - yTile) * TILE_SIZE;
  return { xTile, yTile, xPx, yPx };
}

export function IssueMapThumb({ latitude, longitude, alt = "", zoom = DEFAULT_ZOOM }) {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const { xTile, yTile, xPx, yPx } = lonLatToTilePx(lng, lat, zoom);
  const tileUrl = `https://tile.openstreetmap.org/${zoom}/${xTile}/${yTile}.png`;
  const leftPct = (xPx / TILE_SIZE) * 100;
  const topPct = (yPx / TILE_SIZE) * 100;

  return (
    <span className="issue-map-thumb" aria-hidden="true">
      <Image
        alt={alt}
        className="issue-map-thumb-tile"
        height={256}
        loading="lazy"
        src={tileUrl}
        unoptimized
        width={256}
        sizes="(max-width: 720px) 100vw, 360px"
      />
      <span
        className="issue-map-thumb-pin"
        style={{ left: `${leftPct}%`, top: `${topPct}%` }}
      />
      <span className="issue-map-thumb-attribution">© OpenStreetMap</span>
    </span>
  );
}
