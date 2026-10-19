/**
 * Comprehensive Type Definitions for Arma Reforger Fire Control System
 */

export interface WorldPoint {
  xMeters: number;
  yMeters: number;
  altitudeMeters?: number;
}

export interface MapBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface CoordinateTransform {
  version: number;
  type: 'affine';
  origin: 'bottom-left' | 'top-left';
  xScale: number;
  yScale: number;
  xOffset: number;
  yOffset: number;
}

export type POICategory =
  | 'base-primary'       // Primary military base / Main objective (Red)
  | 'base-secondary'     // Secondary base / Tactical FOB (Blue/Amber)
  | 'motorpool'          // Vehicle / Motorpool spawn (Emerald/Slate)
  | 'settlement-primary'  // Major town / capital (Purple)
  | 'settlement-secondary'// Village / Minor settlement (Light Slate)
  | 'airfield'           // Runway / Airfield installation (Amber/Gold)
  | 'hill'               // High ground / Observation hill (Cyan)
  | 'farm';              // Outpost / Farm / Crossroad (Teal)

export interface MapPOI {
  id: string;
  name: string;
  nameAr: string;
  category: POICategory;
  xMeters: number;
  yMeters: number;
  altitudeMeters: number;
  grid?: string;
  description?: string;
  descriptionAr?: string;
  isVerified?: boolean;
  isUserCustomized?: boolean;
  verifiedSource?: string;
}

export interface MapDefinition {
  id: string;
  name: string;
  nameAr: string;
  subTitle: string;
  worldBounds: MapBounds;
  coordinateTransform: CoordinateTransform;
  tileSize: number;
  minZoom: number;
  maxZoom: number;
  defaultZoom: number;
  defaultCenter: WorldPoint;
  tileUrlTemplate: string;
  fallbackTileUrlTemplate?: string;
  externalMapUrl: string;
  controlPoints: MapPOI[];
  description: string;
}

export type PlacementMode = 'none' | 'place-mortar' | 'place-target' | 'measure';

export type WeaponType = 'm252' | 'b2b14' | 'custom';

export interface FireSolution {
  weaponId: WeaponType;
  projectileId: string;
  horizontalDistanceMeters: number;
  deltaAltitudeMeters: number;
  azimuthDegrees: number;
  azimuthMils: number;
  chargeRings: number;
  elevationMils: number;
  elevationDegrees: number;
  timeOfFlightSec: number;
  maxOrdinateMeters?: number;
  angleOfFallDeg?: number;
  inRange: boolean;
  status: 'valid' | 'too-close' | 'too-far' | 'no-solution';
  warningMessage?: string;
  warningMessageAr?: string;
  availableCharges: {
    rings: number;
    elevationMils: number;
    elevationDegrees: number;
    timeOfFlightSec: number;
    inRange: boolean;
  }[];
  calibrationApplied?: boolean;
}

export interface SavedTarget {
  id: string;
  name: string;
  xMeters: number;
  yMeters: number;
  altitudeMeters: number;
  timestamp: number;
  notes?: string;
}

export type Language = 'en' | 'ar';

export interface MapAppearanceSettings {
  showLabels: boolean;
  threeLineLabels: boolean;
  labelSize: 'small' | 'medium' | 'large';
  labelOpacity: number;
  showBases: boolean;
  showMotorpools: boolean;
  showTowns: boolean;
  showHills: boolean;
  showGridLines: boolean;
  showScaleBar: boolean;
  showCompass: boolean;
  distanceUnit: 'meters' | 'kilometers' | 'both';
  showSlantDistance: boolean;
  colorOverrides?: Partial<Record<POICategory, string>>;
}

export interface LandmarkOverride {
  id: string;
  xMeters: number;
  yMeters: number;
  altitudeMeters: number;
  isCustomized: boolean;
  updatedAt: number;
}

export interface RulerMeasurement {
  start: WorldPoint;
  end: WorldPoint;
  horizontalMeters: number;
  deltaAltitudeMeters: number;
  slantRangeMeters: number;
  azimuthDegrees: number;
  azimuthMilsNATO: number;
  azimuthMilsWarsaw: number;
}

export interface CalibrationRecord {
  id: string;
  timestamp: number;
  targetName: string;
  weaponType: WeaponType;
  charge: number;
  calculatedDistance: number;
  observedImpactDistance: number;
  distanceErrorMeters: number;
  azimuthErrorMils: number;
  weatherNotes?: string;
  notes?: string;
}

export interface ShooterData {
  mortarCallsign: string;
  fobLocationName: string;
  crewName: string;
  sightZeroMils: number;
  enableCustomCalibration: boolean;
  calibrationRangeOffsetMeters: number;
  calibrationAzimuthOffsetMils: number;
  sessionNotes: string;
  records: CalibrationRecord[];
}

export interface CustomMortarProfile {
  id: string;
  name: string;
  nameAr?: string;
  calibre: string;
  milsPerCircle: number;
  minRange: number;
  maxRange: number;
  muzzleVelocityMs?: number;
  baseProfile: 'm252' | 'b2b14';
  isCustom: boolean;
}
