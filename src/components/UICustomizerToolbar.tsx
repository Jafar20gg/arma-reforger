import React, { useState } from 'react';
import {
  Sliders,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  RotateCcw,
  Undo2,
  Redo2,
  Save,
  X,
  Plus,
  Trash2,
  Edit2,
  Check,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Download,
  Upload
} from 'lucide-react';
import {
  UIElementId,
  UIElementConfig,
  LayoutProfile
} from '../types/customization';
import { Language } from '../types/mortar';
import { getTranslation } from '../utils/i18n';

interface UICustomizerToolbarProps {
  lang: Language;
  activeProfile: LayoutProfile;
  profiles: LayoutProfile[];
  selectedElementId: UIElementId;
  isPreviewing: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onSelectElement: (id: UIElementId) => void;
  onUpdateElementConfig: (id: UIElementId, partial: Partial<UIElementConfig>) => void;
  onResetElement: (id: UIElementId) => void;
  onSelectProfile: (profileId: string) => void;
  onCreateProfile: (name: string) => void;
  onRenameProfile: (profileId: string, newName: string) => void;
  onDeleteProfile: (profileId: string) => void;
  onTogglePreview: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onResetLayout: () => void;
  onSave: () => void;
  onCancel: () => void;
  onExport?: () => void;
  onImport?: (jsonString: string) => void;
}

export const UICustomizerToolbar: React.FC<UICustomizerToolbarProps> = ({
  lang,
  activeProfile,
  profiles,
  selectedElementId,
  isPreviewing,
  canUndo,
  canRedo,
  onSelectElement,
  onUpdateElementConfig,
  onResetElement,
  onSelectProfile,
  onCreateProfile,
  onRenameProfile,
  onDeleteProfile,
  onTogglePreview,
  onUndo,
  onRedo,
  onResetLayout,
  onSave,
  onCancel,
  onExport,
  onImport,
}) => {
  const t = getTranslation(lang);
  const currentConfig = activeProfile.elements[selectedElementId];
  const [newProfileModalOpen, setNewProfileModalOpen] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onImport) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) onImport(content);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;
    onCreateProfile(newProfileName.trim());
    setNewProfileName('');
    setNewProfileModalOpen(false);
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameValue.trim()) return;
    onRenameProfile(activeProfile.id, renameValue.trim());
    setIsRenaming(false);
  };

  const nudge = (dx: number, dy: number) => {
    if (currentConfig.locked) return;
    onUpdateElementConfig(selectedElementId, {
      offsetX: currentConfig.offsetX + dx,
      offsetY: currentConfig.offsetY + dy,
    });
  };

  return (
    <div className="z-[9999] fixed top-0 inset-x-0 bg-neutral-950/95 border-b border-amber-500/80 shadow-2xl backdrop-blur-md select-none font-mono text-xs text-neutral-100 flex flex-col">
      <div className="px-3 py-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-amber-600/90 text-neutral-950 font-tactical font-black text-xs shadow">
            <Sliders className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>UI CUSTOMIZER</span>
          </div>

          <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-700 rounded px-2 py-0.5">
            <span className="text-[10px] text-neutral-400 font-tactical uppercase">Profile:</span>
            {isRenaming ? (
              <form onSubmit={handleRenameSubmit} className="flex items-center gap-1">
                <input
                  type="text"
                  value={renameValue}
                  onChange={e => setRenameValue(e.target.value)}
                  className="bg-neutral-950 border border-amber-500 rounded px-1.5 py-0.5 text-xs text-white outline-none w-28"
                  autoFocus
                />
                <button type="submit" className="p-0.5 text-emerald-400 hover:text-emerald-300">
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => setIsRenaming(false)} className="p-0.5 text-neutral-400">
                  <X className="w-3.5 h-3.5" />
                </button>
              </form>
            ) : (
              <select
                value={activeProfile.id}
                onChange={e => onSelectProfile(e.target.value)}
                className="bg-transparent text-xs font-semibold text-amber-300 focus:outline-none cursor-pointer max-w-[140px] truncate"
              >
                {profiles.map(p => (
                  <option key={p.id} value={p.id} className="bg-neutral-900 text-neutral-100">
                    {lang === 'ar' && p.nameAr ? p.nameAr : p.name}
                  </option>
                ))}
              </select>
            )}
            {!activeProfile.isPreset && !isRenaming && (
              <button
                type="button"
                onClick={() => {
                  setRenameValue(activeProfile.name);
                  setIsRenaming(true);
                }}
                className="p-1 text-neutral-400 hover:text-white"
                title="Rename active profile"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setNewProfileModalOpen(true)}
              className="p-1 text-neutral-400 hover:text-amber-400"
              title="Save as new custom layout profile"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            {!activeProfile.isPreset && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Delete profile "${activeProfile.name}"?`)) {
                    onDeleteProfile(activeProfile.id);
                  }
                }}
                className="p-1 text-neutral-500 hover:text-red-400"
                title="Delete custom profile"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto py-0.5">
          <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-700 rounded px-2 py-1">
            <span className="text-[10px] text-neutral-400 font-tactical uppercase">Element:</span>
            <select
              value={selectedElementId}
              onChange={e => onSelectElement(e.target.value as UIElementId)}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer max-w-[130px] truncate"
            >
              {Object.values(activeProfile.elements).map(el => (
                <option key={el.id} value={el.id} className="bg-neutral-900 text-neutral-100">
                  {lang === 'ar' ? el.nameAr : el.name}
                </option>
              ))}
            </select>
          </div>

          {currentConfig && (
            <div className="flex items-center gap-2 bg-neutral-900/90 border border-neutral-800 rounded px-2 py-1">
              <button
                type="button"
                onClick={() => onUpdateElementConfig(selectedElementId, { visible: !currentConfig.visible })}
                className={`p-1 rounded transition ${
                  currentConfig.visible ? 'text-emerald-400 hover:text-emerald-300' : 'text-neutral-500 hover:text-neutral-400'
                }`}
                title={currentConfig.visible ? 'Hide Element' : 'Show Element'}
              >
                {currentConfig.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => onUpdateElementConfig(selectedElementId, { locked: !currentConfig.locked })}
                className={`p-1 rounded transition ${
                  currentConfig.locked ? 'text-red-400 bg-red-950/50' : 'text-neutral-400 hover:text-white'
                }`}
                title={currentConfig.locked ? 'Unlock Position' : 'Lock Position'}
              >
                {currentConfig.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              </button>
              <div className="flex items-center gap-1 text-[11px]">
                <span className="text-[10px] text-neutral-400">Scale:</span>
                <input
                  type="range"
                  min="0.70"
                  max="1.35"
                  step="0.05"
                  disabled={currentConfig.locked}
                  value={currentConfig.scale}
                  onChange={e => onUpdateElementConfig(selectedElementId, { scale: parseFloat(e.target.value) })}
                  className="w-16 accent-amber-500 cursor-pointer disabled:opacity-40"
                />
                <span className="text-[10px] text-amber-400 font-bold w-7 text-right">
                  {Math.round(currentConfig.scale * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] hidden sm:flex">
                <span className="text-[10px] text-neutral-400">Opacity:</span>
                <input
                  type="range"
                  min="0.30"
                  max="1.0"
                  step="0.05"
                  value={currentConfig.opacity}
                  onChange={e => onUpdateElementConfig(selectedElementId, { opacity: parseFloat(e.target.value) })}
                  className="w-14 accent-amber-500 cursor-pointer"
                />
                <span className="text-[10px] text-neutral-300 w-6 text-right">
                  {Math.round(currentConfig.opacity * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-0.5 bg-neutral-950 p-0.5 rounded border border-neutral-800">
                <button
                  type="button"
                  onClick={() => nudge(-5, 0)}
                  disabled={currentConfig.locked}
                  className="p-1 hover:text-amber-400 disabled:opacity-30"
                  title="Nudge Left 5px"
                >
                  <ArrowLeft className="w-3 h-3" />
                </button>
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => nudge(0, -5)}
                    disabled={currentConfig.locked}
                    className="p-0.5 hover:text-amber-400 disabled:opacity-30"
                    title="Nudge Up 5px"
                  >
                    <ArrowUp className="w-2.5 h-2.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => nudge(0, 5)}
                    disabled={currentConfig.locked}
                    className="p-0.5 hover:text-amber-400 disabled:opacity-30"
                    title="Nudge Down 5px"
                  >
                    <ArrowDown className="w-2.5 h-2.5" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => nudge(5, 0)}
                  disabled={currentConfig.locked}
                  className="p-1 hover:text-amber-400 disabled:opacity-30"
                  title="Nudge Right 5px"
                >
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => onResetElement(selectedElementId)}
                className="p-1 text-neutral-400 hover:text-amber-400"
                title="Reset Element to Default"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 rounded bg-neutral-900 border border-neutral-700 text-neutral-300 hover:text-white disabled:opacity-30 transition"
            title="Undo"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 rounded bg-neutral-900 border border-neutral-700 text-neutral-300 hover:text-white disabled:opacity-30 transition"
            title="Redo"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onTogglePreview}
            className={`px-2 py-1 rounded text-xs font-tactical font-semibold border transition ${
              isPreviewing
                ? 'bg-amber-600 text-neutral-950 border-amber-400 shadow'
                : 'bg-neutral-900 text-neutral-300 border-neutral-700 hover:text-white'
            }`}
            title="Toggle Clean Preview"
          >
            {isPreviewing ? 'Editing' : 'Preview'}
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Reset all elements in current profile to factory defaults?')) {
                onResetLayout();
              }
            }}
            className="px-2 py-1 rounded bg-neutral-900 text-neutral-400 hover:text-red-300 border border-neutral-700 text-xs font-tactical transition"
            title="Reset Layout to Default"
          >
            Reset
          </button>
          {onExport && (
            <button
              type="button"
              onClick={onExport}
              className="p-1.5 rounded bg-neutral-900 border border-neutral-700 text-neutral-300 hover:text-amber-400 transition"
              title="Export Layout to JSON"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          )}
          {onImport && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 rounded bg-neutral-900 border border-neutral-700 text-neutral-300 hover:text-amber-400 transition"
                title="Import Layout from JSON"
              >
                <Upload className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-tactical transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            className="flex items-center gap-1 px-3 py-1 rounded bg-amber-600 hover:bg-amber-500 text-neutral-950 font-tactical font-bold text-xs shadow-md shadow-amber-950/50 transition"
          >
            <Save className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Save & Apply</span>
          </button>
        </div>
      </div>

      <div className="px-3 py-1 bg-amber-950/50 border-t border-amber-500/30 flex items-center justify-between text-[10px] text-amber-300/90 font-mono">
        <span>Click any element to select it, drag to reposition, or pull the corner handle to resize.</span>
        <span>Offsets are saved persistently to browser storage.</span>
      </div>

      {newProfileModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm">
          <form
            onSubmit={handleCreateSubmit}
            className="w-full max-w-sm bg-neutral-900 border border-neutral-700 rounded-xl p-4 shadow-2xl flex flex-col gap-3"
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <span className="font-tactical font-bold text-sm text-white">Create New Layout Profile</span>
              <button
                type="button"
                onClick={() => setNewProfileModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-tactical text-neutral-400">Profile Name</label>
              <input
                type="text"
                value={newProfileName}
                onChange={e => setNewProfileName(e.target.value)}
                placeholder="e.g. Squad Leader HUD"
                className="bg-neutral-950 border border-neutral-700 rounded px-2.5 py-1.5 text-xs text-white focus:border-amber-500 outline-none"
                autoFocus
                required
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setNewProfileModalOpen(false)}
                className="px-3 py-1 rounded bg-neutral-800 text-neutral-300 text-xs font-tactical"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-500 text-neutral-950 font-tactical font-bold text-xs"
              >
                Create Profile
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
