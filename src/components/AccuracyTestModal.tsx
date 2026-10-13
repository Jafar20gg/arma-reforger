import React, { useState } from 'react';
import { Language, MortarDefinition } from '../types';
import { translations } from '../i18n/translations';
import { testFiringAccuracy, AccuracyTestResult } from '../utils/calculator';
import { CheckCircle2, AlertTriangle, X, ShieldAlert, Sparkles, Scale } from 'lucide-react';

interface AccuracyTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  mortarDef: MortarDefinition;
  language: Language;
}

export const AccuracyTestModal: React.FC<AccuracyTestModalProps> = ({
  isOpen,
  onClose,
  mortarDef,
  language,
}) => {
  const t = translations[language];

  const chargesList = Object.keys(mortarDef.charges).map(Number).sort((a, b) => a - b);
  const [selectedCharge, setSelectedCharge] = useState<number>(chargesList[0] ?? 1);
  const [rangeMeters, setRangeMeters] = useState<number>(1000);
  const [heightDeltaMeters, setHeightDeltaMeters] = useState<number>(0);
  const [inGameElevationMil, setInGameElevationMil] = useState<number>(1200);

  const [testResult, setTestResult] = useState<AccuracyTestResult | null>(null);

  if (!isOpen) return null;

  const handleRunTest = (e: React.FormEvent) => {
    e.preventDefault();
    const res = testFiringAccuracy(
      mortarDef,
      selectedCharge,
      rangeMeters,
      heightDeltaMeters,
      inGameElevationMil
    );
    setTestResult(res);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Scale className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-base font-bold text-slate-100">{t.accuracyTest}</h3>
              <p className="text-xs text-slate-400">{mortarDef.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleRunTest} className="p-5 space-y-4 overflow-y-auto max-h-[80vh]">
          <p className="text-xs text-slate-300 leading-relaxed">{t.accuracyTestDesc}</p>

          <div className="grid grid-cols-2 gap-3 text-xs">
            {/* Charge */}
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <label className="text-[11px] text-slate-400 block mb-1">{t.charge}</label>
              <select
                value={selectedCharge}
                onChange={(e) => setSelectedCharge(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 font-mono"
              >
                {chargesList.map((c) => (
                  <option key={c} value={c}>
                    Charge {c}
                  </option>
                ))}
              </select>
            </div>

            {/* In-Game Range */}
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <label className="text-[11px] text-slate-400 block mb-1">{t.inputRange}</label>
              <input
                type="number"
                min="50"
                max="6000"
                value={rangeMeters}
                onChange={(e) => setRangeMeters(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 font-mono text-cyan-300"
                required
              />
            </div>

            {/* Height Delta */}
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <label className="text-[11px] text-slate-400 block mb-1">{t.inputHeightDelta}</label>
              <input
                type="number"
                min="-400"
                max="400"
                value={heightDeltaMeters}
                onChange={(e) => setHeightDeltaMeters(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 font-mono text-amber-300"
              />
            </div>

            {/* In-game observed Elevation */}
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <label className="text-[11px] text-slate-400 block mb-1">{t.inGameElev}</label>
              <input
                type="number"
                min="0"
                max="1600"
                value={inGameElevationMil}
                onChange={(e) => setInGameElevationMil(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 font-mono text-purple-300"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-950"
          >
            {t.runTest}
          </button>

          {/* Test Result Card */}
          {testResult && (
            <div
              className={`p-4 rounded-xl border ${
                testResult.isWithinTolerance
                  ? 'bg-emerald-950/30 border-emerald-500/50'
                  : 'bg-rose-950/30 border-rose-500/50'
              } space-y-3`}
            >
              <div className="flex items-center gap-2">
                {testResult.isWithinTolerance ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                )}
                <span className="font-bold text-xs">
                  {testResult.isWithinTolerance ? t.withinTolerance : t.outOfTolerance}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">في اللعبة</span>
                  <span className="text-white font-bold">{testResult.inGameElevation_mil} mil</span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">المحسوب</span>
                  <span className="text-cyan-400 font-bold">{testResult.calculatedElevation_mil} mil</span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">الانحراف</span>
                  <span
                    className={`font-bold ${
                      testResult.elevationDiff_mil === 0
                        ? 'text-emerald-400'
                        : Math.abs(testResult.elevationDiff_mil) <= 2
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {testResult.elevationDiff_mil > 0 ? `+${testResult.elevationDiff_mil}` : testResult.elevationDiff_mil} mil
                  </span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">النسبة</span>
                  <span className="text-slate-300 font-bold">{testResult.percentageDiff}%</span>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
