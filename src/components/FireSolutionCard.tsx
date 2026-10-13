import React, { useState } from 'react';
import {
  FireMissionSolution,
  Language,
  MilSystem,
  MortarDefinition,
  MortarState,
  Target,
} from '../types';
import { translations } from '../i18n/translations';
import {
  Copy,
  Check,
  AlertTriangle,
  RotateCcw,
  Sliders,
  Compass,
  ArrowUpRight,
  Crosshair,
  ChevronUp,
  ChevronDown,
  Layers,
  Sparkles,
  Upload,
} from 'lucide-react';

interface FireSolutionCardProps {
  solution: FireMissionSolution | null;
  mortar: MortarState;
  mortarDef: MortarDefinition;
  target: Target | null;
  language: Language;
  isPlaceholderData?: boolean;
  onUpdateMortarAltitude: (alt: number) => void;
  onUpdateTargetAltitude: (alt: number) => void;
  onSetChargeOverride: (charge: number | null) => void;
  onOpenAdjustment: () => void;
  onUploadHeightmap?: (file: File) => void;
  isHeightmapAvailable: boolean;
  isMobileSheetExpanded?: boolean;
  onToggleMobileSheet?: () => void;
}

export const FireSolutionCard: React.FC<FireSolutionCardProps> = ({
  solution,
  mortar,
  mortarDef,
  target,
  language,
  isPlaceholderData = true,
  onUpdateMortarAltitude,
  onUpdateTargetAltitude,
  onSetChargeOverride,
  onOpenAdjustment,
  onUploadHeightmap,
  isHeightmapAvailable,
  isMobileSheetExpanded = false,
  onToggleMobileSheet,
}) => {
  const t = translations[language];
  const [copied, setCopied] = useState(false);

  const handleCopyMission = () => {
    if (!solution || !target) return;
    const missionText = `[FIRE MISSION]
Mortar: ${mortarDef.name} (${mortar.milSystem} mil)
Target: ${target.name}
Range: ${solution.range_m}m
Charge: ${solution.charge}
Azimuth: ${solution.azimuth_mil} mil (${solution.azimuth_deg}°)
Elevation: ${solution.elevation_mil} mil
Alt Delta: ${solution.altitudeDelta_m > 0 ? '+' : ''}${solution.altitudeDelta_m}m (${solution.altitudeCorrection_mil} mil)
TOF: ${solution.timeOfFlight_s ? solution.timeOfFlight_s + 's' : 'N/A'}`;

    navigator.clipboard.writeText(missionText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  };

  const handleHeightmapInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadHeightmap) {
      onUploadHeightmap(file);
    }
    e.target.value = '';
  };

  if (!target) {
    return (
      <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-4 shadow-xl backdrop-blur-md text-slate-400 text-center">
        <Crosshair className="w-8 h-8 text-slate-600 mx-auto mb-2 animate-pulse" />
        <p className="text-sm font-medium">{t.noTargets}</p>
        <p className="text-xs text-slate-500 mt-1">{t.mapHelp}</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-xl shadow-2xl backdrop-blur-md overflow-hidden flex flex-col transition-all">
      {/* Mobile drag handle / summary banner */}
      <div
        onClick={onToggleMobileSheet}
        className="md:hidden flex items-center justify-between px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 cursor-pointer select-none"
      >
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
          <span className="font-bold text-sm text-slate-200">{target.name}</span>
          {solution && (
            <span className="text-xs font-mono text-cyan-400" dir="ltr">
              {solution.range_m}m • CH {solution.charge} • AZ {solution.azimuth_mil} • EL {solution.elevation_mil}
            </span>
          )}
        </div>
        <button className="text-slate-400 p-1">
          {isMobileSheetExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      <div className={`p-4 space-y-3.5 ${isMobileSheetExpanded ? 'block' : 'hidden md:block'}`}>
        {/* PERMANENT RED BANNER WHILE PLACEHOLDER DATA IS IN USE */}
        {isPlaceholderData && (
          <div className="p-2.5 rounded-lg bg-rose-950/80 border-2 border-rose-500/80 text-rose-200 text-xs font-bold flex items-center gap-2 shadow-lg animate-in fade-in">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 animate-pulse" />
            <div className="flex-1">
              <span>{t.placeholderBanner}</span>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-rose-900 text-[10px] text-white uppercase font-mono tracking-wider shrink-0">
              {t.placeholderBadge}
            </span>
          </div>
        )}

        {/* Header: Target Name & Quick Action */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 ring-4 ring-red-500/20"></div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>{target.name}</span>
                <span className="text-xs font-normal text-slate-400 font-mono" dir="ltr">
                  ({Math.round(target.x)}m, {Math.round(target.y)}m)
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">{mortarDef.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onOpenAdjustment}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold transition"
              title={t.fireAdjustment}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{t.fireAdjustment}</span>
            </button>

            <button
              onClick={handleCopyMission}
              disabled={!solution}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-cyan-950 transition active:scale-95"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? t.missionCopied : t.copyMission}</span>
            </button>
          </div>
        </div>

        {/* Warnings Banner */}
        {solution?.warnings && solution.warnings.length > 0 && (
          <div className="space-y-1.5">
            {solution.warnings.includes('OUT_OF_RANGE') && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{t.outOfRange}</span>
              </div>
            )}
            {solution.warnings.includes('TOO_CLOSE') && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>{t.tooClose}</span>
              </div>
            )}
            {solution.warnings.includes('EXTREME_ALTITUDE') && (
              <div className="flex items-center gap-2 p-2 rounded bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-[11px]">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-yellow-400" />
                <span>{t.extremeAltitude}</span>
              </div>
            )}
          </div>
        )}

        {/* BIG TACTICAL NUMBERS GRID (CH, AZ, EL, Range) */}
        {solution ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            {/* CHARGE (CH) */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between relative overflow-hidden group hover:border-emerald-500/50 transition">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span className="font-semibold uppercase tracking-wider">CH ({t.charge})</span>
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="my-1">
                <span className="text-3xl lg:text-4xl font-extrabold text-emerald-400 font-mono tracking-tight" dir="ltr">
                  {solution.charge}
                </span>
                <span className="text-xs text-slate-400 ms-1 font-mono" dir="ltr">
                  ({solution.minRange_m}-{solution.maxRange_m}m)
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                {mortar.selectedChargeOverride === null ? t.autoCharge : t.overrideCharge}
              </div>
            </div>

            {/* AZIMUTH (AZ, mil & deg) */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between relative overflow-hidden group hover:border-amber-500/50 transition">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span className="font-semibold uppercase tracking-wider">AZ ({t.azimuth})</span>
                <Compass className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="my-1">
                <span className="text-3xl lg:text-4xl font-extrabold text-amber-400 font-mono tracking-tight" dir="ltr">
                  {solution.azimuth_mil.toString().padStart(4, '0')}
                </span>
                <span className="text-xs text-slate-400 ms-1 font-mono">{t.mils}</span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono" dir="ltr">
                {solution.azimuth_deg}°
              </div>
            </div>

            {/* ELEVATION (EL, mil) */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between relative overflow-hidden group hover:border-cyan-500/50 transition">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span className="font-semibold uppercase tracking-wider">EL ({t.elevation})</span>
                <span className="text-[10px] text-cyan-400 font-mono">{mortar.milSystem}</span>
              </div>
              <div className="my-1">
                <span className="text-3xl lg:text-4xl font-extrabold text-cyan-400 font-mono tracking-tight" dir="ltr">
                  {solution.elevation_mil}
                </span>
                <span className="text-xs text-slate-400 ms-1 font-mono">{t.mils}</span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between" dir="ltr">
                <span>Base: {solution.baseElevation_mil}</span>
                <span className={solution.altitudeCorrection_mil >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {solution.altitudeCorrection_mil >= 0 ? '+' : ''}{solution.altitudeCorrection_mil}
                </span>
              </div>
            </div>

            {/* RANGE (m) & TOF */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between relative overflow-hidden group hover:border-purple-500/50 transition">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span className="font-semibold uppercase tracking-wider">{t.range}</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <div className="my-1">
                <span className="text-3xl lg:text-4xl font-extrabold text-purple-300 font-mono tracking-tight" dir="ltr">
                  {solution.range_m}
                </span>
                <span className="text-xs text-slate-400 ms-1 font-mono">{t.meters}</span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between" dir="ltr">
                <span>{t.tof}:</span>
                <span className="text-purple-300 font-bold">
                  {solution.timeOfFlight_s ? `${solution.timeOfFlight_s}s` : '—'}
                </span>
              </div>
            </div>
          </div>
        ) : null}

        {/* CONTROLS ROW: Charge Override Selector & Altitudes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {/* Charge Override Selector */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5">
            <label className="text-[11px] font-semibold text-slate-400 block mb-1.5 flex items-center justify-between">
              <span>{t.charge}</span>
              <span className="text-[10px] text-slate-500 font-normal">
                {mortar.selectedChargeOverride === null ? t.autoCharge : `${t.charge} ${mortar.selectedChargeOverride}`}
              </span>
            </label>
            <div className="flex gap-1" dir="ltr">
              <button
                onClick={() => onSetChargeOverride(null)}
                className={`flex-1 py-1 px-1.5 rounded text-xs font-mono font-medium transition ${
                  mortar.selectedChargeOverride === null
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Auto
              </button>
              {solution?.availableCharges.map((c) => (
                <button
                  key={c}
                  onClick={() => onSetChargeOverride(c)}
                  className={`flex-1 py-1 px-1.5 rounded text-xs font-mono font-medium transition ${
                    mortar.selectedChargeOverride === c
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  CH {c}
                </button>
              ))}
            </div>
          </div>

          {/* Mortar Altitude Input */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5">
            <label className="text-[11px] font-semibold text-cyan-400 block mb-1 flex items-center justify-between">
              <span>{t.mortarAlt}</span>
              <span className="text-[10px] text-slate-500 font-mono">{t.asl}</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="600"
                value={mortar.altitude}
                onChange={(e) => onUpdateMortarAltitude(Number(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-sm font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                dir="ltr"
              />
              <span className="text-xs font-mono text-slate-400">{t.meters}</span>
            </div>
          </div>

          {/* Target Altitude Input */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5">
            <label className="text-[11px] font-semibold text-red-400 block mb-1 flex items-center justify-between">
              <span>{t.targetAlt}</span>
              <span className="text-[10px] text-slate-500 font-mono" dir="ltr">
                Δ {solution ? (solution.altitudeDelta_m > 0 ? `+${solution.altitudeDelta_m}` : solution.altitudeDelta_m) : 0}m
              </span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="600"
                value={target.altitude}
                onChange={(e) => onUpdateTargetAltitude(Number(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-sm font-mono text-red-300 focus:outline-none focus:border-red-500"
                dir="ltr"
              />
              <span className="text-xs font-mono text-slate-400">{t.meters}</span>
            </div>
          </div>
        </div>

        {/* Heightmap automatic lookup status banner & upload option */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 bg-slate-950/40 rounded px-2.5 py-1.5 border border-slate-800/60">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isHeightmapAvailable ? t.heightmapActive : t.heightmapUnavailable}</span>
          </div>

          <label className="cursor-pointer text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px] font-medium transition">
            <Upload className="w-3 h-3" />
            <span>{t.uploadHeightmap}</span>
            <input
              type="file"
              accept="image/png"
              className="hidden"
              onChange={handleHeightmapInput}
            />
          </label>
        </div>

        {/* RECOIL REMINDER BANNER */}
        <div className="bg-amber-950/30 border border-amber-600/40 rounded-lg p-2.5 text-xs text-amber-200/90 flex items-start gap-2 shadow-inner">
          <RotateCcw className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-spin-slow" />
          <p className="leading-relaxed">{t.recoilWarning}</p>
        </div>
      </div>
    </div>
  );
};
