import React, { useState } from 'react';
import { Language, SavedSession, MortarState, Target, TerrainId } from '../types';
import { translations } from '../i18n/translations';
import {
  getSavedSessions,
  saveSession,
  deleteSession,
  encodeMissionToHash,
} from '../utils/storage';
import {
  Save,
  Share2,
  Trash2,
  FolderOpen,
  X,
  Check,
  Download,
  Upload,
  Link,
  Clock,
  MapPin,
} from 'lucide-react';

interface SessionManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  currentTerrain: TerrainId;
  currentMortar: MortarState;
  currentTargets: Target[];
  selectedTargetId: string | null;
  onLoadSession: (session: SavedSession) => void;
}

export const SessionManagerModal: React.FC<SessionManagerModalProps> = ({
  isOpen,
  onClose,
  language,
  currentTerrain,
  currentMortar,
  currentTargets,
  selectedTargetId,
  onLoadSession,
}) => {
  const t = translations[language];
  const [sessions, setSessions] = useState<SavedSession[]>(() => getSavedSessions());
  const [newSessionName, setNewSessionName] = useState('');
  const [shareCopied, setShareCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleSaveCurrent = () => {
    const name = newSessionName.trim() || `Mission ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const session: SavedSession = {
      id: `session-${Date.now()}`,
      name,
      terrain: currentTerrain,
      mortar: currentMortar,
      targets: currentTargets,
      selectedTargetId,
      updatedAt: Date.now(),
    };

    saveSession(session);
    setSessions(getSavedSessions());
    setNewSessionName('');
    showToast(t.sessionLoaded);
  };

  const handleDelete = (id: string) => {
    deleteSession(id);
    setSessions(getSavedSessions());
  };

  const handleCopyShareLink = () => {
    const hash = encodeMissionToHash(
      currentTerrain,
      currentMortar,
      currentTargets,
      selectedTargetId
    );
    const fullUrl = `${window.location.origin}${window.location.pathname}${hash}`;

    navigator.clipboard.writeText(fullUrl).then(() => {
      setShareCopied(true);
      showToast(t.shareLinkCopied);
      setTimeout(() => setShareCopied(false), 2000);
    });
  };

  const handleExportJson = () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      terrain: currentTerrain,
      mortar: currentMortar,
      targets: currentTargets,
      selectedTargetId,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `mortar-session-${currentTerrain}-${Date.now()}.json`);
    document.body.appendChild(dl);
    dl.click();
    dl.remove();
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.mortar && Array.isArray(parsed.targets)) {
          const session: SavedSession = {
            id: `imported-${Date.now()}`,
            name: `Imported (${parsed.terrain || currentTerrain})`,
            terrain: parsed.terrain || currentTerrain,
            mortar: parsed.mortar,
            targets: parsed.targets,
            selectedTargetId: parsed.selectedTargetId || (parsed.targets[0]?.id ?? null),
            updatedAt: Date.now(),
          };
          onLoadSession(session);
          showToast(t.sessionLoaded);
          onClose();
        } else {
          alert('Invalid session JSON schema');
        }
      } catch {
        alert('Failed to parse JSON file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FolderOpen className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-slate-100">{t.sessions}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[80vh]">
          {/* Toast */}
          {toastMessage && (
            <div className="p-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Quick Share Link Section */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>{t.shareLink}</span>
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Encodes terrain, mortar and all {currentTargets.length} targets into URL hash
              </p>
            </div>
            <button
              onClick={handleCopyShareLink}
              className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-cyan-950 transition active:scale-95 shrink-0"
            >
              {shareCopied ? <Check className="w-3.5 h-3.5" /> : <Link className="w-3.5 h-3.5" />}
              <span>{shareCopied ? t.shareLinkCopied : t.shareLink}</span>
            </button>
          </div>

          {/* Save Current Session Form */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <label className="text-xs font-bold text-slate-200 block">{t.saveSession}</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={t.sessionName}
                value={newSessionName}
                onChange={(e) => setNewSessionName(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={handleSaveCurrent}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950 transition"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{t.save}</span>
              </button>
            </div>
          </div>

          {/* Saved Sessions List */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              {t.savedSessions} ({sessions.length})
            </h4>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {sessions.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                  {t.noSavedSessions}
                </div>
              ) : (
                sessions.map((sess) => (
                  <div
                    key={sess.id}
                    className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/80 hover:border-slate-700 flex items-center justify-between gap-3 transition"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-200 truncate">{sess.name}</span>
                        <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-cyan-400 font-mono uppercase">
                          {sess.terrain}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-0.5 font-mono">
                        <span>{sess.targets.length} targets</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {new Date(sess.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => {
                          onLoadSession(sess);
                          showToast(t.sessionLoaded);
                          onClose();
                        }}
                        className="px-2.5 py-1 rounded bg-cyan-950/50 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 text-xs font-medium transition"
                      >
                        {t.loadSession}
                      </button>
                      <button
                        onClick={() => handleDelete(sess.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded transition"
                        title={t.delete}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* JSON Export / Import toolbar */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
            <button
              onClick={handleExportJson}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>{t.exportSessionJson}</span>
            </button>

            <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition">
              <Upload className="w-3.5 h-3.5 text-slate-400" />
              <span>{t.importSessionJson}</span>
              <input
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={handleImportJson}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
