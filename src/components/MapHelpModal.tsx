import React from 'react';
import { Language } from '../types';
import { translations } from '../i18n/translations';
import { HelpCircle, X, Camera, Scissors, Upload, ShieldCheck, CheckCircle2 } from 'lucide-react';

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
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="w-7 h-7 rounded-full bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400 font-bold shrink-0">
                1
              </div>
              <div>
                <h4 className="font-bold text-slate-200 text-xs mb-1">
                  {language === 'ar' ? 'التقاط لقطات الشاشة داخل اللعبة' : 'Take In-Game Screenshots'}
                </h4>
                <p className="text-slate-400">
                  {language === 'ar'
                    ? 'افتح خريطة اللعبة بالضغط على الزر (M)، وقرب بالزووم إلى المستوى المطلوب لتظهر تفاصيل التضاريس والخطوط الكنتورية بوضوح، ثم التقط صورة أو عدة لقطات للمنطقة.'
                    : 'Open the in-game map by pressing (M). Zoom to your desired resolution to capture topographic contours clearly, then take screenshots.'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="w-7 h-7 rounded-full bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400 font-bold shrink-0">
                2
              </div>
              <div>
                <h4 className="font-bold text-slate-200 text-xs mb-1">
                  {language === 'ar' ? 'تجميع وقص الصورة (Stitch & Crop)' : 'Stitch and Crop to Bounds'}
                </h4>
                <p className="text-slate-400">
                  {language === 'ar'
                    ? 'قم بدمج اللقطات (إذا كانت متعددة) وقص الصورة بدقة عند حدود الجزيرة أو شبكة إحداثيات معروفة، وتصديرها بصيغة PNG أو JPG أو WebP.'
                    : 'Stitch multiple screenshots if needed and crop to the terrain bounds or known grid coordinates, then export as PNG, JPG, or WebP.'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="w-7 h-7 rounded-full bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400 font-bold shrink-0">
                3
              </div>
              <div>
                <h4 className="font-bold text-slate-200 text-xs mb-1">
                  {language === 'ar' ? 'الرفع والمعايرة بنقرتين' : 'Upload and Calibrate'}
                </h4>
                <p className="text-slate-400">
                  {language === 'ar'
                    ? 'انقر على "رفع صورة الخريطة". إذا كانت صورتك مقصوصة جزئياً، استخدم أداة "معايرة أبعاد الصورة" وحدد نقطتين معلومتين لتطابقها بدقة السنتيمتر.'
                    : 'Click "Upload Map Image". If your image is cropped to a partial sector, use the calibration tool to bind two reference points to game coordinates.'}
                </p>
              </div>
            </div>
          </div>

          {/* Legal / Personal Use Notice */}
          <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-600/40 text-amber-200 text-[11px] space-y-1">
            <div className="font-bold text-amber-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>{language === 'ar' ? 'تنويه قانوني وترخيص الأصول' : 'Legal & Personal Use Notice'}</span>
            </div>
            <p>
              {language === 'ar'
                ? 'لقطات شاشة اللعبة مخصصة لاستخدامك الشخصي فقط داخل متصفحك. تُحفظ الصور محلياً في ذاكرة جهازك (IndexedDB) ولا يتم رفعها أو تخزينها على أي خادم عام. جميع حقوق الأصول والرسومات والصور تعود لشركة Bohemia Interactive a.s.'
                : 'Screenshots are strictly for your personal, local use. Images are saved exclusively on your device (IndexedDB) and are never uploaded or committed to any repository. Game visual assets remain the property of Bohemia Interactive a.s.'}
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
