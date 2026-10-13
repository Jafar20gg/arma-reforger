import React, { useState } from 'react';
import { Target, Language, FireMissionSolution } from '../types';
import { translations } from '../i18n/translations';
import {
  Trash2,
  Edit2,
  Check,
  Target as TargetIcon,
  ArrowUp,
  ArrowDown,
  Palette,
} from 'lucide-react';

interface TargetManagerProps {
  targets: Target[];
  selectedTargetId: string | null;
  language: Language;
  onSelectTarget: (id: string) => void;
  onUpdateTarget: (id: string, updates: Partial<Target>) => void;
  onDeleteTarget: (id: string) => void;
  onClearTargets: () => void;
  onReorderTargets: (targets: Target[]) => void;
  solutionsMap: Map<string, FireMissionSolution>;
}

export const TargetManager: React.FC<TargetManagerProps> = ({
  targets,
  selectedTargetId,
  language,
  onSelectTarget,
  onUpdateTarget,
  onDeleteTarget,
  onClearTargets,
  onReorderTargets,
  solutionsMap,
}) => {
  const t = translations[language];
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editColor, setEditColor] = useState('#ef4444');

  const startEditing = (tgt: Target) => {
    setEditingId(tgt.id);
    setEditName(tgt.name);
    setEditNotes(tgt.notes || '');
    setEditColor(tgt.color || '#ef4444');
  };

  const saveEdit = (id: string) => {
    onUpdateTarget(id, {
      name: editName.trim() || `Target ${id.slice(-4)}`,
      notes: editNotes.trim(),
      color: editColor,
    });
    setEditingId(null);
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const copy = [...targets];
    const temp = copy[index - 1];
    copy[index - 1] = copy[index];
    copy[index] = temp;
    onReorderTargets(copy);
  };

  const handleMoveDown = (index: number) => {
    if (index >= targets.length - 1) return;
    const copy = [...targets];
    const temp = copy[index + 1];
    copy[index + 1] = copy[index];
    copy[index] = temp;
    onReorderTargets(copy);
  };

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-xl shadow-xl backdrop-blur-md overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TargetIcon className="w-4 h-4 text-red-400" />
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
            <span>{t.targets}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-slate-400 font-mono">
              {targets.length}
            </span>
          </h3>
        </div>

        {targets.length > 0 && (
          <button
            onClick={onClearTargets}
            className="text-[11px] text-rose-400 hover:text-rose-300 hover:underline transition"
          >
            {t.clearAll}
          </button>
        )}
      </div>

      {/* Target List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 max-h-[360px] divide-y divide-slate-800/40">
        {targets.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-xs">
            <p>{t.noTargets}</p>
          </div>
        ) : (
          targets.map((tgt, index) => {
            const isSelected = tgt.id === selectedTargetId;
            const isEditing = editingId === tgt.id;
            const sol = solutionsMap.get(tgt.id);

            return (
              <div
                key={tgt.id}
                onClick={() => !isEditing && onSelectTarget(tgt.id)}
                className={`p-2.5 rounded-lg transition border cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800/90 border-red-500/60 shadow-md ring-1 ring-red-500/20'
                    : 'bg-slate-950/40 border-slate-800/70 hover:bg-slate-800/40'
                }`}
              >
                {isEditing ? (
                  <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">{t.targetName}</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-500"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">{t.notes}</label>
                      <input
                        type="text"
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        placeholder="e.g. bunker, MG nest, road crossing"
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-[10px] text-slate-400">اللون:</label>
                      <div className="flex gap-1.5">
                        {['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'].map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setEditColor(color)}
                            className={`w-4 h-4 rounded-full border ${
                              editColor === color ? 'ring-2 ring-white scale-110' : 'opacity-70'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-end gap-1.5 pt-1">
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-2 py-1 rounded bg-slate-800 text-slate-400 text-xs hover:text-white"
                      >
                        {t.cancel}
                      </button>
                      <button
                        onClick={() => saveEdit(tgt.id)}
                        className="px-2.5 py-1 rounded bg-cyan-600 text-white text-xs font-medium hover:bg-cyan-500 flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        <span>{t.save}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0 text-white shadow"
                        style={{ backgroundColor: tgt.color || '#ef4444' }}
                      >
                        {index + 1}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-200 truncate">{tgt.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono" dir="ltr">
                            {tgt.altitude}m {t.asl}
                          </span>
                        </div>

                        {tgt.notes && (
                          <p className="text-[11px] text-amber-300/80 truncate mt-0.5">{tgt.notes}</p>
                        )}

                        {sol && (
                          <div className="text-[11px] font-mono text-cyan-400 flex items-center gap-2 mt-0.5" dir="ltr">
                            <span>{sol.range_m}m</span>
                            <span>•</span>
                            <span>AZ {sol.azimuth_mil}</span>
                            <span>•</span>
                            <span>EL {sol.elevation_mil}</span>
                            <span>•</span>
                            <span>CH {sol.charge}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action buttons including Reorder */}
                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="p-1 text-slate-500 hover:text-slate-300 disabled:opacity-20 rounded"
                        title={t.moveUp}
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleMoveDown(index)}
                        disabled={index === targets.length - 1}
                        className="p-1 text-slate-500 hover:text-slate-300 disabled:opacity-20 rounded"
                        title={t.moveDown}
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => startEditing(tgt)}
                        className="p-1.5 text-slate-400 hover:text-cyan-400 rounded hover:bg-slate-800/80 transition"
                        title={t.editTarget}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteTarget(tgt.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800/80 transition"
                        title={t.deleteTarget}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
