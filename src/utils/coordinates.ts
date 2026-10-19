import { MapDefinition, WeaponType, WorldPoint } from '../types/mortar';

export interface LatLng {
  lat: number;
  lng: number;
}

export const EDGE_OFFSET = 50;
export const KN_SCALE = 12.501;

/**
 * Converts authentic game-world coordinates (X Easting, Y Northing in meters)
 * into Leaflet coordinates for the Enfusion CRS.
 */
export function worldToLatLng(point: WorldPoint, _mapDef?: MapDefinition): LatLng {
  return {
    lat: point.yMeters + EDGE_OFFSET,
    lng: point.xMeters + EDGE_OFFSET,
  };
}

/**
 * Converts Leaflet coordinates back into authentic game-world coordinates (X Easting, Y Northing in meters).
 */
export function latLngToWorld(latLng: LatLng, mapDef?: MapDefinition): WorldPoint {
  const x = Math.round(latLng.lng - EDGE_OFFSET);
  const y = Math.round(latLng.lat - EDGE_OFFSET);
  if (mapDef) {
    return clampToMapBounds({ xMeters: x, yMeters: y }, mapDef);
  }
  return { xMeters: x, yMeters: y };
}

/**
 * Horizontal Euclidean distance between two points in meters.
 * Distance = sqrt((targetX - mortarX)^2 + (targetY - mortarY)^2)
 */
export function calculateEuclideanDistance(p1: WorldPoint, p2: WorldPoint): number {
  const dx = p2.xMeters - p1.xMeters;
  const dy = p2.yMeters - p1.yMeters;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Three-dimensional slant range distance between two points in meters.
 * Slant Range = sqrt(dx^2 + dy^2 + dz^2)
 */
export function calculateSlantDistance(p1: WorldPoint, p2: WorldPoint): number {
  const dx = p2.xMeters - p1.xMeters;
  const dy = p2.yMeters - p1.yMeters;
  const dz = (p2.altitudeMeters ?? 0) - (p1.altitudeMeters ?? 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Calculates responsive military scale bar metrics for the Enfusion map CRS.
 */
export function calculateScaleBarMetrics(
  zoom: number,
  _mapDef: MapDefinition,
  maxBarWidthPx = 130
): { distanceMeters: number; barWidthPx: number; label: string } {
  const metersPerPx = KN_SCALE / Math.pow(2, zoom);
  const maxMeters = maxBarWidthPx * metersPerPx;

  const niceSteps = [
    10, 25, 50, 100, 200, 250, 500, 750, 1000, 1500, 2000, 2500, 3000, 5000, 7500, 10000
  ];

  let targetMeters = niceSteps[0];
  for (const step of niceSteps) {
    if (step <= maxMeters) {
      targetMeters = step;
    } else {
      break;
    }
  }

  const barWidthPx = Math.max(28, Math.round(targetMeters / metersPerPx));
  const label = targetMeters >= 1000
    ? `${(targetMeters / 1000).toFixed(targetMeters % 1000 === 0 ? 0 : 1)} km`
    : `${targetMeters} m`;

  return {
    distanceMeters: targetMeters,
    barWidthPx,
    label,
  };
}

/**
 * Formats a distance in meters or kilometers.
 */
export function formatDistance(meters: number, unit: 'meters' | 'kilometers' | 'both' = 'meters'): string {
  const m = Math.round(meters);
  if (unit === 'kilometers') {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  if (unit === 'both' && meters >= 1000) {
    return `${m} m (${(meters / 1000).toFixed(2)} km)`;
  }
  return `${m} m`;
}

/**
 * Calculate Azimuth / Bearing from p1 (Mortar) to p2 (Target).
 * Angle is measured clockwise from True North (0° / 0 mils).
 */
export function calculateAzimuth(
  from: WorldPoint,
  to: WorldPoint,
  weaponType: WeaponType = 'm252'
): { degrees: number; mils: number } {
  const dx = to.xMeters - from.xMeters;
  const dy = to.yMeters - from.yMeters;

  let rad = Math.atan2(dx, dy);
  if (rad < 0) {
    rad += 2 * Math.PI;
  }
  const degrees = (rad * 180) / Math.PI;
  const milsPerCircle = weaponType === 'b2b14' ? 6000 : 6400;
  const rawMils = (rad / (2 * Math.PI)) * milsPerCircle;
  const mils = Math.round(rawMils) % milsPerCircle;

  return {
    degrees: Number(degrees.toFixed(1)),
    mils,
  };
}

/**
 * Formats world coordinates into standard military grid strings.
 */
export function formatGrid(point: WorldPoint, digits: 6 | 8 | 10 = 8): string {
  const x = Math.max(0, Math.round(point.xMeters));
  const y = Math.max(0, Math.round(point.yMeters));

  if (digits === 6) {
    const gx = String(Math.floor(x / 100)).padStart(3, '0').slice(-3);
    const gy = String(Math.floor(y / 100)).padStart(3, '0').slice(-3);
    return `${gx} ${gy}`;
  }
  if (digits === 8) {
    const gx = String(Math.floor(x / 10)).padStart(4, '0').slice(-4);
    const gy = String(Math.floor(y / 10)).padStart(4, '0').slice(-4);
    return `${gx} ${gy}`;
  }

  const gx = String(x).padStart(5, '0').slice(-5);
  const gy = String(y).padStart(5, '0').slice(-5);
  return `${gx} ${gy}`;
}

/**
 * Parses user-entered grid string into world coordinates.
 */
export function parseGrid(gridStr: string, mapDef: MapDefinition, centerInCell = false): WorldPoint | null {
  const trimmed = gridStr.trim();

  if (trimmed.includes(',') || trimmed.includes(';')) {
    const parts = trimmed.split(/[,;]+/).map(p => p.trim());
    if (parts.length >= 2) {
      const x = parseFloat(parts[0]);
      const y = parseFloat(parts[1]);
      if (!isNaN(x) && !isNaN(y)) {
        return clampToMapBounds({ xMeters: Math.round(x), yMeters: Math.round(y) }, mapDef);
      }
    }
  }

  const cleaned = trimmed.replace(/[^0-9]/g, '');
  if (cleaned.length === 6) {
    const offset = centerInCell ? 50 : 0;
    const xPart = parseInt(cleaned.slice(0, 3), 10) * 100 + offset;
    const yPart = parseInt(cleaned.slice(3, 6), 10) * 100 + offset;
    return clampToMapBounds({ xMeters: xPart, yMeters: yPart }, mapDef);
  }
  if (cleaned.length === 8) {
    const offset = centerInCell ? 5 : 0;
    const xPart = parseInt(cleaned.slice(0, 4), 10) * 10 + offset;
    const yPart = parseInt(cleaned.slice(4, 8), 10) * 10 + offset;
    return clampToMapBounds({ xMeters: xPart, yMeters: yPart }, mapDef);
  }
  if (cleaned.length === 10) {
    const xPart = parseInt(cleaned.slice(0, 5), 10);
    const yPart = parseInt(cleaned.slice(5, 10), 10);
    return clampToMapBounds({ xMeters: xPart, yMeters: yPart }, mapDef);
  }

  const parts = trimmed.split(/\s+/);
  if (parts.length === 2) {
    const x = parseFloat(parts[0]);
    const y = parseFloat(parts[1]);
    if (!isNaN(x) && !isNaN(y)) {
      return clampToMapBounds({ xMeters: Math.round(x), yMeters: Math.round(y) }, mapDef);
    }
  }

  return null;
}

export function clampToMapBounds(point: WorldPoint, mapDef: MapDefinition): WorldPoint {
  const { minX, maxX, minY, maxY } = mapDef.worldBounds;
  return {
    ...point,
    xMeters: Math.max(minX, Math.min(maxX, point.xMeters)),
    yMeters: Math.max(minY, Math.min(maxY, point.yMeters)),
  };
}
