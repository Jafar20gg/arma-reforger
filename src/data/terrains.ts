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
    name: 'Arland (5.94 × 5.94 km)',
    nameAr: 'أرلاند (5.94 × 5.94 كم)',
    sizeMeters: 5940,
    gridMajorInterval: 1000,
    gridMinorInterval: 100,
    defaultCenter: [2970, 2970],
    defaultZoom: 3,
    minZoom: 0,
    maxZoom: 6,
  },
  kolguyev: {
    id: 'kolguyev',
    name: 'Kolguyev (Custom)',
    nameAr: 'كولغوييف (مخصص)',
    sizeMeters: 0, // Unconfigured by default: user enters world size in meters
    gridMajorInterval: 1000,
    gridMinorInterval: 100,
    defaultCenter: [6000, 6000],
    defaultZoom: 2,
    minZoom: 0,
    maxZoom: 6,
  },
};
