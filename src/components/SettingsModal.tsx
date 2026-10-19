import React, { useState, useMemo } from 'react';
import {
  X,
  Settings,
  Shield,
  Layers,
  Crosshair,
  MapPin,
  Gauge,
  Palette,
  Type,
  Globe,
  Layout,
  Activity,
  RotateCcw,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Wind,
  Plus,
  Trash2,
  Edit2,
  Check,
  Maximize2,
  Columns,
  Sparkles,
  Sliders
} from 'lucide-react';
import {
  Language,
  MapAppearanceSettings,
  WeaponType,
  WorldPoint,
  SavedTarget,
  FireSolution,
  MapDefinition
} from '../types/mortar';
import {
  InterfaceVisibilitySettings,
  WindSettings,
  DisplayPreferences,
  VisualCustomizationSettings,
  DEFAULT_DISPLAY_PREFERENCES,
  DEFAULT_VISUAL_CUSTOMIZATION,
  DEFAULT_INTERFACE_VISIBILITY,
  DEFAULT_WIND_SETTINGS
} from '../types/settings';
import { MAPS } from '../data/mapsData';
import { BALLISTIC_DATA, ShellType } from '../data/ballisticData';
import { getTranslation } from '../utils/i18n';
import { formatGrid } from '../utils/coordinates';
import {
  AppPersistentState,
  DEFAULT_APPEARANCE,
  DEFAULT_STATE,
  exportStateToFile,
  parseStateBackup
} from '../utils/storage';
import { UICustomizationState } from '../types/customization';
import { PRESET_PROFILES } from '../utils/customizationStorage';

export type SettingsCategoryId =
  | 'general'       // A. GENERAL SETTINGS
  | 'weapon'        // B. MORTAR SYSTEM SETTINGS
  | 'map'           // C. MAP DISPLAY SETTINGS
  | 'targets'       // D. TARGET AND MARKER SETTINGS
  | 'calculations'  // E. CALCULATION DISPLAY SETTINGS
  | 'visuals'       // F. APPEARANCE AND COLORS
  | 'typography'    // G. FONTS AND TEXT
  | 'regional'      // H. LANGUAGE AND REGIONAL SETTINGS
  | 'layout'        // I. PANEL AND LAYOUT CUSTOMIZATION
  | 'diagnostics'   // J. DATA AND DIAGNOSTICS
  | 'backup';       // K. RESET AND RESTORE OPTIONS

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  selectedMapId: string;
  onMapChange: (mapId: string) => void;
  visibility: InterfaceVisibilitySettings;
  onVisibilityChange: (settings: InterfaceVisibilitySettings) => void;
  appearance: MapAppearanceSettings;
  onAppearanceChange: (appearance: MapAppearanceSettings) => void;
  displayPreferences: DisplayPreferences;
  onDisplayPreferencesChange: (prefs: DisplayPreferences) => void;
  visualCustomization: VisualCustomizationSettings;
  onVisualCustomizationChange: (visuals: VisualCustomizationSettings) => void;
  weaponType: WeaponType;
  onWeaponChange: (weapon: WeaponType) => void;
  projectileId: string;
  onProjectileChange: (projId: string) => void;
  preferredCharge?: number;
  onChargeChange: (charge?: number) => void;
  windSettings: WindSettings;
  onWindChange?: (wind: WindSettings) => void;
  mortar: WorldPoint;
  onMortarChange?: (point: WorldPoint) => void;
  target: WorldPoint;
  onTargetChange?: (point: WorldPoint) => void;
  savedTargets: SavedTarget[];
  onSelectTarget: (target: SavedTarget) => void;
  onDeleteTarget: (id: string) => void;
  onAddTarget?: (target: SavedTarget) => void;
  solution: FireSolution;
  landmarkOverrides: Record<string, { xMeters: number; yMeters: number; altitudeMeters: number; isCustomized: boolean; updatedAt: number }>;
  onResetLandmarkOverride: (id: string) => void;
  onClearAllLandmarkOverrides: () => void;
  customizationState?: UICustomizationState;
  onSelectLayoutProfile?: (profileId: string) => void;
  onLaunchCustomizer?: () => void;
  onRestoreDefaultLayout: () => void;
  fullState: AppPersistentState;
  onRestoreState: (state: AppPersistentState) => void;
  onResetDefaults: () => void;
  onOpenCoordModal?: (type: 'mortar' | 'target') => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  lang,
  onLanguageChange,
  selectedMapId,
  onMapChange,
  visibility,
  onVisibilityChange,
  appearance,
  onAppearanceChange,
  displayPreferences,
  onDisplayPreferencesChange,
  visualCustomization,
  onVisualCustomizationChange,
  weaponType,
  onWeaponChange,
  projectileId,
  onProjectileChange,
  preferredCharge,
  onChargeChange,
  windSettings,
  onWindChange,
  mortar,
  onMortarChange,
  target,
  onTargetChange,
  savedTargets,
  onSelectTarget,
  onDeleteTarget,
  onAddTarget,
  solution,
  landmarkOverrides,
  onResetLandmarkOverride,
  onClearAllLandmarkOverrides,
  customizationState,
  onSelectLayoutProfile,
  onLaunchCustomizer,
  onRestoreDefaultLayout,
  fullState,
  onRestoreState,
  onResetDefaults,
  onOpenCoordModal,
}) => {
  const t = getTranslation(lang);
  const [activeCategory, setActiveCategory] = useState<SettingsCategoryId>('general');
  const [panelViewMode, setPanelViewMode] = useState<'docked' | 'modal'>('docked');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // New TRP state
  const [newTrpName, setNewTrpName] = useState('');
  const [newTrpNotes, setNewTrpNotes] = useState('');

  if (!isOpen) return null;

  const currentWeapon = BALLISTIC_DATA[weaponType === 'b2b14' ? 'b2b14' : 'm252'];
  const rounds = currentWeapon.defaultRounds;
  const currentMap = MAPS[selectedMapId] || MAPS.everon;

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  const toggleVisibility = (key: keyof InterfaceVisibilitySettings) => {
    onVisibilityChange({
      ...visibility,
      [key]: !visibility[key],
    });
  };

  const toggleAppearance = (key: keyof MapAppearanceSettings) => {
    onAppearanceChange({
      ...appearance,
      [key]: !appearance[key],
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const content = ev.target?.result as string;
      if (content) {
        const parsed = parseStateBackup(content);
        if (parsed) {
          onRestoreState(parsed);
          showFeedback(lang === 'ar' ? 'تم استيراد كافة الإعدادات والبيانات بنجاح!' : 'All settings and targets imported successfully!');
        } else {
          showFeedback(lang === 'ar' ? 'الملف غير صالح كملف نسخ احتياطي للنظام' : 'Invalid FCS backup file');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleCreateTrp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrpName.trim()) return;
    const newTrp: SavedTarget = {
      id: `trp-${Date.now()}`,
      name: newTrpName.trim(),
      xMeters: target.xMeters,
      yMeters: target.yMeters,
      altitudeMeters: target.altitudeMeters || 0,
      timestamp: Date.now(),
      notes: newTrpNotes.trim() || undefined,
    };
    if (onAddTarget) {
      onAddTarget(newTrp);
    }
    setNewTrpName('');
    setNewTrpNotes('');
    showFeedback(lang === 'ar' ? `تم حفظ الهدف: ${newTrp.name}` : `Target saved: ${newTrp.name}`);
  };

  const categories: { id: SettingsCategoryId; labelEn: string; labelAr: string; icon: React.ElementType }[] = [
    { id: 'general', labelEn: 'A. General Settings', labelAr: 'أ. الإعدادات العامة', icon: Settings },
    { id: 'weapon', labelEn: 'B. Mortar System', labelAr: 'ب. منظومة الهاون', icon: Shield },
    { id: 'map', labelEn: 'C. Map Display', labelAr: 'ج. عرض الخريطة', icon: Layers },
    { id: 'targets', labelEn: 'D. Targets & Markers', labelAr: 'د. الأهداف والعلامات', icon: Crosshair },
    { id: 'calculations', labelEn: 'E. Calculations & Wind', labelAr: 'هـ. الحسابات والرياح', icon: Gauge },
    { id: 'visuals', labelEn: 'F. Appearance & Colors', labelAr: 'و. المظهر والألوان', icon: Palette },
    { id: 'typography', labelEn: 'G. Fonts & Text', labelAr: 'ز. الخطوط والنصوص', icon: Type },
    { id: 'regional', labelEn: 'H. Language & Regional', labelAr: 'ح. اللغة والمعايير', icon: Globe },
    { id: 'layout', labelEn: 'I. Layout Customization', labelAr: 'ط. تخطيط الواجهة', icon: Layout },
    { id: 'diagnostics', labelEn: 'J. Data & Diagnostics', labelAr: 'ي. البيانات والتشخيص', icon: Activity },
    { id: 'backup', labelEn: 'K. Reset & Restore', labelAr: 'ك. الحفظ والاستعادة', icon: RotateCcw },
  ];

  return (
    <div
      onWheel={e => e.stopPropagation()}
      onTouchMove={e => e.stopPropagation()}
      className={`fixed z-[9000] select-none font-mono ${
        panelViewMode === 'docked'
          ? `top-0 bottom-0 ${lang === 'ar' ? 'left-0' : 'right-0'} w-full sm:w-[500px] md:w-[540px] max-w-full shadow-2xl flex flex-col pointer-events-auto`
          : 'inset-0 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs pointer-events-auto'
      }`}
    >
      <div
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
        className={`w-full flex flex-col bg-neutral-950 border border-neutral-700/90 rounded-none sm:rounded-xl shadow-2xl overflow-hidden text-neutral-100 ${
          panelViewMode === 'docked' ? 'h-full border-y-0 rounded-none' : 'max-w-4xl max-h-[94vh]'
        }`}
      >
        {/* Unified Settings Header */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 bg-neutral-900 border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-600 flex items-center justify-center text-neutral-950 font-bold shadow-md shadow-amber-950/60 ring-1 ring-amber-400">
              <Settings className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <h2 className="font-tactical text-sm sm:text-base font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <span>{lang === 'ar' ? 'مركز الإعدادات الموحد' : 'Unified Settings Center'}</span>
                <span className="text-[10px] text-amber-400 px-1.5 py-0.5 bg-amber-950/60 border border-amber-600/50 rounded font-mono">
                  v1.8.0
                </span>
              </h2>
              <span className="text-[10px] text-neutral-400">
                {lang === 'ar'
                  ? 'منظومة التحكم الشاملة: السلاح، الخريطة، الحسابات والمظهر'
                  : 'Complete Control: Weapon, Map, Ballistics & Interface'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* View Mode Toggle: Docked Panel vs Centered Modal */}
            <button
              type="button"
              onClick={() => setPanelViewMode(prev => (prev === 'docked' ? 'modal' : 'docked'))}
              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition hidden sm:flex"
              title={panelViewMode === 'docked' ? 'Switch to Modal Window' : 'Dock to Screen Edge'}
            >
              {panelViewMode === 'docked' ? <Maximize2 className="w-3.5 h-3.5" /> : <Columns className="w-3.5 h-3.5" />}
            </button>

            {/* Language Quick Toggle */}
            <button
              type="button"
              onClick={() => onLanguageChange(lang === 'en' ? 'ar' : 'en')}
              className="flex items-center gap-1 px-2 py-1 bg-neutral-950 border border-neutral-700 hover:border-amber-500 rounded-lg text-xs font-tactical font-bold text-amber-400 transition"
              title="Toggle Language"
            >
              <Globe className="w-3 h-3" />
              <span>{lang === 'en' ? 'عربي' : 'EN'}</span>
            </button>

            {/* Explicit Close Button - The ONLY way the panel closes */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-700 text-red-200 hover:text-white transition"
              title={t.close}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Feedback Alert Banner */}
        {feedbackMessage && (
          <div className="bg-emerald-950/90 border-b border-emerald-600/60 px-4 py-2 flex items-center gap-2 text-xs text-emerald-300 font-semibold animate-in fade-in shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
        )}

        {/* 11 Unified Categories Navigation Tabs */}
        <div className="flex items-center overflow-x-auto border-b border-neutral-800 bg-neutral-900/80 px-2 py-1 gap-1 text-xs font-tactical font-semibold shrink-0">
          {categories.map(cat => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-2.5 py-1.5 rounded-md transition whitespace-nowrap flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-amber-600 text-neutral-950 font-bold shadow-md ring-1 ring-amber-400'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/70'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{lang === 'ar' ? cat.labelAr : cat.labelEn}</span>
              </button>
            );
          })}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 text-xs flex flex-col gap-4">
          {/* ========================================================== */}
          {/* A. GENERAL SETTINGS */}
          {/* ========================================================== */}
          {activeCategory === 'general' && (
            <div className="flex flex-col gap-4">
              <div className="pb-2 border-b border-neutral-800 flex items-center justify-between">
                <div>
                  <h3 className="font-tactical text-sm font-bold text-white uppercase">
                    {lang === 'ar' ? 'أ. الإعدادات العامة للنظام' : 'Section A: General Application Settings'}
                  </h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    {lang === 'ar'
                      ? 'حالة النظام التكتيكي، الخريطة الفعالة، والتحكم السريع في المنظومة.'
                      : 'Tactical system status, active theater map, and general parameters.'}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-mono">
                  Enfusion Engine 1:1
                </span>
              </div>

              {/* Theater & Map Selector */}
              <div className="bg-neutral-900 border border-neutral-800 p-3.5 rounded-lg flex flex-col gap-2.5">
                <span className="font-tactical text-xs font-bold text-neutral-200 uppercase">
                  {lang === 'ar' ? 'مسرح العمليات والخريطة التكتيكية:' : 'Active Operational Theater:'}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {Object.values(MAPS).map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => onMapChange(m.id)}
                      className={`p-2.5 rounded-lg border text-left flex flex-col gap-1 transition ${
                        selectedMapId === m.id
                          ? 'bg-amber-950/50 border-amber-500 text-white ring-1 ring-amber-400 shadow-lg'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-tactical font-bold text-xs">
                          {lang === 'ar' ? m.nameAr : m.name}
                        </span>
                        {selectedMapId === m.id && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                      </div>
                      <span className="text-[10px] text-neutral-400 font-mono">{m.subTitle}</span>
                      <span className="text-[9px] text-neutral-500 font-mono">
                        {m.worldBounds.maxX / 1000}×{m.worldBounds.maxY / 1000} km
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Status Overview */}
              <div className="bg-neutral-900 border border-neutral-800 p-3.5 rounded-lg flex flex-col gap-2">
                <span className="font-tactical text-xs font-bold text-neutral-200 uppercase">
                  {lang === 'ar' ? 'ملخص إحداثيات الاشتباك الحالية:' : 'Current Engagement Summary:'}
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="bg-neutral-950 p-2 rounded border border-neutral-800 flex flex-col">
                    <span className="text-neutral-500">{t.mortarPos}:</span>
                    <span className="text-emerald-400 font-bold">{formatGrid(mortar, 8)}</span>
                    <span className="text-[10px] text-neutral-400">Alt: {mortar.altitudeMeters || 0}m</span>
                  </div>
                  <div className="bg-neutral-950 p-2 rounded border border-neutral-800 flex flex-col">
                    <span className="text-neutral-500">{t.targetPos}:</span>
                    <span className="text-blue-400 font-bold">{formatGrid(target, 8)}</span>
                    <span className="text-[10px] text-neutral-400">Alt: {target.altitudeMeters || 0}m</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* B. MORTAR SYSTEM SETTINGS */}
          {/* ========================================================== */}
          {activeCategory === 'weapon' && (
            <div className="flex flex-col gap-4">
              <div className="pb-2 border-b border-neutral-800 flex items-center justify-between">
                <div>
                  <h3 className="font-tactical text-sm font-bold text-white uppercase">
                    {lang === 'ar' ? 'ب. تهيئة منظومة الهاون والحدود الباليستية' : 'Section B: Mortar System & Ballistic Limits'}
                  </h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    {lang === 'ar'
                      ? 'حدد منظومة الهاون ونوع الذخيرة. تُطبّق الحدود الزاوية المعتمدة بدقة لكل منظومة.'
                      : 'Configure the active mortar system and ammunition. Strict elevation limits and circle standards are enforced.'}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-600/50 text-[10px] font-mono flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Enfusion Tables</span>
                </span>
              </div>

              {/* Mortar System Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => onWeaponChange('m252')}
                  className={`p-3.5 rounded-lg border cursor-pointer transition flex flex-col gap-2 ${
                    weaponType === 'm252'
                      ? 'bg-amber-950/40 border-amber-500 ring-1 ring-amber-500/60 shadow-lg'
                      : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-tactical text-sm font-bold text-white">US M252 81mm Mortar</span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-mono border border-amber-500/30">
                      NATO 6400 MIL
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-300 font-mono space-y-1">
                    <div className="flex justify-between">
                      <span className="text-neutral-400">{lang === 'ar' ? 'الحد الأدنى للارتفاع:' : 'Min Elevation:'}</span>
                      <span className="text-amber-400 font-bold">800 MIL (45.0°)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">{lang === 'ar' ? 'الحد الأقصى للارتفاع:' : 'Max Elevation:'}</span>
                      <span className="text-amber-400 font-bold">1515 MIL (85.2°)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">{lang === 'ar' ? 'معيار الدائرة:' : 'Angular Circle:'}</span>
                      <span className="text-neutral-200">degrees = mils × 360 / 6400</span>
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => onWeaponChange('b2b14')}
                  className={`p-3.5 rounded-lg border cursor-pointer transition flex flex-col gap-2 ${
                    weaponType === 'b2b14'
                      ? 'bg-amber-950/40 border-amber-500 ring-1 ring-amber-500/60 shadow-lg'
                      : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-tactical text-sm font-bold text-white">Russian 2B14 Podnos 82mm</span>
                    <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] font-mono border border-red-500/30">
                      WARSAW 6000 MIL
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-300 font-mono space-y-1">
                    <div className="flex justify-between">
                      <span className="text-neutral-400">{lang === 'ar' ? 'الحد الأدنى للارتفاع:' : 'Min Elevation:'}</span>
                      <span className="text-amber-400 font-bold">748 MIL (44.9°)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">{lang === 'ar' ? 'الحد الأقصى للارتفاع:' : 'Max Elevation:'}</span>
                      <span className="text-amber-400 font-bold">1415 MIL (84.9°)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">{lang === 'ar' ? 'معيار الدائرة:' : 'Angular Circle:'}</span>
                      <span className="text-neutral-200">degrees = mils × 360 / 6000</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shell Selection */}
              <div className="bg-neutral-900 border border-neutral-800 p-3.5 rounded-lg flex flex-col gap-2">
                <span className="font-tactical text-xs font-bold text-neutral-200 uppercase">
                  {lang === 'ar' ? 'نوع الذخيرة والقذيفة:' : 'Ammunition & Shell Type:'}
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {rounds.map(round => (
                    <button
                      key={round.id}
                      type="button"
                      onClick={() => onProjectileChange(round.id)}
                      className={`p-2 rounded border text-xs font-mono font-medium transition ${
                        projectileId === round.id
                          ? 'border-amber-500 bg-amber-950/50 text-amber-300 font-bold ring-1 ring-amber-500/50'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                      }`}
                    >
                      {round.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Propellant Charge Selection */}
              <div className="bg-neutral-900 border border-neutral-800 p-3.5 rounded-lg flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-tactical text-xs font-bold text-neutral-200 uppercase">
                    {lang === 'ar' ? 'الحلقات الدافعة (الشحنة):' : 'Propellant Charge Rings:'}
                  </span>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    {preferredCharge === undefined ? t.chargeAuto : `${t.chargeManual} (${preferredCharge})`}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onChargeChange(undefined)}
                    className={`px-3 py-1.5 rounded text-xs font-mono transition border ${
                      preferredCharge === undefined
                        ? 'bg-amber-600 border-amber-400 text-white font-bold shadow'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                    }`}
                  >
                    AUTO ({lang === 'ar' ? 'تلقائي' : 'Optimal'})
                  </button>
                  {solution.availableCharges.map(c => (
                    <button
                      key={c.rings}
                      type="button"
                      onClick={() => onChargeChange(c.rings)}
                      className={`px-3 py-1.5 rounded text-xs font-mono transition border ${
                        preferredCharge === c.rings
                          ? 'bg-amber-600 border-amber-400 text-white font-bold shadow'
                          : c.inRange
                          ? 'bg-neutral-950 border-neutral-700 text-neutral-200 hover:border-amber-600/60'
                          : 'bg-neutral-950/40 border-neutral-800/40 text-neutral-600 hover:border-neutral-700'
                      }`}
                    >
                      C-{c.rings} ({c.elevationMils}M)
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* C. MAP DISPLAY SETTINGS */}
          {/* ========================================================== */}
          {activeCategory === 'map' && (
            <div className="flex flex-col gap-4">
              <div className="pb-2 border-b border-neutral-800 flex items-center justify-between">
                <div>
                  <h3 className="font-tactical text-sm font-bold text-white uppercase">
                    {lang === 'ar' ? 'ج. إعدادات عرض ومعالم الخريطة' : 'Section C: Map Display & Tactical Layers'}
                  </h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    {lang === 'ar'
                      ? 'التحكم في إظهار القواعد، المركبات، المدن، القمم والشبكة التكتيكية.'
                      : 'Toggle military bases, vehicle parks, settlements, peaks, and grid lines.'}
                  </p>
                </div>
              </div>

              {/* Layer Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { key: 'showBases' as const, labelEn: 'Military Bases & FOBs', labelAr: 'القواعد العسكرية ونقاط التمركز' },
                  { key: 'showMotorpools' as const, labelEn: 'Vehicle Parks & Motorpools', labelAr: 'حظائر ومستودعات الآليات' },
                  { key: 'showTowns' as const, labelEn: 'Towns & Settlements', labelAr: 'المدن والقرى السكنية' },
                  { key: 'showHills' as const, labelEn: 'Mountain Peaks & Elevations', labelAr: 'قمم التلال ونقاط الارتفاع' },
                  { key: 'showGridLines' as const, labelEn: '1000m Tactical Grid Lines', labelAr: 'شبكة الخطوط التكتيكية (1000م)' },
                  { key: 'showScaleBar' as const, labelEn: 'Dynamic Scale Bar', labelAr: 'مقياس الرسم البياني المتغير' },
                  { key: 'showCompass' as const, labelEn: 'Tactical Compass Rose', labelAr: 'بوصلة الاتجاهات التكتيكية' },
                  { key: 'showLabels' as const, labelEn: 'Location Text Labels', labelAr: 'تسميات المواقع والمعالم' },
                ].map(item => (
                  <div
                    key={item.key}
                    onClick={() => toggleAppearance(item.key)}
                    className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-between cursor-pointer hover:border-neutral-700 transition"
                  >
                    <span className="font-tactical font-semibold text-neutral-200">
                      {lang === 'ar' ? item.labelAr : item.labelEn}
                    </span>
                    <input
                      type="checkbox"
                      checked={appearance[item.key]}
                      onChange={() => {}}
                      className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                    />
                  </div>
                ))}
              </div>

              {/* Landmark Overrides Reset */}
              <div className="bg-neutral-900 border border-neutral-800 p-3.5 rounded-lg flex items-center justify-between">
                <div>
                  <span className="font-tactical font-bold text-neutral-200">
                    {lang === 'ar' ? 'إحداثيات المعالم المخصصة:' : 'Custom Landmark Overrides:'}
                  </span>
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    {Object.keys(landmarkOverrides).length > 0
                      ? `${Object.keys(landmarkOverrides).length} ${lang === 'ar' ? 'معالم معدلة' : 'customized POIs'}`
                      : lang === 'ar' ? 'جميع المعالم مطابقة للأصل' : 'All landmarks match original game coordinates'}
                  </p>
                </div>
                {Object.keys(landmarkOverrides).length > 0 && (
                  <button
                    type="button"
                    onClick={onClearAllLandmarkOverrides}
                    className="px-2.5 py-1 rounded bg-red-950 border border-red-700 text-red-300 hover:text-white font-tactical font-bold text-xs transition"
                  >
                    {lang === 'ar' ? 'استعادة إحداثيات اللعبة الأصلية' : 'Reset to Game Defaults'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* D. TARGET AND MARKER SETTINGS */}
          {/* ========================================================== */}
          {activeCategory === 'targets' && (
            <div className="flex flex-col gap-4">
              <div className="pb-2 border-b border-neutral-800 flex items-center justify-between">
                <div>
                  <h3 className="font-tactical text-sm font-bold text-white uppercase">
                    {lang === 'ar' ? 'د. إعدادات الأهداف ومكتبة النقاط المحفوظة (TRPs)' : 'Section D: Targets, Markers & TRP Library'}
                  </h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    {lang === 'ar'
                      ? 'إدارة نقاط الأهداف المحفوظة وتعديل إحداثيات الهاون والهدف يدوياً.'
                      : 'Manage Target Reference Points (TRPs) and manually input precise coordinates.'}
                  </p>
                </div>
              </div>

              {/* Coordinate Entry Triggers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-lg bg-neutral-900 border border-neutral-800 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-tactical font-bold text-emerald-400">{t.mortarPos}</span>
                    <span className="text-[10px] font-mono text-neutral-400">{formatGrid(mortar, 8)}</span>
                  </div>
                  {onOpenCoordModal && (
                    <button
                      type="button"
                      onClick={() => onOpenCoordModal('mortar')}
                      className="w-full py-1.5 rounded bg-emerald-950/80 border border-emerald-600/70 text-emerald-300 font-tactical font-bold text-xs hover:bg-emerald-900 transition flex items-center justify-center gap-1.5"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{lang === 'ar' ? 'إدخال إحداثيات الهاون يدوياً' : 'Manual Mortar Coordinates'}</span>
                    </button>
                  )}
                </div>

                <div className="p-3.5 rounded-lg bg-neutral-900 border border-neutral-800 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-tactical font-bold text-blue-400">{t.targetPos}</span>
                    <span className="text-[10px] font-mono text-neutral-400">{formatGrid(target, 8)}</span>
                  </div>
                  {onOpenCoordModal && (
                    <button
                      type="button"
                      onClick={() => onOpenCoordModal('target')}
                      className="w-full py-1.5 rounded bg-blue-950/80 border border-blue-600/70 text-blue-300 font-tactical font-bold text-xs hover:bg-blue-900 transition flex items-center justify-center gap-1.5"
                    >
                      <Crosshair className="w-3.5 h-3.5" />
                      <span>{lang === 'ar' ? 'إدخال إحداثيات الهدف يدوياً' : 'Manual Target Coordinates'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Add New Target Reference Point */}
              <form onSubmit={handleCreateTrp} className="p-3.5 rounded-lg bg-neutral-900 border border-neutral-800 flex flex-col gap-2.5">
                <span className="font-tactical font-bold text-xs text-neutral-200 uppercase">
                  {lang === 'ar' ? 'حفظ الموقع الحالي كنقطة هدف مسجلة (TRP):' : 'Save Current Target Position as TRP:'}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newTrpName}
                    onChange={e => setNewTrpName(e.target.value)}
                    placeholder={lang === 'ar' ? 'اسم الهدف (مثال: مستودع الوقود)' : 'Target Name (e.g. Fuel Depot)'}
                    className="px-2.5 py-1.5 rounded bg-neutral-950 border border-neutral-700 text-neutral-100 placeholder-neutral-500 text-xs focus:outline-none focus:border-amber-500 font-tactical"
                  />
                  <input
                    type="text"
                    value={newTrpNotes}
                    onChange={e => setNewTrpNotes(e.target.value)}
                    placeholder={lang === 'ar' ? 'ملاحظات تكتيكية (اختياري)' : 'Tactical notes (optional)'}
                    className="px-2.5 py-1.5 rounded bg-neutral-950 border border-neutral-700 text-neutral-100 placeholder-neutral-500 text-xs focus:outline-none focus:border-amber-500 font-tactical"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!newTrpName.trim()}
                  className="py-1.5 px-3 rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-neutral-950 font-tactical font-bold text-xs transition flex items-center justify-center gap-1.5 shadow"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'إضافة إلى مكتبة الأهداف' : 'Add to TRP Library'}</span>
                </button>
              </form>

              {/* Saved Targets List */}
              <div className="bg-neutral-900 border border-neutral-800 p-3.5 rounded-lg flex flex-col gap-2">
                <span className="font-tactical font-bold text-xs text-neutral-200 uppercase">
                  {lang === 'ar' ? 'الأهداف المسجلة مسبقاً:' : 'Saved Target Reference Points:'}
                </span>
                <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto">
                  {savedTargets.length === 0 ? (
                    <span className="text-[11px] text-neutral-500 py-2 text-center">
                      {lang === 'ar' ? 'لا توجد أهداف محفوظة حالياً' : 'No saved targets recorded'}
                    </span>
                  ) : (
                    savedTargets.map(st => (
                      <div
                        key={st.id}
                        className="p-2 rounded bg-neutral-950 border border-neutral-800 flex items-center justify-between hover:border-neutral-700 transition"
                      >
                        <div className="flex flex-col">
                          <span className="font-tactical font-bold text-white text-xs">{st.name}</span>
                          <span className="text-[10px] text-neutral-400 font-mono">
                            Grid: {formatGrid(st, 8)} | Alt: {st.altitudeMeters || 0}m
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onSelectTarget(st)}
                            className="px-2 py-1 rounded bg-blue-950 text-blue-300 hover:text-white border border-blue-700 text-[10px] font-tactical font-bold transition"
                          >
                            {lang === 'ar' ? 'اشتباك' : 'Engage'}
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteTarget(st.id)}
                            className="p-1 rounded bg-red-950/60 text-red-400 hover:text-white border border-red-800 text-[10px] transition"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* E. CALCULATION DISPLAY SETTINGS */}
          {/* ========================================================== */}
          {activeCategory === 'calculations' && (
            <div className="flex flex-col gap-4">
              <div className="pb-2 border-b border-neutral-800 flex items-center justify-between">
                <div>
                  <h3 className="font-tactical text-sm font-bold text-white uppercase">
                    {lang === 'ar' ? 'هـ. تفضيلات الحسابات والوحدات والرياح' : 'Section E: Calculations, Units & Wind Corrections'}
                  </h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    {lang === 'ar'
                      ? 'تحديد وحدات الزوايا (مليمترات / درجات)، وحدات المسافة، وتصحيح انحراف الرياح.'
                      : 'Configure angular units (mils / degrees), distance formatting, and environmental wind drift.'}
                  </p>
                </div>
              </div>

              {/* Angular Units */}
              <div className="bg-neutral-900 border border-neutral-800 p-3.5 rounded-lg flex flex-col gap-2">
                <span className="font-tactical text-xs font-bold text-neutral-200 uppercase">
                  {lang === 'ar' ? 'طريقة عرض زاوية الارتفاع:' : 'Angle Display Unit:'}
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 'both' as const, label: lang === 'ar' ? 'كلاهما (مليمترات + درجات)' : 'Both (Mils & Degrees)' },
                    { val: 'mils' as const, label: lang === 'ar' ? 'مليمترات فقط (Mils)' : 'Mils Only' },
                    { val: 'degrees' as const, label: lang === 'ar' ? 'درجات فقط (°)' : 'Degrees Only' },
                  ].map(u => (
                    <button
                      key={u.val}
                      type="button"
                      onClick={() => onDisplayPreferencesChange({ ...displayPreferences, angleUnit: u.val })}
                      className={`p-2 rounded border text-xs font-tactical font-bold transition ${
                        displayPreferences.angleUnit === u.val
                          ? 'bg-amber-600 border-amber-400 text-neutral-950 shadow'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {u.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Distance Units */}
              <div className="bg-neutral-900 border border-neutral-800 p-3.5 rounded-lg flex flex-col gap-2">
                <span className="font-tactical text-xs font-bold text-neutral-200 uppercase">
                  {lang === 'ar' ? 'وحدة قياس المسافة:' : 'Distance Display Unit:'}
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 'meters' as const, label: lang === 'ar' ? 'أمتار (m)' : 'Meters (m)' },
                    { val: 'kilometers' as const, label: lang === 'ar' ? 'كيلومترات (km)' : 'Kilometers (km)' },
                    { val: 'both' as const, label: lang === 'ar' ? 'كلاهما (m / km)' : 'Both (m / km)' },
                  ].map(u => (
                    <button
                      key={u.val}
                      type="button"
                      onClick={() => onDisplayPreferencesChange({ ...displayPreferences, distanceUnit: u.val })}
                      className={`p-2 rounded border text-xs font-tactical font-bold transition ${
                        displayPreferences.distanceUnit === u.val
                          ? 'bg-amber-600 border-amber-400 text-neutral-950 shadow'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {u.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Wind Correction Section */}
              {onWindChange && (
                <div className="bg-neutral-900 border border-neutral-800 p-3.5 rounded-lg flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="font-tactical text-xs font-bold text-neutral-200 uppercase flex items-center gap-1.5">
                      <Wind className="w-3.5 h-3.5 text-amber-400" />
                      <span>{lang === 'ar' ? 'تصحيح سرعة واتجاه الرياح:' : 'Environmental Wind Parameters:'}</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={windSettings.enabled}
                      onChange={e => onWindChange({ ...windSettings, enabled: e.target.checked })}
                      className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                    />
                  </div>

                  {windSettings.enabled && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-neutral-400 text-[11px]">
                          <span>{lang === 'ar' ? 'سرعة الرياح (م/ث):' : 'Wind Speed (m/s):'}</span>
                          <span className="text-amber-400 font-bold">{windSettings.speedMps} m/s</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="25"
                          step="0.5"
                          value={windSettings.speedMps}
                          onChange={e => onWindChange({ ...windSettings, speedMps: parseFloat(e.target.value) })}
                          className="w-full accent-amber-500"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-neutral-400 text-[11px]">
                          <span>{lang === 'ar' ? 'اتجاه الرياح (درجة):' : 'Wind Direction (Degrees):'}</span>
                          <span className="text-amber-400 font-bold">{windSettings.directionDeg}°</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="359"
                          step="1"
                          value={windSettings.directionDeg}
                          onChange={e => onWindChange({ ...windSettings, directionDeg: parseInt(e.target.value, 10) })}
                          className="w-full accent-amber-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ========================================================== */}
          {/* F. APPEARANCE AND COLORS */}
          {/* ========================================================== */}
          {activeCategory === 'visuals' && (
            <div className="flex flex-col gap-4">
              <div className="pb-2 border-b border-neutral-800 flex items-center justify-between">
                <div>
                  <h3 className="font-tactical text-sm font-bold text-white uppercase">
                    {lang === 'ar' ? 'و. المظهر وأنماط الألوان التكتيكية' : 'Section F: Appearance, Tactical Themes & Colors'}
                  </h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    {lang === 'ar'
                      ? 'تخصيص ثيم الواجهة، ألوان علامات الهاون والهدف وخط المسافة.'
                      : 'Customize visual theme, mortar/target marker colors, and distance line.'}
                  </p>
                </div>
              </div>

              {/* Preset Themes */}
              <div className="bg-neutral-900 border border-neutral-800 p-3.5 rounded-lg flex flex-col gap-2">
                <span className="font-tactical text-xs font-bold text-neutral-200 uppercase">
                  {lang === 'ar' ? 'السمات التكتيكية الجاهزة:' : 'Tactical Preset Themes:'}
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'dark-tactical' as const, label: 'Dark Tactical', desc: 'Default Military' },
                    { id: 'high-contrast' as const, label: 'High Contrast', desc: 'Maximum Clarity' },
                    { id: 'night-vision' as const, label: 'Night Vision', desc: 'NVG Green Phosphor' },
                    { id: 'desert-tan' as const, label: 'Desert Tan', desc: 'Arid Operations' },
                  ].map(themeItem => (
                    <button
                      key={themeItem.id}
                      type="button"
                      onClick={() => onVisualCustomizationChange({ ...visualCustomization, theme: themeItem.id })}
                      className={`p-2.5 rounded-lg border text-left flex flex-col gap-0.5 transition ${
                        visualCustomization.theme === themeItem.id
                          ? 'bg-amber-600 border-amber-400 text-neutral-950 font-bold shadow'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <span className="font-tactical text-xs">{themeItem.label}</span>
                      <span className="text-[9px] opacity-80">{themeItem.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Element Colors */}
              <div className="bg-neutral-900 border border-neutral-800 p-3.5 rounded-lg flex flex-col gap-3">
                <span className="font-tactical text-xs font-bold text-neutral-200 uppercase">
                  {lang === 'ar' ? 'ألوان عناصر الخريطة:' : 'Map Markers & Line Colors:'}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex items-center justify-between p-2 rounded bg-neutral-950 border border-neutral-800">
                    <span className="text-neutral-300 font-tactical">{lang === 'ar' ? 'علامة الهاون' : 'Mortar Marker'}</span>
                    <input
                      type="color"
                      value={visualCustomization.mortarMarkerColor}
                      onChange={e => onVisualCustomizationChange({ ...visualCustomization, mortarMarkerColor: e.target.value })}
                      className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 rounded bg-neutral-950 border border-neutral-800">
                    <span className="text-neutral-300 font-tactical">{lang === 'ar' ? 'علامة الهدف' : 'Target Marker'}</span>
                    <input
                      type="color"
                      value={visualCustomization.targetMarkerColor}
                      onChange={e => onVisualCustomizationChange({ ...visualCustomization, targetMarkerColor: e.target.value })}
                      className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 rounded bg-neutral-950 border border-neutral-800">
                    <span className="text-neutral-300 font-tactical">{lang === 'ar' ? 'خط المسار' : 'Trajectory Line'}</span>
                    <input
                      type="color"
                      value={visualCustomization.distanceLineColor}
                      onChange={e => onVisualCustomizationChange({ ...visualCustomization, distanceLineColor: e.target.value })}
                      className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* G. FONTS AND TEXT */}
          {/* ========================================================== */}
          {activeCategory === 'typography' && (
            <div className="flex flex-col gap-4">
              <div className="pb-2 border-b border-neutral-800 flex items-center justify-between">
                <div>
                  <h3 className="font-tactical text-sm font-bold text-white uppercase">
                    {lang === 'ar' ? 'ز. الخطوط وحجم النصوص التكتيكية' : 'Section G: Typography & Font Scaling'}
                  </h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    {lang === 'ar'
                      ? 'اختر نوع الخط المفضل وحجم الخطوط لملاءمة شاشات الميدان والأجهزة اللوحية.'
                      : 'Choose font family and scale for optimal field tablet legibility.'}
                  </p>
                </div>
              </div>

              {/* Font Family */}
              <div className="bg-neutral-900 border border-neutral-800 p-3.5 rounded-lg flex flex-col gap-2">
                <span className="font-tactical text-xs font-bold text-neutral-200 uppercase">
                  {lang === 'ar' ? 'عائلة الخطوط:' : 'Font Family:'}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'JetBrains Mono' as const, label: 'Tactical Monospace', desc: 'Code & Grid Optimized' },
                    { id: 'Chakra Petch' as const, label: 'Military Digital', desc: 'Sharp Military Sans' },
                    { id: 'system-ui' as const, label: 'System UI', desc: 'Native OS Interface' },
                  ].map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => onVisualCustomizationChange({ ...visualCustomization, fontFamily: f.id })}
                      className={`p-2.5 rounded-lg border text-left flex flex-col gap-0.5 transition ${
                        visualCustomization.fontFamily === f.id
                          ? 'bg-amber-600 border-amber-400 text-neutral-950 font-bold shadow'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <span className="font-tactical text-xs">{f.label}</span>
                      <span className="text-[9px] opacity-80">{f.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Sizing */}
              <div className="bg-neutral-900 border border-neutral-800 p-3.5 rounded-lg flex flex-col gap-2">
                <span className="font-tactical text-xs font-bold text-neutral-200 uppercase">
                  {lang === 'ar' ? 'حجم الخط الأساسي:' : 'Interface Font Scale:'}
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'small' as const, label: lang === 'ar' ? 'صغير (مدمج)' : 'Compact / Small' },
                    { id: 'medium' as const, label: lang === 'ar' ? 'متوسط (قياسي)' : 'Standard / Medium' },
                    { id: 'large' as const, label: lang === 'ar' ? 'كبير (ميداني)' : 'Large / Tactical' },
                  ].map(sz => (
                    <button
                      key={sz.id}
                      type="button"
                      onClick={() => onVisualCustomizationChange({ ...visualCustomization, fontSize: sz.id })}
                      className={`p-2 rounded border text-xs font-tactical font-bold transition ${
                        visualCustomization.fontSize === sz.id
                          ? 'bg-amber-600 border-amber-400 text-neutral-950 shadow'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {sz.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* H. LANGUAGE AND REGIONAL SETTINGS */}
          {/* ========================================================== */}
          {activeCategory === 'regional' && (
            <div className="flex flex-col gap-4">
              <div className="pb-2 border-b border-neutral-800 flex items-center justify-between">
                <div>
                  <h3 className="font-tactical text-sm font-bold text-white uppercase">
                    {lang === 'ar' ? 'ح. اللغة والمعايير الإقليمية' : 'Section H: Language & Regional Conventions'}
                  </h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    {lang === 'ar'
                      ? 'التبديل بين العربية والإنجليزية ومعايير الدوائر الزاوية العسكرية.'
                      : 'Switch between English and Arabic with strict regional circle standards.'}
                  </p>
                </div>
              </div>

              {/* Language Selection */}
              <div className="bg-neutral-900 border border-neutral-800 p-3.5 rounded-lg flex flex-col gap-2">
                <span className="font-tactical text-xs font-bold text-neutral-200 uppercase">
                  {lang === 'ar' ? 'لغة واجهة الاستخدام:' : 'Interface Language:'}
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => onLanguageChange('ar')}
                    className={`p-3 rounded-lg border flex items-center justify-between transition ${
                      lang === 'ar'
                        ? 'bg-amber-600 border-amber-400 text-neutral-950 font-bold shadow'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <span className="font-tactical text-sm">العربية (RTL)</span>
                    {lang === 'ar' && <CheckCircle2 className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => onLanguageChange('en')}
                    className={`p-3 rounded-lg border flex items-center justify-between transition ${
                      lang === 'en'
                        ? 'bg-amber-600 border-amber-400 text-neutral-950 font-bold shadow'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <span className="font-tactical text-sm">English (LTR)</span>
                    {lang === 'en' && <CheckCircle2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Military Angular Circle Information */}
              <div className="bg-neutral-900 border border-neutral-800 p-3.5 rounded-lg flex flex-col gap-2">
                <span className="font-tactical text-xs font-bold text-neutral-200 uppercase">
                  {lang === 'ar' ? 'معايير الدائرة الزاوية النشطة:' : 'Active Angular Circle Standard:'}
                </span>
                <div className="p-2.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-300 font-mono text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">{lang === 'ar' ? 'المنظومة الحالية:' : 'Selected Weapon:'}</span>
                    <span className="text-amber-400 font-bold">{currentWeapon.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">{lang === 'ar' ? 'المعيار العسكري:' : 'Military Standard:'}</span>
                    <span className="text-neutral-200">{currentWeapon.standard}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">{lang === 'ar' ? 'عدد المليمترات لكل 360°:' : 'Mils per 360° Circle:'}</span>
                    <span className="text-emerald-400 font-bold">{currentWeapon.milsPerCircle} MIL</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* I. PANEL AND LAYOUT CUSTOMIZATION */}
          {/* ========================================================== */}
          {activeCategory === 'layout' && (
            <div className="flex flex-col gap-4">
              <div className="pb-2 border-b border-neutral-800 flex items-center justify-between">
                <div>
                  <h3 className="font-tactical text-sm font-bold text-white uppercase">
                    {lang === 'ar' ? 'ط. تخطيط وإظهار عناصر الشاشة' : 'Section I: Panel Layout & UI Visibility'}
                  </h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    {lang === 'ar'
                      ? 'التحكم في إظهار أو إخفاء أي عنصر على الشاشة أو إعادة تعيين التخطيط.'
                      : 'Toggle on-screen HUD panels, select layout presets, or open visual customizer.'}
                  </p>
                </div>
              </div>

              {/* Visual Customizer Launch */}
              {onLaunchCustomizer && (
                <div className="bg-amber-950/40 border border-amber-600/70 p-3.5 rounded-lg flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-tactical font-bold text-white text-xs">
                      {lang === 'ar' ? 'محرر التخطيط المرئي التفاعلي:' : 'Interactive Visual UI Customizer:'}
                    </span>
                    <span className="text-[10px] text-neutral-300">
                      {lang === 'ar'
                        ? 'انقر لتغيير أماكن اللوحات وأحجامها بالسحب والإفلات مباشرة.'
                        : 'Drag, resize, and position any UI panel directly on the tactical screen.'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onLaunchCustomizer();
                    }}
                    className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-neutral-950 font-tactical font-bold text-xs transition shadow flex items-center gap-1.5"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>{lang === 'ar' ? 'فتح المحرر' : 'Launch Customizer'}</span>
                  </button>
                </div>
              )}

              {/* Visibility Checklist */}
              <div className="bg-neutral-900 border border-neutral-800 p-3.5 rounded-lg flex flex-col gap-2">
                <span className="font-tactical text-xs font-bold text-neutral-200 uppercase">
                  {lang === 'ar' ? 'عناصر الواجهة المرئية:' : 'HUD & Interface Visibility:'}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { key: 'showAppHeader' as const, label: lang === 'ar' ? 'شريط العنوان العلوي' : 'Top App Header' },
                    { key: 'showMortarPanel' as const, label: lang === 'ar' ? 'لوحة الهاون' : 'Mortar Control Panel' },
                    { key: 'showTargetPanel' as const, label: lang === 'ar' ? 'لوحة الهدف' : 'Target Control Panel' },
                    { key: 'showBallisticInfo' as const, label: lang === 'ar' ? 'لوحة الحلول البالستية' : 'Ballistic Solutions Panel' },
                    { key: 'showCoordinates' as const, label: lang === 'ar' ? 'شريط الإحداثيات' : 'Coordinates HUD' },
                    { key: 'showRangeCircles' as const, label: lang === 'ar' ? 'دوائر مدى الهاون' : 'Mortar Range Rings' },
                    { key: 'showRangeLines' as const, label: lang === 'ar' ? 'خط مسار القذيفة' : 'Trajectory Line' },
                    { key: 'showBottomToolbar' as const, label: lang === 'ar' ? 'شريط المعلومات السفلي' : 'Bottom Info Bar' },
                  ].map(v => (
                    <div
                      key={v.key}
                      onClick={() => toggleVisibility(v.key)}
                      className="p-2 rounded bg-neutral-950 border border-neutral-800 flex items-center justify-between cursor-pointer hover:border-neutral-700 transition"
                    >
                      <span className="text-neutral-300 font-tactical text-xs">{v.label}</span>
                      <input
                        type="checkbox"
                        checked={visibility[v.key]}
                        onChange={() => {}}
                        className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Reset Layout */}
              <button
                type="button"
                onClick={onRestoreDefaultLayout}
                className="py-2 px-3 rounded bg-neutral-900 border border-neutral-700 hover:border-amber-500 text-neutral-200 font-tactical font-bold text-xs transition flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>{lang === 'ar' ? 'استعادة تخطيط الشاشة الافتراضي' : 'Reset UI Layout to Default'}</span>
              </button>
            </div>
          )}

          {/* ========================================================== */}
          {/* J. DATA AND DIAGNOSTICS */}
          {/* ========================================================== */}
          {activeCategory === 'diagnostics' && (
            <div className="flex flex-col gap-4">
              <div className="pb-2 border-b border-neutral-800 flex items-center justify-between">
                <div>
                  <h3 className="font-tactical text-sm font-bold text-white uppercase">
                    {lang === 'ar' ? 'ي. البيانات والتشخيص التكتيكي المباشر' : 'Section J: Live Telemetry & System Diagnostics'}
                  </h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    {lang === 'ar'
                      ? 'مراقبة فورية لكافة معاملات الاشتباك ودقة تحويل الإحداثيات.'
                      : 'Real-time telemetry, ballistic state verification, and Enfusion scaling.'}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-600/50 text-[10px] font-mono">
                  Diagnostics Active
                </span>
              </div>

              {/* Telemetry Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
                <div className="bg-neutral-900 border border-neutral-800 p-2.5 rounded-lg">
                  <span className="text-[10px] text-neutral-500">{t.distance}</span>
                  <div className="text-white font-bold text-sm mt-0.5">{solution.horizontalDistanceMeters}m</div>
                </div>
                <div className="bg-neutral-900 border border-neutral-800 p-2.5 rounded-lg">
                  <span className="text-[10px] text-neutral-500">{t.deltaH}</span>
                  <div className="text-amber-400 font-bold text-sm mt-0.5">{solution.deltaAltitudeMeters}m</div>
                </div>
                <div className="bg-neutral-900 border border-neutral-800 p-2.5 rounded-lg">
                  <span className="text-[10px] text-neutral-500">{t.azimuth}</span>
                  <div className="text-emerald-400 font-bold text-sm mt-0.5">{solution.azimuthMils} MIL</div>
                </div>
                <div className="bg-neutral-900 border border-neutral-800 p-2.5 rounded-lg">
                  <span className="text-[10px] text-neutral-500">{t.elevationTube}</span>
                  <div className="text-emerald-400 font-bold text-sm mt-0.5">
                    {solution.inRange ? `${solution.elevationMils}M` : 'OOR'}
                  </div>
                </div>
              </div>

              {/* Status and Diagnostics */}
              <div className="bg-neutral-900 border border-neutral-800 p-3.5 rounded-lg flex flex-col gap-2">
                <span className="font-tactical text-xs font-bold text-neutral-200 uppercase">
                  {lang === 'ar' ? 'فحص صحة الحل البالستي:' : 'Ballistic Verification State:'}
                </span>
                <div className="p-2.5 rounded bg-neutral-950 border border-neutral-800 flex items-center justify-between text-xs font-mono">
                  <span className="text-neutral-400">Solution Status:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded ${
                      solution.status === 'valid'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-600/50'
                        : 'bg-red-950 text-red-400 border border-red-600/50'
                    }`}
                  >
                    {solution.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* K. RESET AND RESTORE OPTIONS */}
          {/* ========================================================== */}
          {activeCategory === 'backup' && (
            <div className="flex flex-col gap-4">
              <div className="pb-2 border-b border-neutral-800 flex items-center justify-between">
                <div>
                  <h3 className="font-tactical text-sm font-bold text-white uppercase">
                    {lang === 'ar' ? 'ك. خيارات الحفظ، التصدير والاستعادة' : 'Section K: Backup, Restore & Reset Options'}
                  </h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    {lang === 'ar'
                      ? 'تصدير ملف النسخ الاحتياطي، استيراد التكوينات، أو إعادة ضبط المصنع.'
                      : 'Export system state to JSON, import backups, or factory reset.'}
                  </p>
                </div>
              </div>

              {/* Export / Import */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    exportStateToFile(fullState);
                    showFeedback(lang === 'ar' ? 'تم تنزيل ملف النسخ الاحتياطي بنجاح' : 'Backup file downloaded successfully');
                  }}
                  className="p-3.5 rounded-lg bg-neutral-900 border border-neutral-700 hover:border-amber-500 text-neutral-100 flex items-center justify-center gap-2 font-tactical font-bold text-xs transition shadow"
                >
                  <Download className="w-4 h-4 text-amber-400" />
                  <span>{lang === 'ar' ? 'تصدير نسخة احتياطية كاملة (JSON)' : 'Export Full Backup (JSON)'}</span>
                </button>

                <label className="p-3.5 rounded-lg bg-neutral-900 border border-neutral-700 hover:border-amber-500 text-neutral-100 flex items-center justify-center gap-2 font-tactical font-bold text-xs transition shadow cursor-pointer">
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>{lang === 'ar' ? 'استيراد نسخة احتياطية من ملف' : 'Import Backup from File'}</span>
                  <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              {/* Factory Reset */}
              <div className="bg-red-950/30 border border-red-800/60 p-4 rounded-lg flex flex-col gap-2.5">
                <div className="flex items-center gap-2 text-red-400 font-tactical font-bold text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{lang === 'ar' ? 'إعادة ضبط المصنع الشاملة:' : 'Complete Factory Reset:'}</span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  {lang === 'ar'
                    ? 'سيتم مسح جميع الإعدادات المحفوظة، الأهداف، وتخصيصات الواجهة وإعادة التطبيق إلى حالته الأصلية.'
                    : 'Clears all stored configurations, custom targets, and layouts from localStorage.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(lang === 'ar' ? 'هل أنت متأكد من إعادة ضبط كافة الإعدادات إلى الحالة الأولية؟' : 'Are you sure you want to reset all settings to factory default?')) {
                      onResetDefaults();
                      showFeedback(lang === 'ar' ? 'تمت استعادة الإعدادات الأصلية بنجاح' : 'Factory settings restored successfully');
                    }
                  }}
                  className="self-start py-1.5 px-3 rounded bg-red-900/80 hover:bg-red-800 text-white font-tactical font-bold text-xs transition border border-red-600"
                >
                  {lang === 'ar' ? 'إعادة تعيين كافة الإعدادات (Factory Reset)' : 'Reset All to Factory Defaults'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Explicit Close Action */}
        <div className="px-3 sm:px-4 py-2 bg-neutral-900 border-t border-neutral-800 flex items-center justify-between shrink-0">
          <span className="text-[10px] text-neutral-500 font-mono">
            {activeCategory.toUpperCase()} | FCS v1.8.0
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-tactical font-bold text-xs transition flex items-center gap-1.5 border border-neutral-700"
          >
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t.close}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
