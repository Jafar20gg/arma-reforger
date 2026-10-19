import {
  Language,
  WorldPoint,
  WeaponType,
  SavedTarget,
  MapAppearanceSettings,
  ShooterData,
  CustomMortarProfile,
} from '../types/mortar';
import {
  InterfaceVisibilitySettings,
  DEFAULT_INTERFACE_VISIBILITY,
  WindSettings,
  DEFAULT_WIND_SETTINGS,
  DisplayPreferences,
  DEFAULT_DISPLAY_PREFERENCES,
  VisualCustomizationSettings,
  DEFAULT_VISUAL_CUSTOMIZATION,
} from '../types/settings';

export const STORAGE_SCHEMA_VERSION = 3;
export const STORAGE_KEY = 'arma_reforger_fcs_state_v3';

export interface AppPersistentState {
  version: number;
  language: Language;
  selectedMapId: string;
  mortar: WorldPoint;
  target: WorldPoint;
  weaponType: WeaponType;
  projectileId: string;
  preferredCharge?: number;
  savedTargets: SavedTarget[];
  appearance: MapAppearanceSettings;
  interfaceVisibility: InterfaceVisibilitySettings;
  windSettings: WindSettings;
  displayPreferences: DisplayPreferences;
  visualCustomization: VisualCustomizationSettings;
  shooterData: ShooterData;
  customProfiles: CustomMortarProfile[];
  landmarkOverrides: Record<string, { xMeters: number; yMeters: number; altitudeMeters: number; isCustomized: boolean; updatedAt: number }>;
}

export const LANDMARK_OVERRIDES_STORAGE_KEY = 'arma_fcs_landmark_overrides_v2';

export const DEFAULT_APPEARANCE: MapAppearanceSettings = {
  showLabels: true,
  threeLineLabels: true,
  labelSize: 'medium',
  labelOpacity: 0.94,
  showBases: true,
  showMotorpools: true,
  showTowns: true,
  showHills: true,
  showGridLines: true,
  showScaleBar: true,
  showCompass: true,
  distanceUnit: 'meters',
  showSlantDistance: false,
};

export const DEFAULT_SHOOTER_DATA: ShooterData = {
  mortarCallsign: 'HAMMER-1',
  fobLocationName: 'FOB Alpha',
  crewName: 'Mortar Section 1',
  sightZeroMils: 0,
  enableCustomCalibration: false,
  calibrationRangeOffsetMeters: 0,
  calibrationAzimuthOffsetMils: 0,
  sessionNotes: '',
  records: [],
};

export const DEFAULT_STATE: AppPersistentState = {
  version: STORAGE_SCHEMA_VERSION,
  language: 'ar',
  selectedMapId: 'everon',
  mortar: { xMeters: 4880, yMeters: 6700, altitudeMeters: 65 },
  target: { xMeters: 5124, yMeters: 6981, altitudeMeters: 75 },
  weaponType: 'm252',
  projectileId: 'm821-he',
  landmarkOverrides: {},
  savedTargets: [
    {
      id: 'trp-1',
      name: 'Montignac Crossroads (تقاطع مونتينياك)',
      xMeters: 5124,
      yMeters: 6981,
      altitudeMeters: 75,
      timestamp: Date.now() - 3600000,
      notes: 'تقاطع طرق رئيسي ونقطة تمركز استراتيجية',
    },
    {
      id: 'trp-2',
      name: 'Airbase Saint-Philippe (قاعدة سانت فيليب)',
      xMeters: 4888,
      yMeters: 12030,
      altitudeMeters: 28,
      timestamp: Date.now() - 1800000,
      notes: 'المدرج الرئيسي للقاعدة الجوية الشمالية',
    },
  ],
  appearance: DEFAULT_APPEARANCE,
  interfaceVisibility: DEFAULT_INTERFACE_VISIBILITY,
  windSettings: DEFAULT_WIND_SETTINGS,
  displayPreferences: DEFAULT_DISPLAY_PREFERENCES,
  visualCustomization: DEFAULT_VISUAL_CUSTOMIZATION,
  shooterData: DEFAULT_SHOOTER_DATA,
  customProfiles: [],
};

export function loadPersistentState(): AppPersistentState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_STATE;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || parsed.version !== STORAGE_SCHEMA_VERSION) {
      return DEFAULT_STATE;
    }
    return {
      version: STORAGE_SCHEMA_VERSION,
      language: parsed.language === 'ar' || parsed.language === 'en' ? parsed.language : 'ar',
      selectedMapId: typeof parsed.selectedMapId === 'string' ? parsed.selectedMapId : 'everon',
      mortar: parsed.mortar && typeof parsed.mortar.xMeters === 'number' ? parsed.mortar : DEFAULT_STATE.mortar,
      target: parsed.target && typeof parsed.target.xMeters === 'number' ? parsed.target : DEFAULT_STATE.target,
      weaponType: parsed.weaponType === 'b2b14' ? 'b2b14' : 'm252',
      projectileId: typeof parsed.projectileId === 'string' ? parsed.projectileId : 'm821-he',
      preferredCharge: typeof parsed.preferredCharge === 'number' ? parsed.preferredCharge : undefined,
      savedTargets: Array.isArray(parsed.savedTargets) ? parsed.savedTargets : DEFAULT_STATE.savedTargets,
      landmarkOverrides: parsed.landmarkOverrides && typeof parsed.landmarkOverrides === 'object'
        ? parsed.landmarkOverrides
        : loadLandmarkOverrides(),
      appearance: {
        ...DEFAULT_APPEARANCE,
        ...(parsed.appearance && typeof parsed.appearance === 'object' ? parsed.appearance : {}),
      },
      interfaceVisibility: {
        ...DEFAULT_INTERFACE_VISIBILITY,
        ...(parsed.interfaceVisibility && typeof parsed.interfaceVisibility === 'object' ? parsed.interfaceVisibility : {}),
      },
      windSettings: {
        ...DEFAULT_WIND_SETTINGS,
        ...(parsed.windSettings && typeof parsed.windSettings === 'object' ? parsed.windSettings : {}),
      },
      displayPreferences: {
        ...DEFAULT_DISPLAY_PREFERENCES,
        ...(parsed.displayPreferences && typeof parsed.displayPreferences === 'object' ? parsed.displayPreferences : {}),
      },
      visualCustomization: {
        ...DEFAULT_VISUAL_CUSTOMIZATION,
        ...(parsed.visualCustomization && typeof parsed.visualCustomization === 'object' ? parsed.visualCustomization : {}),
      },
      shooterData: {
        ...DEFAULT_SHOOTER_DATA,
        ...(parsed.shooterData && typeof parsed.shooterData === 'object' ? parsed.shooterData : {}),
      },
      customProfiles: Array.isArray(parsed.customProfiles) ? parsed.customProfiles : [],
    };
  } catch (err) {
    console.warn('[FCS Storage] Error reading state from localStorage:', err);
    return DEFAULT_STATE;
  }
}

export function loadLandmarkOverrides(): Record<string, { xMeters: number; yMeters: number; altitudeMeters: number; isCustomized: boolean; updatedAt: number }> {
  try {
    const raw = localStorage.getItem(LANDMARK_OVERRIDES_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveLandmarkOverride(
  id: string,
  override: { xMeters: number; yMeters: number; altitudeMeters: number }
): Record<string, { xMeters: number; yMeters: number; altitudeMeters: number; isCustomized: boolean; updatedAt: number }> {
  const current = loadLandmarkOverrides();
  const updated = {
    ...current,
    [id]: {
      ...override,
      isCustomized: true,
      updatedAt: Date.now(),
    },
  };
  try {
    localStorage.setItem(LANDMARK_OVERRIDES_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('[FCS Storage] Failed to save landmark override:', err);
  }
  return updated;
}

export function removeLandmarkOverride(id: string): Record<string, { xMeters: number; yMeters: number; altitudeMeters: number; isCustomized: boolean; updatedAt: number }> {
  const current = loadLandmarkOverrides();
  delete current[id];
  try {
    localStorage.setItem(LANDMARK_OVERRIDES_STORAGE_KEY, JSON.stringify(current));
  } catch (err) {
    console.warn('[FCS Storage] Failed to remove landmark override:', err);
  }
  return current;
}

export function clearAllLandmarkOverrides(): void {
  try {
    localStorage.removeItem(LANDMARK_OVERRIDES_STORAGE_KEY);
  } catch (err) {
    console.warn('[FCS Storage] Failed to clear landmark overrides:', err);
  }
}

export function savePersistentState(state: Partial<AppPersistentState>): void {
  try {
    const current = loadPersistentState();
    const updated: AppPersistentState = {
      ...current,
      ...state,
      version: STORAGE_SCHEMA_VERSION,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('[FCS Storage] Error saving state to localStorage:', err);
  }
}

export function exportStateToFile(state: AppPersistentState): void {
  const jsonStr = JSON.stringify(state, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `arma-reforger-fcs-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function parseStateBackup(jsonString: string): AppPersistentState | null {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      ...DEFAULT_STATE,
      ...parsed,
      version: STORAGE_SCHEMA_VERSION,
    };
  } catch {
    return null;
  }
}
