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
