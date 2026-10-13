import React from 'react';
import { Language } from '../types';
import { translations } from '../i18n/translations';
import { HelpCircle, X, ExternalLink, FolderOpen, Layers, ShieldCheck, Download, Terminal } from 'lucide-react';

interface EnfusionHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const EnfusionHelpModal: React.FC<EnfusionHelpModalProps> = ({ isOpen, onClose, language }) => {
  const t = translations[language];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-base font-bold text-slate-100">
                {language === 'ar' ? 'تجهيز البلاطات بأداة EnfusionMapMaker' : 'Preparing Tiles with EnfusionMapMaker'}
              </h3>
              <p className="text-xs text-slate-400">Arma Reforger Community Tool Guide</p>
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
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs text-slate-300 leading-relaxed">
          {/* Credit & License Notice */}
          <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-800/50 text-cyan-200 space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-cyan-300 text-xs">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>{language === 'ar' ? 'أداة EnfusionMapMaker والترخيص' : 'EnfusionMapMaker & License'}</span>
            </div>
            <p>
              {language === 'ar'
                ? 'أداة EnfusionMapMaker مطورة من قبل مجتمع Arma Reforger لتوليد وتصدير بلاطات الخرائط بدقة عالية (Slippy Map Tiles z/x/y) من محرك اللعبة Enfusion.'
                : 'EnfusionMapMaker is an open community tool for generating Slippy map tiles ({z}/{x}/{y}.png) directly from Arma Reforger Enfusion workbench projects.'}
            </p>
            <div className="pt-1 flex items-center gap-2 font-mono text-[11px] text-cyan-400">
              <span>License: Arma Public License Share Alike (APL-SA)</span>
            </div>
          </div>

          {/* Step by step guide */}
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="w-7 h-7 rounded-full bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400 font-bold shrink-0">
                1
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-200">
                  {language === 'ar' ? 'تصدير صور الخريطة من Arma Reforger Workbench' : 'Export Map Image from Reforger Tools'}
                </h4>
                <p className="text-slate-400">
                  {language === 'ar'
                    ? 'افتح أداة World Editor في Arma Reforger Tools على جهاز الكمبيوتر. حمّل عالم التضاريس (Everon أو Arland أو Kolguyev) وقم بتصدير الخريطة الطبوغرافية أو قمرية بدقة عالية.'
                    : 'Open World Editor in Arma Reforger Tools on PC. Load the terrain world and export the high-resolution topographic or satellite orthophoto.'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="w-7 h-7 rounded-full bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400 font-bold shrink-0">
                2
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-200">
                  {language === 'ar' ? 'تشغيل EnfusionMapMaker لتقطيع البلاطات' : 'Run EnfusionMapMaker to Slice Tiles'}
                </h4>
                <p className="text-slate-400">
                  {language === 'ar'
                    ? 'شغّل أداة EnfusionMapMaker واختر مستويات الزووم المطلوبة (مثلاً من 0 إلى 5). ستقوم الأداة بإنشاء مجلد يحتوي على هيكل البلاطات المعياري z/x/y بصيغة PNG أو WebP.'
                    : 'Run EnfusionMapMaker and select target zoom levels (e.g. 0 to 5). It will slice your map image into standardized {z}/{x}/{y}.png tile folders.'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="w-7 h-7 rounded-full bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400 font-bold shrink-0">
                3
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-200">
                  {language === 'ar' ? 'التحميل المباشر داخل التطبيق' : 'Import Folder Directly into the App'}
                </h4>
                <p className="text-slate-400">
                  {language === 'ar'
                    ? 'في هذا التطبيق، افتح "رفع صورة الخريطة والبلاطات"، واختر "تحميل مجلد البلاطات (EnfusionMapMaker)" وحدد المجلد الناتج. تُحفظ البلاطات محلياً في متصفحك (IndexedDB) وتعمل فورياً حتى بدون إنترنت!'
                    : 'In this app, open "Upload Map & Tiles", select "Upload Tiles Folder (EnfusionMapMaker)" and pick the folder. All tiles are indexed locally in browser IndexedDB for instant offline pan & zoom!'}
                </p>
              </div>
            </div>
          </div>

          {/* Legal Reminder */}
          <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-600/40 text-amber-200 text-[11px]">
            <p>
              {language === 'ar'
                ? 'تذكير: البلاطات المنشأة تُحفظ للاستخدام الشخصي على جهازك فقط ولا يتم رفعها لأي خادم. تظل حقوق أصول اللعبة خاضعة لترخيص Bohemia Interactive.'
                : 'Reminder: Generated tiles remain on your local device only and are never uploaded. Bohemia Interactive assets retain Bohemia Interactive licensing.'}
            </p>
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
