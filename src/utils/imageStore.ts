import { TerrainId, LocationLayer } from '../types';
import { mapLogger } from './mapLogger';

export type TileSourceType = 'image' | 'url' | 'folder' | 'none';

export interface CalibrationPoint {
  imgU: number; // 0 to 1
  imgV: number; // 0 to 1
  worldX: number; // meters
  worldY: number; // meters
}

export interface TerrainImageConfig {
  terrain: TerrainId;
  imageUrl: string | null;
  imageBlob?: Blob;
  displayBlob?: Blob;
  naturalWidth?: number;
  naturalHeight?: number;
  flipY?: boolean; // Flip vertical axis (عكس المحور الرأسي)
  opacity: number;
  tileSourceType?: TileSourceType;
  tileUrlTemplate?: string;
  tileFolderCount?: number;
  isCalibrated: boolean;
  calibrationPoints?: [CalibrationPoint, CalibrationPoint];
  bounds: [[number, number], [number, number]];
  updatedAt: number;
}

export interface TerrainTileMeta {
  terrain: string;
  sizeMeters: number;
  tileSize: number;
  minZoom: number;
  maxZoom: number;
  format: 'webp' | 'png' | 'jpg';
  yOrder: 'xyz' | 'tms';
  attribution: string;
}

/**
 * Checks if the site ships its own tiles at ./tiles/{terrain}/meta.json.
 * If present, loads metadata automatically.
 */
export async function fetchSiteTileMeta(terrainId: string): Promise<TerrainTileMeta | null> {
  try {
    const res = await fetch(`./tiles/${terrainId}/meta.json`, { cache: 'no-cache' });
    if (!res.ok) return null;
    const data = await res.json();
    if (data && typeof data === 'object') {
      return {
        terrain: data.terrain || terrainId,
        sizeMeters: Number(data.sizeMeters) || 12800,
        tileSize: Number(data.tileSize) || 256,
        minZoom: typeof data.minZoom === 'number' ? data.minZoom : 0,
        maxZoom: typeof data.maxZoom === 'number' ? data.maxZoom : 6,
        format: data.format || 'webp',
        yOrder: data.yOrder === 'tms' ? 'tms' : 'xyz',
        attribution: data.attribution || 'Map tiles generated with EnfusionMapMaker (APL-SA)',
      };
    }
    return null;
  } catch {
    return null;
  }
}

// Educational links for external reference only - no hotlinking or auto-downloading
export interface RecoilTerrainInfo {
  terrainId: TerrainId;
  name: string;
  nameAr: string;
  sizeMeters: number;
  pageUrl: string;
  creator: string;
}

export const RECOIL_TERRAIN_INFO: Record<TerrainId, RecoilTerrainInfo> = {
  everon: {
    terrainId: 'everon',
    name: 'Everon',
    nameAr: 'إيفرون',
    sizeMeters: 12800,
    pageUrl: 'https://reforger.recoil.org/everon/',
    creator: 'Nick Ludlam (EnfusionMapMaker)',
  },
  arland: {
    terrainId: 'arland',
    name: 'Arland',
    nameAr: 'أرلاند',
    sizeMeters: 4000,
    pageUrl: 'https://reforger.recoil.org/arland/',
    creator: 'Nick Ludlam (EnfusionMapMaker)',
  },
  kolguyev: {
    terrainId: 'kolguyev',
    name: 'Kolguyev',
    nameAr: 'كولغوييف',
    sizeMeters: 12800,
    pageUrl: 'https://reforger.recoil.org/kolguyev/',
    creator: 'Nick Ludlam (EnfusionMapMaker)',
  },
};

const DB_NAME = 'reforger_mortar_storage_db';
const DB_VERSION = 3;
const STORE_IMAGES = 'terrain_images';
const STORE_TILES = 'map_tiles';
const STORE_LAYERS = 'location_layers';

let dbInstance: IDBDatabase | null = null;
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

/**
 * Returns bounds in CRS.Simple [[south, west], [north, east]]
 * where y is north (0 to sizeMeters)
 */
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
 * Validates and scales down an image if dimensions exceed maxDimension (4096px).
 * Preserves the original file in IndexedDB and creates a display blob for rendering.
 */
export async function processLocalImageFile(
  file: File,
  maxDimension = 4096
): Promise<{
  originalBlob: Blob;
  displayBlob: Blob;
  width: number;
  height: number;
  isDownscaled: boolean;
}> {
  const validTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/jpg'];
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!validTypes.includes(file.type) && !['png', 'jpg', 'jpeg', 'webp'].includes(ext || '')) {
    throw new Error('نوع الملف غير مدعوم. يرجى اختيار ملف صورة بتنسيق PNG أو JPG أو WebP.');
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      const origWidth = img.naturalWidth || img.width;
      const origHeight = img.naturalHeight || img.height;

      if (!origWidth || !origHeight) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('تعذر قراءة أبعاد الصورة. قد يكون الملف تالفاً.'));
        return;
      }

      if (origWidth <= maxDimension && origHeight <= maxDimension) {
        // No downscaling required
        resolve({
          originalBlob: file,
          displayBlob: file,
          width: origWidth,
          height: origHeight,
          isDownscaled: false,
        });
        URL.revokeObjectURL(objectUrl);
        return;
      }

      // Downscaling needed
      try {
        const scale = Math.min(maxDimension / origWidth, maxDimension / origHeight);
        const targetW = Math.round(origWidth * scale);
        const targetH = Math.round(origHeight * scale);

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          // Fallback to original
          resolve({
            originalBlob: file,
            displayBlob: file,
            width: origWidth,
            height: origHeight,
            isDownscaled: false,
          });
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, targetW, targetH);

        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(objectUrl);
            if (!blob) {
              resolve({
                originalBlob: file,
                displayBlob: file,
                width: origWidth,
                height: origHeight,
                isDownscaled: false,
              });
              return;
            }

            resolve({
              originalBlob: file,
              displayBlob: blob,
              width: targetW,
              height: targetH,
              isDownscaled: true,
            });
          },
          'image/jpeg',
          0.92
        );
      } catch (canvasErr) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('حدث خطأ في الذاكرة أثناء معالجة أبعاد الصورة الكبيرة.'));
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('فشل فك ترميز ملف الصورة. يرجى التأكد من سلامة الملف وصيغته.'));
    };

    img.src = objectUrl;
  });
}

/**
 * Generates a synthetic test pattern map image on an HTML5 canvas.
 * Useful for diagnosing Leaflet image overlay rendering independently of file uploads.
 */
export async function generateTestPatternImage(
  terrain: TerrainId,
  sizeMeters: number
): Promise<{ blob: Blob; width: number; height: number }> {
  const width = 2048;
  const height = 2048;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('تعذر إنشاء سياق رسم لوحة الاختبار.');
  }

  // Base background
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#0c1b33');
  gradient.addColorStop(0.5, '#11294a');
  gradient.addColorStop(1, '#081326');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Checkerboard pattern
  const checkSize = 128;
  for (let y = 0; y < height; y += checkSize) {
    for (let x = 0; x < width; x += checkSize) {
      if ((x / checkSize + y / checkSize) % 2 === 0) {
        ctx.fillStyle = 'rgba(14, 165, 233, 0.08)';
        ctx.fillRect(x, y, checkSize, checkSize);
      }
    }
  }

  // Grid lines
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
  ctx.lineWidth = 2;
  const step = width / 8;
  for (let i = 0; i <= width; i += step) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(width, i);
    ctx.stroke();
  }

  // Border
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, width - 8, height - 8);

  // Crosshair in center
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 60, height / 2);
  ctx.lineTo(width / 2 + 60, height / 2);
  ctx.moveTo(width / 2, height / 2 - 60);
  ctx.lineTo(width / 2, height / 2 + 60);
  ctx.stroke();

  // Concentric rings
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
  ctx.beginPath();
  ctx.arc(width / 2, height / 2, 80, 0, Math.PI * 2);
  ctx.arc(width / 2, height / 2, 160, 0, Math.PI * 2);
  ctx.arc(width / 2, height / 2, 280, 0, Math.PI * 2);
  ctx.stroke();

  // Text labels
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 44px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`اختبار طبقة الخريطة (${terrain.toUpperCase()})`, width / 2, 120);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '30px monospace';
  ctx.fillText(`الأبعاد: ${sizeMeters} م × ${sizeMeters} م | الحجم: ${width}×${height}px`, width / 2, 180);

  // Compass directions
  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 36px monospace';
  ctx.fillText('شمال (NORTH - Y Max)', width / 2, 70);
  ctx.fillText('جنوب (SOUTH - Y 0)', width / 2, height - 40);
  ctx.fillText('غرب (W)', 100, height / 2);
  ctx.fillText('شرق (E)', width - 100, height / 2);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('فشل إنشاء ملف نمط الاختبار.'));
      } else {
        resolve({ blob, width, height });
      }
    }, 'image/png');
  });
}

/**
 * Save terrain map image configuration to IndexedDB
 */
export async function saveTerrainImage(
  terrain: TerrainId,
  imageBlob: Blob | null,
  options?: Partial<Omit<TerrainImageConfig, 'terrain' | 'imageBlob'>> & {
    displayBlob?: Blob;
    naturalWidth?: number;
    naturalHeight?: number;
    flipY?: boolean;
  }
): Promise<TerrainImageConfig> {
  const db = await openDB();
  const existing = await getTerrainImage(terrain);

  const displayBlobToUse = options?.displayBlob ?? (imageBlob ? imageBlob : existing?.displayBlob);
  const effectiveImageUrl = displayBlobToUse
    ? URL.createObjectURL(displayBlobToUse)
    : options?.imageUrl !== undefined
    ? options.imageUrl
    : existing?.imageUrl ?? null;

  const config: TerrainImageConfig = {
    terrain,
    imageUrl: effectiveImageUrl,
    imageBlob: imageBlob ?? existing?.imageBlob,
    displayBlob: displayBlobToUse,
    naturalWidth: options?.naturalWidth ?? existing?.naturalWidth,
    naturalHeight: options?.naturalHeight ?? existing?.naturalHeight,
    flipY: options?.flipY !== undefined ? options.flipY : existing?.flipY ?? false,
    opacity: options?.opacity ?? existing?.opacity ?? 0.85,
    tileSourceType: options?.tileSourceType ?? existing?.tileSourceType ?? (effectiveImageUrl ? 'image' : 'none'),
    tileUrlTemplate: options?.tileUrlTemplate ?? existing?.tileUrlTemplate ?? '',
    tileFolderCount: options?.tileFolderCount ?? existing?.tileFolderCount ?? 0,
    isCalibrated: options?.isCalibrated ?? existing?.isCalibrated ?? false,
    calibrationPoints: options?.calibrationPoints ?? existing?.calibrationPoints,
    bounds: options?.bounds ?? existing?.bounds ?? getDefaultBounds(terrain),
    updatedAt: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_IMAGES, 'readwrite');
    const store = tx.objectStore(STORE_IMAGES);

    const recordToStore = {
      terrain: config.terrain,
      imageBlob: config.imageBlob,
      displayBlob: config.displayBlob,
      naturalWidth: config.naturalWidth,
      naturalHeight: config.naturalHeight,
      flipY: config.flipY,
      opacity: config.opacity,
      tileSourceType: config.tileSourceType,
      tileUrlTemplate: config.tileUrlTemplate,
      tileFolderCount: config.tileFolderCount,
      isCalibrated: config.isCalibrated,
      calibrationPoints: config.calibrationPoints,
      bounds: config.bounds,
      updatedAt: config.updatedAt,
    };

    const req = store.put(recordToStore);
    req.onsuccess = () => {
      mapLogger.addLog('info', `تم حفظ إعدادات خريطة ${terrain} محلياً.`);
      resolve(config);
    };
    req.onerror = () => {
      mapLogger.recordImageError(`فشل الكتابة إلى قاعدة البيانات: ${req.error?.message}`);
      reject(req.error);
    };
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
        const blobToRender = result.displayBlob instanceof Blob
          ? result.displayBlob
          : result.imageBlob instanceof Blob
          ? result.imageBlob
          : null;

        if (blobToRender) {
          imageUrl = URL.createObjectURL(blobToRender);
        }

        resolve({
          terrain: result.terrain,
          imageUrl,
          imageBlob: result.imageBlob,
          displayBlob: result.displayBlob,
          naturalWidth: result.naturalWidth,
          naturalHeight: result.naturalHeight,
          flipY: result.flipY ?? false,
          opacity: result.opacity ?? 0.85,
          tileSourceType: result.tileSourceType ?? (imageUrl ? 'image' : 'none'),
          tileUrlTemplate: result.tileUrlTemplate ?? '',
          tileFolderCount: result.tileFolderCount ?? 0,
          isCalibrated: result.isCalibrated ?? false,
          calibrationPoints: result.calibrationPoints,
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

    req.onsuccess = () => {
      mapLogger.addLog('info', `تم حذف صورة وبلاطات ${terrain} من المتصفح.`);
      resolve();
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Store tiles loaded from EnfusionMapMaker folder
 */
export async function storeTileFolder(terrain: TerrainId, files: File[]): Promise<number> {
  const db = await openDB();
  let count = 0;

  const tx = db.transaction(STORE_TILES, 'readwrite');
  const store = tx.objectStore(STORE_TILES);

  for (const file of files) {
    const path = file.webkitRelativePath || file.name;
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

  const existing = await getTerrainImage(terrain);
  await saveTerrainImage(terrain, existing?.imageBlob ?? null, {
    tileSourceType: 'folder',
    tileFolderCount: count,
  });

  mapLogger.addLog('info', `تم استيراد ${count} بلاطة محلياً لخريطة ${terrain}.`);
  return count;
}

/**
 * Get tile object URL (cached in memory)
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

    req.onerror = () => {
      mapLogger.recordTileError(key);
      resolve(null);
    };
  });
}

/**
 * Delete all stored tiles for a terrain
 */
export async function clearTilesForTerrain(terrain: TerrainId): Promise<void> {
  const db = await openDB();
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
 * Calculate calibration bounds from two reference points.
 * Point coords: imgU (0..1 from left), imgV (0..1 from top or bottom).
 * In screen/canvas preview: (u, v) where u=0 is left, v=0 is top.
 * worldX is Easting (meters), worldY is Northing (meters).
 * Computes non-uniform scale and exact bounding box in Leaflet CRS.Simple format:
 * [[minY, minX], [maxY, maxX]]
 */
export function computeCalibrationBounds(
  p1: CalibrationPoint,
  p2: CalibrationPoint
): [[number, number], [number, number]] | null {
  const du = p2.imgU - p1.imgU;
  const dv = p2.imgV - p1.imgV;
  const dx = p2.worldX - p1.worldX;
  const dy = p2.worldY - p1.worldY;

  if (Math.abs(du) < 0.005 || Math.abs(dv) < 0.005) {
    return null;
  }

  const metersPerU = dx / du;
  const metersPerV = dy / dv;

  // Horizontal range
  const imageWidthMeters = Math.abs(metersPerU);
  const minX = p1.worldX - p1.imgU * metersPerU;
  const maxX = minX + imageWidthMeters;

  // Vertical range (accounting for standard top-to-bottom V vs bottom-to-top Northing Y)
  const imageHeightMeters = Math.abs(metersPerV);
  // If v=0 is top (North), then as v increases, worldY decreases:
  // worldY = topY - v * imageHeightMeters => topY = worldY + v * imageHeightMeters
  const topY = metersPerV < 0
    ? p1.worldY + p1.imgV * imageHeightMeters
    : p1.worldY + (1 - p1.imgV) * imageHeightMeters;
  const bottomY = topY - imageHeightMeters;

  const south = Math.min(bottomY, topY);
  const north = Math.max(bottomY, topY);
  const west = Math.min(minX, maxX);
  const east = Math.max(minX, maxX);

  return [
    [Math.round(south), Math.round(west)],
    [Math.round(north), Math.round(east)],
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
