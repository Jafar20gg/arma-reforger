import React, { useState } from 'react';
import { POI, POIType, TerrainId, Language } from '../types';
import { translations } from '../i18n/translations';
import { to6DigitGrid } from '../utils/coordinates';
import {
  MapPin,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Download,
  Upload,
  AlertTriangle,
  Compass,
} from 'lucide-react';

interface PoiEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  terrain: TerrainId;
  language: Language;
  pois: POI[];
  onAddPoi: (poi: Omit<POI, 'id'>) => void;
  onUpdatePoi: (id: string, updates: Partial<POI>) => void;
  onDeletePoi: (id: string) => void;
  onImportPois: (imported: POI[]) => void;
  autoNameDistMeters: number;
  onSetAutoNameDist: (meters: number) => void;
  prefillCoords?: { x: number; y: number } | null;
}

export const PoiEditorModal: React.FC<PoiEditorModalProps> = ({
  isOpen,
  onClose,
  terrain,
  language,
  pois,
  onAddPoi,
  onUpdatePoi,
  onDeletePoi,
  onImportPois,
  autoNameDistMeters,
  onSetAutoNameDist,
  prefillCoords,
}) => {
  const t = translations[language];

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formNameEn, setFormNameEn] = useState(prefillCoords ? `POI ${to6DigitGrid(prefillCoords.x, prefillCoords.y)}` : '');
  const [formNameAr, setFormNameAr] = useState('');
  const [formType, setFormType] = useState<POIType>('town');
  const [formX, setFormX] = useState<number>(prefillCoords?.x ?? 5000);
  const [formY, setFormY] = useState<number>(prefillCoords?.y ?? 5000);
  const [formNotes, setFormNotes] = useState('');
  const [isAddingNew, setIsAddingNew] = useState<boolean>(!!prefillCoords);

  if (!isOpen) return null;

  const currentTerrainPois = pois.filter((p) => p.terrain === terrain);

  const startEdit = (poi: POI) => {
    setEditingId(poi.id);
    setFormNameEn(poi.name);
    setFormNameAr(poi.nameAr || '');
    setFormType(poi.type);
    setFormX(poi.x);
    setFormY(poi.y);
    setFormNotes(poi.notes || '');
    setIsAddingNew(false);
  };

  const handleSaveForm = () => {
    if (!formNameEn.trim()) {
      alert('يرجى إدخال اسم المكان بالإنجليزية.');
      return;
    }

    if (editingId) {
      onUpdatePoi(editingId, {
        name: formNameEn.trim(),
        nameAr: formNameAr.trim() || undefined,
        type: formType,
        x: formX,
        y: formY,
        notes: formNotes.trim() || undefined,
        isVerified: true,
      });
      setEditingId(null);
    } else {
      onAddPoi({
        terrain,
        name: formNameEn.trim(),
        nameAr: formNameAr.trim() || undefined,
        type: formType,
        x: formX,
        y: formY,
        notes: formNotes.trim() || undefined,
        isVerified: true,
      });
      setIsAddingNew(false);
    }

    // Reset form
    setFormNameEn('');
    setFormNameAr('');
    setFormNotes('');
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentTerrainPois, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `reforger-pois-${terrain}-${Date.now()}.json`);
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
        if (Array.isArray(parsed)) {
          onImportPois(parsed);
          alert(t.poisImported);
        } else {
          alert('تنسيق ملف JSON غير صالح للأماكن.');
        }
      } catch {
        alert('تعذر قراءة ملف JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <MapPin className="w-5 h-5 text-red-400" />
            <div>
              <h3 className="text-base font-bold text-slate-100">{t.places}</h3>
              <p className="text-xs text-slate-400 capitalize">
                {terrain} • {currentTerrainPois.length} مكان
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

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Config: Nearest Place Auto-name distance */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div>
              <span className="text-xs font-semibold text-slate-200 block">{t.nearestPlaceDist}</span>
              <span className="text-[11px] text-slate-400">
                تسمية الهدف تلقائياً إذا كان ضمن هذه المسافة من أقرب معلم
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono">
              <input
                type="number"
                min="50"
                max="2000"
                step="50"
                value={autoNameDistMeters}
                onChange={(e) => onSetAutoNameDist(Number(e.target.value) || 500)}
                className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-center text-cyan-300"
              />
              <span className="text-xs text-slate-400">متر</span>
            </div>
          </div>

          {/* Add / Edit Form */}
          {(isAddingNew || editingId) ? (
            <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/40 space-y-3">
              <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center justify-between">
                <span>{editingId ? t.editPlace : t.addPlace}</span>
                <span className="text-slate-400 font-mono">
                  ({formX}m, {formY}m) • {to6DigitGrid(formX, formY)}
                </span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">{t.placeNameEn}</label>
                  <input
                    type="text"
                    value={formNameEn}
                    onChange={(e) => setFormNameEn(e.target.value)}
                    placeholder="e.g. Morton, Saint Philippe"
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">{t.placeNameAr}</label>
                  <input
                    type="text"
                    value={formNameAr}
                    onChange={(e) => setFormNameAr(e.target.value)}
                    placeholder="مثال: مورتون"
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">{t.placeType}</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as POIType)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="town">{t.town}</option>
                    <option value="military">{t.militaryBase}</option>
                    <option value="hill">{t.hillPeak}</option>
                    <option value="port">{t.port}</option>
                    <option value="airfield">{t.airfield}</option>
                    <option value="checkpoint">{t.checkpoint}</option>
                    <option value="other">{t.otherPlace}</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">X (شرقاً بالمتر)</label>
                  <input
                    type="number"
                    value={formX}
                    onChange={(e) => setFormX(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-cyan-300 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">Y (شمالاً بالمتر)</label>
                  <input
                    type="number"
                    value={formY}
                    onChange={(e) => setFormY(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-cyan-300 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => {
                    setEditingId(null);
                    setIsAddingNew(false);
                  }}
                  className="px-3 py-1.5 rounded bg-slate-800 text-slate-400 text-xs"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={handleSaveForm}
                  className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{t.save}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">قائمة الأماكن المحفوظة</span>
              <button
                onClick={() => {
                  setEditingId(null);
                  setIsAddingNew(true);
                  setFormNameEn('');
                  setFormNameAr('');
                  setFormX(6000);
                  setFormY(6000);
                }}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.addPlace}</span>
              </button>
            </div>
          )}

          {/* Places List */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {currentTerrainPois.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                لا توجد أماكن مسجلة لهذا التضاريس. أضف أماكن بالضغط المطول على الخريطة أو استورد ملف JSON.
              </div>
            ) : (
              currentTerrainPois.map((p) => (
                <div
                  key={p.id}
                  className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-200">{p.name}</span>
                      {p.nameAr && (
                        <span className="text-[11px] text-slate-400 font-sans">({p.nameAr})</span>
                      )}
                      {!p.isVerified && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-950/80 border border-amber-800/80 text-[10px] text-amber-400">
                          {t.unverifiedSample}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                      <span className="text-cyan-400">GRID: {to6DigitGrid(p.x, p.y)}</span>
                      <span>•</span>
                      <span>X: {p.x}m, Y: {p.y}m</span>
                      <span>•</span>
                      <span className="uppercase text-slate-500">{p.type}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => startEdit(p)}
                      className="p-1.5 text-slate-400 hover:text-cyan-400 rounded hover:bg-slate-800 transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeletePoi(p.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Import / Export JSON */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
            <button
              onClick={handleExportJson}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>{t.exportPois}</span>
            </button>

            <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition">
              <Upload className="w-3.5 h-3.5 text-slate-400" />
              <span>{t.importPois}</span>
              <input
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={handleImportJson}
              />
            </label>
          </div>
        </div>

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
