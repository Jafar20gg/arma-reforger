import React from 'react';
import { Shield, Gauge, AlertCircle, CheckCircle2 } from 'lucide-react';
import { FireSolution, WeaponType, Language, WorldPoint } from '../types/mortar';
import { BALLISTIC_DATA, ShellType } from '../data/ballisticData';
import { getTranslation } from '../utils/i18n';

interface BallisticPanelProps {
  solution: FireSolution;
  weaponType: WeaponType;
  projectileId: string;
  preferredCharge?: number;
  mortar: WorldPoint;
  target: WorldPoint;
  lang: Language;
  onWeaponChange: (weapon: WeaponType) => void;
  onProjectileChange: (projId: string) => void;
  onChargeChange: (charge?: number) => void;
  onMortarAltChange: (alt: number) => void;
  onTargetAltChange: (alt: number) => void;
}

export const BallisticPanel: React.FC<BallisticPanelProps> = ({
  solution,
  weaponType,
  projectileId,
  preferredCharge,
  mortar,
  target,
  lang,
  onWeaponChange,
  onProjectileChange,
  onChargeChange,
  onMortarAltChange,
  onTargetAltChange,
}) => {
  const t = getTranslation(lang);
  const currentWeapon = BALLISTIC_DATA[weaponType === 'b2b14' ? 'b2b14' : 'm252'];
  const rounds = currentWeapon.defaultRounds;

  return (
    <div className="flex flex-col gap-2.5 bg-neutral-900/90 border border-neutral-800 rounded-lg p-2.5 sm:p-3 shadow-lg">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-amber-500" />
            <h3 className="font-tactical text-xs font-bold uppercase tracking-wider text-neutral-200">
              {t.weapon}
            </h3>
          </div>
          <span className="font-mono text-[10px] text-amber-400 font-semibold px-1.5 py-0.5 bg-amber-950/60 border border-amber-800/60 rounded">
            {weaponType === 'm252' ? 'NATO 6400 MIL' : 'WARSAW PACT 6000 MIL'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5 bg-neutral-950 p-0.5 rounded-lg border border-neutral-800">
          <button
            type="button"
            onClick={() => onWeaponChange('m252')}
            className={`py-1.5 px-2 rounded-md text-xs font-semibold font-tactical transition-all ${
              weaponType === 'm252'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-950/50'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            M252 81mm (US)
          </button>
          <button
            type="button"
            onClick={() => onWeaponChange('b2b14')}
            className={`py-1.5 px-2 rounded-md text-xs font-semibold font-tactical transition-all ${
              weaponType === 'b2b14'
                ? 'bg-red-700 text-white shadow-md shadow-red-950/50'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            2B14 Podnos 82mm (RU)
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-neutral-400 font-tactical">
            {t.shellType}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {rounds.map((round: ShellType) => (
              <button
                key={round.id}
                type="button"
                onClick={() => onProjectileChange(round.id)}
                className={`py-1.5 px-2 rounded border text-xs font-mono font-medium transition-all ${
                  projectileId === round.id
                    ? 'border-amber-500 bg-amber-950/50 text-amber-300 font-bold'
                    : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                }`}
              >
                {round.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-neutral-400 font-tactical">
              {t.charge} ({t.chargeRings})
            </label>
            <span className="text-[10px] text-neutral-500 font-mono">
              {preferredCharge === undefined ? t.chargeAuto : `${t.chargeManual} (${preferredCharge})`}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => onChargeChange(undefined)}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-all border ${
                preferredCharge === undefined
                  ? 'bg-amber-600 border-amber-400 text-white font-bold'
                  : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
              }`}
            >
              AUTO
            </button>
            {solution.availableCharges.map(c => (
              <button
                key={c.rings}
                type="button"
                onClick={() => onChargeChange(c.rings)}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-all border ${
                  preferredCharge === c.rings
                    ? 'bg-amber-600 border-amber-400 text-white font-bold'
                    : c.inRange
                    ? 'bg-neutral-950 border-neutral-700 text-neutral-200 hover:border-amber-600/60'
                    : 'bg-neutral-950/30 border-neutral-800/40 text-neutral-600 hover:border-neutral-700'
                }`}
              >
                C-{c.rings} {c.inRange ? `(${c.elevationMils}m)` : (lang === 'ar' ? '(خارج)' : '(OOR)')}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 bg-neutral-950 border border-neutral-800 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-amber-500" />
            <h4 className="font-tactical text-xs font-bold uppercase tracking-wider text-neutral-300">
              {t.firingSolution}
            </h4>
          </div>
          {solution.inRange ? (
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-800/80 px-2 py-0.5 rounded">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.solutionValid}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[11px] font-bold text-red-400 bg-red-950/70 border border-red-800/80 px-2 py-0.5 rounded">
              <AlertCircle className="w-3.5 h-3.5 text-red-400" />
              <span>{t.solutionOutOfRange}</span>
            </div>
          )}
        </div>

        {solution.warningMessage && !solution.inRange && (
          <div className="bg-red-950/40 border border-red-800/50 p-2 rounded text-xs text-red-300 font-mono">
            {lang === 'ar' ? solution.warningMessageAr : solution.warningMessage}
          </div>
        )}

        <div className="bg-emerald-950/50 border border-emerald-500/80 p-2.5 rounded-lg flex flex-col justify-between shadow-md shadow-emerald-950/60 ring-1 ring-emerald-400/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-tactical text-emerald-300 uppercase font-black tracking-wider">
                {t.elevationTube}
              </span>
            </div>
            <span className="text-[9px] font-mono text-emerald-300 font-bold px-1.5 py-0.5 bg-emerald-900/80 rounded border border-emerald-500/50">
              {lang === 'ar' ? 'مقياس الميل / المنظار' : 'INCLINOMETER / SIGHT'}
            </span>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <div className="text-3xl font-mono font-black text-emerald-400 tracking-tight drop-shadow-[0_0_10px_rgba(52,211,153,0.35)]">
              {solution.inRange ? `${solution.elevationDegrees}°` : '---°'}
            </div>
            <div className="text-right">
              <div className="text-sm font-mono font-bold text-emerald-200">
                {solution.inRange ? `${solution.elevationMils} MIL` : '---- MIL'}
              </div>
              <div className="text-[9px] font-mono text-emerald-400/80">
                {weaponType === 'm252' ? 'NATO (6400 MIL)' : 'WARSAW (6000 MIL)'}
              </div>
            </div>
          </div>
        </div>

        {solution.inRange && (
          <div className="flex items-center justify-between p-1.5 rounded bg-amber-950/40 border border-amber-600/70 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-amber-500 text-neutral-950 font-bold text-[10px]">
                {t.charge} {solution.chargeRings}
              </span>
              <span className="text-amber-200 font-medium text-[10px]">
                {lang === 'ar'
                  ? solution.chargeRings === 0
                    ? '0 حلقات دافعة (الشحنة الأساسية فقط)'
                    : `قم بتركيب ${solution.chargeRings} حلقات دافعة على القذيفة`
                  : solution.chargeRings === 0
                  ? '0 Propellant Rings (Base charge only)'
                  : `Attach ${solution.chargeRings} propellant ring${solution.chargeRings > 1 ? 's' : ''} in-game`}
              </span>
            </div>
            <span className="text-[8.5px] text-amber-400 font-semibold uppercase hidden sm:inline">
              {lang === 'ar' ? 'حلقات اللعبة' : 'In-Game Ring'}
            </span>
          </div>
        )}

        <div className="grid grid-cols-3 gap-1.5 mt-0.5">
          <div className="bg-neutral-900 border border-neutral-800 p-2 rounded-lg flex flex-col justify-between">
            <span className="text-[9px] font-tactical text-neutral-400 uppercase font-semibold">
              {t.azimuth}
            </span>
            <div className="mt-0.5">
              <div className="text-lg font-mono font-bold text-amber-400 tracking-tight">
                {solution.azimuthMils}
                <span className="text-[10px] font-normal text-neutral-400 ml-1">MIL</span>
              </div>
              <div className="text-[9px] font-mono text-neutral-400">
                {solution.azimuthDegrees}° {lang === 'ar' ? 'شمال حقيقي' : 'True'}
              </div>
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 p-2.5 rounded-lg flex flex-col justify-between">
            <span className="text-[10px] font-tactical text-neutral-400 uppercase font-semibold">
              {t.charge}
            </span>
            <div className="mt-1">
              <div className="text-xl font-mono font-bold text-amber-400 tracking-tight">
                {solution.inRange ? solution.chargeRings : '--'}
                <span className="text-xs font-normal text-neutral-400 ml-1">{t.chargeRings}</span>
              </div>
              <div className="text-[10px] font-mono text-neutral-400">
                {lang === 'ar' ? 'حلقات دافعة' : 'Propellant Rings'}
              </div>
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 p-2.5 rounded-lg flex flex-col justify-between">
            <span className="text-[10px] font-tactical text-neutral-400 uppercase font-semibold">
              {t.tof}
            </span>
            <div className="mt-1">
              <div className="text-xl font-mono font-bold text-amber-400 tracking-tight">
                {solution.inRange ? solution.timeOfFlightSec : '--'}
                <span className="text-xs font-normal text-neutral-400 ml-1">{t.seconds}</span>
              </div>
              <div className="text-[10px] font-mono text-neutral-400">
                {lang === 'ar' ? 'وقت الوصول' : 'Impact countdown'}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-neutral-800/80 text-xs font-mono">
          <div className="flex items-center justify-between px-2 py-1.5 bg-neutral-900/60 rounded border border-neutral-800/60">
            <span className="text-neutral-400 text-[11px]">{t.distance}:</span>
            <span className="text-neutral-100 font-bold">{solution.horizontalDistanceMeters}m</span>
          </div>
          <div className="flex items-center justify-between px-2 py-1.5 bg-neutral-900/60 rounded border border-neutral-800/60">
            <span className="text-neutral-400 text-[11px]">{t.deltaH}:</span>
            <span className={`font-bold ${solution.deltaAltitudeMeters > 0 ? 'text-amber-400' : solution.deltaAltitudeMeters < 0 ? 'text-blue-400' : 'text-neutral-100'}`}>
              {solution.deltaAltitudeMeters > 0 ? `+${solution.deltaAltitudeMeters}` : solution.deltaAltitudeMeters}m
            </span>
          </div>
          <div className="flex items-center justify-between px-2 py-1.5 bg-neutral-900/60 rounded border border-neutral-800/60">
            <span className="text-neutral-400 text-[11px]">{t.apex}:</span>
            <span className="text-neutral-100 font-bold">{solution.maxOrdinateMeters ? `${solution.maxOrdinateMeters}m` : 'N/A'}</span>
          </div>
          <div className="flex items-center justify-between px-2 py-1.5 bg-neutral-900/60 rounded border border-neutral-800/60">
            <span className="text-neutral-400 text-[11px]">{t.angleFall}:</span>
            <span className="text-neutral-100 font-bold">{solution.angleOfFallDeg ? `${solution.angleOfFallDeg}°` : 'N/A'}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-800/80">
          <div className="flex items-center justify-between bg-neutral-900/80 px-2.5 py-1.5 rounded border border-neutral-800">
            <label className="text-[11px] font-tactical text-neutral-400">
              {t.altMortar} (m)
            </label>
            <input
              type="number"
              value={mortar.altitudeMeters ?? 0}
              onChange={e => onMortarAltChange(parseFloat(e.target.value) || 0)}
              className="w-16 bg-neutral-950 border border-neutral-700 px-2 py-0.5 rounded text-right font-mono text-xs text-neutral-100 focus:border-amber-500 outline-none"
            />
          </div>
          <div className="flex items-center justify-between bg-neutral-900/80 px-2.5 py-1.5 rounded border border-neutral-800">
            <label className="text-[11px] font-tactical text-neutral-400">
              {t.altTarget} (m)
            </label>
            <input
              type="number"
              value={target.altitudeMeters ?? 0}
              onChange={e => onTargetAltChange(parseFloat(e.target.value) || 0)}
              className="w-16 bg-neutral-950 border border-neutral-700 px-2 py-0.5 rounded text-right font-mono text-xs text-neutral-100 focus:border-amber-500 outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
