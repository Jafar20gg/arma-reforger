import React, { useState, useEffect } from 'react';
import { TerrainId, TerrainConfig, Language } from '../types';
import { translations } from '../i18n/translations';
import { Settings, X, Check, Maximize2, ExternalLink, RotateCcw, Link2 } from 'lucide-react';
import {
  getTacOpsSettings,
  saveTacOpsSettings,
  resetTacOpsSettings,
  buildTacOpsUrl,
  DEFAULT_TACOPS_BASE,
  DEFAULT_TACOPS_PARAMS,
} from '../utils/externalMaps';

interface TerrainSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  terrainId: TerrainId;
  terrainConfigs: Record<TerrainId, TerrainConfig>;
  language: Language;
  onSaveTerrainSize: (terrainId: TerrainId, sizeMeters: number) => void;
  isInitialKolguyevPrompt?: boolean;
}

export const TerrainSettingsModal: React.FC<TerrainSettingsModalProps> = ({
  isOpen,
  onClose,
  terrainId,
  terrainConfigs,
  language,
  onSaveTerrainSize,
  isInitialKolguyevPrompt = false,
}) => {
  const t = translations[language];
  const currentConfig = terrainConfigs[terrainId];

  const [inputSize, setInputSize] = useState<number>(
    currentConfig.sizeMeters > 0 ? currentConfig.sizeMeters : 12800
  );

  // TacOps editable link template & parameter template
  const [tacopsBase, setTacopsBase] = useState<string>(DEFAULT_TACOPS_BASE);
  const [tacopsParams, setTacopsParams] = useState<string>(DEFAULT_TACOPS_PARAMS);

  useEffect(() => {
    if (isOpen) {
      setInputSize(currentConfig.sizeMeters > 0 ? currentConfig.sizeMeters : 12800);
      const settings = getTacOpsSettings();
      setTacopsBase(settings.baseTemplate);
      setTacopsParams(settings.paramTemplate);
    }
  }, [isOpen, currentConfig.sizeMeters]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputSize <= 0 || isNaN(inputSize)) {
      alert('يرجى إدخال حجم صالح للخريطة بالمتر (أكبر من 0).');
      return;
    }
    // Save terrain size
    onSaveTerrainSize(terrainId, inputSize);

    // Save TacOps settings
    saveTacOpsSettings({
      baseTemplate: tacopsBase,
      paramTemplate: tacopsParams,
    });

    onClose();
  };

  const handlePreset = (size: number) => {
    setInputSize(size);
  };

  const handleTestTacOps = () => {
    // Generate test URL using current field values
    let url = tacopsBase.replace(/{terrain}/g, terrainId.toLowerCase());
    if (tacopsParams) {
      const p = tacopsParams
        .replace(/{terrain}/g, terrainId.toLowerCase())
        .replace(/{zoom}/g, '3')
        .replace(/{x}/g, String(Math.round(inputSize / 2)))
        .replace(/{y}/g, String(Math.round(inputSize / 2)));
      if (!url.includes('?') && p.startsWith('?')) {
        url += p;
      } else if (url.includes('?') && p.startsWith('?')) {
        url += '&' + p.substring(1);
      } else {
        url += p;
      }
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleResetTacOps = () => {
    const res = resetTacOpsSettings();
    setTacopsBase(res.baseTemplate);
    setTacopsParams(res.paramTemplate);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Maximize2 className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-base font-bold text-slate-100">
                {isInitialKolguyevPrompt
                  ? language === 'ar'
                    ? 'إعداد أبعاد خريطة كولغوييف'
                    : 'Configure Kolguyev Map Dimensions'
                  : language === 'ar'
                  ? 'أبعاد التضاريس وإعدادات الخرائط'
                  : 'Terrain Dimensions & Map Settings'}
              </h3>
              <p className="text-xs text-slate-400 capitalize">
                {currentConfig.name}
              </p>
            </div>
          </div>
          {!isInitialKolguyevPrompt && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-5 space-y-4 text-xs overflow-y-auto">
          {isInitialKolguyevPrompt ? (
            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 leading-relaxed">
              {language === 'ar'
                ? 'خريطة كولغوييف (Kolguyev) تضاريس مخصصة غير ثابتة الأبعاد افتراضياً. يرجى إدخال طول ضلع الخريطة بالمتر قبل تحميلها:'
                : 'Kolguyev is a community custom terrain with non-standard dimensions. Please enter the world size in meters before loading:'}
            </div>
          ) : (
            <p className="text-slate-300 leading-relaxed">
              {language === 'ar'
                ? 'يمكنك تعديل أبعاد الخريطة بالمتر لتطابق مود التضاريس الخاص بك (إيفرون 12,800م، كولغوييف 12,800م، أرلاند 4,000م):'
                : 'Customize the map world size in meters (Everon 12,800m, Kolguyev 12,800m, Arland 4,000m):'}
            </p>
          )}

          {/* Input field */}
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <label className="text-xs font-bold text-slate-200 block">
              {language === 'ar' ? 'طول ضلع الخريطة بالمتر (مربع X × Y)' : 'World Size in Meters (Square X × Y)'}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="500"
                max="65536"
                step="100"
                value={inputSize}
                onChange={(e) => setInputSize(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                dir="ltr"
                required
              />
              <span className="text-slate-400 font-mono font-bold">m</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono" dir="ltr">
              = {(inputSize / 1000).toFixed(2)} km × {(inputSize / 1000).toFixed(2)} km
            </div>
          </div>

          {/* Quick presets */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-slate-400 block font-semibold">
              {language === 'ar' ? 'أبعاد شائعة وسريعة:' : 'Common Presets:'}
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handlePreset(12800)}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono"
              >
                12,800m (Everon / Kolguyev)
              </button>
              <button
                type="button"
                onClick={() => handlePreset(4000)}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono"
              >
                4,000m (Arland)
              </button>
              <button
                type="button"
                onClick={() => handlePreset(10240)}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono"
              >
                10,240m
              </button>
              <button
                type="button"
                onClick={() => handlePreset(8192)}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono"
              >
                8,192m
              </button>
            </div>
          </div>

          {/* Section: TacOps Link Template Configuration */}
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-3 pt-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-slate-200 text-xs">
                  {language === 'ar' ? 'قالب رابط أداة TacOps التفاعلية' : 'TacOps Interactive Link Template'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleResetTacOps}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                title="Reset to default"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{language === 'ar' ? 'استعادة' : 'Reset'}</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              {language === 'ar'
                ? 'يمكنك تعديل قالب الرابط والمعاملات التجريبية (مثل ?v={zoom}/{x}/{y}) وتجربتها لأن دلالة معاملات TacOps غير موثقة رسمياً.'
                : 'Configure the link template and test parameter string (?v={zoom}/{x}/{y}) for TacOps external map.'}
            </p>

            <div>
              <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                {language === 'ar' ? 'قالب الرابط الأساسي (Base Template):' : 'Base URL Template:'}
              </label>
              <input
                type="text"
                value={tacopsBase}
                onChange={(e) => setTacopsBase(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                dir="ltr"
                placeholder="https://app.tacops.gg/m/{terrain}"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                {language === 'ar' ? 'قالب المعاملات (Parameter Template):' : 'Parameter Template:'}
              </label>
              <input
                type="text"
                value={tacopsParams}
                onChange={(e) => setTacopsParams(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                dir="ltr"
                placeholder="?v={zoom}/{x}/{y}"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleTestTacOps}
                className="px-3 py-1.5 rounded-lg bg-emerald-950 border border-emerald-500/40 hover:bg-emerald-900 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'اختبار الرابط' : 'Test TacOps Link'}</span>
              </button>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            {!isInitialKolguyevPrompt && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                {t.cancel}
              </button>
            )}
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-950"
            >
              <Check className="w-4 h-4" />
              <span>{t.save}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
