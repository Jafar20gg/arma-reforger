import { TerrainId, LocationLayer } from '../types';

export type TileSourceType = 'image' | 'url' | 'folder' | 'recoil' | 'none';

export interface TerrainImageConfig {
  terrain: TerrainId;
  imageUrl: string | null;
  imageBlob?: Blob;
  externalImageUrl?: string;
  opacity: number;
  tileSourceType?: TileSourceType;
  tileUrlTemplate?: string;
  tileFolderCount?: number;
  isCalibrated: boolean;
  bounds: [[number, number], [number, number]];
  updatedAt: number;
}

export interface CalibrationPoint {
  imgU: number; // 0 to 1
  imgV: number; // 0 to 1
  worldX: number;
  worldY: number;
}

export interface RecoilMapPreset {
  terrainId: TerrainId;
  name: string;
  nameAr: string;
  sizeMeters: number;
  compositeUrl: string;
  thumbUrl: string;
  tileUrlTemplate: string;
  pageUrl: string;
  description: string;
  descriptionAr: string;
}

export const RECOIL_MAP_PRESETS: Record<TerrainId, RecoilMapPreset> = {
  everon: {
    terrainId: 'everon',
    name: 'Everon',
    nameAr: 'إيفرون',
    sizeMeters: 12800,
    compositeUrl: 'https://reforger.recoil.org/everon_hero_composite.jpg',
    thumbUrl: 'https://reforger.recoil.org/everon_hero_composite_thumb.jpg',
    tileUrlTemplate: 'https://reforger.recoil.org/map-tiles/everon/{z}/{x}/{y}/tile.jpg',
    pageUrl: 'https://reforger.recoil.org/everon/',
    description: '12.8 × 12.8 km high-resolution composite map (2159px) from recoil.org.',
    descriptionAr: 'خريطة جزيرة إيفرون 12.8 × 12.8 كم عالية الدقة (2159 بكسل) من recoil.org.',
  },
  arland: {
    terrainId: 'arland',
    name: 'Arland',
    nameAr: 'أرلاند',
    sizeMeters: 4000,
    compositeUrl: 'https://reforger.recoil.org/arland_hero_composite.jpg',
    thumbUrl: 'https://reforger.recoil.org/arland_hero_composite_thumb.jpg',
    tileUrlTemplate: 'https://reforger.recoil.org/map-tiles/arland/{z}/{x}/{y}/tile.jpg',
    pageUrl: 'https://reforger.recoil.org/arland/',
    description: '4.0 × 4.0 km high-resolution composite map (1699px) from recoil.org.',
    descriptionAr: 'خريطة تضاريس أرلاند 4.0 × 4.0 كم عالية الدقة (1699 بكسل) من recoil.org.',
  },
  kolguyev: {
    terrainId: 'kolguyev',
    name: 'Kolguyev',
    nameAr: 'كولغوييف',
    sizeMeters: 12800,
    compositeUrl: 'https://reforger.recoil.org/kolguyev_hero_composite.jpg',
    thumbUrl: 'https://reforger.recoil.org/kolguyev_hero_composite_thumb.jpg',
    tileUrlTemplate: 'https://reforger.recoil.org/map-tiles/kolguyev/{z}/{x}/{y}/tile.jpg',
    pageUrl: 'https://reforger.recoil.org/kolguyev/',
    description: '12.8 × 12.8 km ultra-resolution composite map (4200px) from recoil.org.',
    descriptionAr: 'خريطة كولغوييف الكلاسيكية 12.8 × 12.8 كم فائقة الدقة (4200 بكسل) من recoil.org.',
  },
};

const DB_NAME = 'reforger_mortar_storage_db';
const DB_VERSION = 2;
const STORE_IMAGES = 'terrain_images';
const STORE_TILES = 'map_tiles';
const STORE_LAYERS = 'location_layers';

let dbInstance: IDBDatabase | null = null;

// In-memory tile cache for rapid map panning
const tileMemoryCache = new Map<string, string>(); // key -> ObjectURL

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_IMAGES)) {
        db.createObjectStore(STORE_IMAGES, { keyPath: 'terrain' });
      }
      if (!db.objectStoreNames.contains(STORE_TILES)) {
        const tileStore = db.createObjectStore(STORE_TILES, { keyPath: 'id' });
        tileStore.createIndex('terrain', 'terrain', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_LAYERS)) {
        const layerStore = db.createObjectStore(STORE_LAYERS, { keyPath: 'id' });
        layerStore.createIndex('terrain', 'terrain', { unique: false });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export function getDefaultBounds(terrain: TerrainId, customSize?: number): [[number, number], [number, number]] {
  const size = customSize && customSize > 0
    ? customSize
    : terrain === 'arland'
    ? 4000
    : 12800; // Everon & Kolguyev default to 12800 m
  return [
    [0, 0],
    [size, size],
  ];
}

/**
 * Save terrain map image configuration
 */
export async function saveTerrainImage(
  terrain: TerrainId,
  imageBlob: Blob | null,
  options?: Partial<Omit<TerrainImageConfig, 'terrain' | 'imageBlob'>> & {
    externalImageUrl?: string;
  }
): Promise<TerrainImageConfig> {
  const db = await openDB();
  const existing = await getTerrainImage(terrain);

  const effectiveImageUrl = imageBlob
    ? URL.createObjectURL(imageBlob)
    : options?.imageUrl !== undefined
    ? options.imageUrl
    : options?.externalImageUrl !== undefined
    ? options.externalImageUrl
    : existing?.imageUrl ?? null;

  const config: TerrainImageConfig = {
    terrain,
    imageUrl: effectiveImageUrl,
    imageBlob: imageBlob ?? existing?.imageBlob,
    externalImageUrl: options?.externalImageUrl ?? (imageBlob ? undefined : existing?.externalImageUrl),
    opacity: options?.opacity ?? existing?.opacity ?? 0.85,
    tileSourceType: options?.tileSourceType ?? existing?.tileSourceType ?? (imageBlob ? 'image' : 'none'),
    tileUrlTemplate: options?.tileUrlTemplate ?? existing?.tileUrlTemplate ?? '',
    tileFolderCount: options?.tileFolderCount ?? existing?.tileFolderCount ?? 0,
    isCalibrated: options?.isCalibrated ?? existing?.isCalibrated ?? false,
    bounds: options?.bounds ?? existing?.bounds ?? getDefaultBounds(terrain),
    updatedAt: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_IMAGES, 'readwrite');
    const store = tx.objectStore(STORE_IMAGES);

    const recordToStore = {
      terrain: config.terrain,
      imageBlob: config.imageBlob,
      externalImageUrl: config.externalImageUrl,
      imageUrl: config.imageUrl,
      opacity: config.opacity,
      tileSourceType: config.tileSourceType,
      tileUrlTemplate: config.tileUrlTemplate,
      tileFolderCount: config.tileFolderCount,
      isCalibrated: config.isCalibrated,
      bounds: config.bounds,
      updatedAt: config.updatedAt,
    };

    const req = store.put(recordToStore);
    req.onsuccess = () => resolve(config);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Retrieve map image config from IndexedDB
 */
export async function getTerrainImage(terrain: TerrainId): Promise<TerrainImageConfig | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_IMAGES, 'readonly');
      const store = tx.objectStore(STORE_IMAGES);
      const req = store.get(terrain);

      req.onsuccess = () => {
        const result = req.result;
        if (!result) {
          resolve(null);
          return;
        }

        let imageUrl: string | null = null;
        if (result.imageBlob instanceof Blob) {
          imageUrl = URL.createObjectURL(result.imageBlob);
        } else if (result.externalImageUrl && typeof result.externalImageUrl === 'string') {
          imageUrl = result.externalImageUrl;
        } else if (result.imageUrl && typeof result.imageUrl === 'string') {
          imageUrl = result.imageUrl;
        }

        resolve({
          terrain: result.terrain,
          imageUrl,
          imageBlob: result.imageBlob,
          externalImageUrl: result.externalImageUrl,
          opacity: result.opacity ?? 0.85,
          tileSourceType: result.tileSourceType ?? (result.imageBlob ? 'image' : 'none'),
          tileUrlTemplate: result.tileUrlTemplate ?? '',
          tileFolderCount: result.tileFolderCount ?? 0,
          isCalibrated: result.isCalibrated ?? false,
          bounds: result.bounds ?? getDefaultBounds(terrain),
          updatedAt: result.updatedAt ?? Date.now(),
        });
      };

      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Error loading terrain image from IndexedDB:', err);
    return null;
  }
}

/**
 * Remove terrain map image and tiles from IndexedDB
 */
export async function deleteTerrainImage(terrain: TerrainId): Promise<void> {
  const db = await openDB();
  await clearTilesForTerrain(terrain);

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_IMAGES, 'readwrite');
    const store = tx.objectStore(STORE_IMAGES);
    const req = store.delete(terrain);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Store tiles loaded from EnfusionMapMaker folder
 * Supported path structures:
 * e.g. `{z}/{x}/{y}.png`, `tiles/{z}/{x}/{y}.png`, or `{z}_{x}_{y}.png`
 */
export async function storeTileFolder(terrain: TerrainId, files: File[]): Promise<number> {
  const db = await openDB();
  let count = 0;

  const tx = db.transaction(STORE_TILES, 'readwrite');
  const store = tx.objectStore(STORE_TILES);

  for (const file of files) {
    const path = file.webkitRelativePath || file.name;
    // Regex for z/x/y with extension
    const match = path.match(/(\d+)[\/\-_](\d+)[\/\-_](\d+)\.(png|jpg|webp)$/i);
    if (match) {
      const z = parseInt(match[1], 10);
      const x = parseInt(match[2], 10);
      const y = parseInt(match[3], 10);
      const id = `${terrain}/${z}/${x}/${y}`;

      store.put({
        id,
        terrain,
        z,
        x,
        y,
        blob: file,
      });
      count++;
    }
  }

  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  // Update terrain image config with tile folder count
  const existing = await getTerrainImage(terrain);
  await saveTerrainImage(terrain, existing?.imageBlob ?? null, {
    tileSourceType: 'folder',
    tileFolderCount: count,
  });

  return count;
}

/**
 * Get tile object URL (cached in memory for high performance)
 */
export async function getTileUrl(terrain: TerrainId, z: number, x: number, y: number): Promise<string | null> {
  const key = `${terrain}/${z}/${x}/${y}`;
  if (tileMemoryCache.has(key)) {
    return tileMemoryCache.get(key)!;
  }

  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_TILES, 'readonly');
    const store = tx.objectStore(STORE_TILES);
    const req = store.get(key);

    req.onsuccess = () => {
      if (req.result && req.result.blob instanceof Blob) {
        const url = URL.createObjectURL(req.result.blob);
        tileMemoryCache.set(key, url);
        resolve(url);
      } else {
        resolve(null);
      }
    };

    req.onerror = () => resolve(null);
  });
}

/**
 * Delete all stored tiles for a terrain
 */
export async function clearTilesForTerrain(terrain: TerrainId): Promise<void> {
  const db = await openDB();
  // Clear memory cache keys
  for (const key of tileMemoryCache.keys()) {
    if (key.startsWith(`${terrain}/`)) {
      URL.revokeObjectURL(tileMemoryCache.get(key)!);
      tileMemoryCache.delete(key);
    }
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_TILES, 'readwrite');
    const store = tx.objectStore(STORE_TILES);
    const index = store.index('terrain');
    const req = index.openKeyCursor(IDBKeyRange.only(terrain));

    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        store.delete(cursor.primaryKey);
        cursor.continue();
      } else {
        resolve();
      }
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Calculate calibration bounds from two reference points
 */
export function computeCalibrationBounds(
  p1: CalibrationPoint,
  p2: CalibrationPoint
): [[number, number], [number, number]] | null {
  const du = p2.imgU - p1.imgU;
  const dv = p2.imgV - p1.imgV;
  const dx = p2.worldX - p1.worldX;
  const dy = p2.worldY - p1.worldY;

  if (Math.abs(du) < 0.001 || Math.abs(dv) < 0.001) {
    return null;
  }

  const imageWidthMeters = Math.abs(dx / du);
  const imageHeightMeters = Math.abs(dy / dv);

  const leftX = p1.worldX - p1.imgU * imageWidthMeters;
  const rightX = leftX + imageWidthMeters;

  const topY = p1.worldY + p1.imgV * imageHeightMeters;
  const bottomY = topY - imageHeightMeters;

  return [
    [Math.round(bottomY), Math.round(leftX)],
    [Math.round(topY), Math.round(rightX)],
  ];
}

// ---------------------------------------------------------------------------
// LOCATION LAYERS STORE (IndexedDB)
// ---------------------------------------------------------------------------

export async function saveLocationLayer(layer: LocationLayer): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_LAYERS, 'readwrite');
    const store = tx.objectStore(STORE_LAYERS);
    const req = store.put(layer);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getLocationLayers(terrain: TerrainId): Promise<LocationLayer[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_LAYERS, 'readonly');
      const store = tx.objectStore(STORE_LAYERS);
      const index = store.index('terrain');
      const req = index.getAll(IDBKeyRange.only(terrain));

      req.onsuccess = () => {
        resolve(req.result || []);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Error fetching location layers:', err);
    return [];
  }
}

export async function deleteLocationLayer(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_LAYERS, 'readwrite');
    const store = tx.objectStore(STORE_LAYERS);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
