import React, { useState } from 'react';
import {
  X,
  Sliders,
  Eye,
  RotateCcw,
  Globe,
  Compass,
  Wind,
  Layers,
  Crosshair,
  Gauge,
  CheckCircle2,
  Info,
  Shield,
  Palette,
  Layout,
  Download,
  Upload,
  AlertTriangle,
  Move
} from 'lucide-react';
import {
  Language,
  MapAppearanceSettings,
  WeaponType,
  FireSolution,
} from '../types/mortar';
import {
  InterfaceVisibilitySettings,
  WindSettings,
  DisplayPreferences,
  VisualCustomizationSettings,
  DEFAULT_DISPLAY_PREFERENCES,
  DEFAULT_VISUAL_CUSTOMIZATION,
  DEFAULT_INTERFACE_VISIBILITY,
} from '../types/settings';
import { MAPS } from '../data/mapsData';
import { BALLISTIC_DATA, ShellType } from '../data/ballisticData';
import { getTranslation } from '../utils/i18n';
import { parseStateBackup } from '../utils/storage';

interface SettingsModalProps {
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
  windSettings: WindSettings;
  onWindChange?: (wind: WindSettings) => void;
  weaponType: WeaponType;
  onWeaponChange: (weapon: WeaponType) => void;
  projectileId: string;
  onProjectileChange: (projId: string) => void;
  preferredCharge?: number;
  onChargeChange: (charge?: number) => void;
  solution?: FireSolution;
  onResetAppearance: () => void;
  onResetInterface?: () => void;
  onRestoreDefaultLayout: () => void;
  onResetAll?: () => void;
  onExportBackup?: () => void;
  onImportBackup?: (state: any) => void;
  onEnterCustomizer?: () => void;
}

type TabType = 'weapon' | 'preferences' | 'visuals' | 'layout' | 'map' | 'wind' | 'backup';

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
  windSettings,
  onWindChange,
  weaponType,
  onWeaponChange,
  projectileId,
  onProjectileChange,
  preferredCharge,
  onChargeChange,
  solution,
  onResetAppearance,
  onResetInterface,
  onRestoreDefaultLayout,
  onResetAll,
  onExportBackup,
  onImportBackup,
  onEnterCustomizer,
}) => {
  const t = getTranslation(lang);
  const [activeTab, setActiveTab] = useState<TabType>('weapon');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentWeapon = BALLISTIC_DATA[weaponType === 'b2b14' ? 'b2b14' : 'm252'];
  const rounds = currentWeapon.defaultRounds;

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 2800);
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
    if (!file || !onImportBackup) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const content = ev.target?.result as string;
      if (content) {
        const parsed = parseStateBackup(content);
        if (parsed) {
          onImportBackup(parsed);
          showFeedback(lang === 'ar' ? 'تم استيراد الإعدادات بنجاح!' : 'Settings imported successfully!');
        } else {
          showFeedback(lang === 'ar' ? 'ملف النسخ الاحتياطي غير صالح' : 'Invalid backup file');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150 select-none font-mono">
      <div
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
        className="w-full max-w-4xl max-h-[94vh] flex flex-col bg-neutral-950 border border-neutral-700/90 rounded-xl shadow-2xl overflow-hidden text-neutral-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 bg-neutral-900 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-600 flex items-center justify-center text-neutral-950 font-bold shadow-md shadow-amber-950/60 ring-1 ring-amber-400">
              <Sliders className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <h2 className="font-tactical text-sm sm:text-base font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <span>{lang === 'ar' ? 'مركز إعدادات منظومة الهاون' : 'Mortar System Settings Center'}</span>
                <span className="text-[10px] text-amber-400 px-1.5 py-0.5 bg-amber-950/60 border border-amber-600/50 rounded font-mono">
                  v1.8.0
                </span>
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onLanguageChange(lang === 'en' ? 'ar' : 'en')}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-950 border border-neutral-700 hover:border-amber-500 rounded-lg text-xs font-tactical font-bold text-amber-400 transition"
              title="Toggle Language"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'العربية' : 'English'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition"
              title={t.close}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center overflow-x-auto border-b border-neutral-800 bg-neutral-900/70 px-2 py-1 gap-1 text-xs font-tactical font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('weapon')}
            className={`px-3 py-1.5 rounded-md transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'weapon'
                ? 'bg-amber-600 text-neutral-950 font-bold shadow'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'أ. تهيئة السلاح' : 'A. Weapon Config'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preferences')}
            className={`px-3 py-1.5 rounded-md transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'preferences'
                ? 'bg-amber-600 text-neutral-950 font-bold shadow'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'ب. تفضيلات الحساب' : 'B. Calculations'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('visuals')}
            className={`px-3 py-1.5 rounded-md transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'visuals'
                ? 'bg-amber-600 text-neutral-950 font-bold shadow'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'ج. التخصيص البصري' : 'C. Visuals'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('layout')}
            className={`px-3 py-1.5 rounded-md transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'layout'
                ? 'bg-amber-600 text-neutral-950 font-bold shadow'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
            }`}
          >
            <Layout className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'د. التخطيط والواجهة' : 'D. Layout'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('map')}
            className={`px-3 py-1.5 rounded-md transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'map'
                ? 'bg-amber-600 text-neutral-950 font-bold shadow'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'هـ. طبقات الخريطة' : 'E. Map Overlays'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('wind')}
            className={`px-3 py-1.5 rounded-md transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'wind'
                ? 'bg-amber-600 text-neutral-950 font-bold shadow'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            <span>{t.windSettings}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`px-3 py-1.5 rounded-md transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'backup'
                ? 'bg-amber-600 text-neutral-950 font-bold shadow'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'و. الحفظ والاستعادة' : 'F. Persistence'}</span>
          </button>
        </div>

        {feedbackMessage && (
          <div className="bg-emerald-950/80 border-b border-emerald-600/60 px-4 py-2 flex items-center gap-2 text-xs text-emerald-300 font-semibold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{feedbackMessage}</span>
          </div>
        )}

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 text-xs flex flex-col gap-4">
          {/* SECTION A: WEAPON CONFIGURATION */}
          {activeTab === 'weapon' && (
            <div className="flex flex-col gap-4">
              <div className="pb-2 border-b border-neutral-800 flex items-center justify-between">
                <div>
                  <h3 className="font-tactical text-sm font-bold text-white uppercase">
                    {lang === 'ar' ? 'تهيئة منظومة السلاح والحدود الباليستية المعتمدة' : 'Section A: Weapon System & Ballistic Limits'}
                  </h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    {lang === 'ar'
                      ? 'حدد منظومة الهاون ونوع الذخيرة. تُطبّق الحدود الزاوية المعتمدة بدقة لكل منظومة.'
                      : 'Configure the active mortar system and ammunition. Strict elevation limits and circle standards are enforced.'}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-600/50 text-[10px] font-mono flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Enfusion Verified</span>
                </span>
              </div>

              {/* Weapon Selection */}
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
                      ? 'bg-red-950/40 border-red-500 ring-1 ring-red-500/60 shadow-lg'
                      : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-tactical text-sm font-bold text-white">2B14 Podnos 82mm (RU)</span>
                    <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] font-mono border border-red-500/30">
                      WARSAW 6000 MIL
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-300 font-mono space-y-1">
                    <div className="flex justify-between">
                      <span className="text-neutral-400">{lang === 'ar' ? 'الحد الأدنى للارتفاع:' : 'Min Elevation:'}</span>
                      <span className="text-red-400 font-bold">748 MIL (44.9°)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">{lang === 'ar' ? 'الحد الأقصى للارتفاع:' : 'Max Elevation:'}</span>
                      <span className="text-red-400 font-bold">1415 MIL (84.9°)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">{lang === 'ar' ? 'معيار الدائرة:' : 'Angular Circle:'}</span>
                      <span className="text-neutral-200">degrees = mils × 360 / 6000</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ammunition Selection */}
              <div className="flex flex-col gap-2 bg-neutral-900/60 p-3.5 rounded-lg border border-neutral-800">
                <label className="font-tactical font-bold text-amber-400 uppercase text-xs">
                  {lang === 'ar' ? 'الذخيرة والقذائف المدعومة' : 'Supported Ammunition & Shells'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {rounds.map((round: ShellType) => (
                    <button
                      key={round.id}
                      type="button"
                      onClick={() => onProjectileChange(round.id)}
                      className={`p-2.5 rounded-lg border text-xs font-mono text-left rtl:text-right transition ${
                        projectileId === round.id
                          ? 'border-amber-500 bg-amber-950/60 text-amber-300 font-bold ring-1 ring-amber-500/50'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700 hover:text-white'
                      }`}
                    >
                      <div className="font-bold">{round.name}</div>
                      <div className="text-[10px] text-neutral-500 uppercase mt-0.5">{round.category}</div>
                      <div className="text-[9px] text-neutral-400 font-mono mt-1">
                        {round.charges.length} {lang === 'ar' ? 'شحنات' : 'charges'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Elevation Constraints Banner */}
              <div className="bg-neutral-900 border border-neutral-800 p-3 rounded-lg flex items-start gap-2.5 text-neutral-300 text-[11px] leading-relaxed">
                <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block mb-0.5">
                    {lang === 'ar' ? 'تطبيق قيود زاوية الارتفاع الإلزامية:' : 'Strict Elevation Validation Policy:'}
                  </span>
                  {lang === 'ar'
                    ? `النظام يرفض أي حل رماية تتجاوز فيه الزاوية المطلوبة حدود الأنبوب (${currentWeapon.minElevationMils} - ${currentWeapon.maxElevationMils} مليم). لا يتم تقريب الحلول غير الصالحة أو التظاهر بصلاحيتها.`
                    : `Any firing solution exceeding physical tube limits (${currentWeapon.minElevationMils} - ${currentWeapon.maxElevationMils} MIL) is rejected with clear diagnostics. Invalid solutions are never clamped or represented as valid.`}
                </div>
              </div>
            </div>
          )}

          {/* SECTION B: DISPLAY AND CALCULATION PREFERENCES */}
          {activeTab === 'preferences' && (
            <div className="flex flex-col gap-4">
              <div className="pb-2 border-b border-neutral-800">
                <h3 className="font-tactical text-sm font-bold text-white uppercase">
                  {lang === 'ar' ? 'تفضيلات عرض وحساب زوايا ومسافات الرماية' : 'Section B: Display & Calculation Preferences'}
                </h3>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  {lang === 'ar'
                    ? 'تحكم في وحدات القياس، عدد الخانات العشرية، والحقول المعروضة في النتائج وعلامات الخريطة.'
                    : 'Configure units of measurement, decimal precision, and which calculation result fields are displayed.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Angle Unit */}
                <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-neutral-900/70 border border-neutral-800">
                  <span className="font-tactical font-bold text-xs text-neutral-200">
                    {lang === 'ar' ? 'وحدة عرض الزوايا (Elevation / Azimuth):' : 'Angle Display Unit:'}
                  </span>
                  <div className="grid grid-cols-3 gap-1 bg-neutral-950 p-1 rounded border border-neutral-800">
                    {(['both', 'mils', 'degrees'] as const).map(u => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => onDisplayPreferencesChange({ ...displayPreferences, angleUnit: u })}
                        className={`py-1 text-xs font-tactical rounded transition ${
                          displayPreferences.angleUnit === u
                            ? 'bg-amber-600 text-neutral-950 font-bold shadow'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        {u === 'both' ? (lang === 'ar' ? 'كلاهما (م/د)' : 'Dual (M/°)') : u === 'mils' ? 'Mils (مليم)' : 'Degrees (°)'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Distance Unit */}
                <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-neutral-900/70 border border-neutral-800">
                  <span className="font-tactical font-bold text-xs text-neutral-200">
                    {lang === 'ar' ? 'وحدة قياس المسافة:' : 'Distance Display Unit:'}
                  </span>
                  <div className="grid grid-cols-3 gap-1 bg-neutral-950 p-1 rounded border border-neutral-800">
                    {(['meters', 'kilometers', 'both'] as const).map(u => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => onDisplayPreferencesChange({ ...displayPreferences, distanceUnit: u })}
                        className={`py-1 text-xs font-tactical rounded transition ${
                          displayPreferences.distanceUnit === u
                            ? 'bg-amber-600 text-neutral-950 font-bold shadow'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        {u === 'meters' ? 'Meters (م)' : u === 'kilometers' ? 'Km (كم)' : 'Both (م/كم)'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Decimal Precision */}
                <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-neutral-900/70 border border-neutral-800">
                  <span className="font-tactical font-bold text-xs text-neutral-200">
                    {lang === 'ar' ? 'الدقة العشرية للأرقام:' : 'Numeric Decimal Precision:'}
                  </span>
                  <div className="grid grid-cols-3 gap-1 bg-neutral-950 p-1 rounded border border-neutral-800">
                    {([0, 1, 2] as const).map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => onDisplayPreferencesChange({ ...displayPreferences, decimalPrecision: p })}
                        className={`py-1 text-xs font-tactical rounded transition ${
                          displayPreferences.decimalPrecision === p
                            ? 'bg-amber-600 text-neutral-950 font-bold shadow'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        {p === 0 ? '0 (45°)' : p === 1 ? '1 (45.2°)' : '2 (45.23°)'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Marker Labels */}
                <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-neutral-900/70 border border-neutral-800">
                  <span className="font-tactical font-bold text-xs text-neutral-200">
                    {lang === 'ar' ? 'بيانات تسميات علامات الخريطة:' : 'Marker Labels Information:'}
                  </span>
                  <div className="grid grid-cols-3 gap-1 bg-neutral-950 p-1 rounded border border-neutral-800">
                    {(['full', 'grid-only', 'name-only'] as const).map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => onDisplayPreferencesChange({ ...displayPreferences, markerLabelMode: m })}
                        className={`py-1 text-xs font-tactical rounded transition ${
                          displayPreferences.markerLabelMode === m
                            ? 'bg-amber-600 text-neutral-950 font-bold shadow'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        {m === 'full' ? (lang === 'ar' ? 'كامل' : 'Full') : m === 'grid-only' ? 'Grid' : 'Name'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Result Fields Toggles */}
              <div className="flex flex-col gap-2 bg-neutral-900/60 p-3.5 rounded-lg border border-neutral-800">
                <span className="font-tactical font-bold text-neutral-300 uppercase text-xs">
                  {lang === 'ar' ? 'إظهار حقول نتائج الرماية الإضافية' : 'Ballistic Result Fields Visibility'}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div
                    onClick={() => onDisplayPreferencesChange({ ...displayPreferences, showSlantDistance: !displayPreferences.showSlantDistance })}
                    className="flex items-center justify-between p-2 rounded bg-neutral-950 border border-neutral-800 cursor-pointer hover:border-neutral-700"
                  >
                    <span>{lang === 'ar' ? 'المسافة المائلة ثلاثية الأبعاد (3D Slant Range)' : '3D Slant Range'}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${displayPreferences.showSlantDistance ? 'bg-emerald-950 text-emerald-400' : 'bg-neutral-900 text-neutral-500'}`}>
                      {displayPreferences.showSlantDistance ? t.on : t.off}
                    </span>
                  </div>
                  <div
                    onClick={() => onDisplayPreferencesChange({ ...displayPreferences, showMaxOrdinate: !displayPreferences.showMaxOrdinate })}
                    className="flex items-center justify-between p-2 rounded bg-neutral-950 border border-neutral-800 cursor-pointer hover:border-neutral-700"
                  >
                    <span>{lang === 'ar' ? 'أعلى نقطة تحليق للقذيفة (Apex / Max Ordinate)' : 'Apex (Max Ordinate)'}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${displayPreferences.showMaxOrdinate ? 'bg-emerald-950 text-emerald-400' : 'bg-neutral-900 text-neutral-500'}`}>
                      {displayPreferences.showMaxOrdinate ? t.on : t.off}
                    </span>
                  </div>
                  <div
                    onClick={() => onDisplayPreferencesChange({ ...displayPreferences, showAngleOfFall: !displayPreferences.showAngleOfFall })}
                    className="flex items-center justify-between p-2 rounded bg-neutral-950 border border-neutral-800 cursor-pointer hover:border-neutral-700"
                  >
                    <span>{lang === 'ar' ? 'زاوية سقوط القذيفة (Angle of Fall)' : 'Angle of Fall'}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${displayPreferences.showAngleOfFall ? 'bg-emerald-950 text-emerald-400' : 'bg-neutral-900 text-neutral-500'}`}>
                      {displayPreferences.showAngleOfFall ? t.on : t.off}
                    </span>
                  </div>
                  <div
                    onClick={() => onDisplayPreferencesChange({ ...displayPreferences, showFlightTime: !displayPreferences.showFlightTime })}
                    className="flex items-center justify-between p-2 rounded bg-neutral-950 border border-neutral-800 cursor-pointer hover:border-neutral-700"
                  >
                    <span>{lang === 'ar' ? 'زمن التحليق (Time of Flight)' : 'Time of Flight (TOF)'}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${displayPreferences.showFlightTime ? 'bg-emerald-950 text-emerald-400' : 'bg-neutral-900 text-neutral-500'}`}>
                      {displayPreferences.showFlightTime ? t.on : t.off}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION C: VISUAL CUSTOMIZATION */}
          {activeTab === 'visuals' && (
            <div className="flex flex-col gap-4">
              <div className="pb-2 border-b border-neutral-800 flex items-center justify-between">
                <div>
                  <h3 className="font-tactical text-sm font-bold text-white uppercase">
                    {lang === 'ar' ? 'التخصيص البصري والألوان والخطوط' : 'Section C: Visual Customization'}
                  </h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    {lang === 'ar'
                      ? 'تخصيص ألوان الواجهة وعلامات الهاون والهدف والخطوط ونمط السمة التكتيكية.'
                      : 'Customize interface themes, marker colors, fonts, and animation effects.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onVisualCustomizationChange(DEFAULT_VISUAL_CUSTOMIZATION);
                    showFeedback(lang === 'ar' ? 'تمت استعادة الألوان الافتراضية' : 'Visuals reset to defaults');
                  }}
                  className="px-2.5 py-1 rounded bg-neutral-900 border border-neutral-700 hover:border-amber-500 text-neutral-300 text-xs font-tactical transition"
                >
                  {lang === 'ar' ? 'استعادة الألوان الافتراضية' : 'Reset Visuals'}
                </button>
              </div>

              {/* Theme Selector */}
              <div className="flex flex-col gap-2 bg-neutral-900/70 p-3 rounded-lg border border-neutral-800">
                <span className="font-tactical font-bold text-xs text-neutral-200">
                  {lang === 'ar' ? 'نمط السمة التكتيكية (Theme):' : 'Tactical Theme:'}
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'dark-tactical', name: 'Dark Tactical', nameAr: 'تكتيكي داكن' },
                    { id: 'high-contrast', name: 'High Contrast', nameAr: 'تباين عالي' },
                    { id: 'night-vision', name: 'Night Vision', nameAr: 'رؤية ليلية' },
                    { id: 'desert-tan', name: 'Desert Tan', nameAr: 'صحراوي' },
                  ].map(th => (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => onVisualCustomizationChange({ ...visualCustomization, theme: th.id as any })}
                      className={`p-2.5 rounded-lg border text-xs font-tactical font-semibold transition ${
                        visualCustomization.theme === th.id
                          ? 'border-amber-500 bg-amber-950/60 text-amber-300 font-bold ring-1 ring-amber-500/50'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {lang === 'ar' ? th.nameAr : th.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-neutral-900/70 p-3 rounded-lg border border-neutral-800">
                <div className="flex items-center justify-between p-2 rounded bg-neutral-950 border border-neutral-800">
                  <span className="text-xs font-tactical">{lang === 'ar' ? 'لون علامة الهاون (Mortar):' : 'Mortar Marker Color:'}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={visualCustomization.mortarMarkerColor}
                      onChange={e => onVisualCustomizationChange({ ...visualCustomization, mortarMarkerColor: e.target.value })}
                      className="w-7 h-7 rounded border border-neutral-700 bg-transparent cursor-pointer"
                    />
                    <span className="font-mono text-xs text-neutral-300">{visualCustomization.mortarMarkerColor}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-neutral-950 border border-neutral-800">
                  <span className="text-xs font-tactical">{lang === 'ar' ? 'لون علامة الهدف (Target):' : 'Target Marker Color:'}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={visualCustomization.targetMarkerColor}
                      onChange={e => onVisualCustomizationChange({ ...visualCustomization, targetMarkerColor: e.target.value })}
                      className="w-7 h-7 rounded border border-neutral-700 bg-transparent cursor-pointer"
                    />
                    <span className="font-mono text-xs text-neutral-300">{visualCustomization.targetMarkerColor}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-neutral-950 border border-neutral-800">
                  <span className="text-xs font-tactical">{lang === 'ar' ? 'لون خط مسار الرماية:' : 'Distance Line Color:'}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={visualCustomization.distanceLineColor}
                      onChange={e => onVisualCustomizationChange({ ...visualCustomization, distanceLineColor: e.target.value })}
                      className="w-7 h-7 rounded border border-neutral-700 bg-transparent cursor-pointer"
                    />
                    <span className="font-mono text-xs text-neutral-300">{visualCustomization.distanceLineColor}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-neutral-950 border border-neutral-800">
                  <span className="text-xs font-tactical">{lang === 'ar' ? 'لون دوائر المدى الأقصى:' : 'Max Range Ring Color:'}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={visualCustomization.rangeRingMaxColor}
                      onChange={e => onVisualCustomizationChange({ ...visualCustomization, rangeRingMaxColor: e.target.value })}
                      className="w-7 h-7 rounded border border-neutral-700 bg-transparent cursor-pointer"
                    />
                    <span className="font-mono text-xs text-neutral-300">{visualCustomization.rangeRingMaxColor}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION D: LAYOUT CUSTOMIZATION */}
          {activeTab === 'layout' && (
            <div className="flex flex-col gap-4">
              <div className="pb-2 border-b border-neutral-800 flex items-center justify-between">
                <div>
                  <h3 className="font-tactical text-sm font-bold text-white uppercase">
                    {lang === 'ar' ? 'تخصيص التخطيط وترتيب النوافذ' : 'Section D: Layout Customization'}
                  </h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    {lang === 'ar'
                      ? 'يمكنك سحب وإعادة ترتيب أي لوحة أو أداة وتكبيرها مباشرة على الخريطة.'
                      : 'Freely reposition, scale, or toggle any floating panel or toolbar.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onRestoreDefaultLayout}
                  className="px-2.5 py-1 rounded bg-neutral-900 border border-neutral-700 hover:border-amber-500 text-neutral-300 text-xs font-tactical transition"
                >
                  {t.restoreDefaultLayout}
                </button>
              </div>

              {onEnterCustomizer && (
                <div className="p-4 rounded-lg bg-amber-950/40 border border-amber-500/80 flex flex-col gap-2 shadow-lg">
                  <div className="flex items-center gap-2">
                    <Move className="w-4 h-4 text-amber-400" />
                    <span className="font-tactical font-bold text-xs uppercase text-amber-300">
                      {lang === 'ar' ? 'محرر الواجهة التفاعلي بالسحب والإفلات' : 'Interactive Drag & Drop Customizer'}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-300">
                    {lang === 'ar'
                      ? 'انقر لتفعيل وضع السحب المباشر لجميع النوافذ وأشرطة الأدوات على الشاشة.'
                      : 'Enter visual customization mode to reposition and scale HUD widgets directly on the map.'}
                  </p>
                  <button
                    type="button"
                    onClick={onEnterCustomizer}
                    className="w-full py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-neutral-950 font-tactical font-black text-xs flex items-center justify-center gap-2 shadow-md transition"
                  >
                    <Sliders className="w-4 h-4 stroke-[2.5]" />
                    <span>{lang === 'ar' ? 'بدء تخصيص الواجهة الآن' : 'Launch Interactive Customizer'}</span>
                  </button>
                </div>
              )}

              {/* Interface Panels Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-neutral-900/60 p-3 rounded-lg border border-neutral-800">
                <span className="col-span-full font-tactical font-bold text-neutral-300 uppercase text-xs mb-1">
                  {lang === 'ar' ? 'إظهار وإخفاء الألواح الرئيسية' : 'Primary Panels Visibility'}
                </span>
                <div
                  onClick={() => toggleVisibility('showAppHeader')}
                  className="flex items-center justify-between p-2 rounded bg-neutral-950 border border-neutral-800 cursor-pointer hover:border-neutral-700"
                >
                  <span>{t.showAppHeader}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${visibility.showAppHeader ? 'bg-emerald-950 text-emerald-400' : 'bg-neutral-900 text-neutral-500'}`}>
                    {visibility.showAppHeader ? t.on : t.off}
                  </span>
                </div>
                <div
                  onClick={() => toggleVisibility('showMortarPanel')}
                  className="flex items-center justify-between p-2 rounded bg-neutral-950 border border-neutral-800 cursor-pointer hover:border-neutral-700"
                >
                  <span>{t.showMortarPanel}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${visibility.showMortarPanel ? 'bg-emerald-950 text-emerald-400' : 'bg-neutral-900 text-neutral-500'}`}>
                    {visibility.showMortarPanel ? t.on : t.off}
                  </span>
                </div>
                <div
                  onClick={() => toggleVisibility('showTargetPanel')}
                  className="flex items-center justify-between p-2 rounded bg-neutral-950 border border-neutral-800 cursor-pointer hover:border-neutral-700"
                >
                  <span>{t.showTargetPanel}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${visibility.showTargetPanel ? 'bg-emerald-950 text-emerald-400' : 'bg-neutral-900 text-neutral-500'}`}>
                    {visibility.showTargetPanel ? t.on : t.off}
                  </span>
                </div>
                <div
                  onClick={() => toggleVisibility('showBallisticInfo')}
                  className="flex items-center justify-between p-2 rounded bg-neutral-950 border border-neutral-800 cursor-pointer hover:border-neutral-700"
                >
                  <span>{t.showBallisticInfo}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${visibility.showBallisticInfo ? 'bg-emerald-950 text-emerald-400' : 'bg-neutral-900 text-neutral-500'}`}>
                    {visibility.showBallisticInfo ? t.on : t.off}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* SECTION E: MAP DISPLAY PREFERENCES */}
          {activeTab === 'map' && (
            <div className="flex flex-col gap-4">
              <div className="pb-2 border-b border-neutral-800">
                <h3 className="font-tactical text-sm font-bold text-white uppercase">
                  {lang === 'ar' ? 'خيارات طبقات ومعالم الخريطة التكتيكية' : 'Section E: Map Overlays & Display'}
                </h3>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  {t.placeNameNotice}
                </p>
              </div>

              {/* Theater selection */}
              <div className="flex flex-col gap-1.5 bg-neutral-900/60 p-3 rounded-lg border border-neutral-800">
                <label className="font-tactical font-bold text-amber-400 uppercase text-xs">
                  {lang === 'ar' ? 'مسرح العمليات النشط:' : 'Active Theater Map:'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1">
                  {Object.values(MAPS).map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => onMapChange(m.id)}
                      className={`p-2.5 rounded-lg border text-left rtl:text-right transition flex flex-col ${
                        selectedMapId === m.id
                          ? 'border-amber-500 bg-amber-950/40 text-white font-bold ring-1 ring-amber-500/50'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-300 hover:border-neutral-700'
                      }`}
                    >
                      <span className="font-tactical text-xs text-amber-300 font-bold">
                        {lang === 'ar' ? m.nameAr : m.name}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono mt-0.5">{m.subTitle}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Overlays Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div
                  onClick={() => toggleAppearance('showGridLines')}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-neutral-800 bg-neutral-900/70 cursor-pointer hover:border-neutral-700"
                >
                  <span className="font-tactical text-xs font-semibold">{t.showGridLines}</span>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${appearance.showGridLines ? 'bg-emerald-950 text-emerald-400' : 'bg-neutral-900 text-neutral-500'}`}>
                    {appearance.showGridLines ? t.on : t.off}
                  </span>
                </div>
                <div
                  onClick={() => toggleAppearance('showScaleBar')}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-neutral-800 bg-neutral-900/70 cursor-pointer hover:border-neutral-700"
                >
                  <span className="font-tactical text-xs font-semibold">{t.showScaleBar}</span>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${appearance.showScaleBar ? 'bg-emerald-950 text-emerald-400' : 'bg-neutral-900 text-neutral-500'}`}>
                    {appearance.showScaleBar ? t.on : t.off}
                  </span>
                </div>
                <div
                  onClick={() => toggleAppearance('showCompass')}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-neutral-800 bg-neutral-900/70 cursor-pointer hover:border-neutral-700"
                >
                  <span className="font-tactical text-xs font-semibold">{t.showCompass}</span>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${appearance.showCompass ? 'bg-emerald-950 text-emerald-400' : 'bg-neutral-900 text-neutral-500'}`}>
                    {appearance.showCompass ? t.on : t.off}
                  </span>
                </div>
                <div
                  onClick={() => toggleAppearance('showBases')}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-neutral-800 bg-neutral-900/70 cursor-pointer hover:border-neutral-700"
                >
                  <span className="font-tactical text-xs font-semibold">{t.showBases}</span>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${appearance.showBases ? 'bg-emerald-950 text-emerald-400' : 'bg-neutral-900 text-neutral-500'}`}>
                    {appearance.showBases ? t.on : t.off}
                  </span>
                </div>
                <div
                  onClick={() => toggleAppearance('showTowns')}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-neutral-800 bg-neutral-900/70 cursor-pointer hover:border-neutral-700"
                >
                  <span className="font-tactical text-xs font-semibold">{t.showTowns}</span>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${appearance.showTowns ? 'bg-emerald-950 text-emerald-400' : 'bg-neutral-900 text-neutral-500'}`}>
                    {appearance.showTowns ? t.on : t.off}
                  </span>
                </div>
                <div
                  onClick={() => toggleAppearance('showHills')}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-neutral-800 bg-neutral-900/70 cursor-pointer hover:border-neutral-700"
                >
                  <span className="font-tactical text-xs font-semibold">{t.showHills}</span>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${appearance.showHills ? 'bg-emerald-950 text-emerald-400' : 'bg-neutral-900 text-neutral-500'}`}>
                    {appearance.showHills ? t.on : t.off}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: WIND & ENVIRONMENTAL */}
          {activeTab === 'wind' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                <div>
                  <h3 className="font-tactical text-sm font-bold text-white uppercase">{t.windSettings}</h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    {lang === 'ar' ? 'حساب تأثير الرياح العرضية والطولية على انحراف القذيفة.' : 'Environmental crosswind & headwind deflection corrections.'}
                  </p>
                </div>
                {onWindChange && (
                  <div
                    onClick={() => onWindChange({ ...windSettings, enabled: !windSettings.enabled })}
                    className="flex items-center gap-2 cursor-pointer bg-neutral-900 border border-neutral-700 px-2.5 py-1 rounded-lg"
                  >
                    <span className="font-tactical text-xs font-bold text-neutral-200">{t.enableWindCorrection}</span>
                    <div className={`w-9 h-4.5 flex items-center rounded-full p-0.5 transition ${windSettings.enabled ? 'bg-amber-600' : 'bg-neutral-800'}`}>
                      <div className={`bg-white w-3.5 h-3.5 rounded-full shadow transform transition ${windSettings.enabled ? (lang === 'ar' ? '-translate-x-4.5' : 'translate-x-4.5') : 'translate-x-0'}`} />
                    </div>
                  </div>
                )}
              </div>

              {onWindChange && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-neutral-900/60 p-3 rounded-lg border border-neutral-800">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-tactical font-bold text-xs text-neutral-300">{t.windSpeed}</label>
                      <span className="font-mono text-amber-400 font-bold">{windSettings.speedMps} {t.windSpeedMps}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="0.5"
                      value={windSettings.speedMps}
                      onChange={e => onWindChange({ ...windSettings, speedMps: parseFloat(e.target.value) || 0 })}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-tactical font-bold text-xs text-neutral-300">{t.windDirection}</label>
                      <span className="font-mono text-cyan-400 font-bold">{windSettings.directionDeg}°</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="359"
                      step="5"
                      value={windSettings.directionDeg}
                      onChange={e => onWindChange({ ...windSettings, directionDeg: parseInt(e.target.value, 10) || 0 })}
                      className="w-full accent-cyan-500 cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECTION F: PERSISTENCE & DATA MANAGEMENT */}
          {activeTab === 'backup' && (
            <div className="flex flex-col gap-4">
              <div className="pb-2 border-b border-neutral-800">
                <h3 className="font-tactical text-sm font-bold text-white uppercase">
                  {lang === 'ar' ? 'إدارة البيانات والنسخ الاحتياطي وإعادة الضبط' : 'Section F: Persistence, Backup & Factory Reset'}
                </h3>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  {lang === 'ar'
                    ? 'تُحفظ كافة الإعدادات محلياً في المتصفح. يمكنك تصدير نسخة احتياطية أو استعادتها في أي وقت.'
                    : 'All preferences are preserved in browser storage. Export or import your configuration anytime.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {onExportBackup && (
                  <button
                    type="button"
                    onClick={onExportBackup}
                    className="flex items-center justify-center gap-2 p-3 rounded-lg bg-neutral-900 border border-neutral-700 hover:border-amber-500 text-xs font-tactical font-bold text-neutral-200 transition shadow"
                  >
                    <Download className="w-4 h-4 text-amber-400" />
                    <span>{t.exportBackup}</span>
                  </button>
                )}

                {onImportBackup && (
                  <label className="flex items-center justify-center gap-2 p-3 rounded-lg bg-neutral-900 border border-neutral-700 hover:border-amber-500 text-xs font-tactical font-bold text-neutral-200 transition shadow cursor-pointer">
                    <Upload className="w-4 h-4 text-amber-400" />
                    <span>{t.importBackup}</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {onResetAll && (
                <div className="p-3.5 rounded-lg bg-red-950/30 border border-red-800/60 flex items-center justify-between">
                  <div>
                    <span className="font-tactical font-bold text-xs text-red-300 block">
                      {t.resetToDefaults}
                    </span>
                    <span className="text-[11px] text-neutral-400 font-sans">
                      {lang === 'ar' ? 'إعادة ضبط كافة الإعدادات والخرائط والأهداف لحالة المصنع الافتراضية.' : 'Reset all preferences, markers, and targets to initial factory state.'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(lang === 'ar' ? 'هل أنت متأكد من استعادة ضبط المصنع بالكامل؟' : 'Reset all application preferences to factory defaults?')) {
                        onResetAll();
                        showFeedback(lang === 'ar' ? 'تمت استعادة ضبط المصنع بنجاح' : 'Factory defaults restored');
                      }
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-red-900 hover:bg-red-800 text-white font-tactical font-bold text-xs transition shadow shrink-0"
                  >
                    {t.resetToDefaults}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-900 border-t border-neutral-800">
          <span className="text-[11px] text-neutral-400 font-mono hidden sm:inline">
            Arma Reforger FCS • Bohemia Interactive Compliant
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-neutral-950 font-tactical text-xs font-bold transition shadow ml-auto rtl:mr-auto rtl:ml-0"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
