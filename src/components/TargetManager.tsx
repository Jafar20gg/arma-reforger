import React, { useState } from 'react';
import { Bookmark, Plus, Trash2, Crosshair, Check } from 'lucide-react';
import { SavedTarget, WorldPoint, Language } from '../types/mortar';
import { formatGrid } from '../utils/coordinates';
import { getTranslation } from '../utils/i18n';

interface TargetManagerProps {
  currentTarget: WorldPoint;
  savedTargets: SavedTarget[];
  lang: Language;
  onSaveTarget: (target: SavedTarget) => void;
  onDeleteTarget: (id: string) => void;
  onSelectTarget: (target: SavedTarget) => void;
}

export const TargetManager: React.FC<TargetManagerProps> = ({
  currentTarget,
  savedTargets,
  lang,
  onSaveTarget,
  onDeleteTarget,
  onSelectTarget,
}) => {
  const t = getTranslation(lang);
  const [newTargetName, setNewTargetName] = useState('');
  const [justSaved, setJustSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const defaultName = lang === 'ar' ? `هدف ${savedTargets.length + 1}` : `TRP ${savedTargets.length + 1}`;
    const name = newTargetName.trim() || defaultName;
    const newTarget: SavedTarget = {
      id: `target-${Date.now()}`,
      name,
      xMeters: currentTarget.xMeters,
      yMeters: currentTarget.yMeters,
      altitudeMeters: currentTarget.altitudeMeters ?? 0,
      timestamp: Date.now(),
    };
    onSaveTarget(newTarget);
    setNewTargetName('');
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  return (
    <div className="flex flex-col gap-3 bg-neutral-900/90 border border-neutral-800 rounded-lg p-3 sm:p-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
        <div className="flex items-center gap-2">
          <Bookmark className="w-4 h-4 text-amber-500" />
          <h3 className="font-tactical text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-200">
            {t.savedTargets}
          </h3>
        </div>
        <span className="font-mono text-[11px] text-neutral-400">
          {savedTargets.length} {lang === 'ar' ? 'أهداف' : 'Targets'}
        </span>
      </div>

      <form onSubmit={handleSave} className="flex gap-2">
        <input
          type="text"
          value={newTargetName}
          onChange={e => setNewTargetName(e.target.value)}
          placeholder={t.targetNamePlaceholder}
          className="flex-1 bg-neutral-950 border border-neutral-700 rounded-md px-3 py-1.5 text-xs text-neutral-200 font-mono placeholder:text-neutral-500 focus:border-amber-500 outline-none"
        />
        <button
          type="submit"
          className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white font-tactical text-xs font-bold px-3 py-1.5 rounded-md transition shadow shrink-0"
        >
          {justSaved ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          <span>{justSaved ? (lang === 'ar' ? 'تم الحفظ' : 'Saved') : t.saveCurrentTarget}</span>
        </button>
      </form>

      <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1">
        {savedTargets.length === 0 ? (
          <div className="text-center py-4 text-xs font-mono text-neutral-500 italic">
            {t.noSavedTargets}
          </div>
        ) : (
          savedTargets.map(tgt => (
            <div
              key={tgt.id}
              className="flex items-center justify-between p-2 rounded bg-neutral-950 border border-neutral-800 hover:border-neutral-700 transition"
            >
              <div className="flex flex-col">
                <span className="text-xs font-tactical font-bold text-neutral-200">
                  {tgt.name}
                </span>
                <span className="text-[10px] font-mono text-neutral-400">
                  Grid: {formatGrid(tgt, 8)} | Alt: {tgt.altitudeMeters}m
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onSelectTarget(tgt)}
                  className="flex items-center gap-1 bg-blue-600/80 hover:bg-blue-600 text-white px-2.5 py-1 rounded text-xs font-tactical font-semibold transition shadow"
                >
                  <Crosshair className="w-3 h-3" />
                  <span>{t.applyTarget}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteTarget(tgt.id)}
                  className="p-1 text-neutral-400 hover:text-red-400 transition"
                  title={t.deleteTarget}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
