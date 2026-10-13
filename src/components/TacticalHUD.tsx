import React from 'react';
import { Language, MilSystem } from '../types';
import { formatCoordinates } from '../utils/coordinates';
import { translations } from '../i18n/translations';
import { Crosshair, MapPin } from 'lucide-react';

interface TacticalHUDProps {
  cursorCoords: { x: number; y: number } | null;
  mortarCoords: { x: number; y: number; altitude: number };
  activeTargetCoords: { x: number; y: number; altitude: number } | null;
  language: Language;
  milSystem: MilSystem;
}

export const TacticalHUD: React.FC<TacticalHUDProps> = ({
  cursorCoords,
  mortarCoords,
  activeTargetCoords,
  language,
  milSystem,
}) => {
  const t = translations[language];

  return (
    <div className="absolute top-3 start-3 z-30 pointer-events-none flex flex-col gap-1.5 font-mono text-[11px] text-slate-300">
      {/* Real-time Cursor Coordinates */}
      <div className="bg-slate-950/85 backdrop-blur-md border border-slate-800/90 rounded-lg px-3 py-1.5 shadow-xl flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-emerald-400">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></div>
          <span className="font-bold">GRID</span>
        </div>
        {cursorCoords ? (
          <div className="flex items-center gap-3">
            <span className="text-white font-bold tracking-wider">
              {formatCoordinates(cursorCoords.x, cursorCoords.y).grid8}
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">
              X: {cursorCoords.x.toString().padStart(5, '0')} Y: {cursorCoords.y.toString().padStart(5, '0')}
            </span>
          </div>
        ) : (
          <span className="text-slate-500 italic">Hover map for coords</span>
        )}
      </div>

      {/* Mortar & Active Target summary badge */}
      <div className="hidden sm:flex items-center gap-2">
        <div className="bg-slate-950/80 backdrop-blur-md border border-cyan-500/40 rounded px-2.5 py-1 text-[10px] text-cyan-300 flex items-center gap-1.5">
          <Crosshair className="w-3 h-3 text-cyan-400" />
          <span>
            M: {formatCoordinates(mortarCoords.x, mortarCoords.y).grid6} ({mortarCoords.altitude}m)
          </span>
        </div>

        {activeTargetCoords && (
          <div className="bg-slate-950/80 backdrop-blur-md border border-red-500/40 rounded px-2.5 py-1 text-[10px] text-red-300 flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-red-400" />
            <span>
              T: {formatCoordinates(activeTargetCoords.x, activeTargetCoords.y).grid6} ({activeTargetCoords.altitude}m)
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
