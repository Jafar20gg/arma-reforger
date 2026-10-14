/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TerrainId, Language } from '../types';
import {
  ExternalLink,
  X,
  Compass,
  Layers,
  Settings,
  Check,
  RotateCcw,
  Info,
  ShieldAlert,
} from 'lucide-react';
import {
  getTacOpsSettings,
  saveTacOpsSettings,
  resetTacOpsSettings,
  buildTacOpsUrl,
  buildRecoilUrl,
  DEFAULT_TACOPS_BASE,
  DEFAULT_TACOPS_PARAMS,
} from '../utils/externalMaps';

interface ExternalMapsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTerrain: TerrainId;
  language: Language;
}

export const ExternalMapsModal: React.FC<ExternalMapsModalProps> = ({
  isOpen,
  onClose,
  currentTerrain,
  language,
}) => {
  const [selectedTerrain, setSelectedTerrain] = useState<TerrainId>(currentTerrain);
  const [baseTemplate, setBaseTemplate] = useState<string>(DEFAULT_TACOPS_BASE);
  const [paramTemplate, setParamTemplate] = useState<string>(DEFAULT_TACOPS_PARAMS);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    setSelectedTerrain(currentTerrain);
  }, [currentTerrain]);

  useEffect(() => {
    if (isOpen) {
      const settings = getTacOpsSettings();
      setBaseTemplate(settings.baseTemplate);
      setParamTemplate(settings.paramTemplate);
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentTacOpsUrl = buildTacOpsUrl(selectedTerrain, 3, 6400, 6400);
  const currentRecoilUrl = buildRecoilUrl(selectedTerrain);

  const handleSaveSettings = () => {
    saveTacOpsSettings({
      baseTemplate,
      paramTemplate,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleResetSettings = () => {
    const res = resetTacOpsSettings();
    setBaseTemplate(res.baseTemplate);
    setParamTemplate(res.paramTemplate);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleTestTacOpsLink = () => {
    window.open(currentTacOpsUrl, '_blank', 'noopener,noreferrer');
  };

  const handleOpenRecoilLink = () => {
    window.open(currentRecoilUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Compass className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-base font-bold text-slate-100">
                {language === 'ar' ? 'خرائط وأدوات خارجية' : 'External Maps & Tools'}
              </h3>
              <p className="text-xs text-slate-400">
                {language === 'ar'
                  ? 'روابط مباشرة لخرائط Arma Reforger التفاعلية'
                  : 'Direct links to interactive Arma Reforger tactical maps'}
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
        <div className="p-5 space-y-4 overflow-y-auto text-xs">
          {/* Independence / Credits Notice */}
          <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/30 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="text-amber-200 font-bold text-xs">
                {language === 'ar'
                  ? 'موقعان مستقلان وغير تابعين لهذا المشروع'
                  : 'Two independent websites not affiliated with this project'}
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                {language === 'ar'
                  ? 'يتم فتح هذه المواقع في نوافذ جديدة مستقلة (New Tab) لتمكين التخطيط الخارجي والاستفادة من قواعد بيانات المواقع والمركبات مع الحفاظ على خصوصيتك وعدم سحب بياناتهم.'
                  : 'These external sites open in a new tab for operational planning and POI lookups, without hotlinking or data scraping.'}
              </p>
            </div>
          </div>

          {/* Terrain Selector for External Tools */}
          <div className="flex items-center justify-between bg-slate-950 p-2 rounded-xl border border-slate-800">
            <span className="text-slate-300 font-semibold text-xs px-2">
              {language === 'ar' ? 'التضاريس المختارة:' : 'Selected Terrain:'}
            </span>
            <div className="flex gap-1">
              {(['everon', 'arland', 'kolguyev'] as TerrainId[]).map((tId) => (
                <button
                  key={tId}
                  onClick={() => setSelectedTerrain(tId)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition ${
                    selectedTerrain === tId
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  {tId}
                </button>
              ))}
            </div>
          </div>

          {/* External Map Tool 1: TacOps */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-950/70 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
                  TO
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-200">TacOps Map</h4>
                  <p className="text-[11px] text-slate-400">app.tacops.gg/m/{selectedTerrain}</p>
                </div>
              </div>
              <a
                href={currentTacOpsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow transition"
              >
                <span>{language === 'ar' ? 'افتح في TacOps' : 'Open in TacOps'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {language === 'ar'
                ? 'أداة تخطيط عمليات تكتيكية تفاعلية متقدمة خاصة بمجتمع ريفورجر.'
                : 'Advanced tactical operation planning tool for Arma Reforger.'}
            </p>
          </div>

          {/* External Map Tool 2: Recoil */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-cyan-950/70 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-xs">
                  RC
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-200">Recoil Map</h4>
                  <p className="text-[11px] text-slate-400">reforger.recoil.org/{selectedTerrain}</p>
                </div>
              </div>
              <a
                href={currentRecoilUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow transition"
              >
                <span>{language === 'ar' ? 'افتح في Recoil' : 'Open in Recoil'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {language === 'ar'
                ? 'خريطة تفاعلية ممتازة من تطوير Nick Ludlam توضح المركبات والإمدادات وقواعد اللعبة.'
                : 'Interactive reference map by Nick Ludlam showing supplies, vehicles, and bases.'}
            </p>
          </div>

          {/* TacOps Link Template Settings Toggle */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1.5 transition"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>
                {language === 'ar'
                  ? showSettings
                    ? 'إخفاء إعدادات قالب رابط TacOps'
                    : 'تعديل قالب رابط TacOps المتقدم (Settings)'
                  : showSettings
                  ? 'Hide TacOps link template settings'
                  : 'Customize TacOps link template'}
              </span>
            </button>
          </div>

          {showSettings && (
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                <Settings className="w-3.5 h-3.5" />
                <span>
                  {language === 'ar'
                    ? 'قالب رابط TacOps والمعاملات التجريبية'
                    : 'TacOps URL & Parameter Template'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {language === 'ar'
                  ? 'يمكنك تعديل قالب الرابط والمعاملات التجريبية (مثل ?v={zoom}/{x}/{y}) وتجربتها، نظراً لأن دلالة معاملات رابط TacOps غير موثقة رسمياً.'
                  : 'Customize the base template and parameter string. Meanings of parameters are undocumented by TacOps, so you can test adjustments here.'}
              </p>

              <div>
                <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                  {language === 'ar' ? 'قالب الرابط الأساسي (Base URL):' : 'Base URL Template:'}
                </label>
                <input
                  type="text"
                  value={baseTemplate}
                  onChange={(e) => setBaseTemplate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                  dir="ltr"
                  placeholder="https://app.tacops.gg/m/{terrain}"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                  {language === 'ar'
                    ? 'معاملات الرابط الاختيارية (Parameters Template):'
                    : 'Optional Parameter Template:'}
                </label>
                <input
                  type="text"
                  value={paramTemplate}
                  onChange={(e) => setParamTemplate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                  dir="ltr"
                  placeholder="?v={zoom}/{x}/{y}"
                />
                <div className="text-[10px] text-slate-500 mt-1 font-mono" dir="ltr">
                  Tags: {'{terrain}'}, {'{zoom}'}, {'{x}'}, {'{y}'}
                </div>
              </div>

              {/* URL Preview */}
              <div className="p-2 rounded bg-slate-900/90 border border-slate-800 text-[11px] font-mono break-all text-slate-300" dir="ltr">
                <span className="text-slate-500 text-[10px] block">Preview:</span>
                {currentTacOpsUrl}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleTestTacOpsLink}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-xs flex items-center gap-1.5 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{language === 'ar' ? 'اختبار الرابط' : 'Test Link'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetSettings}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs flex items-center gap-1 transition"
                    title={language === 'ar' ? 'استعادة الافتراضي' : 'Reset to default'}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{language === 'ar' ? 'افتراضي' : 'Reset'}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'حفظ القالب' : 'Save Template'}</span>
                </button>
              </div>

              {savedSuccess && (
                <div className="text-[11px] text-emerald-400 font-semibold text-center">
                  {language === 'ar' ? '✓ تم حفظ إعدادات الرابط بنجاح' : '✓ Settings saved successfully'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
          >
            {language === 'ar' ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
