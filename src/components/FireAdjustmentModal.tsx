import React, { useState } from 'react';
import {
  FireAdjustment,
  FireMissionSolution,
  Language,
  MortarDefinition,
  MortarState,
  Target,
} from '../types';
import { translations } from '../i18n/translations';
import { calculateFireAdjustment, computeFireSolution } from '../utils/calculator';
import { Sliders, X, Check, ArrowDown, ArrowUp, ArrowLeft, ArrowRight, Crosshair } from 'lucide-react';

interface FireAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: Target | null;
  mortar: MortarState;
  mortarDef: MortarDefinition;
  solution: FireMissionSolution | null;
  language: Language;
  onApplyAdjustment: (newCoords: { x: number; y: number }, newName: string) => void;
}

export const FireAdjustmentModal: React.FC<FireAdjustmentModalProps> = ({
  isOpen,
  onClose,
  target,
  mortar,
  mortarDef,
  solution,
  language,
  onApplyAdjustment,
}) => {
  const t = translations[language];

  // Distance correction: positive = Short (Add), negative = Over (Drop)
  const [distType, setDistType] = useState<'short' | 'over'>('short');
  const [distMeters, setDistMeters] = useState<number>(50);

  // Lateral correction: positive = Right, negative = Left
  const [lateralType, setLateralType] = useState<'left' | 'right'>('right');
  const [lateralMeters, setLateralMeters] = useState<number>(30);

  // Observer Azimuth
  const [customObserverAz, setCustomObserverAz] = useState<string>('');

  if (!isOpen || !target || !solution) return null;

  // Compute adjustment preview
  const distSign = distType === 'short' ? 1 : -1;
  const latSign = lateralType === 'right' ? 1 : -1;

  const adjustment: FireAdjustment = {
    distanceCorrection_m: distMeters * distSign,
    lateralCorrection_m: lateralMeters * latSign,
    observerAzimuth_deg: customObserverAz ? Number(customObserverAz) : undefined,
  };

  const { newTargetCoords } = calculateFireAdjustment(target, mortar, adjustment);

  // Mock new target for solution calculation
  const previewTarget: Target = {
    ...target,
    x: newTargetCoords.x,
    y: newTargetCoords.y,
  };

  const newSolution = computeFireSolution(mortar, previewTarget, mortarDef);

  // Delta Azimuth & Delta Elevation in mils
  const deltaAz_mil = newSolution.azimuth_mil - solution.azimuth_mil;
  const deltaEl_mil = newSolution.elevation_mil - solution.elevation_mil;

  const handleApply = () => {
    const adjustedName = `${target.name} [ADJ]`;
    onApplyAdjustment(newTargetCoords, adjustedName);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-base font-bold text-slate-100">{t.fireAdjustment}</h3>
              <p className="text-xs text-slate-400">
                {target.name} • {solution.range_m}m
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[80vh]">
          <p className="text-xs text-slate-300 leading-relaxed">{t.adjustmentDesc}</p>

          {/* Range Correction (Short / Over) */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
            <label className="text-xs font-semibold text-slate-300 block">{t.distCorrection}</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDistType('short')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition ${
                  distType === 'short'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <ArrowUp className="w-4 h-4" />
                <span>{t.shortAdd}</span>
              </button>
              <button
                type="button"
                onClick={() => setDistType('over')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition ${
                  distType === 'over'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <ArrowDown className="w-4 h-4" />
                <span>{t.overDrop}</span>
              </button>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="range"
                min="0"
                max="500"
                step="10"
                value={distMeters}
                onChange={(e) => setDistMeters(Number(e.target.value))}
                className="w-full accent-amber-400"
              />
              <div className="flex items-center gap-1 min-w-[70px]">
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={distMeters}
                  onChange={(e) => setDistMeters(Number(e.target.value) || 0)}
                  className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-center text-amber-300 focus:outline-none focus:border-amber-400"
                />
                <span className="text-xs text-slate-400 font-mono">m</span>
              </div>
            </div>
          </div>

          {/* Lateral Correction (Left / Right) */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
            <label className="text-xs font-semibold text-slate-300 block">{t.lateralCorrection}</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLateralType('left')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition ${
                  lateralType === 'left'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t.left}</span>
              </button>
              <button
                type="button"
                onClick={() => setLateralType('right')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition ${
                  lateralType === 'right'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <ArrowRight className="w-4 h-4" />
                <span>{t.right}</span>
              </button>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="range"
                min="0"
                max="500"
                step="5"
                value={lateralMeters}
                onChange={(e) => setLateralMeters(Number(e.target.value))}
                className="w-full accent-cyan-400"
              />
              <div className="flex items-center gap-1 min-w-[70px]">
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={lateralMeters}
                  onChange={(e) => setLateralMeters(Number(e.target.value) || 0)}
                  className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-center text-cyan-300 focus:outline-none focus:border-cyan-400"
                />
                <span className="text-xs text-slate-400 font-mono">m</span>
              </div>
            </div>
          </div>

          {/* Observer Azimuth (Optional) */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              {t.observerAzimuth}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="360"
                placeholder={`${solution.azimuth_deg}° (Mortar-Target LOS)`}
                value={customObserverAz}
                onChange={(e) => setCustomObserverAz(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <span className="text-xs text-slate-400 font-mono">{t.degrees}</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">{t.observerAzimuthHelp}</p>
          </div>

          {/* DELTA RECALCULATION PREVIEW */}
          <div className="bg-slate-950 border border-emerald-500/30 rounded-xl p-4">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>{t.solution} (New Solution)</span>
              <span className="text-slate-400 font-mono text-[11px]">
                CH {newSolution.charge} • {newSolution.range_m}m
              </span>
            </h4>

            <div className="grid grid-cols-2 gap-3 font-mono">
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">{t.elevation}</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-cyan-400">{newSolution.elevation_mil}</span>
                  <span
                    className={`text-xs font-semibold ${
                      deltaEl_mil >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    Δ {deltaEl_mil >= 0 ? `+${deltaEl_mil}` : deltaEl_mil} {t.mils}
                  </span>
                </div>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">{t.azimuth}</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-amber-400">{newSolution.azimuth_mil}</span>
                  <span
                    className={`text-xs font-semibold ${
                      deltaAz_mil >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    Δ {deltaAz_mil >= 0 ? `+${deltaAz_mil}` : deltaAz_mil} {t.mils}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
          >
            {t.cancel}
          </button>
          <button
            onClick={handleApply}
            className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950 transition active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>{t.applyAdjustment}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
