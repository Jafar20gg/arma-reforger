import React from 'react';
import { Language } from '../types';
import { translations } from '../i18n/translations';
import { Info, X, ShieldAlert, Code2, Map, Crosshair, BookOpen, ExternalLink, Heart } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose, language }) => {
  const t = translations[language];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Info className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-base font-bold text-slate-100">{t.about}</h3>
              <p className="text-xs text-slate-400">Reforger Mortar Map (خريطة هاون ريفورجر)</p>
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
        <div className="p-5 space-y-4 overflow-y-auto max-h-[80vh] text-xs leading-relaxed text-slate-300">
          {/* Disclaimer */}
          <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-600/40 text-amber-200/90 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-300 text-xs mb-1">{t.disclaimer}</h4>
              <p>{t.disclaimerText}</p>
            </div>
          </div>

          {/* Ballistic & Technical Overview */}
          <div className="space-y-2 bg-slate-950/50 p-3.5 rounded-xl border border-slate-800">
            <h4 className="font-bold text-cyan-300 flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-cyan-400" />
              <span>{language === 'ar' ? 'المعادلات البالستية والنظام الرياضي' : 'Ballistic Physics & Mathematics'}</span>
            </h4>
            <ul className="list-disc list-inside space-y-1 text-slate-300 font-mono text-[11px]">
              <li>Range: R = √(Δx² + Δy²)</li>
              <li>Azimuth: θ = atan2(Δx, Δy) (0..6400 NATO mil / 0..6000 Warsaw Pact mil)</li>
              <li>Elevation: Linear interpolation with dElev altitude correction: (Δh / 100) × dElev</li>
              <li>Fire Adjustment: Spotter Add/Drop along observer bearing with lateral correction</li>
            </ul>
          </div>

          {/* Tile Guide */}
          <div className="space-y-1.5 bg-slate-950/50 p-3.5 rounded-xl border border-slate-800">
            <h4 className="font-bold text-emerald-300 flex items-center gap-2">
              <Map className="w-4 h-4 text-emerald-400" />
              <span>{language === 'ar' ? 'إضافة خرائط وبلاطات اللعبة' : 'Game Tiles & Heightmaps'}</span>
            </h4>
            <p className="text-slate-400 text-[11px]">{t.tileGuideNote}</p>
            <p className="text-[11px] text-slate-400 font-mono mt-1">
              Path: /public/tiles/{'{terrain}'}/{'{z}'}/{'{x}'}/{'{y}'}.png<br />
              Heightmaps: /public/heightmaps/{'{terrain}'}.png
            </p>
          </div>

          {/* EnfusionMapMaker & Recoil.org Credits */}
          <div className="space-y-2 bg-slate-950/50 p-3.5 rounded-xl border border-cyan-800/40">
            <h4 className="font-bold text-cyan-300 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-cyan-400" />
                <span>EnfusionMapMaker & reforger.recoil.org</span>
              </span>
              <a
                href="https://reforger.recoil.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 font-normal"
              >
                <span>recoil.org</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </h4>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              {language === 'ar'
                ? 'تقدير وشكر خاص للمطور Nick Ludlam ومشروع reforger.recoil.org وأداة EnfusionMapMaker على إتاحة الخرائط المجمعة والبلاطات التفاعلية عالية الدقة لمجتمع Arma Reforger. ترخيص الأداة: Arma Public License Share Alike (APL-SA).'
                : 'Special thanks to Nick Ludlam, creator of reforger.recoil.org and EnfusionMapMaker, for providing high-resolution composite maps and interactive tile layers for the Arma Reforger community (APL-SA license).'}
            </p>
            <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px] text-amber-300/90 leading-relaxed font-mono">
              {language === 'ar'
                ? '• جميع بيانات وأصول اللعبة تظل خاضعة لتراخيص شركة Bohemia Interactive a.s. الخاصة بها.\n• هذا التطبيق غير رسمي (Unofficial) وغير تابع لشركة Bohemia Interactive أو معتمد منها.'
                : '• All game data and assets retain their own Bohemia Interactive a.s. licensing.\n• This application is unofficial and is not affiliated with or endorsed by Bohemia Interactive.'}
            </div>
          </div>

          {/* Credits & License */}
          <div className="space-y-1 bg-slate-950/50 p-3.5 rounded-xl border border-slate-800">
            <h4 className="font-bold text-slate-200 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-slate-400" />
              <span>{t.credits}</span>
            </h4>
            <p className="text-slate-400 text-[11px]">{t.creditsText}</p>
            <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 font-mono border-t border-slate-800/80 mt-2">
              <span>{t.license}</span>
              <span>Arma Reforger Community Tool</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> for the Reforger community
          </span>
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
