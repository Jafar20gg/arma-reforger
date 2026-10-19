import React, { useState } from 'react';
import {
  X,
  Layers,
  MapPin,
  Crosshair,
  Shield,
  Settings,
  Sliders,
  Download,
  Upload,
  RefreshCw,
  Eye,
  EyeOff,
  Compass,
  Activity,
  Truck,
  Building,
  Mountain,
  Flag,
  FileText,
  CheckCircle2,
  AlertCircle,
  Ruler,
  Grid,
  RotateCcw
} from 'lucide-react';
import {
  Language,
  MapAppearanceSettings,
  WeaponType,
  WorldPoint,
  SavedTarget,
} from '../types/mortar';
import { MAPS } from '../data/mapsData';
import { getTranslation } from '../utils/i18n';
import { formatGrid } from '../utils/coordinates';
import { AppPersistentState, exportStateToFile, parseStateBackup } from '../utils/storage';
import { UICustomizationState } from '../types/customization';
import { PRESET_PROFILES, exportCustomizationToFile } from '../utils/customizationStorage';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  selectedMapId: string;
  onMapChange: (mapId: string) => void;
  appearance: MapAppearanceSettings;
  onAppearanceChange: (appearance: MapAppearanceSettings) => void;
  weaponType: WeaponType;
  onWeaponChange: (weapon: WeaponType) => void;
  projectileId: string;
  onProjectileChange: (projId: string) => void;
  savedTargets: SavedTarget[];
  onSelectTarget: (target: SavedTarget) => void;
  onDeleteTarget: (id: string) => void;
  mortar: WorldPoint;
  target: WorldPoint;
  fullState: AppPersistentState;
  landmarkOverrides: Record<string, { xMeters: number; yMeters: number; altitudeMeters: number; isCustomized: boolean; updatedAt: number }>;
  customizationState?: UICustomizationState;
  onSelectLayoutProfile?: (profileId: string) => void;
  onToggleCustomizer?: () => void;
  onResetLandmarkOverride: (id: string) => void;
  onClearAllLandmarkOverrides: () => void;
  onRestoreState: (state: AppPersistentState) => void;
  onResetDefaults: () => void;
}

type SidebarTab = 'map' | 'poi' | 'layout' | 'settings' | 'weapon' | 'targets' | 'telemetry' | 'backup';

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  lang,
  onLanguageChange,
  selectedMapId,
  onMapChange,
  appearance,
  onAppearanceChange,
  weaponType,
  onWeaponChange,
  projectileId,
  onProjectileChange,
  savedTargets,
  onSelectTarget,
  onDeleteTarget,
  mortar,
  target,
  fullState,
  landmarkOverrides,
  customizationState,
  onSelectLayoutProfile,
  onToggleCustomizer,
  onResetLandmarkOverride,
  onClearAllLandmarkOverrides,
  onRestoreState,
  onResetDefaults,
}) => {
  const t = getTranslation(lang);
  const [activeTab, setActiveTab] = useState<SidebarTab>('map');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentMap = MAPS[selectedMapId] || MAPS.everon;
  const customOverridesCount = Object.keys(landmarkOverrides || {}).length;

  const toggleAppearance = (key: keyof MapAppearanceSettings) => {
    onAppearanceChange({
      ...appearance,
      [key]: !appearance[key],
    });
  };

  const setLabelSize = (size: 'small' | 'medium' | 'large') => {
    onAppearanceChange({
      ...appearance,
      labelSize: size,
    });
  };

  const setDistanceUnit = (unit: 'meters' | 'kilometers' | 'both') => {
    onAppearanceChange({
      ...appearance,
      distanceUnit: unit,
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      if (content) {
        const parsed = parseStateBackup(content);
        if (parsed) {
          onRestoreState(parsed);
          setImportStatus('success');
          setTimeout(() => setImportStatus(null), 3000);
        } else {
          setImportStatus('error');
          setTimeout(() => setImportStatus(null), 4000);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-[1000] flex justify-end">
      <div
        className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <aside
        className={`relative w-full max-w-md bg-neutral-900 border-l border-neutral-800 shadow-2xl flex flex-col h-full z-10 animate-in slide-in-from-right duration-200 select-none overflow-hidden ${
          lang === 'ar' ? 'font-sans' : 'font-mono'
        }`}
      >
        <div className="px-4 py-3.5 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-600/90 flex items-center justify-center border border-amber-500 shadow-md">
              <Sliders className="w-4 h-4 text-neutral-950 stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <h2 className="font-tactical text-sm font-bold uppercase tracking-wider text-neutral-100">
                {t.sidebarTitle}
              </h2>
              <span className="text-[10px] text-neutral-400 font-mono">
                Arma Reforger FCS v1.8.0
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
            title={t.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center bg-neutral-950 border-b border-neutral-800 overflow-x-auto text-xs font-tactical font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('map')}
            className={`flex items-center gap-1.5 px-3 py-2.5 whitespace-nowrap border-b-2 transition ${
              activeTab === 'map'
                ? 'border-amber-500 text-amber-400 bg-neutral-900'
                : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{t.tabMap}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('poi')}
            className={`flex items-center gap-1.5 px-3 py-2.5 whitespace-nowrap border-b-2 transition ${
              activeTab === 'poi'
                ? 'border-amber-500 text-amber-400 bg-neutral-900'
                : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>{t.tabAppearance}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('layout')}
            className={`flex items-center gap-1.5 px-3 py-2.5 whitespace-nowrap border-b-2 transition ${
              activeTab === 'layout'
                ? 'border-amber-500 text-amber-400 bg-neutral-900'
                : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'تخصيص الواجهة' : 'UI Customizer'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-1.5 px-3 py-2.5 whitespace-nowrap border-b-2 transition ${
              activeTab === 'settings'
                ? 'border-amber-500 text-amber-400 bg-neutral-900'
                : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'المعايرة' : 'Calibration'}</span>
            {customOverridesCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('weapon')}
            className={`flex items-center gap-1.5 px-3 py-2.5 whitespace-nowrap border-b-2 transition ${
              activeTab === 'weapon'
                ? 'border-amber-500 text-amber-400 bg-neutral-900'
                : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{t.tabProfiles}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('targets')}
            className={`flex items-center gap-1.5 px-3 py-2.5 whitespace-nowrap border-b-2 transition ${
              activeTab === 'targets'
                ? 'border-amber-500 text-amber-400 bg-neutral-900'
                : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>{t.tabTargets}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('telemetry')}
            className={`flex items-center gap-1.5 px-3 py-2.5 whitespace-nowrap border-b-2 transition ${
              activeTab === 'telemetry'
                ? 'border-amber-500 text-amber-400 bg-neutral-900'
                : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Intel</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-1.5 px-3 py-2.5 whitespace-nowrap border-b-2 transition ${
              activeTab === 'backup'
                ? 'border-amber-500 text-amber-400 bg-neutral-900'
                : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Backup</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {activeTab === 'map' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-tactical uppercase font-bold text-neutral-400">
                  {lang === 'ar' ? 'حدد خريطة مسرح العمليات' : 'Select Active Island Theatre'}
                </span>
                <span className="text-[10px] text-amber-400 font-mono">
                  {Object.keys(MAPS).length} Authentic Maps
                </span>
              </div>
              <div className="flex flex-col gap-2.5">
                {Object.values(MAPS).map(m => {
                  const isSelected = m.id === selectedMapId;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => onMapChange(m.id)}
                      className={`p-3 rounded-lg border text-left rtl:text-right transition-all flex flex-col gap-1.5 ${
                        isSelected
                          ? 'bg-amber-950/40 border-amber-500 shadow-md shadow-amber-950/40 ring-1 ring-amber-500/50'
                          : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/80'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-tactical text-sm font-bold text-neutral-100">
                          {lang === 'ar' ? m.nameAr : m.name}
                        </span>
                        {isSelected && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-neutral-950 uppercase">
                            Active
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-mono text-amber-400 font-semibold">
                        {m.subTitle}
                      </span>
                      <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
                        {m.description}
                      </p>
                      <div className="flex items-center gap-3 pt-1 text-[10px] font-mono text-neutral-500 border-t border-neutral-800/80 mt-1">
                        <span>Bounds: {m.worldBounds.maxX}m × {m.worldBounds.maxY}m</span>
                        <span>•</span>
                        <span>POIs: {m.controlPoints.length}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'poi' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2 bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                <span className="text-xs font-tactical font-bold uppercase text-neutral-300">
                  {t.legend}
                </span>
                <div className="flex flex-col gap-2 text-xs">
                  <div className="flex items-center justify-between p-1.5 rounded bg-neutral-900/70 border border-neutral-800">
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-full bg-red-600 ring-2 ring-red-400/50 shadow-sm shrink-0" />
                      <span className="font-tactical font-semibold text-neutral-200">
                        {t.catBasePrimary}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-red-400 font-bold">#ef4444</span>
                  </div>
                  <div className="flex items-center justify-between p-1.5 rounded bg-neutral-900/70 border border-neutral-800">
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-full bg-blue-500 ring-2 ring-blue-400/50 shadow-sm shrink-0" />
                      <span className="font-tactical font-semibold text-neutral-200">
                        {t.catBaseSecondary}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-blue-400 font-bold">#3b82f6</span>
                  </div>
                  <div className="flex items-center justify-between p-1.5 rounded bg-neutral-900/70 border border-neutral-800">
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-emerald-400/50 shadow-sm shrink-0" />
                      <span className="font-tactical font-semibold text-neutral-200">
                        {t.catMotorpool}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-emerald-400 font-bold">#10b981</span>
                  </div>
                  <div className="flex items-center justify-between p-1.5 rounded bg-neutral-900/70 border border-neutral-800">
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-full bg-purple-500 ring-2 ring-purple-400/50 shadow-sm shrink-0" />
                      <span className="font-tactical font-semibold text-neutral-200">
                        {t.catSettlementPrimary}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-purple-400 font-bold">#a855f7</span>
                  </div>
                  <div className="flex items-center justify-between p-1.5 rounded bg-neutral-900/70 border border-neutral-800">
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-full bg-cyan-500 ring-2 ring-cyan-400/50 shadow-sm shrink-0" />
                      <span className="font-tactical font-semibold text-neutral-200">
                        {t.catHill}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-cyan-400 font-bold">#06b6d4</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                <span className="text-xs font-tactical font-bold uppercase text-neutral-300">
                  {lang === 'ar' ? 'فلاتر طبقات الخريطة' : 'Tactical Layer Filters'}
                </span>
                <button
                  type="button"
                  onClick={() => toggleAppearance('showBases')}
                  className="flex items-center justify-between p-2 rounded bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition"
                >
                  <div className="flex items-center gap-2">
                    <Flag className="w-4 h-4 text-red-400" />
                    <span className="text-xs font-tactical text-neutral-200">{t.showBases}</span>
                  </div>
                  {appearance.showBases ? (
                    <Eye className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-neutral-600" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => toggleAppearance('showMotorpools')}
                  className="flex items-center justify-between p-2 rounded bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition"
                >
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-tactical text-neutral-200">{t.showMotorpools}</span>
                  </div>
                  {appearance.showMotorpools ? (
                    <Eye className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-neutral-600" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => toggleAppearance('showTowns')}
                  className="flex items-center justify-between p-2 rounded bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition"
                >
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-tactical text-neutral-200">{t.showTowns}</span>
                  </div>
                  {appearance.showTowns ? (
                    <Eye className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-neutral-600" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => toggleAppearance('showHills')}
                  className="flex items-center justify-between p-2 rounded bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition"
                >
                  <div className="flex items-center gap-2">
                    <Mountain className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-tactical text-neutral-200">{t.showHills}</span>
                  </div>
                  {appearance.showHills ? (
                    <Eye className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-neutral-600" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => toggleAppearance('threeLineLabels')}
                  className="flex items-center justify-between p-2 rounded bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-tactical text-neutral-200">{t.threeLineLabels}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    appearance.threeLineLabels ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'text-neutral-500 bg-neutral-800'
                  }`}>
                    {appearance.threeLineLabels ? 'ENABLED' : 'SIMPLE'}
                  </span>
                </button>

                <div className="flex flex-col gap-1.5 pt-2">
                  <span className="text-xs font-tactical text-neutral-400">{t.labelSize}</span>
                  <div className="grid grid-cols-3 gap-1 bg-neutral-900 p-1 rounded border border-neutral-800">
                    {(['small', 'medium', 'large'] as const).map(size => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setLabelSize(size)}
                        className={`py-1 text-xs font-tactical font-semibold rounded capitalize transition ${
                          appearance.labelSize === size
                            ? 'bg-amber-600 text-white shadow'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        {size === 'small' ? t.small : size === 'medium' ? t.medium : t.large}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'layout' && (
            <div className="flex flex-col gap-4">
              <div className="p-3.5 rounded-lg bg-amber-950/40 border border-amber-500/80 flex flex-col gap-2.5 shadow-xl">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  <span className="font-tactical font-bold text-xs uppercase text-amber-300">
                    {lang === 'ar' ? 'وضع التخصيص التفاعلي' : 'Interactive Customization Mode'}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-300 leading-relaxed font-sans">
                  {lang === 'ar'
                    ? 'يمكنك سحب وإعادة ترتيب أي نافذة أو شريط أدوات وتكبيرها أو تصغيرها مباشرة على الخريطة.'
                    : 'Click and drag any HUD widget, toolbar, or panel directly on the map. Pull corner resize handles to adjust scale.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onToggleCustomizer?.();
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-neutral-950 font-tactical font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-950/50 ring-1 ring-amber-400 transition"
                >
                  <Sliders className="w-4 h-4 stroke-[2.5]" />
                  <span>{lang === 'ar' ? 'تفعيل وضع التخصيص' : 'Enter Interactive Customizer'}</span>
                </button>
              </div>

              <div className="flex flex-col gap-2.5 bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
                  <span className="text-xs font-tactical font-bold uppercase text-neutral-300">
                    {lang === 'ar' ? 'القوالب التكتيكية الجاهزة' : 'Layout Presets & Profiles'}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2 pt-1">
                  {(customizationState?.profiles || PRESET_PROFILES).map(p => {
                    const isActive = (customizationState?.activeProfileId || 'profile-compact') === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => onSelectLayoutProfile?.(p.id)}
                        className={`p-2.5 rounded-lg border text-left rtl:text-right transition-all flex items-center justify-between ${
                          isActive
                            ? 'bg-amber-950/40 border-amber-500 text-amber-300 shadow-md ring-1 ring-amber-500/50'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700 hover:text-white'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="font-tactical font-bold text-xs">
                            {lang === 'ar' && p.nameAr ? p.nameAr : p.name}
                          </span>
                          <span className="text-[10px] text-neutral-500 font-mono">
                            {p.isPreset ? 'Built-in Preset' : 'Custom User Profile'}
                          </span>
                        </div>
                        {isActive && (
                          <div className="w-2 h-2 rounded-full bg-amber-400 shadow shadow-amber-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {customizationState && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => exportCustomizationToFile(customizationState)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-amber-500 text-neutral-300 hover:text-amber-400 text-xs font-tactical transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{lang === 'ar' ? 'تصدير التخطيط JSON' : 'Export Layout JSON'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2.5 bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                <span className="text-xs font-tactical font-bold uppercase text-neutral-300">
                  {t.mapSettings}
                </span>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-tactical text-neutral-400">{t.distanceUnit}</span>
                  <div className="grid grid-cols-3 gap-1 bg-neutral-900 p-1 rounded border border-neutral-800">
                    <button
                      type="button"
                      onClick={() => setDistanceUnit('meters')}
                      className={`py-1 text-xs font-tactical font-semibold rounded transition ${
                        appearance.distanceUnit === 'meters' ? 'bg-amber-600 text-white shadow' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      {t.metersUnit}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDistanceUnit('kilometers')}
                      className={`py-1 text-xs font-tactical font-semibold rounded transition ${
                        appearance.distanceUnit === 'kilometers' ? 'bg-amber-600 text-white shadow' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      {t.kilometersUnit}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDistanceUnit('both')}
                      className={`py-1 text-xs font-tactical font-semibold rounded transition ${
                        appearance.distanceUnit === 'both' ? 'bg-amber-600 text-white shadow' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      {t.bothUnits}
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleAppearance('showScaleBar')}
                  className="flex items-center justify-between p-2 rounded bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition"
                >
                  <div className="flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-tactical text-neutral-200">{t.showScaleBar}</span>
                  </div>
                  {appearance.showScaleBar ? (
                    <Eye className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-neutral-600" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => toggleAppearance('showCompass')}
                  className="flex items-center justify-between p-2 rounded bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition"
                >
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-red-400" />
                    <span className="text-xs font-tactical text-neutral-200">{t.showCompass}</span>
                  </div>
                  {appearance.showCompass ? (
                    <Eye className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-neutral-600" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => toggleAppearance('showGridLines')}
                  className="flex items-center justify-between p-2 rounded bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition"
                >
                  <div className="flex items-center gap-2">
                    <Grid className="w-4 h-4 text-neutral-400" />
                    <span className="text-xs font-tactical text-neutral-200">{t.showGridLines}</span>
                  </div>
                  {appearance.showGridLines ? (
                    <Eye className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-neutral-600" />
                  )}
                </button>
              </div>

              <div className="flex flex-col gap-2.5 bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-tactical font-bold uppercase text-neutral-300">
                      {t.customLandmarks} ({customOverridesCount})
                    </span>
                  </div>
                  {customOverridesCount > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Reset all custom landmark overrides to verified game defaults?')) {
                          onClearAllLandmarkOverrides();
                        }
                      }}
                      className="text-[10px] text-red-400 hover:text-red-300 underline font-mono"
                    >
                      Reset All
                    </button>
                  )}
                </div>
                {customOverridesCount === 0 ? (
                  <div className="text-[11px] text-neutral-400 italic py-2 leading-relaxed">
                    {t.noCustomLandmarks}
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
                    {Object.entries(landmarkOverrides).map(([id, override]) => {
                      const poi = currentMap.controlPoints.find(p => p.id === id);
                      const name = poi ? (lang === 'ar' ? (poi.nameAr || poi.name) : poi.name) : id;
                      return (
                        <div
                          key={id}
                          className="flex items-center justify-between p-2 rounded bg-neutral-900 border border-neutral-800 text-xs"
                        >
                          <div className="flex flex-col">
                            <span className="font-tactical font-bold text-neutral-200">{name}</span>
                            <span className="font-mono text-[10px] text-amber-400">
                              X:{override.xMeters}m Y:{override.yMeters}m ({override.altitudeMeters}m)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => onResetLandmarkOverride(id)}
                            className="p-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] font-tactical transition"
                            title={t.resetToVerified}
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'weapon' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2 bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                <span className="text-xs font-tactical font-bold uppercase text-neutral-300">
                  {t.weapon}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onWeaponChange('m252');
                      onProjectileChange('m821-he');
                    }}
                    className={`p-3 rounded-lg border text-left rtl:text-right transition-all flex flex-col gap-1 ${
                      weaponType === 'm252'
                        ? 'bg-amber-950/50 border-amber-500 shadow-md ring-1 ring-amber-500/40 text-amber-300'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <span className="font-tactical font-bold text-xs text-white">M252 81mm (US)</span>
                    <span className="text-[10px] font-mono text-amber-400">NATO 6400 MIL</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onWeaponChange('b2b14');
                      onProjectileChange('o-832du');
                    }}
                    className={`p-3 rounded-lg border text-left rtl:text-right transition-all flex flex-col gap-1 ${
                      weaponType === 'b2b14'
                        ? 'bg-red-950/50 border-red-500 shadow-md ring-1 ring-red-500/40 text-red-300'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <span className="font-tactical font-bold text-xs text-white">2B14 Podnos 82mm</span>
                    <span className="text-[10px] font-mono text-red-400">Warsaw 6000 MIL</span>
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-neutral-400 flex flex-col gap-1 leading-relaxed">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold font-tactical">
                  <Compass className="w-3.5 h-3.5" />
                  <span>Angular Standards</span>
                </div>
                <p className="text-[11px]">
                  {weaponType === 'm252' ? t.natoNotice : t.warsawNotice}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'targets' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-tactical uppercase font-bold text-neutral-400">
                  Target Reference Points ({savedTargets.length})
                </span>
              </div>
              <div className="flex flex-col gap-1.5 max-h-80 overflow-y-auto">
                {savedTargets.length === 0 ? (
                  <div className="text-center py-6 text-xs text-neutral-500 font-mono italic">
                    {t.noSavedTargets}
                  </div>
                ) : (
                  savedTargets.map(tgt => (
                    <div
                      key={tgt.id}
                      className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-between gap-2"
                    >
                      <div className="flex flex-col">
                        <span className="font-tactical text-xs font-bold text-neutral-200">
                          {tgt.name}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-400">
                          Grid: {formatGrid(tgt, 8)} | Alt: {tgt.altitudeMeters}m
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectTarget(tgt);
                            onClose();
                          }}
                          className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-tactical font-semibold shadow transition"
                        >
                          {t.applyTarget}
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteTarget(tgt.id)}
                          className="p-1 text-neutral-500 hover:text-red-400 transition"
                          title={t.deleteTarget}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'telemetry' && (
            <div className="flex flex-col gap-3 bg-neutral-950 p-3 rounded-lg border border-neutral-800 text-xs font-mono">
              <span className="font-tactical font-bold uppercase text-neutral-300">
                Diagnostics & Enfusion Grid Alignment
              </span>
              <div className="space-y-1.5 text-[11px] text-neutral-400">
                <div className="flex justify-between border-b border-neutral-900 pb-1">
                  <span>Projection CRS:</span>
                  <span className="text-amber-400 font-bold">Leaflet CRS.Simple</span>
                </div>
                <div className="flex justify-between border-b border-neutral-900 pb-1">
                  <span>Mortar World Coord:</span>
                  <span className="text-red-400">X:{mortar.xMeters} Y:{mortar.yMeters}</span>
                </div>
                <div className="flex justify-between border-b border-neutral-900 pb-1">
                  <span>Target World Coord:</span>
                  <span className="text-blue-400">X:{target.xMeters} Y:{target.yMeters}</span>
                </div>
                <div className="flex justify-between border-b border-neutral-900 pb-1">
                  <span>Active Tile Source:</span>
                  <span className="text-neutral-300 truncate max-w-[200px]">{currentMap.tileUrlTemplate}</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span>Map Bounds:</span>
                  <span className="text-neutral-300">{currentMap.worldBounds.maxX}m</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2 bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                <span className="text-xs font-tactical font-bold uppercase text-neutral-300">
                  {lang === 'ar' ? 'لغة الواجهة / Interface Language' : 'Interface Language'}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onLanguageChange('en')}
                    className={`py-2 px-3 rounded-md text-xs font-tactical font-bold transition ${
                      lang === 'en'
                        ? 'bg-amber-600 text-white shadow'
                        : 'bg-neutral-900 text-neutral-400 hover:text-white'
                    }`}
                  >
                    English (LTR)
                  </button>
                  <button
                    type="button"
                    onClick={() => onLanguageChange('ar')}
                    className={`py-2 px-3 rounded-md text-xs font-tactical font-bold transition ${
                      lang === 'ar'
                        ? 'bg-amber-600 text-white shadow'
                        : 'bg-neutral-900 text-neutral-400 hover:text-white'
                    }`}
                  >
                    العربية (RTL)
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                <span className="text-xs font-tactical font-bold uppercase text-neutral-300">
                  {lang === 'ar' ? 'النسخ الاحتياطي واسترداد البيانات' : 'Data Backup & Persistence'}
                </span>
                <button
                  type="button"
                  onClick={() => exportStateToFile(fullState)}
                  className="flex items-center justify-center gap-2 p-2 rounded bg-neutral-900 border border-neutral-800 hover:border-amber-500/60 text-xs font-tactical font-bold text-neutral-200 transition shadow"
                >
                  <Download className="w-4 h-4 text-amber-400" />
                  <span>{t.exportBackup}</span>
                </button>
                <label className="flex items-center justify-center gap-2 p-2 rounded bg-neutral-900 border border-neutral-800 hover:border-amber-500/60 text-xs font-tactical font-bold text-neutral-200 transition shadow cursor-pointer">
                  <Upload className="w-4 h-4 text-amber-400" />
                  <span>{t.importBackup}</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                {importStatus === 'success' && (
                  <div className="flex items-center gap-1.5 p-2 rounded bg-emerald-950/60 border border-emerald-500/60 text-xs text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{t.restoreSuccess}</span>
                  </div>
                )}
                {importStatus === 'error' && (
                  <div className="flex items-center gap-1.5 p-2 rounded bg-red-950/60 border border-red-500/80 text-xs text-red-300">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{lang === 'ar' ? 'صيغة ملف النسخ الاحتياطي غير صالحة' : 'Invalid backup file format'}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Reset all FCS settings and markers to factory defaults?')) {
                      onResetDefaults();
                    }
                  }}
                  className="flex items-center justify-center gap-2 p-2 mt-2 rounded bg-red-950/40 border border-red-800/60 hover:bg-red-900/60 text-xs font-tactical font-bold text-red-300 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{t.resetToDefaults}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-3 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-500 font-mono">
          <span>Arma Reforger FCS</span>
          <span>Bohemia Interactive Compliant</span>
        </div>
      </aside>
    </div>
  );
};
