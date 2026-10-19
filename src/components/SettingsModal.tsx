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
  MapPin,
  Crosshair,
  Ruler,
  Gauge,
  CheckCircle2,
  Info
} from 'lucide-react';
import {
  Language,
  MapAppearanceSettings,
  WeaponType,
  FireSolution
} from '../types/mortar';
import { InterfaceVisibilitySettings, WindSettings } from '../types/settings';
import { MAPS } from '../data/mapsData';
import { BALLISTIC_DATA, ShellType } from '../data/ballisticData';
import { getTranslation } from '../utils/i18n';

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
  windSettings: WindSettings;
  onWindSettingsChange?: (wind: WindSettings) => void;
  onWindChange?: (wind: WindSettings) => void;
  weaponType: WeaponType;
  onWeaponChange: (weapon: WeaponType) => void;
  projectileId: string;
  onProjectileChange: (projId: string) => void;
  preferredCharge?: number;
  onChargeChange: (charge?: number) => void;
  solution?: FireSolution;
  onResetAppearance: () => void;
  onResetInterfaceSettings?: () => void;
  onResetInterface?: () => void;
  onRestoreDefaultLayout: () => void;
}

type TabType = 'visibility' | 'display' | 'ballistics' | 'wind' | 'reset';

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
  windSettings,
  onWindSettingsChange,
  onWindChange,
  weaponType,
  onWeaponChange,
  projectileId,
  onProjectileChange,
  preferredCharge,
  onChargeChange,
  solution,
  onResetAppearance,
  onResetInterfaceSettings,
  onResetInterface,
  onRestoreDefaultLayout,
}) => {
  const t = getTranslation(lang);
  const [activeTab, setActiveTab] = useState<TabType>('visibility');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const handleWindChange = (newWind: WindSettings) => {
    if (onWindChange) onWindChange(newWind);
    if (onWindSettingsChange) onWindSettingsChange(newWind);
  };

  const handleResetInterface = () => {
    if (onResetInterface) onResetInterface();
    if (onResetInterfaceSettings) onResetInterfaceSettings();
  };

  if (!isOpen) return null;

  const sol = solution || {
    inRange: true,
    elevationDegrees: 62.5,
    elevationMils: 1111,
    azimuthDegrees: 45,
    azimuthMils: 800,
    chargeRings: 1,
    timeOfFlightSec: 25,
    horizontalDistanceMeters: 1200,
    deltaAltitudeMeters: 10,
    maxOrdinateMeters: 650,
    projectileId: 'm821-he',
    availableCharges: [],
  };

  const currentWeapon = BALLISTIC_DATA[weaponType === 'b2b14' ? 'b2b14' : 'm252'];
  const rounds = currentWeapon.defaultRounds;

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

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 2800);
  };

  const visibilityOptions: { key: keyof InterfaceVisibilitySettings; label: string; icon: React.ReactNode }[] = [
    { key: 'showAppHeader', label: visibility.showAppHeader ? t.showAppHeader : t.hideAppHeader, icon: <Layers className="w-4 h-4 text-amber-400" /> },
    { key: 'showNavigation', label: visibility.showNavigation ? t.showNavigation : t.hideNavigation, icon: <Sliders className="w-4 h-4 text-sky-400" /> },
    { key: 'showMapControls', label: visibility.showMapControls ? t.showMapControls : t.hideMapControls, icon: <Sliders className="w-4 h-4 text-emerald-400" /> },
    { key: 'showMortarPanel', label: visibility.showMortarPanel ? t.showMortarPanel : t.hideMortarPanel, icon: <Crosshair className="w-4 h-4 text-red-500" /> },
    { key: 'showTargetPanel', label: visibility.showTargetPanel ? t.showTargetPanel : t.hideTargetPanel, icon: <MapPin className="w-4 h-4 text-blue-500" /> },
    { key: 'showCoordinates', label: visibility.showCoordinates ? t.showCoordinates : t.hideCoordinates, icon: <Gauge className="w-4 h-4 text-teal-400" /> },
    { key: 'showGridReferences', label: visibility.showGridReferences ? t.showGridReferences : t.hideGridReferences, icon: <Layers className="w-4 h-4 text-neutral-300" /> },
    { key: 'showDistanceMeasurements', label: visibility.showDistanceMeasurements ? t.showDistanceMeasurements : t.hideDistanceMeasurements, icon: <Ruler className="w-4 h-4 text-amber-300" /> },
    { key: 'showElevationInfo', label: visibility.showElevationInfo ? t.showElevationInfo : t.hideElevationInfo, icon: <Gauge className="w-4 h-4 text-emerald-400" /> },
    { key: 'showCompass', label: visibility.showCompass ? t.showCompass : t.hideCompass, icon: <Compass className="w-4 h-4 text-amber-400" /> },
    { key: 'showWindIndicators', label: visibility.showWindIndicators ? t.showWindIndicators : t.hideWindIndicators, icon: <Wind className="w-4 h-4 text-cyan-400" /> },
    { key: 'showRangeCircles', label: visibility.showRangeCircles ? t.showRangeCircles : t.hideRangeCircles, icon: <Crosshair className="w-4 h-4 text-red-400" /> },
    { key: 'showRangeLines', label: visibility.showRangeLines ? t.showRangeLines : t.hideRangeLines, icon: <Ruler className="w-4 h-4 text-amber-400" /> },
    { key: 'showLocationMarkers', label: visibility.showLocationMarkers ? t.showLocationMarkers : t.hideLocationMarkers, icon: <MapPin className="w-4 h-4 text-blue-400" /> },
    { key: 'showPlaceNames', label: visibility.showPlaceNames ? t.showPlaceNames : t.hidePlaceNames, icon: <Info className="w-4 h-4 text-purple-400" /> },
    { key: 'showMapLayers', label: visibility.showMapLayers ? t.showMapLayers : t.hideMapLayers, icon: <Layers className="w-4 h-4 text-indigo-400" /> },
    { key: 'showBallisticInfo', label: visibility.showBallisticInfo ? t.showBallisticInfo : t.hideBallisticInfo, icon: <Gauge className="w-4 h-4 text-emerald-400" /> },
    { key: 'showStatusIndicators', label: visibility.showStatusIndicators ? t.showStatusIndicators : t.hideStatusIndicators, icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" /> },
    { key: 'showInfoCards', label: visibility.showInfoCards ? t.showInfoCards : t.hideInfoCards, icon: <Layers className="w-4 h-4 text-neutral-400" /> },
    { key: 'showBottomToolbar', label: visibility.showBottomToolbar ? t.showBottomToolbar : t.hideBottomToolbar, icon: <Sliders className="w-4 h-4 text-amber-400" /> },
    { key: 'showAdvancedControls', label: visibility.showAdvancedControls ? t.showAdvancedControls : t.hideAdvancedControls, icon: <Sliders className="w-4 h-4 text-amber-500" /> },
  ];

  const bearingDeg = sol.azimuthDegrees || 0;
  const relWindAngleRad = ((windSettings.directionDeg - bearingDeg) * Math.PI) / 180;
  const crosswindSpeed = Number((windSettings.speedMps * Math.sin(relWindAngleRad)).toFixed(1));
  const longWindSpeed = Number((windSettings.speedMps * Math.cos(relWindAngleRad)).toFixed(1));
  const crosswindCorrectionMils = Math.round(crosswindSpeed * 4.2);
  const longCorrectionMils = Math.round(longWindSpeed * 2.8);

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 select-none font-mono">
      <div
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
        className="w-full max-w-3xl max-h-[92vh] flex flex-col bg-neutral-950 border border-neutral-700/90 rounded-xl shadow-2xl overflow-hidden text-neutral-100"
      >
        <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 bg-neutral-900 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-600/90 flex items-center justify-center text-neutral-950 font-bold shadow">
              <Sliders className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <h2 className="font-tactical text-sm sm:text-base font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <span>{t.settings}</span>
                <span className="text-[10px] text-amber-400 px-1.5 py-0.5 bg-amber-950/60 border border-amber-600/50 rounded font-mono">
                  {lang === 'ar' ? 'نظام التحكم بالنيران' : 'Arma Reforger FCS'}
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

        <div className="flex items-center overflow-x-auto border-b border-neutral-800 bg-neutral-900/60 px-2 py-1 gap-1 text-xs font-tactical font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('visibility')}
            className={`px-3 py-1.5 rounded-md transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'visibility'
                ? 'bg-amber-600 text-neutral-950 font-bold shadow'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{t.visibilityControls}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('display')}
            className={`px-3 py-1.5 rounded-md transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'display'
                ? 'bg-amber-600 text-neutral-950 font-bold shadow'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{t.mapDisplayOptions}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ballistics')}
            className={`px-3 py-1.5 rounded-md transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'ballistics'
                ? 'bg-amber-600 text-neutral-950 font-bold shadow'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>{t.ballisticInfoSection}</span>
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
            onClick={() => setActiveTab('reset')}
            className={`px-3 py-1.5 rounded-md transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'reset'
                ? 'bg-amber-600 text-neutral-950 font-bold shadow'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.resetOptionsSection}</span>
          </button>
        </div>

        {feedbackMessage && (
          <div className="bg-emerald-950/80 border-b border-emerald-600/60 px-4 py-2 flex items-center gap-2 text-xs text-emerald-300 font-semibold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{feedbackMessage}</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-3 sm:p-4 text-xs">
          {activeTab === 'visibility' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                <div>
                  <h3 className="font-tactical text-sm font-bold text-white uppercase">
                    {t.visibilityControls}
                  </h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    {lang === 'ar'
                      ? 'يمكنك إظهار أو إخفاء أي عنصر من عناصر واجهة النظام بشكل مستقل.'
                      : 'Independently show or hide every interface element with individual ON/OFF toggle switches.'}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      handleResetInterface();
                      showFeedback(t.layoutRestoredConfirm);
                    }}
                    className="px-2 py-1 rounded bg-neutral-900 border border-neutral-700 hover:border-amber-500 text-neutral-300 text-[11px] font-tactical transition"
                  >
                    {t.restoreDefaultLayout}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {visibilityOptions.map(opt => {
                  const isChecked = Boolean(visibility[opt.key]);
                  return (
                    <div
                      key={opt.key}
                      onClick={() => toggleVisibility(opt.key)}
                      className={`flex items-center justify-between p-2.5 rounded-lg border transition cursor-pointer ${
                        isChecked
                          ? 'bg-neutral-900/90 border-amber-500/50 shadow-sm'
                          : 'bg-neutral-950 border-neutral-800/80 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="shrink-0">{opt.icon}</div>
                        <span className="font-tactical text-xs font-semibold text-neutral-200">
                          {opt.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                            isChecked
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-600/40'
                              : 'bg-neutral-900 text-neutral-500 border border-neutral-800'
                          }`}
                        >
                          {isChecked ? t.on : t.off}
                        </span>
                        <div
                          className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                            isChecked ? 'bg-amber-600' : 'bg-neutral-800'
                          }`}
                        >
                          <div
                            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                              isChecked ? (lang === 'ar' ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'display' && (
            <div className="flex flex-col gap-3.5">
              <div className="pb-2 border-b border-neutral-800">
                <h3 className="font-tactical text-sm font-bold text-white uppercase">
                  {t.mapDisplayOptions}
                </h3>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  {t.placeNameNotice}
                </p>
              </div>

              <div className="flex flex-col gap-1.5 bg-neutral-900/60 p-3 rounded-lg border border-neutral-800">
                <label className="font-tactical font-bold text-amber-400 uppercase text-[11px]">
                  {t.map} ({lang === 'ar' ? 'اختيار مسرح العمليات' : 'Tactical Map Selection'})
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1">
                  {Object.values(MAPS).map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => onMapChange(m.id)}
                      className={`p-2 rounded-lg border text-left rtl:text-right transition flex flex-col ${
                        selectedMapId === m.id
                          ? 'border-amber-500 bg-amber-950/40 text-white font-bold ring-1 ring-amber-500/50'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-300 hover:border-neutral-700'
                      }`}
                    >
                      <span className="font-tactical text-xs text-amber-300">
                        {lang === 'ar' ? m.nameAr : m.name}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {m.subTitle}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

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
                  onClick={() => toggleAppearance('threeLineLabels')}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-neutral-800 bg-neutral-900/70 cursor-pointer hover:border-neutral-700"
                >
                  <span className="font-tactical text-xs font-semibold">{t.threeLineLabels}</span>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${appearance.threeLineLabels ? 'bg-emerald-950 text-emerald-400' : 'bg-neutral-900 text-neutral-500'}`}>
                    {appearance.threeLineLabels ? t.on : t.off}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-neutral-900/60 rounded-lg border border-neutral-800">
                <span className="font-tactical text-xs font-semibold text-neutral-300">
                  {t.distanceUnit}
                </span>
                <div className="flex items-center gap-1">
                  {(['meters', 'kilometers', 'both'] as const).map(unit => (
                    <button
                      key={unit}
                      type="button"
                      onClick={() => onAppearanceChange({ ...appearance, distanceUnit: unit })}
                      className={`px-2 py-1 rounded text-xs font-mono transition ${
                        appearance.distanceUnit === unit
                          ? 'bg-amber-600 text-neutral-950 font-bold'
                          : 'bg-neutral-950 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {unit === 'meters' ? t.metersUnit : unit === 'kilometers' ? t.kilometersUnit : t.bothUnits}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ballistics' && (
            <div className="flex flex-col gap-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                <div>
                  <h3 className="font-tactical text-sm font-bold text-white uppercase">
                    {t.ballisticInfoSection}
                  </h3>
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-tactical">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{t.verifiedData}: {lang === 'ar' ? 'جداول محرك Enfusion الأصلية' : 'Official in-game Enfusion tables'}</span>
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-tactical font-bold text-neutral-300 text-xs">
                  {t.selectMortar}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onWeaponChange('m252')}
                    className={`py-2 px-3 rounded-lg border font-tactical text-xs font-bold transition flex items-center justify-between ${
                      weaponType === 'm252'
                        ? 'bg-amber-600 text-neutral-950 border-amber-400 shadow-md'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                    }`}
                  >
                    <span>M252 81mm (US)</span>
                    <span className="text-[10px] font-mono">6400 MIL</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onWeaponChange('b2b14')}
                    className={`py-2 px-3 rounded-lg border font-tactical text-xs font-bold transition flex items-center justify-between ${
                      weaponType === 'b2b14'
                        ? 'bg-red-700 text-white border-red-500 shadow-md'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                    }`}
                  >
                    <span>2B14 Podnos 82mm (RU)</span>
                    <span className="text-[10px] font-mono">6000 MIL</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-tactical font-bold text-neutral-300 text-xs">
                  {t.ammunition}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {rounds.map((round: ShellType) => (
                    <button
                      key={round.id}
                      type="button"
                      onClick={() => onProjectileChange(round.id)}
                      className={`p-2 rounded-lg border text-xs font-mono transition text-left rtl:text-right flex flex-col justify-between ${
                        projectileId === round.id
                          ? 'border-amber-500 bg-amber-950/60 text-amber-300 font-bold ring-1 ring-amber-500/50'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700 hover:text-white'
                      }`}
                    >
                      <span className="font-bold">{round.name}</span>
                      <span className="text-[10px] text-neutral-500 uppercase">{round.category}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'wind' && (
            <div className="flex flex-col gap-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                <div>
                  <h3 className="font-tactical text-sm font-bold text-white uppercase">
                    {t.windSettings}
                  </h3>
                </div>
                <div
                  onClick={() => handleWindChange({ ...windSettings, enabled: !windSettings.enabled })}
                  className="flex items-center gap-2 cursor-pointer bg-neutral-900 border border-neutral-700 px-2.5 py-1 rounded-lg"
                >
                  <span className="font-tactical text-xs font-bold text-neutral-200">
                    {t.enableWindCorrection}
                  </span>
                  <div className={`w-9 h-4.5 flex items-center rounded-full p-0.5 transition ${windSettings.enabled ? 'bg-amber-600' : 'bg-neutral-800'}`}>
                    <div className={`bg-white w-3.5 h-3.5 rounded-full shadow transform transition ${windSettings.enabled ? (lang === 'ar' ? '-translate-x-4.5' : 'translate-x-4.5') : 'translate-x-0'}`} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-neutral-900/60 p-3 rounded-lg border border-neutral-800">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-tactical font-bold text-xs text-neutral-300">
                      {t.windSpeed}
                    </label>
                    <span className="font-mono text-amber-400 font-bold">
                      {windSettings.speedMps} {t.windSpeedMps}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="0.5"
                    value={windSettings.speedMps}
                    onChange={e => handleWindChange({ ...windSettings, speedMps: parseFloat(e.target.value) || 0 })}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-tactical font-bold text-xs text-neutral-300">
                      {t.windDirection}
                    </label>
                    <span className="font-mono text-cyan-400 font-bold">
                      {windSettings.directionDeg}°
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="359"
                    step="5"
                    value={windSettings.directionDeg}
                    onChange={e => handleWindChange({ ...windSettings, directionDeg: parseInt(e.target.value, 10) || 0 })}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="bg-neutral-900/90 border border-neutral-800 p-3 rounded-lg flex flex-col justify-between">
                  <span className="font-tactical font-bold text-xs text-neutral-300">{t.crosswind}</span>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="font-mono text-lg font-bold text-amber-400">
                      {Math.abs(crosswindSpeed)} {t.windSpeedMps}
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-300">
                      {windSettings.enabled ? `${crosswindCorrectionMils > 0 ? `+${crosswindCorrectionMils}` : crosswindCorrectionMils} MIL` : '--'}
                    </span>
                  </div>
                </div>

                <div className="bg-neutral-900/90 border border-neutral-800 p-3 rounded-lg flex flex-col justify-between">
                  <span className="font-tactical font-bold text-xs text-neutral-300">{t.longitudinalWind}</span>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="font-mono text-lg font-bold text-cyan-400">
                      {Math.abs(longWindSpeed)} {t.windSpeedMps}
                    </span>
                    <span className="text-xs font-mono font-bold text-cyan-300">
                      {windSettings.enabled ? `${longCorrectionMils > 0 ? `+${longCorrectionMils}` : longCorrectionMils} MIL` : '--'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reset' && (
            <div className="flex flex-col gap-3.5">
              <div className="pb-2 border-b border-neutral-800">
                <h3 className="font-tactical text-sm font-bold text-white uppercase">
                  {t.resetOptionsSection}
                </h3>
              </div>
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between p-3 bg-neutral-900/70 border border-neutral-800 rounded-lg">
                  <div className="flex flex-col">
                    <span className="font-tactical font-bold text-xs text-white">
                      {t.resetAppearance}
                    </span>
                    <span className="text-[11px] text-neutral-400 font-sans mt-0.5">
                      {t.resetAppearanceDesc}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onResetAppearance();
                      showFeedback(t.appearanceResetConfirm);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-300 font-tactical text-xs font-bold transition shadow"
                  >
                    {t.resetAppearance}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-neutral-900/70 border border-neutral-800 rounded-lg">
                  <div className="flex flex-col">
                    <span className="font-tactical font-bold text-xs text-white">
                      {t.resetInterfaceSettings}
                    </span>
                    <span className="text-[11px] text-neutral-400 font-sans mt-0.5">
                      {t.resetInterfaceSettingsDesc}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      handleResetInterface();
                      showFeedback(t.resetConfirm);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-300 font-tactical text-xs font-bold transition shadow"
                  >
                    {t.resetInterfaceSettings}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-amber-950/30 border border-amber-600/50 rounded-lg">
                  <div className="flex flex-col">
                    <span className="font-tactical font-bold text-xs text-amber-300">
                      {t.restoreDefaultLayout}
                    </span>
                    <span className="text-[11px] text-neutral-300 font-sans mt-0.5">
                      {t.restoreDefaultLayoutDesc}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onRestoreDefaultLayout();
                      showFeedback(t.layoutRestoredConfirm);
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-neutral-950 font-tactical text-xs font-bold transition shadow-lg shadow-amber-950/60 ring-1 ring-amber-400"
                  >
                    {t.restoreDefaultLayout}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-900 border-t border-neutral-800">
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
