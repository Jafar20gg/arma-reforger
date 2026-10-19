import React, { useState } from 'react';
import { X, Check, RefreshCw, Copy, CheckCircle2, ShieldCheck, Edit3 } from 'lucide-react';
import { MapDefinition, MapPOI, Language } from '../types/mortar';
import { formatGrid } from '../utils/coordinates';
import { getTranslation } from '../utils/i18n';

interface LandmarkEditModalProps {
  isOpen: boolean;
  poi: MapPOI | null;
  mapDef: MapDefinition;
  lang: Language;
  onClose: () => void;
  onSaveOverride: (id: string, coords: { xMeters: number; yMeters: number; altitudeMeters: number }) => void;
  onResetOverride: (id: string) => void;
}

export const LandmarkEditModal: React.FC<LandmarkEditModalProps> = ({
  isOpen,
  poi,
  mapDef,
  lang,
  onClose,
  onSaveOverride,
  onResetOverride,
}) => {
  const t = getTranslation(lang);
  if (!isOpen || !poi) return null;

  const [xVal, setXVal] = useState<string>(String(poi.xMeters));
  const [yVal, setYVal] = useState<string>(String(poi.yMeters));
  const [altVal, setAltVal] = useState<string>(String(poi.altitudeMeters));
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const displayName = lang === 'ar' ? (poi.nameAr || poi.name) : poi.name;

  const handleCopy = () => {
    const text = `${displayName} - Grid: ${formatGrid(poi, 8)} | X: ${poi.xMeters}m, Y: ${poi.yMeters}m, Alt: ${poi.altitudeMeters}m`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const x = parseFloat(xVal);
    const y = parseFloat(yVal);
    const alt = parseFloat(altVal);

    if (isNaN(x) || isNaN(y) || isNaN(alt)) {
      setErrorMsg(lang === 'ar' ? 'يرجى إدخال قيم عددية صحيحة' : 'Please enter valid numeric coordinates');
      return;
    }

    if (
      x < mapDef.worldBounds.minX ||
      x > mapDef.worldBounds.maxX ||
      y < mapDef.worldBounds.minY ||
      y > mapDef.worldBounds.maxY
    ) {
      setErrorMsg(lang === 'ar' ? `يجب أن تكون الإحداثيات ضمن حدود الخريطة (0 - ${mapDef.worldBounds.maxX}م)` : `Coordinates must be within map bounds (0 - ${mapDef.worldBounds.maxX}m)`);
      return;
    }

    onSaveOverride(poi.id, {
      xMeters: Math.round(x),
      yMeters: Math.round(y),
      altitudeMeters: Math.round(alt),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-700/80 rounded-xl shadow-2xl overflow-hidden flex flex-col font-mono text-xs">
        <div className="px-4 py-3 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-amber-500" />
            <h3 className="font-tactical text-sm font-bold uppercase tracking-wider text-neutral-100">
              {t.editCoordinates}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-4 flex flex-col gap-3">
          <div className="flex flex-col gap-1 p-2.5 rounded bg-neutral-950 border border-neutral-800">
            <div className="flex items-center justify-between">
              <span className="font-tactical text-sm font-bold text-white">{displayName}</span>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 text-[10px] text-amber-400 hover:text-amber-300 transition"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? t.coordsCopied : t.copyCoords}</span>
              </button>
            </div>
            <div className="flex items-center gap-2 text-[10px] pt-1">
              {poi.isUserCustomized ? (
                <span className="px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-400 border border-amber-500/50 font-tactical font-semibold flex items-center gap-1">
                  <Edit3 className="w-3 h-3" />
                  {t.userCustomized}
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-500/50 font-tactical font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  {t.verifiedCoordinate}
                </span>
              )}
              <span className="text-neutral-500">|</span>
              <span className="text-neutral-400 font-mono">Grid: {formatGrid(poi, 8)}</span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-2 rounded bg-red-950/80 border border-red-500/80 text-red-300 text-[11px]">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-tactical uppercase font-bold text-neutral-400">
                {t.xCoord} (m)
              </label>
              <input
                type="number"
                value={xVal}
                onChange={e => setXVal(e.target.value)}
                min={mapDef.worldBounds.minX}
                max={mapDef.worldBounds.maxX}
                step="1"
                required
                className="bg-neutral-950 border border-neutral-700 rounded px-2.5 py-1.5 text-neutral-100 font-mono focus:border-amber-500 outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-tactical uppercase font-bold text-neutral-400">
                {t.yCoord} (m)
              </label>
              <input
                type="number"
                value={yVal}
                onChange={e => setYVal(e.target.value)}
                min={mapDef.worldBounds.minY}
                max={mapDef.worldBounds.maxY}
                step="1"
                required
                className="bg-neutral-950 border border-neutral-700 rounded px-2.5 py-1.5 text-neutral-100 font-mono focus:border-amber-500 outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-tactical uppercase font-bold text-neutral-400">
              {t.altTarget} / {lang === 'ar' ? 'الارتفاع (متر)' : 'Elevation (m)'}
            </label>
            <input
              type="number"
              value={altVal}
              onChange={e => setAltVal(e.target.value)}
              min="-50"
              max="2000"
              step="1"
              required
              className="bg-neutral-950 border border-neutral-700 rounded px-2.5 py-1.5 text-neutral-100 font-mono focus:border-amber-500 outline-none"
            />
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-neutral-800">
            {poi.isUserCustomized ? (
              <button
                type="button"
                onClick={() => {
                  onResetOverride(poi.id);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-tactical text-xs transition"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                <span>{t.resetToVerified}</span>
              </button>
            ) : <span />}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-tactical text-xs transition"
              >
                {t.close}
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-neutral-950 font-tactical font-bold text-xs shadow transition"
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{t.saveCoordinates}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
