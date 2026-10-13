import React, { useState } from 'react';
import {
  Language,
  MilSystem,
  MortarDefinition,
  MortarState,
  TerrainConfig,
  TerrainId,
} from '../types';
import { translations } from '../i18n/translations';
import { parseGridReference } from '../utils/coordinates';
import {
  Crosshair,
  Search,
  Globe,
  Grid,
  Radio,
  BookOpen,
  FolderOpen,
  Info,
  MapPin,
  Image as ImageIcon,
  Scale,
  Server,
  Navigation2,
  Settings,
  Layers,
  HelpCircle,
} from 'lucide-react';

interface NavbarProps {
  currentTerrain: TerrainConfig;
  mortar: MortarState;
  mortarDef: MortarDefinition;
  allMortars: Record<string, MortarDefinition>;
  language: Language;
  showGrid100m: boolean;
  showRangeRings: boolean;
  showPois: boolean;
  onSelectTerrain: (id: TerrainId) => void;
  onSelectMortarType: (id: string) => void;
  onToggleMilSystem: (system: MilSystem) => void;
  onToggleGrid100m: () => void;
  onToggleRangeRings: () => void;
  onTogglePois: () => void;
  onToggleLanguage: () => void;
  onGoToGrid: (coords: { x: number; y: number }) => void;
  onCenterMortar: () => void;
  onCenterTarget: () => void;
  onOpenTerrainSettings: (terrainId: TerrainId) => void;
  onOpenMapImageModal: () => void;
  onOpenPoiModal: () => void;
  onOpenLocationLayersModal: () => void;
  onOpenAccuracyTestModal: () => void;
  onOpenServersModal: () => void;
  onOpenBallisticsEditor: () => void;
  onOpenSessions: () => void;
  onOpenAbout: () => void;
  onOpenEnfusionHelp?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTerrain,
  mortar,
  mortarDef,
  allMortars,
  language,
  showGrid100m,
  showRangeRings,
  showPois,
  onSelectTerrain,
  onSelectMortarType,
  onToggleMilSystem,
  onToggleGrid100m,
  onToggleRangeRings,
  onTogglePois,
  onToggleLanguage,
  onGoToGrid,
  onCenterMortar,
  onCenterTarget,
  onOpenTerrainSettings,
  onOpenMapImageModal,
  onOpenPoiModal,
  onOpenLocationLayersModal,
  onOpenAccuracyTestModal,
  onOpenServersModal,
  onOpenBallisticsEditor,
  onOpenSessions,
  onOpenAbout,
  onOpenEnfusionHelp,
}) => {
  const t = translations[language];
  const [gridQuery, setGridQuery] = useState('');
  const [gridError, setGridError] = useState(false);

  const handleSearchGrid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gridQuery.trim()) return;

    const coords = parseGridReference(gridQuery);
    if (coords) {
      setGridError(false);
      onGoToGrid(coords);
      setGridQuery('');
    } else {
      setGridError(true);
      setTimeout(() => setGridError(false), 3000);
    }
  };

  return (
    <header className="bg-slate-950/95 border-b border-slate-800 text-slate-100 px-2 sm:px-4 py-2 z-40 select-none backdrop-blur-md">
      {/* Top row: Brand + Search + Essential Actions */}
      <div className="flex items-center justify-between gap-2.5 pb-1.5">
        {/* Brand & Weapon Header */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/50 flex items-center justify-center shadow-lg shadow-cyan-950">
            <Crosshair className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold tracking-wide text-slate-100 flex items-center gap-1.5">
              <span>{t.appName}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/80 border border-cyan-800/80 text-cyan-400 uppercase">
                REFORGER
              </span>
            </h1>
          </div>
        </div>

        {/* Center: Search Grid Input */}
        <form onSubmit={handleSearchGrid} className="relative flex-1 max-w-xs min-w-[150px]">
          <input
            type="text"
            value={gridQuery}
            onChange={(e) => setGridQuery(e.target.value)}
            placeholder={t.gridSearchPlaceholder}
            className={`w-full bg-slate-900 border ${
              gridError ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-700/80'
            } rounded-lg pl-7 pr-12 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono`}
            dir="ltr"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2.5" />
          <button
            type="submit"
            className="absolute right-1 top-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 text-[10px] font-bold uppercase transition"
          >
            {t.goToGrid}
          </button>
          {gridError && (
            <div className="absolute left-0 -bottom-4 text-[10px] text-rose-400 font-mono whitespace-nowrap">
              {t.invalidGrid}
            </div>
          )}
        </form>

        {/* Language switcher & About */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onToggleLanguage}
            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-cyan-300 flex items-center gap-1 transition"
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="text-xs">{language === 'ar' ? 'English' : 'العربية'}</span>
          </button>

          <button
            onClick={onOpenAbout}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title={t.about}
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom row: Scrollable Toolbar with Labels on all icons */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-thin scrollbar-thumb-slate-800 no-scrollbar whitespace-nowrap">
        {/* Terrain Switcher: Everon, Arland, Kolguyev + Dimension Settings */}
        <div className="flex items-center rounded-lg bg-slate-900 border border-slate-800 p-0.5 shrink-0 gap-0.5">
          <button
            onClick={() => onSelectTerrain('everon')}
            className={`px-2 py-1 rounded text-xs font-semibold transition ${
              currentTerrain.id === 'everon'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.everon}
          </button>
          <button
            onClick={() => onSelectTerrain('arland')}
            className={`px-2 py-1 rounded text-xs font-semibold transition ${
              currentTerrain.id === 'arland'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.arland}
          </button>
          <button
            onClick={() => onSelectTerrain('kolguyev')}
            className={`px-2 py-1 rounded text-xs font-semibold transition ${
              currentTerrain.id === 'kolguyev'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.kolguyev}
          </button>
          <button
            onClick={() => onOpenTerrainSettings(currentTerrain.id)}
            className="p-1.5 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition"
            title={t.terrainSettings}
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Location Layers (JSON) */}
        <button
          onClick={onOpenLocationLayersModal}
          className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-medium text-cyan-300 hover:text-white flex items-center gap-1.5 transition shrink-0"
        >
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>{t.locationLayers}</span>
        </button>

        {/* Mortar Weapon Picker */}
        <div className="flex rounded-lg bg-slate-900 border border-slate-800 p-0.5 shrink-0">
          {Object.keys(allMortars).map((mKey) => (
            <button
              key={mKey}
              onClick={() => onSelectMortarType(mKey)}
              className={`px-2.5 py-1 rounded text-xs font-semibold font-mono transition ${
                mortar.type === mKey
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {mKey}
            </button>
          ))}
        </div>

        {/* Mil System Switcher */}
        <div className="flex rounded-lg bg-slate-900 border border-slate-800 p-0.5 text-xs font-mono shrink-0">
          <button
            onClick={() => onToggleMilSystem('6400')}
            className={`px-2 py-1 rounded font-bold transition ${
              mortar.milSystem === '6400'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-400 hover:text-white'
            }`}
            title="6400 NATO Mils"
          >
            6400
          </button>
          <button
            onClick={() => onToggleMilSystem('6000')}
            className={`px-2 py-1 rounded font-bold transition ${
              mortar.milSystem === '6000'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-400 hover:text-white'
            }`}
            title="6000 Warsaw Pact Mils"
          >
            6000
          </button>
        </div>

        <div className="h-4 w-[1px] bg-slate-800 shrink-0"></div>

        {/* Map Image Button */}
        <button
          onClick={onOpenMapImageModal}
          className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-medium text-cyan-300 hover:text-white flex items-center gap-1.5 transition shrink-0"
        >
          <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
          <span>{t.uploadMapImage}</span>
        </button>

        {/* Places / POIs Button */}
        <button
          onClick={onOpenPoiModal}
          className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1.5 transition shrink-0"
        >
          <MapPin className="w-3.5 h-3.5 text-red-400" />
          <span>{t.places}</span>
        </button>

        {/* Accuracy Test Button */}
        <button
          onClick={onOpenAccuracyTestModal}
          className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1.5 transition shrink-0"
        >
          <Scale className="w-3.5 h-3.5 text-emerald-400" />
          <span>{t.accuracyTest}</span>
        </button>

        {/* Servers Tab Button */}
        <button
          onClick={onOpenServersModal}
          className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-medium text-amber-300 hover:text-white flex items-center gap-1.5 transition shrink-0"
        >
          <Server className="w-3.5 h-3.5 text-amber-400" />
          <span>{t.servers}</span>
        </button>

        {/* Ballistics Editor Button */}
        <button
          onClick={onOpenBallisticsEditor}
          className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1.5 transition shrink-0"
        >
          <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
          <span>{t.ballisticsEditor}</span>
        </button>

        {/* Sessions Button */}
        <button
          onClick={onOpenSessions}
          className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1.5 transition shrink-0"
        >
          <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
          <span>{t.sessions}</span>
        </button>

        <div className="h-4 w-[1px] bg-slate-800 shrink-0"></div>

        {/* Map Toggles with Labels */}
        <button
          onClick={onToggleGrid100m}
          className={`px-2 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1 transition shrink-0 ${
            showGrid100m
              ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
          <span>100m</span>
        </button>

        <button
          onClick={onToggleRangeRings}
          className={`px-2 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1 transition shrink-0 ${
            showRangeRings
              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>{t.ranges}</span>
        </button>

        <button
          onClick={onTogglePois}
          className={`px-2 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1 transition shrink-0 ${
            showPois
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>{t.landmarks}</span>
        </button>

        {/* Center Buttons */}
        <button
          onClick={onCenterMortar}
          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-cyan-400 hover:bg-slate-800 transition shrink-0"
          title={t.centerMortar}
        >
          <Crosshair className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onCenterTarget}
          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-red-400 hover:bg-slate-800 transition shrink-0"
          title={t.centerTarget}
        >
          <Navigation2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
