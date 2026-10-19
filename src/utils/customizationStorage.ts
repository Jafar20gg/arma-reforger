import {
  UIElementId,
  UIElementConfig,
  LayoutProfile,
  LandmarkLabelOffset,
  UICustomizationState
} from '../types/customization';

export const UI_CUSTOMIZATION_STORAGE_KEY = 'arma_fcs_ui_customization_v2';
export const LABEL_OFFSETS_STORAGE_KEY = 'arma_fcs_label_offsets_v1';

export const DEFAULT_ELEMENT_CONFIGS: Record<UIElementId, UIElementConfig> = {
  header: {
    id: 'header',
    name: 'Top Navigation Bar',
    nameAr: 'شريط التنقل العلوي',
    visible: true,
    locked: false,
    scale: 0.90,
    opacity: 1.0,
    offsetX: 0,
    offsetY: 0,
  },
  modeToolbar: {
    id: 'modeToolbar',
    name: 'Placement Mode Toolbar',
    nameAr: 'شريط أدوات تحديد المواقع',
    visible: true,
    locked: false,
    scale: 0.90,
    opacity: 0.95,
    offsetX: 0,
    offsetY: 0,
  },
  mapControls: {
    id: 'mapControls',
    name: 'Map Zoom & Focus Controls',
    nameAr: 'أزرار التكبير والتركيز',
    visible: true,
    locked: false,
    scale: 0.90,
    opacity: 0.95,
    offsetX: 0,
    offsetY: 0,
  },
  hudCoordinates: {
    id: 'hudCoordinates',
    name: 'HUD Quick Coordinates Readout',
    nameAr: 'قراءة الإحداثيات السريعة',
    visible: true,
    locked: false,
    scale: 0.88,
    opacity: 0.95,
    offsetX: 0,
    offsetY: 0,
  },
  compass: {
    id: 'compass',
    name: 'Tactical Compass Rose',
    nameAr: 'بوصلة التوجيه التكتيكية',
    visible: true,
    locked: false,
    scale: 0.85,
    opacity: 0.95,
    offsetX: 0,
    offsetY: 0,
  },
  scaleBar: {
    id: 'scaleBar',
    name: 'Dynamic Military Scale Bar',
    nameAr: 'مقياس الرسم العسكري التفاعلي',
    visible: true,
    locked: false,
    scale: 0.85,
    opacity: 0.95,
    offsetX: 0,
    offsetY: 0,
  },
  quickFilters: {
    id: 'quickFilters',
    name: 'Quick Map Layer Filters',
    nameAr: 'فلاتر طبقات الخريطة',
    visible: true,
    locked: false,
    scale: 0.88,
    opacity: 0.95,
    offsetX: 0,
    offsetY: 0,
  },
  rulerHud: {
    id: 'rulerHud',
    name: 'Rangefinder / Ruler Overlay',
    nameAr: 'مسطرة قياس المسافات والزوايا',
    visible: true,
    locked: false,
    scale: 0.92,
    opacity: 0.98,
    offsetX: 0,
    offsetY: 0,
  },
  mapBottomBar: {
    id: 'mapBottomBar',
    name: 'Map Status Strip',
    nameAr: 'شريط حالة الخريطة السفلي',
    visible: true,
    locked: false,
    scale: 0.85,
    opacity: 0.90,
    offsetX: 0,
    offsetY: 0,
  },
  fireControlAside: {
    id: 'fireControlAside',
    name: 'Fire Control & Solution Panel',
    nameAr: 'لوحة التحكم بالنيران وحساب القذائف',
    visible: true,
    locked: false,
    scale: 0.92,
    opacity: 0.98,
    offsetX: 0,
    offsetY: 0,
  },
};

export const PRESET_PROFILES: LayoutProfile[] = [
  {
    id: 'profile-compact',
    name: 'Compact Tactical (Default)',
    nameAr: 'الوضع التكتيكي المدمج (الافتراضي)',
    isPreset: true,
    elements: { ...DEFAULT_ELEMENT_CONFIGS },
  },
  {
    id: 'profile-minimal',
    name: 'Minimalist Map Focus',
    nameAr: 'وضع التركيز على الخريطة',
    isPreset: true,
    elements: {
      ...DEFAULT_ELEMENT_CONFIGS,
      hudCoordinates: { ...DEFAULT_ELEMENT_CONFIGS.hudCoordinates, visible: false },
      quickFilters: { ...DEFAULT_ELEMENT_CONFIGS.quickFilters, scale: 0.80 },
      compass: { ...DEFAULT_ELEMENT_CONFIGS.compass, scale: 0.75, opacity: 0.85 },
      scaleBar: { ...DEFAULT_ELEMENT_CONFIGS.scaleBar, scale: 0.80 },
      modeToolbar: { ...DEFAULT_ELEMENT_CONFIGS.modeToolbar, scale: 0.85 },
    },
  },
  {
    id: 'profile-cockpit',
    name: 'Commander Cockpit',
    nameAr: 'قمرة القيادة الموسعة',
    isPreset: true,
    elements: {
      ...DEFAULT_ELEMENT_CONFIGS,
      header: { ...DEFAULT_ELEMENT_CONFIGS.header, scale: 0.95 },
      hudCoordinates: { ...DEFAULT_ELEMENT_CONFIGS.hudCoordinates, scale: 0.95, visible: true },
      compass: { ...DEFAULT_ELEMENT_CONFIGS.compass, scale: 1.0 },
      scaleBar: { ...DEFAULT_ELEMENT_CONFIGS.scaleBar, scale: 0.95 },
      fireControlAside: { ...DEFAULT_ELEMENT_CONFIGS.fireControlAside, scale: 0.95 },
    },
  },
];

export const DEFAULT_CUSTOMIZATION_STATE: UICustomizationState = {
  version: 2,
  activeProfileId: 'profile-compact',
  profiles: PRESET_PROFILES,
  labelOffsets: {
    'ev-base-airfield': { dx: 0, dy: 14 },
    'ev-town-stphilippe': { dx: 16, dy: 10 },
  },
};

export function loadCustomizationState(): UICustomizationState {
  try {
    const raw = localStorage.getItem(UI_CUSTOMIZATION_STORAGE_KEY);
    const labelOffsetsRaw = localStorage.getItem(LABEL_OFFSETS_STORAGE_KEY);
    const labelOffsets = labelOffsetsRaw ? JSON.parse(labelOffsetsRaw) : DEFAULT_CUSTOMIZATION_STATE.labelOffsets;

    if (!raw) {
      return {
        ...DEFAULT_CUSTOMIZATION_STATE,
        labelOffsets,
      };
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return DEFAULT_CUSTOMIZATION_STATE;

    const profiles = Array.isArray(parsed.profiles) && parsed.profiles.length > 0
      ? parsed.profiles
      : PRESET_PROFILES;
    const activeProfileId = typeof parsed.activeProfileId === 'string'
      ? parsed.activeProfileId
      : 'profile-compact';

    return {
      version: 2,
      activeProfileId,
      profiles,
      labelOffsets: parsed.labelOffsets || labelOffsets,
    };
  } catch (err) {
    console.warn('[FCS UI Customization] Error reading customization state:', err);
    return DEFAULT_CUSTOMIZATION_STATE;
  }
}

export function saveCustomizationState(state: UICustomizationState): void {
  try {
    localStorage.setItem(UI_CUSTOMIZATION_STORAGE_KEY, JSON.stringify(state));
    if (state.labelOffsets) {
      localStorage.setItem(LABEL_OFFSETS_STORAGE_KEY, JSON.stringify(state.labelOffsets));
    }
  } catch (err) {
    console.warn('[FCS UI Customization] Error saving customization state:', err);
  }
}

export function saveLabelOffset(poiId: string, offset: LandmarkLabelOffset): Record<string, LandmarkLabelOffset> {
  const state = loadCustomizationState();
  const updatedOffsets = {
    ...state.labelOffsets,
    [poiId]: offset,
  };
  saveCustomizationState({
    ...state,
    labelOffsets: updatedOffsets,
  });
  return updatedOffsets;
}

export function resetLabelOffset(poiId: string): Record<string, LandmarkLabelOffset> {
  const state = loadCustomizationState();
  const updatedOffsets = { ...state.labelOffsets };
  delete updatedOffsets[poiId];
  saveCustomizationState({
    ...state,
    labelOffsets: updatedOffsets,
  });
  return updatedOffsets;
}

export function exportCustomizationToFile(state: UICustomizationState): void {
  try {
    const jsonStr = JSON.stringify(state, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    link.href = url;
    link.download = `arma-reforger-fcs-layout-${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Failed to export UI layout:', err);
  }
}

export function parseCustomizationBackup(jsonString: string): UICustomizationState | null {
  try {
    const data = JSON.parse(jsonString);
    if (!data || typeof data !== 'object') return null;
    if (!Array.isArray(data.profiles) || data.profiles.length === 0) return null;
    if (!data.activeProfileId) return null;
    return {
      version: 2,
      activeProfileId: data.activeProfileId,
      profiles: data.profiles,
      labelOffsets: data.labelOffsets || {},
    };
  } catch (err) {
    console.error('Failed to parse layout JSON backup:', err);
    return null;
  }
}
