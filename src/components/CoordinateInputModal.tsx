import React, { useState, useEffect } from 'react';
import { Crosshair, MapPin, X, Check } from 'lucide-react';
import { MapDefinition, WorldPoint, Language } from '../types/mortar';
import { formatGrid, parseGrid, clampToMapBounds } from '../utils/coordinates';
import { getTranslation } from '../utils/i18n';

interface CoordinateInputModalProps {
  isOpen: boolean;
  type: 'mortar' | 'target';
  currentPoint: WorldPoint;
  mapDef: MapDefinition;
  lang: Language;
  onClose: () => void;
  onApply: (point: WorldPoint) => void;
}

export const CoordinateInputModal: React.FC<CoordinateInputModalProps> = ({
  isOpen,
  type,
  currentPoint,
  mapDef,
  lang,
  onClose,
  onApply,
}) => {
  const t = getTranslation(lang);
  const [xVal, setXVal] = useState(String(currentPoint.xMeters));
  const [yVal, setYVal] = useState(String(currentPoint.yMeters));
  const [altVal, setAltVal] = useState(String(currentPoint.altitudeMeters ?? 0));
  const [gridVal, setGridVal] = useState(formatGrid(currentPoint, 8));
  const [inputMode, setInputMode] = useState<'xy' | 'grid'>('xy');
  const [parseError, setParseError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setXVal(String(currentPoint.xMeters));
      setYVal(String(currentPoint.yMeters));
      setAltVal(String(currentPoint.altitudeMeters ?? 0));
      setGridVal(formatGrid(currentPoint, 8));
      setParseError('');
    }
  }, [isOpen, currentPoint]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setParseError('');
    if (inputMode === 'grid') {
      const parsed = parseGrid(gridVal, mapDef);
      if (!parsed) {
        setParseError(lang === 'ar' ? 'صيغة الإحداثية الشبكية غير صحيحة. استخدم 6 أو 8 أرقام (مثال: 0472 0825).' : 'Invalid military grid format. Use 6 or 8 digits (e.g. "0472 0825").');
        return;
      }
      onApply({
        ...parsed,
        altitudeMeters: parseFloat(altVal) || 0,
      });
      onClose();
      return;
    }
    const x = parseFloat(xVal);
    const y = parseFloat(yVal);
    const alt = parseFloat(altVal) || 0;
    if (isNaN(x) || isNaN(y)) {
      setParseError(lang === 'ar' ? 'يرجى إدخال أرقام صحيحة بالمتر.' : 'Please enter valid numeric meter coordinates.');
      return;
    }
    const clamped = clampToMapBounds({ xMeters: Math.round(x), yMeters: Math.round(y), altitudeMeters: alt }, mapDef);
    onApply(clamped);
    onClose();
  };

  const isMortar = type === 'mortar';

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            {isMortar ? (
              <Crosshair className="w-5 h-5 text-red-500" />
            ) : (
              <MapPin className="w-5 h-5 text-blue-500" />
            )}
            <h3 className="font-tactical text-base font-bold uppercase tracking-wider text-neutral-100">
              {isMortar ? t.mortarPos : t.targetPos} – {t.manualCoordEntry}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 bg-neutral-950 p-1 rounded-lg border border-neutral-800 font-tactical text-xs">
          <button
            type="button"
            onClick={() => setInputMode('xy')}
            className={`py-1.5 rounded transition ${
              inputMode === 'xy'
                ? 'bg-amber-600 text-white font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            {lang === 'ar' ? 'أمتار (X / Y)' : 'Meters (X / Y)'}
          </button>
          <button
            type="button"
            onClick={() => setInputMode('grid')}
            className={`py-1.5 rounded transition ${
              inputMode === 'grid'
                ? 'bg-amber-600 text-white font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            {lang === 'ar' ? 'شبكة عسكرية (Grid)' : 'Military Grid'}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {inputMode === 'xy' ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-mono text-neutral-400">
                  {t.xCoord} (m)
                </label>
                <input
                  type="number"
                  value={xVal}
                  onChange={e => setXVal(e.target.value)}
                  className="bg-neutral-950 border border-neutral-700 rounded p-2 text-sm font-mono text-neutral-100 focus:border-amber-500 outline-none"
                  placeholder="e.g. 4725"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-mono text-neutral-400">
                  {t.yCoord} (m)
                </label>
                <input
                  type="number"
                  value={yVal}
                  onChange={e => setYVal(e.target.value)}
                  className="bg-neutral-950 border border-neutral-700 rounded p-2 text-sm font-mono text-neutral-100 focus:border-amber-500 outline-none"
                  placeholder="e.g. 8250"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-mono text-neutral-400">
                {t.grid} (6 or 8 digits)
              </label>
              <input
                type="text"
                value={gridVal}
                onChange={e => setGridVal(e.target.value)}
                className="bg-neutral-950 border border-neutral-700 rounded p-2 text-sm font-mono text-neutral-100 focus:border-amber-500 outline-none"
                placeholder="0472 0825"
              />
              <span className="text-[10px] text-neutral-500 font-mono">
                {lang === 'ar' ? 'الصيغة: 6 أرقام (دقة 100م) أو 8 أرقام (دقة 10م)' : 'Format: 3+3 digits (100m) or 4+4 digits (10m)'}
              </span>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-xs font-mono text-neutral-400">
              {lang === 'ar' ? 'الارتفاع فوق مستوى البحر (متر)' : 'Altitude (m ASL)'}
            </label>
            <input
              type="number"
              value={altVal}
              onChange={e => setAltVal(e.target.value)}
              className="bg-neutral-950 border border-neutral-700 rounded p-2 text-sm font-mono text-neutral-100 focus:border-amber-500 outline-none"
              placeholder="0"
            />
          </div>

          <div className="text-[11px] font-mono text-neutral-400 bg-neutral-950 p-2 rounded border border-neutral-800">
            {lang === 'ar' ? `حدود الخريطة: 0 - ${mapDef.worldBounds.maxX}م (X)، 0 - ${mapDef.worldBounds.maxY}م (Y)` : `Map bounds: 0 - ${mapDef.worldBounds.maxX}m (X), 0 - ${mapDef.worldBounds.maxY}m (Y)`}
          </div>

          {parseError && (
            <div className="text-xs font-mono text-red-400 bg-red-950/50 border border-red-800 p-2 rounded">
              {parseError}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 mt-2 pt-3 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded text-xs font-tactical font-semibold text-neutral-400 hover:text-white transition"
            >
              {t.close}
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded text-xs font-tactical font-bold bg-amber-600 hover:bg-amber-500 text-white transition shadow-lg"
            >
              <Check className="w-4 h-4" />
              <span>{t.updatePos}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
