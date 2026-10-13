export type TerrainId = 'everon' | 'arland' | 'kolguyev';

export interface TerrainConfig {
  id: TerrainId;
  name: string;
  nameAr: string;
  sizeMeters: number; // width & height in meters (editable by user)
  gridMajorInterval: number; // 1000m (1km)
  gridMinorInterval: number; // 100m
  defaultCenter: [number, number]; // [y, x] in Leaflet CRS.Simple (m)
  defaultZoom: number;
  minZoom: number;
  maxZoom: number;
}

export type MilSystem = '6400' | '6000'; // 6400 NATO (US), 6000 Warsaw Pact (USSR)

export interface BallisticEntry {
  range_m: number;
  elevation_mil: number;
  delev_per_100m: number; // delta elevation per 100m target-mortar altitude difference
  time_of_flight_s?: number;
}

export interface MortarChargeData {
  charge: number;
  min_range_m: number;
  max_range_m: number;
  entries: BallisticEntry[];
}

export interface MortarDefinition {
  id: string; // 'M252' | '2B14'
  name: string;
  nameAr: string;
  faction: 'US' | 'USSR';
  caliber: string;
  defaultMilSystem: MilSystem;
  charges: Record<string, MortarChargeData>; // key e.g. "0", "1", "2", "3", "4"
}

export interface BallisticsDatabase {
  gameVersion: string;
  lastUpdated: string;
  sourceNote: string;
  isPlaceholder?: boolean;
  mortars: Record<string, MortarDefinition>;
}

export interface Target {
  id: string;
  name: string;
  notes?: string;
  x: number; // Easting in meters
  y: number; // Northing in meters
  altitude: number; // meters above sea level
  color: string;
  createdAt: number;
}

export interface MortarState {
  x: number;
  y: number;
  altitude: number;
  type: string; // 'M252' | '2B14'
  milSystem: MilSystem;
  selectedChargeOverride: number | null; // null = auto lowest charge
}

export interface FireMissionSolution {
  targetId: string;
  range_m: number;
  dx: number;
  dy: number;
  azimuth_deg: number;
  azimuth_mil: number;
  charge: number;
  availableCharges: number[];
  elevation_mil: number;
  baseElevation_mil: number;
  altitudeDelta_m: number;
  altitudeCorrection_mil: number;
  timeOfFlight_s?: number;
  warnings: ('OUT_OF_RANGE' | 'TOO_CLOSE' | 'NO_CHARGE_DATA' | 'EXTREME_ALTITUDE')[];
  minRange_m: number;
  maxRange_m: number;
}

export interface FireAdjustment {
  distanceCorrection_m: number; // positive = Add (drop was short), negative = Drop (drop was long)
  lateralCorrection_m: number;  // positive = Right, negative = Left
  observerAzimuth_deg?: number; // Spotter angle relative to North (defaults to Mortar->Target azimuth)
}

export interface SavedSession {
  id: string;
  name: string;
  terrain: TerrainId;
  mortar: MortarState;
  targets: Target[];
  selectedTargetId: string | null;
  updatedAt: number;
}

export type Language = 'ar' | 'en';

export type POIType = 'town' | 'hill' | 'military' | 'port' | 'airfield' | 'checkpoint' | 'other';

export interface POI {
  id: string;
  terrain: TerrainId;
  name: string; // In-game English name
  nameAr?: string; // Optional Arabic name
  x: number; // Easting in meters
  y: number; // Northing in meters
  type: POIType;
  isVerified: boolean;
  notes?: string;
}

export type Platform = 'PC' | 'XBOX' | 'PLAYSTATION';

export interface GameServer {
  id: string;
  name: string;
  address: string;
  platforms: Platform[];
  crossplay: boolean;
  modded: boolean;
  scenario: string;
  region: string;
  discord?: string;
  notes?: string;
  players?: number;
  maxPlayers?: number;
  lastUpdated?: string;
  armahqUrl?: string;
  isPlaceholder?: boolean;
}

export interface LocationItem {
  id: string;
  name: string;
  x: number; // East in meters
  y: number; // North in meters
  height?: number; // Height in meters
  raw?: Record<string, any>;
}

export interface LocationLayer {
  id: string;
  terrain: TerrainId;
  name: string;
  color: string;
  isVisible: boolean;
  items: LocationItem[];
  createdAt: number;
}
