import React, { useState } from 'react';
import {
  BallisticsDatabase,
  Language,
  MortarDefinition,
  MortarChargeData,
  BallisticEntry,
} from '../types';
import { translations } from '../i18n/translations';
import defaultBallisticsData from '../data/ballistics.json';
import {
  BookOpen,
  X,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Download,
  Upload,
  Check,
  AlertCircle,
} from 'lucide-react';

interface BallisticsEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  database: BallisticsDatabase;
  language: Language;
  onSaveDatabase: (db: BallisticsDatabase) => void;
}

export const BallisticsEditorModal: React.FC<BallisticsEditorModalProps> = ({
  isOpen,
  onClose,
  database,
  language,
  onSaveDatabase,
}) => {
  const t = translations[language];

  // Working copy of data
  const [dataCopy, setDataCopy] = useState<BallisticsDatabase>(() =>
    JSON.parse(JSON.stringify(database))
  );

  const [selectedMortarId, setSelectedMortarId] = useState<string>('M252');
  const [selectedChargeStr, setSelectedChargeStr] = useState<string>('1');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentMortar = dataCopy.mortars[selectedMortarId];
  const currentCharge = currentMortar?.charges[selectedChargeStr];

  const handleUpdateEntry = (index: number, field: keyof BallisticEntry, value: number) => {
    if (!currentCharge) return;
    const updatedEntries = [...currentCharge.entries];
    updatedEntries[index] = {
      ...updatedEntries[index],
      [field]: isNaN(value) ? 0 : value,
    };

    // Recalculate min and max range for charge
    const ranges = updatedEntries.map((e) => e.range_m);
    const min_range_m = Math.min(...ranges);
    const max_range_m = Math.max(...ranges);

    const updatedCharges = {
      ...currentMortar.charges,
      [selectedChargeStr]: {
        ...currentCharge,
        min_range_m: isFinite(min_range_m) ? min_range_m : 0,
        max_range_m: isFinite(max_range_m) ? max_range_m : 0,
        entries: updatedEntries,
      },
    };

    setDataCopy({
      ...dataCopy,
      mortars: {
        ...dataCopy.mortars,
        [selectedMortarId]: {
          ...currentMortar,
          charges: updatedCharges,
        },
      },
    });
  };

  const handleAddRow = () => {
    if (!currentCharge) return;
    const lastEntry = currentCharge.entries[currentCharge.entries.length - 1];
    const newEntry: BallisticEntry = {
      range_m: lastEntry ? lastEntry.range_m + 100 : 500,
      elevation_mil: lastEntry ? Math.max(0, lastEntry.elevation_mil - 50) : 1200,
      delev_per_100m: lastEntry ? lastEntry.delev_per_100m : -10,
      time_of_flight_s: lastEntry ? (lastEntry.time_of_flight_s ?? 20) + 2 : 20,
    };

    const updatedEntries = [...currentCharge.entries, newEntry];
    setDataCopy({
      ...dataCopy,
      mortars: {
        ...dataCopy.mortars,
        [selectedMortarId]: {
          ...currentMortar,
          charges: {
            ...currentMortar.charges,
            [selectedChargeStr]: {
              ...currentCharge,
              max_range_m: newEntry.range_m,
              entries: updatedEntries,
            },
          },
        },
      },
    });
  };

  const handleDeleteRow = (index: number) => {
    if (!currentCharge || currentCharge.entries.length <= 1) return;
    const updatedEntries = currentCharge.entries.filter((_, idx) => idx !== index);
    setDataCopy({
      ...dataCopy,
      mortars: {
        ...dataCopy.mortars,
        [selectedMortarId]: {
          ...currentMortar,
          charges: {
            ...currentMortar.charges,
            [selectedChargeStr]: {
              ...currentCharge,
              entries: updatedEntries,
            },
          },
        },
      },
    });
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all ballistics data to default values?')) {
      const def = JSON.parse(JSON.stringify(defaultBallisticsData));
      setDataCopy(def);
      setStatusMessage('Reset to defaults');
      setTimeout(() => setStatusMessage(null), 2500);
    }
  };

  const handleSave = () => {
    onSaveDatabase(dataCopy);
    setStatusMessage(t.ballisticsSaved);
    setTimeout(() => {
      setStatusMessage(null);
      onClose();
    }, 1200);
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dataCopy, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `reforger-ballistics-${dataCopy.gameVersion.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.mortars) {
          setDataCopy(parsed);
          setStatusMessage('Imported successfully!');
          setTimeout(() => setStatusMessage(null), 2000);
        } else {
          alert('Invalid ballistics JSON schema');
        }
      } catch {
        alert('Failed to parse JSON file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-base font-bold text-slate-100">{t.ballisticsEditor}</h3>
              <p className="text-[11px] text-slate-400">
                Data-driven ballistic tables for Arma Reforger
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {statusMessage && (
              <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 text-xs font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                {statusMessage}
              </span>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Game version and metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {t.gameVersion}
              </label>
              <input
                type="text"
                value={dataCopy.gameVersion}
                onChange={(e) => setDataCopy({ ...dataCopy, gameVersion: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Notice / Notes
              </label>
              <p className="text-[11px] text-amber-300/80 leading-tight">
                {dataCopy.sourceNote}
              </p>
            </div>
          </div>

          {/* Mortar & Charge Selector Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold">{t.mortarSelect}:</span>
              {Object.keys(dataCopy.mortars).map((mId) => (
                <button
                  key={mId}
                  onClick={() => {
                    setSelectedMortarId(mId);
                    const firstCharge = Object.keys(dataCopy.mortars[mId]?.charges || {})[0] || '1';
                    setSelectedChargeStr(firstCharge);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    selectedMortarId === mId
                      ? 'bg-cyan-600 text-white shadow-md'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {dataCopy.mortars[mId]?.name ?? mId}
                </button>
              ))}
            </div>

            {/* Charge selector buttons */}
            {currentMortar && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400 font-semibold">{t.charges}:</span>
                {Object.keys(currentMortar.charges).map((cKey) => (
                  <button
                    key={cKey}
                    onClick={() => setSelectedChargeStr(cKey)}
                    className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition ${
                      selectedChargeStr === cKey
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    CH {cKey}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Table Entries */}
          {currentCharge ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-300">
                  <span className="font-bold text-emerald-400">Charge {currentCharge.charge}</span> •{' '}
                  <span className="text-slate-400">
                    Range: {currentCharge.min_range_m}m - {currentCharge.max_range_m}m ({currentCharge.entries.length} rows)
                  </span>
                </div>
                <button
                  onClick={handleAddRow}
                  className="px-2.5 py-1 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/40 text-cyan-300 text-xs font-semibold flex items-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t.addRow}</span>
                </button>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/50">
                <div className="max-h-[300px] overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-900 text-slate-400 text-[11px] font-mono sticky top-0 border-b border-slate-800 z-10">
                      <tr>
                        <th className="py-2 px-3 text-center w-12">#</th>
                        <th className="py-2 px-3">{t.rangeM}</th>
                        <th className="py-2 px-3">{t.elevMil}</th>
                        <th className="py-2 px-3">{t.dElevPer100}</th>
                        <th className="py-2 px-3">{t.tofSec}</th>
                        <th className="py-2 px-3 text-center w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {currentCharge.entries.map((entry, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/60 transition">
                          <td className="py-1 px-3 text-center text-slate-500">{idx + 1}</td>
                          <td className="py-1 px-3">
                            <input
                              type="number"
                              value={entry.range_m}
                              onChange={(e) =>
                                handleUpdateEntry(idx, 'range_m', Number(e.target.value))
                              }
                              className="w-24 bg-slate-900 border border-slate-700/80 rounded px-2 py-1 text-xs text-cyan-300 focus:outline-none focus:border-cyan-500"
                            />
                          </td>
                          <td className="py-1 px-3">
                            <input
                              type="number"
                              value={entry.elevation_mil}
                              onChange={(e) =>
                                handleUpdateEntry(idx, 'elevation_mil', Number(e.target.value))
                              }
                              className="w-24 bg-slate-900 border border-slate-700/80 rounded px-2 py-1 text-xs text-amber-300 focus:outline-none focus:border-amber-500"
                            />
                          </td>
                          <td className="py-1 px-3">
                            <input
                              type="number"
                              value={entry.delev_per_100m}
                              onChange={(e) =>
                                handleUpdateEntry(idx, 'delev_per_100m', Number(e.target.value))
                              }
                              className="w-24 bg-slate-900 border border-slate-700/80 rounded px-2 py-1 text-xs text-emerald-300 focus:outline-none focus:border-emerald-500"
                            />
                          </td>
                          <td className="py-1 px-3">
                            <input
                              type="number"
                              step="0.5"
                              value={entry.time_of_flight_s ?? ''}
                              onChange={(e) =>
                                handleUpdateEntry(idx, 'time_of_flight_s', Number(e.target.value))
                              }
                              className="w-24 bg-slate-900 border border-slate-700/80 rounded px-2 py-1 text-xs text-purple-300 focus:outline-none focus:border-purple-500"
                            />
                          </td>
                          <td className="py-1 px-3 text-center">
                            <button
                              onClick={() => handleDeleteRow(idx)}
                              className="p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800 transition"
                              title={t.deleteRow}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500">No charge selected</div>
          )}

          {/* Import / Export & Reset toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition">
                <Upload className="w-3.5 h-3.5 text-slate-400" />
                <span>{t.importJson}</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={handleImportJson}
                />
              </label>

              <button
                onClick={handleExportJson}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>{t.exportJson}</span>
              </button>

              <button
                onClick={handleResetDefaults}
                className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-rose-300 text-xs font-medium flex items-center gap-1.5 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t.resetDefaults}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-cyan-950 transition active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>{t.saveBallistics}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
