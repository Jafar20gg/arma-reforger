import { TerrainId } from '../types';

interface HeightmapCache {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  maxElevationMeters: number;
}

const heightmapCaches: Partial<Record<TerrainId, HeightmapCache | null>> = {};
const heightmapAvailability: Partial<Record<TerrainId, boolean>> = {};

/**
 * Procedural fallback elevation model based on topographical contours of Everon & Arland
 */
function getProceduralElevation(terrain: TerrainId, x: number, y: number): number {
  if (terrain === 'everon') {
    const nx = x / 12800;
    const ny = y / 12800;
    
    const distToCenter = Math.sqrt(Math.pow(nx - 0.48, 2) + Math.pow(ny - 0.52, 2));
    if (distToCenter > 0.42) return 0; // Ocean

    const peak1 = Math.exp(-((Math.pow(nx - 0.52, 2) + Math.pow(ny - 0.72, 2)) / 0.015)) * 290;
    const peak2 = Math.exp(-((Math.pow(nx - 0.38, 2) + Math.pow(ny - 0.48, 2)) / 0.025)) * 210;
    const peak3 = Math.exp(-((Math.pow(nx - 0.65, 2) + Math.pow(ny - 0.38, 2)) / 0.020)) * 170;
    const rolling = Math.sin(nx * 18) * Math.cos(ny * 16) * 25 + 40;

    const baseElevation = Math.max(0, peak1 + peak2 + peak3 + rolling);
    return Math.round(baseElevation);
  } else {
    const nx = x / 5940;
    const ny = y / 5940;
    const distToCenter = Math.sqrt(Math.pow(nx - 0.5, 2) + Math.pow(ny - 0.5, 2));
    if (distToCenter > 0.44) return 0; // Ocean

    const peak = Math.exp(-((Math.pow(nx - 0.58, 2) + Math.pow(ny - 0.62, 2)) / 0.03)) * 115;
    const rolling = Math.sin(nx * 12) * Math.cos(ny * 12) * 18 + 25;
    return Math.max(0, Math.round(peak + rolling));
  }
}

/**
 * Load user-uploaded heightmap from Blob into canvas cache
 */
export async function setCustomHeightmapBlob(terrain: TerrainId, blob: Blob): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.src = url;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(url);
          resolve(false);
          return;
        }

        ctx.drawImage(img, 0, 0);
        heightmapCaches[terrain] = {
          canvas,
          ctx,
          width: img.width,
          height: img.height,
          maxElevationMeters: terrain === 'everon' ? 350 : 150,
        };
        heightmapAvailability[terrain] = true;
        URL.revokeObjectURL(url);
        resolve(true);
      } catch {
        URL.revokeObjectURL(url);
        resolve(false);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(false);
    };
  });
}

/**
 * Initialize and load heightmap image if available in /heightmaps/{terrain}.png
 */
export async function loadHeightmapImage(terrain: TerrainId): Promise<boolean> {
  if (heightmapCaches[terrain] !== undefined) {
    return heightmapAvailability[terrain] ?? false;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.src = `./heightmaps/${terrain}.png`;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          heightmapCaches[terrain] = null;
          heightmapAvailability[terrain] = false;
          resolve(false);
          return;
        }

        ctx.drawImage(img, 0, 0);
        heightmapCaches[terrain] = {
          canvas,
          ctx,
          width: img.width,
          height: img.height,
          maxElevationMeters: terrain === 'everon' ? 350 : 150,
        };
        heightmapAvailability[terrain] = true;
        resolve(true);
      } catch {
        heightmapCaches[terrain] = null;
        heightmapAvailability[terrain] = false;
        resolve(false);
      }
    };

    img.onerror = () => {
      heightmapCaches[terrain] = null;
      heightmapAvailability[terrain] = false;
      resolve(false);
    };
  });
}

/**
 * Sample elevation at coordinates (x, y) in meters.
 * Checks real heightmap image first; if not found, falls back to procedural terrain model.
 */
export async function sampleAltitudeAt(
  terrain: TerrainId,
  x: number,
  y: number,
  terrainSize: number
): Promise<{ altitude: number; isFromImage: boolean }> {
  if (heightmapCaches[terrain] === undefined) {
    await loadHeightmapImage(terrain);
  }

  const cache = heightmapCaches[terrain];
  if (cache && cache.ctx) {
    try {
      const px = Math.floor((x / terrainSize) * cache.width);
      const py = Math.floor(((terrainSize - y) / terrainSize) * cache.height);

      if (px >= 0 && px < cache.width && py >= 0 && py < cache.height) {
        const pixel = cache.ctx.getImageData(px, py, 1, 1).data;
        const gray = (pixel[0] + pixel[1] + pixel[2]) / 3;
        const altitude = Math.round((gray / 255) * cache.maxElevationMeters);
        return { altitude, isFromImage: true };
      }
    } catch {
      // Fallback
    }
  }

  return {
    altitude: getProceduralElevation(terrain, x, y),
    isFromImage: false,
  };
}

export function isHeightmapImageLoaded(terrain: TerrainId): boolean {
  return !!heightmapAvailability[terrain];
}
