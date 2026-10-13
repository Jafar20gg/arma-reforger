import { MilSystem } from '../types';

/**
 * Normalizes an angle in radians to [0, 2π)
 */
export function normalizeRadians(rad: number): number {
  const twoPi = 2 * Math.PI;
  return ((rad % twoPi) + twoPi) % twoPi;
}

/**
 * Calculate Euclidean horizontal range between two points in meters
 */
export function calculateRange(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate azimuth in radians from point 1 to point 2.
 * Point 1 is South/West origin (0,0) where Y is North and X is East.
 * Clockwise from North: North = 0, East = π/2, South = π, West = 3π/2.
 */
export function calculateAzimuthRadians(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  // atan2(dx, dy): angle from North (dy=1, dx=0 gives 0)
  const rad = Math.atan2(dx, dy);
  return normalizeRadians(rad);
}

/**
 * Convert radians to degrees [0, 360)
 */
export function radiansToDegrees(rad: number): number {
  return normalizeRadians(rad) * (180 / Math.PI);
}

/**
 * Convert radians or degrees to mils according to specified system (6400 NATO or 6000 Warsaw Pact)
 */
export function degreesToMils(degrees: number, milSystem: MilSystem = '6400'): number {
  const circleMils = milSystem === '6000' ? 6000 : 6400;
  const normalizedDeg = ((degrees % 360) + 360) % 360;
  return Math.round(normalizedDeg * (circleMils / 360)) % circleMils;
}

/**
 * Convert mils to degrees
 */
export function milsToDegrees(mils: number, milSystem: MilSystem = '6400'): number {
  const circleMils = milSystem === '6000' ? 6000 : 6400;
  return (mils / circleMils) * 360;
}

/**
 * Format meters to 6-digit military grid reference (e.g. "045 112")
 * 6-digit represents 100m grid squares.
 */
export function to6DigitGrid(x: number, y: number): string {
  const east100 = Math.floor(Math.max(0, x) / 100);
  const north100 = Math.floor(Math.max(0, y) / 100);
  const eStr = east100.toString().padStart(3, '0').slice(-3);
  const nStr = north100.toString().padStart(3, '0').slice(-3);
  return `${eStr} ${nStr}`;
}

/**
 * Format meters to 8-digit military grid reference (e.g. "0452 1120")
 * 8-digit represents 10m grid squares.
 */
export function to8DigitGrid(x: number, y: number): string {
  const east10 = Math.floor(Math.max(0, x) / 10);
  const north10 = Math.floor(Math.max(0, y) / 10);
  const eStr = east10.toString().padStart(4, '0').slice(-4);
  const nStr = north10.toString().padStart(4, '0').slice(-4);
  return `${eStr} ${nStr}`;
}

/**
 * Parse a military grid reference string (6 or 8 digits) into meters coordinates.
 * Returns { x, y } in meters or null if invalid format.
 */
export function parseGridReference(input: string): { x: number; y: number } | null {
  const cleaned = input.replace(/[\s\-_,.]/g, '');
  if (!/^\d+$/.test(cleaned)) {
    return null;
  }

  if (cleaned.length === 6) {
    // 3 digits Easting, 3 digits Northing (100m precision)
    const e = parseInt(cleaned.slice(0, 3), 10);
    const n = parseInt(cleaned.slice(3, 6), 10);
    return {
      x: e * 100 + 50, // center of 100m square
      y: n * 100 + 50,
    };
  }

  if (cleaned.length === 8) {
    // 4 digits Easting, 4 digits Northing (10m precision)
    const e = parseInt(cleaned.slice(0, 4), 10);
    const n = parseInt(cleaned.slice(4, 8), 10);
    return {
      x: e * 10 + 5, // center of 10m square
      y: n * 10 + 5,
    };
  }

  return null;
}

/**
 * Format coordinates for HUD display
 */
export function formatCoordinates(x: number, y: number, milSystem: MilSystem = '6400') {
  return {
    meters: `X: ${Math.round(x).toString().padStart(5, '0')}m | Y: ${Math.round(y).toString().padStart(5, '0')}m`,
    grid6: to6DigitGrid(x, y),
    grid8: to8DigitGrid(x, y),
  };
}
