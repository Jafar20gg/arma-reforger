/**
 * UI Customization & Layout Profile Type Definitions
 * Arma Reforger Fire Control System
 */

export type UIElementId =
  | 'header'
  | 'modeToolbar'
  | 'mapControls'
  | 'hudCoordinates'
  | 'compass'
  | 'scaleBar'
  | 'quickFilters'
  | 'rulerHud'
  | 'mapBottomBar'
  | 'fireControlAside';

export interface UIElementConfig {
  id: UIElementId;
  name: string;
  nameAr: string;
  visible: boolean;
  locked: boolean;
  scale: number;     // 0.70 to 1.30 (size multiplier)
  opacity: number;   // 0.30 to 1.0 (transparency)
  offsetX: number;   // horizontal visual translation in pixels
  offsetY: number;   // vertical visual translation in pixels
  width?: number;    // optional fixed width in px
  height?: number;   // optional fixed height in px
}

export interface LayoutProfile {
  id: string;
  name: string;
  nameAr: string;
  isPreset?: boolean;
  elements: Record<UIElementId, UIElementConfig>;
}

export interface LandmarkLabelOffset {
  dx: number; // visual horizontal text offset in pixels
  dy: number; // visual vertical text offset in pixels
}

export interface UICustomizationState {
  version: number;
  activeProfileId: string;
  profiles: LayoutProfile[];
  labelOffsets: Record<string, LandmarkLabelOffset>; // Keyed by POI ID
}
