import { TerrainConfig, TerrainId } from '../types';

export const TERRAINS: Record<TerrainId, TerrainConfig> = {
  everon: {
    id: 'everon',
    name: 'Everon (12.8 × 12.8 km)',
    nameAr: 'إيفرون (12.8 × 12.8 كم)',
    sizeMeters: 12800,
    gridMajorInterval: 1000,
    gridMinorInterval: 100,
    defaultCenter: [6400, 6400], // [y, x] in meters
    defaultZoom: 2,
    minZoom: 0,
    maxZoom: 6,
  },
  arland: {
    id: 'arland',
    name: 'Arland (4.0 × 4.0 km)',
    nameAr: 'أرلاند (4.0 × 4.0 كم)',
    sizeMeters: 4000,
    gridMajorInterval: 1000,
    gridMinorInterval: 100,
    defaultCenter: [2000, 2000],
    defaultZoom: 3,
    minZoom: 0,
    maxZoom: 6,
  },
  kolguyev: {
    id: 'kolguyev',
    name: 'Kolguyev (12.8 × 12.8 km)',
    nameAr: 'كولغوييف (12.8 × 12.8 كم)',
    sizeMeters: 12800,
    gridMajorInterval: 1000,
    gridMinorInterval: 100,
    defaultCenter: [6400, 6400],
    defaultZoom: 2,
    minZoom: 0,
    maxZoom: 6,
  },
};
