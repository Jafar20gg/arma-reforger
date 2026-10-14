import React from 'react';
import { Language } from '../types';
import { translations } from '../i18n/translations';
import { HelpCircle, X, Camera, Upload, ShieldCheck, CheckCircle2, Crosshair, ExternalLink } from 'lucide-react';

interface MapHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const MapHelpModal: React.FC<MapHelpModalProps> = ({ isOpen, onClose, language }) => {
  const t = translations[language];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-slate-100">{t.howToPrepareMap}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps Content */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[80vh] text-xs leading-relaxed text-slate-300">
          <div className="space-y-3">
            {/* Step 1 */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="w-7 h-7 rounded-full bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400 font-bold shrink-0">
                1
              </div>
              <div>
                <h4 className="font-bold text-slate-200 text-xs mb-1">
                  {language === 'ar' ? 'تنزيل أو التقاط صورة الخريطة' : 'Download or Screenshot Terrain Map'}
                </h4>
                <p className="text-slate-400">
                  {language === 'ar'
                    ? 'التقط لقطة شاشة عالية الدقة من خريطة اللعبة داخل Arma Reforger بالضغط على مفتاح (M)، أو قم بتنزيل صورة الخريطة يدوياً من المواقع المرجعية مثل reforger.recoil.org لاستخدامك الشخصي.'
                    : 'Take a clear in-game screenshot from Arma Reforger by pressing (M), or download the map image manually from reference sites like reforger.recoil.org for your personal use.'}
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="w-7 h-7 rounded-full bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400 font-bold shrink-0">
                2
              </div>
              <div>
                <h4 className="font-bold text-slate-200 text-xs mb-1">
                  {language === 'ar' ? 'رفع الصورة عبر زر "رفع صورة الخريطة"' : 'Upload via "Upload Map" Button'}
                </h4>
                <p className="text-slate-400">
                  {language === 'ar'
                    ? 'في التطبيق، اضغط على زر "رفع صورة الخريطة" واختر ملف الصورة (PNG أو JPG أو WebP). يقوم التطبيق تلقائياً بقراءة أبعاد الصورة وتحسينها للعرض فائق السرعة مع الحفاظ على الأصل.'
                    : 'Click "Upload Map" and select your image file (PNG, JPG, or WebP). The app handles large images smoothly by generating an optimized display view while keeping the original.'}
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="w-7 h-7 rounded-full bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400 font-bold shrink-0">
                3
              </div>
              <div>
                <h4 className="font-bold text-slate-200 text-xs mb-1">
                  {language === 'ar' ? 'اختيار "تغطي الخريطة كاملة" أو "معايرة بنقطتين"' : 'Choose "Full Terrain" or "Two-Point Calibration"'}
                </h4>
                <p className="text-slate-400">
                  {language === 'ar'
                    ? 'إذا كانت الصورة مربعة وتغطي الجزيرة كاملة، اختر خيار "تغطي الخريطة كاملة". أما إذا كانت الصورة لقطة شاشة مقصوصة جزئياً أو غير مربعة، اختر "معايرة بنقطتين" وانقر على نقطتين معروفتين في الصورة وأدخل إحداثياتهما ليتم حساب المقياس والإزاحة بدقة متناهية.'
                    : 'If the image covers the entire island from edge to edge, select "Full Terrain Bounds". If it is a partial or cropped screenshot, choose "Two-Point Calibration" and tap two reference landmarks to calculate exact scale and offset.'}
                </p>
              </div>
            </div>
          </div>

          {/* Device Local Storage & Privacy Notice */}
          <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-600/40 text-emerald-200 text-[11px] space-y-1.5">
            <div className="font-bold text-emerald-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{language === 'ar' ? 'استخدام شخصي محلي 100%' : '100% Local & Personal Use'}</span>
            </div>
            <p className="leading-relaxed">
              {language === 'ar'
                ? 'تنبيه: صور الخرائط والشرائح مخصصة للاستخدام الشخصي على جهازك فقط. تُخزن الصور داخل متصفحك محلياً (IndexedDB)، ولا يتم رفعها إلى أي خادم، ولا يتم عمل Commit لها في المستودع إطلاقاً.'
                : 'Notice: Map images are strictly for personal use on your device. All files are stored locally in IndexedDB, never uploaded to any remote server, and never committed to any repository.'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition shadow"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
