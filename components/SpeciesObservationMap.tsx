"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ObservationLocation } from "@/lib/birding";

const TILE_SIZE = 256;
const MIN_ZOOM = 2;
const MAX_ZOOM = 13;
const PADDING = 34;
const MAX_MERCATOR_LAT = 85.05112878;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function project(latitude: number, longitude: number) {
  const lat = clamp(latitude, -MAX_MERCATOR_LAT, MAX_MERCATOR_LAT) * Math.PI / 180;
  return {
    x: (longitude + 180) / 360,
    y: (1 - Math.log(Math.tan(lat) + 1 / Math.cos(lat)) / Math.PI) / 2,
  };
}

export function SpeciesObservationMap({ points }: { points: ObservationLocation[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const update = () => setSize({ width: node.clientWidth, height: node.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const view = useMemo(() => {
    if (!size.width || !size.height || !points.length) return null;

    const projected = points.map((point) => ({ point, ...project(point.latitude, point.longitude) }));
    const xs = projected.map((point) => point.x);
    const ys = projected.map((point) => point.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const spanX = maxX - minX;
    const spanY = maxY - minY;
    const availableWidth = Math.max(64, size.width - PADDING * 2);
    const availableHeight = Math.max(64, size.height - PADDING * 2);

    let zoom = MAX_ZOOM;
    if (points.length > 1) {
      const zoomX = spanX > 0 ? Math.log2(availableWidth / (spanX * TILE_SIZE)) : MAX_ZOOM;
      const zoomY = spanY > 0 ? Math.log2(availableHeight / (spanY * TILE_SIZE)) : MAX_ZOOM;
      zoom = Math.floor(Math.min(zoomX, zoomY, MAX_ZOOM));
    } else {
      zoom = 10;
    }
    zoom = clamp(zoom, MIN_ZOOM, MAX_ZOOM);

    const worldSize = TILE_SIZE * 2 ** zoom;
    const centerX = ((minX + maxX) / 2) * worldSize;
    const centerY = ((minY + maxY) / 2) * worldSize;
    const topLeftX = centerX - size.width / 2;
    const topLeftY = centerY - size.height / 2;
    const firstTileX = Math.floor(topLeftX / TILE_SIZE);
    const lastTileX = Math.floor((topLeftX + size.width) / TILE_SIZE);
    const firstTileY = Math.floor(topLeftY / TILE_SIZE);
    const lastTileY = Math.floor((topLeftY + size.height) / TILE_SIZE);
    const tiles: Array<{ x: number; y: number; sourceX: number; left: number; top: number }> = [];
    const tileCount = 2 ** zoom;

    for (let y = firstTileY; y <= lastTileY; y += 1) {
      if (y < 0 || y >= tileCount) continue;
      for (let x = firstTileX; x <= lastTileX; x += 1) {
        const sourceX = ((x % tileCount) + tileCount) % tileCount;
        tiles.push({
          x,
          y,
          sourceX,
          left: x * TILE_SIZE - topLeftX,
          top: y * TILE_SIZE - topLeftY,
        });
      }
    }

    const markers = projected.map(({ point, x, y }) => ({
      ...point,
      left: x * worldSize - topLeftX,
      top: y * worldSize - topLeftY,
    }));

    return { zoom, tiles, markers };
  }, [points, size]);

  return (
    <div className="species-observation-map" ref={rootRef} aria-label="Observed locations map">
      {view?.tiles.map((tile) => (
        <img
          key={`${view.zoom}-${tile.x}-${tile.y}`}
          className="species-map-tile"
          src={`https://tile.openstreetmap.org/${view.zoom}/${tile.sourceX}/${tile.y}.png`}
          alt=""
          draggable={false}
          loading="lazy"
          style={{ left: tile.left, top: tile.top }}
        />
      ))}
      {view?.markers.map((marker) => (
        <span
          aria-hidden="true"
          className="species-map-dot"
          key={marker.id}
          style={{ left: marker.left, top: marker.top }}
        />
      ))}
      <span className="species-map-attribution">© OpenStreetMap contributors</span>
    </div>
  );
}
