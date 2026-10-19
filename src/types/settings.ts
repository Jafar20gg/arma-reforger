export interface InterfaceVisibilitySettings {
  showAppHeader: boolean;
  showNavigation: boolean;
  showMapControls: boolean;
  showMortarPanel: boolean;
  showTargetPanel: boolean;
  showCoordinates: boolean;
  showGridReferences: boolean;
  showDistanceMeasurements: boolean;
  showElevationInfo: boolean;
  showCompass: boolean;
  showWindIndicators: boolean;
  showRangeCircles: boolean;
  showRangeLines: boolean;
  showLocationMarkers: boolean;
  showPlaceNames: boolean;
  showMapLayers: boolean;
  showBallisticInfo: boolean;
  showStatusIndicators: boolean;
  showInfoCards: boolean;
  showBottomToolbar: boolean;
  showAdvancedControls: boolean;
}

export const DEFAULT_INTERFACE_VISIBILITY: InterfaceVisibilitySettings = {
  showAppHeader: true,
  showNavigation: true,
  showMapControls: true,
  showMortarPanel: true,
  showTargetPanel: true,
  showCoordinates: true,
  showGridReferences: true,
  showDistanceMeasurements: true,
  showElevationInfo: true,
  showCompass: true,
  showWindIndicators: false,
  showRangeCircles: true,
  showRangeLines: true,
  showLocationMarkers: true,
  showPlaceNames: true,
  showMapLayers: true,
  showBallisticInfo: true,
  showStatusIndicators: true,
  showInfoCards: true,
  showBottomToolbar: true,
  showAdvancedControls: true,
};

export interface WindSettings {
  speedMps: number;       // Wind speed in m/s (0 to 30)
  directionDeg: number;   // Wind direction in degrees (0 to 359, direction wind blows FROM)
  enabled: boolean;       // Whether wind correction is active
}

export const DEFAULT_WIND_SETTINGS: WindSettings = {
  speedMps: 4,
  directionDeg: 270,
  enabled: false,
};

export type AngleDisplayUnit = 'both' | 'mils' | 'degrees';
export type DistanceDisplayUnit = 'meters' | 'kilometers' | 'both';
export type AppTheme = 'dark-tactical' | 'high-contrast' | 'night-vision' | 'desert-tan';

export interface DisplayPreferences {
  angleUnit: AngleDisplayUnit;
  distanceUnit: DistanceDisplayUnit;
  decimalPrecision: number;
  showSlantDistance: boolean;
  showMaxOrdinate: boolean;
  showAngleOfFall: boolean;
  showFlightTime: boolean;
  showHeightDifference: boolean;
  markerLabelMode: 'full' | 'grid-only' | 'name-only';
}

export interface VisualCustomizationSettings {
  theme: AppTheme;
  accentColor: string;
  mortarMarkerColor: string;
  targetMarkerColor: string;
  distanceLineColor: string;
  rangeRingMinColor: string;
  rangeRingMaxColor: string;
  fontFamily: 'JetBrains Mono' | 'Chakra Petch' | 'system-ui';
  fontSize: 'small' | 'medium' | 'large';
  enableAnimations: boolean;
}

export const DEFAULT_DISPLAY_PREFERENCES: DisplayPreferences = {
  angleUnit: 'both',
  distanceUnit: 'meters',
  decimalPrecision: 1,
  showSlantDistance: false,
  showMaxOrdinate: true,
  showAngleOfFall: true,
  showFlightTime: true,
  showHeightDifference: true,
  markerLabelMode: 'full',
};

export const DEFAULT_VISUAL_CUSTOMIZATION: VisualCustomizationSettings = {
  theme: 'dark-tactical',
  accentColor: '#f59e0b',
  mortarMarkerColor: '#ef4444',
  targetMarkerColor: '#3b82f6',
  distanceLineColor: '#f59e0b',
  rangeRingMinColor: '#ef4444',
  rangeRingMaxColor: '#10b981',
  fontFamily: 'JetBrains Mono',
  fontSize: 'medium',
  enableAnimations: true,
};
