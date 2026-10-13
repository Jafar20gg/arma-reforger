/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import {
  BallisticsDatabase,
  FireMissionSolution,
  Language,
  MilSystem,
  MortarState,
  POI,
  SavedSession,
  Target,
  TerrainId,
} from './types';
import { TERRAINS } from './data/terrains';
import defaultBallisticsData from './data/ballistics.json';
import defaultPoisData from './data/pois.json';
import { computeFireSolution, getAutoTargetName } from './utils/calculator';
import {
  decodeMissionFromHash,
  getLastActiveState,
  saveLastActiveState,
} from './utils/storage';
import {
  sampleAltitudeAt,
  isHeightmapImageLoaded,
  setCustomHeightmapBlob,
} from './utils/heightmap';
import {
  TerrainImageConfig,
  getTerrainImage,
  getLocationLayers,
} from './utils/imageStore';
import { LocationLayer, TerrainConfig } from './types';

import { Navbar } from './components/Navbar';
import { MortarMap } from './components/MortarMap';
import { TacticalHUD } from './components/TacticalHUD';
import { FireSolutionCard } from './components/FireSolutionCard';
import { TargetManager } from './components/TargetManager';
import { FireAdjustmentModal } from './components/FireAdjustmentModal';
import { BallisticsEditorModal } from './components/BallisticsEditorModal';
import { SessionManagerModal } from './components/SessionManagerModal';
import { AboutModal } from './components/AboutModal';
import { MapImageCalibrationModal } from './components/MapImageCalibrationModal';
import { MapHelpModal } from './components/MapHelpModal';
import { PoiEditorModal } from './components/PoiEditorModal';
import { AccuracyTestModal } from './components/AccuracyTestModal';
import { ServersModal } from './components/ServersModal';
import { TerrainSettingsModal } from './components/TerrainSettingsModal';
import { LocationLayersModal } from './components/LocationLayersModal';
import { EnfusionHelpModal } from './components/EnfusionHelpModal';
import { translations } from './i18n/translations';
import { Target as TargetIcon, List } from 'lucide-react';

const BALLISTICS_STORAGE_KEY = 'reforger_mortar_ballistics_db';
const POIS_STORAGE_KEY = 'reforger_mortar_pois_db';

export default function App() {
  // Language & RTL State (Defaults to Arabic 'ar' with RTL)
  const [language, setLanguage] = useState<Language>('ar');

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  // Ballistics Database State
  const [ballisticsDb, setBallisticsDb] = useState<BallisticsDatabase>(() => {
    try {
      const saved = localStorage.getItem(BALLISTICS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return defaultBallisticsData as BallisticsDatabase;
  });

  const handleSaveBallistics = (newDb: BallisticsDatabase) => {
    setBallisticsDb(newDb);
    try {
      localStorage.setItem(BALLISTICS_STORAGE_KEY, JSON.stringify(newDb));
    } catch {
      // ignore
    }
  };

  // POIs / Places State
  const [pois, setPois] = useState<POI[]>(() => {
    try {
      const saved = localStorage.getItem(POIS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return defaultPoisData as POI[];
  });

  const [autoNameDistMeters, setAutoNameDistMeters] = useState<number>(500);

  const savePois = (updatedPois: POI[]) => {
    setPois(updatedPois);
    try {
      localStorage.setItem(POIS_STORAGE_KEY, JSON.stringify(updatedPois));
    } catch {
      // ignore
    }
  };

  const TERRAIN_SIZES_STORAGE_KEY = 'reforger_mortar_terrain_sizes';

  // Dynamic Terrain Configurations (editable world size in meters per terrain)
  const [terrainConfigs, setTerrainConfigs] = useState<Record<TerrainId, TerrainConfig>>(() => {
    const configs = { ...TERRAINS };
    try {
      const saved = localStorage.getItem(TERRAIN_SIZES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        (Object.keys(parsed) as TerrainId[]).forEach((id) => {
          if (configs[id] && typeof parsed[id] === 'number') {
            const size = parsed[id];
            configs[id] = {
              ...configs[id],
              sizeMeters: size,
              defaultCenter: [Math.round(size / 2), Math.round(size / 2)],
            };
          }
        });
      }
    } catch {
      // fallback
    }
    return configs;
  });

  const handleSaveTerrainSize = (tId: TerrainId, newSize: number) => {
    setTerrainConfigs((prev) => {
      const updated = {
        ...prev,
        [tId]: {
          ...prev[tId],
          sizeMeters: newSize,
          defaultCenter: [Math.round(newSize / 2), Math.round(newSize / 2)] as [number, number],
        },
      };
      try {
        const toSave: Record<string, number> = {};
        (Object.keys(updated) as TerrainId[]).forEach((k) => {
          toSave[k] = updated[k].sizeMeters;
        });
        localStorage.setItem(TERRAIN_SIZES_STORAGE_KEY, JSON.stringify(toSave));
      } catch {}
      return updated;
    });

    if (tId === 'kolguyev' && terrainId !== 'kolguyev') {
      setTerrainId('kolguyev');
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView([Math.round(newSize / 2), Math.round(newSize / 2)], 2);
      }
    } else if (terrainId === tId && mapInstanceRef.current) {
      mapInstanceRef.current.setView([Math.round(newSize / 2), Math.round(newSize / 2)], 2);
    }
  };

  // Map & Mission State
  const [terrainId, setTerrainId] = useState<TerrainId>('everon');
  const currentTerrain = terrainConfigs[terrainId] || TERRAINS[terrainId];

  // User Map Image Config per terrain from IndexedDB
  const [terrainImageConfig, setTerrainImageConfig] = useState<TerrainImageConfig | null>(null);

  // Load terrain image config on terrain switch or mount
  useEffect(() => {
    let isMounted = true;
    getTerrainImage(terrainId).then((cfg) => {
      if (isMounted) {
        setTerrainImageConfig(cfg);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [terrainId]);

  // Location Layers (JSON imported items) from IndexedDB
  const [locationLayers, setLocationLayers] = useState<LocationLayer[]>([]);

  useEffect(() => {
    let isMounted = true;
    getLocationLayers(terrainId).then((layers) => {
      if (isMounted) {
        setLocationLayers(layers);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [terrainId]);

  const [mortar, setMortar] = useState<MortarState>({
    x: 4500,
    y: 7200,
    altitude: 75,
    type: 'M252',
    milSystem: '6400',
    selectedChargeOverride: null,
  });

  const [targets, setTargets] = useState<Target[]>([
    {
      id: 'target-initial-1',
      name: 'Target 1 [062 078]',
      notes: 'Initial mission target',
      x: 6200,
      y: 7800,
      altitude: 85,
      color: '#ef4444',
      createdAt: Date.now(),
    },
  ]);

  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(
    'target-initial-1'
  );

  // Overlay toggles
  const [showGrid100m, setShowGrid100m] = useState(true);
  const [showRangeRings, setShowRangeRings] = useState(true);
  const [showPois, setShowPois] = useState(true);

  // HUD cursor tracking
  const [cursorCoords, setCursorCoords] = useState<{ x: number; y: number } | null>(
    null
  );

  // Leaflet map instance ref for programmatic panning/zooming
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Modals state
  const [isTerrainSettingsModalOpen, setIsTerrainSettingsModalOpen] = useState(false);
  const [selectedTerrainForSettings, setSelectedTerrainForSettings] = useState<TerrainId>('everon');
  const [isInitialKolguyevPrompt, setIsInitialKolguyevPrompt] = useState(false);
  const [isLocationLayersModalOpen, setIsLocationLayersModalOpen] = useState(false);
  const [isEnfusionHelpModalOpen, setIsEnfusionHelpModalOpen] = useState(false);
  const [isMapImageModalOpen, setIsMapImageModalOpen] = useState(false);
  const [isMapHelpModalOpen, setIsMapHelpModalOpen] = useState(false);
  const [isPoiModalOpen, setIsPoiModalOpen] = useState(false);
  const [prefillPoiCoords, setPrefillPoiCoords] = useState<{ x: number; y: number } | null>(null);
  const [isAccuracyTestModalOpen, setIsAccuracyTestModalOpen] = useState(false);
  const [isServersModalOpen, setIsServersModalOpen] = useState(false);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [isBallisticsEditorOpen, setIsBallisticsEditorOpen] = useState(false);
  const [isSessionsModalOpen, setIsSessionsModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  // Mobile layout state
  const [isMobileSheetExpanded, setIsMobileSheetExpanded] = useState(false);
  const [activeSideTab, setActiveSideTab] = useState<'solution' | 'targets'>('solution');

  // Restore URL Hash or localStorage state on initial mount
  useEffect(() => {
    if (window.location.hash) {
      const decoded = decodeMissionFromHash(window.location.hash);
      if (decoded) {
        setTerrainId(decoded.terrain);
        setMortar(decoded.mortar);
        setTargets(decoded.targets);
        setSelectedTargetId(decoded.selectedTargetId);
        return;
      }
    }

    const last = getLastActiveState();
    if (last) {
      setTerrainId(last.terrain || 'everon');
      setMortar(last.mortar);
      setTargets(last.targets);
      setSelectedTargetId(last.selectedTargetId);
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    saveLastActiveState({
      terrain: terrainId,
      mortar,
      targets,
      selectedTargetId,
    });
  }, [terrainId, mortar, targets, selectedTargetId]);

  // Current Mortar definition
  const currentMortarDef = useMemo(() => {
    return (
      ballisticsDb.mortars[mortar.type] ||
      ballisticsDb.mortars['M252'] ||
      Object.values(ballisticsDb.mortars)[0]
    );
  }, [ballisticsDb, mortar.type]);

  // Calculate firing solutions for all targets
  const solutionsMap = useMemo(() => {
    const map = new Map<string, FireMissionSolution>();
    targets.forEach((tgt) => {
      const sol = computeFireSolution(mortar, tgt, currentMortarDef);
      map.set(tgt.id, sol);
    });
    return map;
  }, [mortar, targets, currentMortarDef]);

  // Active Target and its Solution
  const activeTarget = useMemo(() => {
    return targets.find((t) => t.id === selectedTargetId) || targets[0] || null;
  }, [targets, selectedTargetId]);

  const activeSolution = useMemo(() => {
    if (!activeTarget) return null;
    return solutionsMap.get(activeTarget.id) || null;
  }, [activeTarget, solutionsMap]);

  // Mortar & Target Actions
  const handleUpdateMortar = (updates: Partial<MortarState>) => {
    setMortar((prev) => ({ ...prev, ...updates }));
  };

  const handleSelectMortarType = (typeId: string) => {
    const def = ballisticsDb.mortars[typeId];
    setMortar((prev) => ({
      ...prev,
      type: typeId,
      milSystem: def ? def.defaultMilSystem : prev.milSystem,
      selectedChargeOverride: null,
    }));
  };

  const handleToggleMilSystem = (milSystem: MilSystem) => {
    setMortar((prev) => ({ ...prev, milSystem }));
  };

  const handleSetChargeOverride = (charge: number | null) => {
    setMortar((prev) => ({ ...prev, selectedChargeOverride: charge }));
  };

  // Handle terrain selection: prompt for Kolguyev size if not set
  const handleSelectTerrain = (tId: TerrainId) => {
    if (tId === 'kolguyev' && (!terrainConfigs.kolguyev.sizeMeters || terrainConfigs.kolguyev.sizeMeters <= 0)) {
      setSelectedTerrainForSettings('kolguyev');
      setIsInitialKolguyevPrompt(true);
      setIsTerrainSettingsModalOpen(true);
      return;
    }

    setTerrainId(tId);
    if (mapInstanceRef.current && terrainConfigs[tId]) {
      mapInstanceRef.current.setView(
        terrainConfigs[tId].defaultCenter,
        terrainConfigs[tId].defaultZoom
      );
    }
  };

  // Add target with nearest POI and Location Layer auto-naming
  const handleAddTarget = (coords: { x: number; y: number; altitude: number }) => {
    const currentTerrainPois = pois.filter((p) => p.terrain === terrainId);
    const autoName = getAutoTargetName(
      coords.x,
      coords.y,
      currentTerrainPois,
      locationLayers,
      language,
      autoNameDistMeters
    );

    const newTarget: Target = {
      id: `target-${Date.now()}`,
      name: autoName,
      x: coords.x,
      y: coords.y,
      altitude: coords.altitude,
      color: '#ef4444',
      createdAt: Date.now(),
    };

    setTargets((prev) => [...prev, newTarget]);
    setSelectedTargetId(newTarget.id);
  };

  const handleUpdateTarget = (id: string, updates: Partial<Target>) => {
    setTargets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const handleDeleteTarget = (id: string) => {
    setTargets((prev) => {
      const filtered = prev.filter((t) => t.id !== id);
      if (selectedTargetId === id) {
        setSelectedTargetId(filtered[0]?.id ?? null);
      }
      return filtered;
    });
  };

  const handleClearTargets = () => {
    setTargets([]);
    setSelectedTargetId(null);
  };

  // Spotter adjustment callback: adds adjusted target
  const handleApplyAdjustment = (
    newCoords: { x: number; y: number },
    newName: string
  ) => {
    sampleAltitudeAt(
      terrainId,
      newCoords.x,
      newCoords.y,
      currentTerrain.sizeMeters
    ).then(({ altitude }) => {
      const adjTarget: Target = {
        id: `target-adj-${Date.now()}`,
        name: newName,
        x: newCoords.x,
        y: newCoords.y,
        altitude,
        color: '#f59e0b',
        createdAt: Date.now(),
      };
      setTargets((prev) => [...prev, adjTarget]);
      setSelectedTargetId(adjTarget.id);
    });
  };

  // Session load callback
  const handleLoadSession = (session: SavedSession) => {
    setTerrainId(session.terrain);
    setMortar(session.mortar);
    setTargets(session.targets);
    setSelectedTargetId(session.selectedTargetId);
  };

  // Heightmap upload handler
  const handleUploadHeightmap = async (file: File) => {
    const success = await setCustomHeightmapBlob(terrainId, file);
    if (success) {
      alert(language === 'ar' ? 'تم تحميل خريطة الارتفاع بنجاح!' : 'Heightmap loaded successfully!');
    } else {
      alert(language === 'ar' ? 'فشل تحميل ملف خريطة الارتفاع.' : 'Failed to parse heightmap.');
    }
  };

  // POI actions
  const handleAddPoi = (poiData: Omit<POI, 'id'>) => {
    const newPoi: POI = {
      ...poiData,
      id: `poi-${Date.now()}`,
    };
    savePois([...pois, newPoi]);
  };

  const handleUpdatePoi = (id: string, updates: Partial<POI>) => {
    savePois(pois.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const handleDeletePoi = (id: string) => {
    savePois(pois.filter((p) => p.id !== id));
  };

  const handleImportPois = (imported: POI[]) => {
    savePois(imported);
  };

  const handleOpenAddPoiAtCoords = (coords: { x: number; y: number }) => {
    setPrefillPoiCoords(coords);
    setIsPoiModalOpen(true);
  };

  // Pan / Zoom Map Controls
  const handleGoToGrid = (coords: { x: number; y: number }) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([coords.y, coords.x], 3.5, { duration: 1 });
    }
  };

  const handleCenterMortar = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo([mortar.y, mortar.x]);
    }
  };

  const handleCenterTarget = () => {
    if (mapInstanceRef.current && activeTarget) {
      mapInstanceRef.current.panTo([activeTarget.y, activeTarget.x]);
    }
  };

  const t = translations[language];

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 select-none">
      {/* Top Tactical Navigation Bar */}
      <Navbar
        currentTerrain={currentTerrain}
        mortar={mortar}
        mortarDef={currentMortarDef}
        allMortars={ballisticsDb.mortars}
        language={language}
        showGrid100m={showGrid100m}
        showRangeRings={showRangeRings}
        showPois={showPois}
        onSelectTerrain={handleSelectTerrain}
        onSelectMortarType={handleSelectMortarType}
        onToggleMilSystem={handleToggleMilSystem}
        onToggleGrid100m={() => setShowGrid100m((v) => !v)}
        onToggleRangeRings={() => setShowRangeRings((v) => !v)}
        onTogglePois={() => setShowPois((v) => !v)}
        onToggleLanguage={() =>
          setLanguage((prev) => (prev === 'ar' ? 'en' : 'ar'))
        }
        onGoToGrid={handleGoToGrid}
        onCenterMortar={handleCenterMortar}
        onCenterTarget={handleCenterTarget}
        onOpenTerrainSettings={(tId) => {
          setSelectedTerrainForSettings(tId);
          setIsInitialKolguyevPrompt(false);
          setIsTerrainSettingsModalOpen(true);
        }}
        onOpenMapImageModal={() => setIsMapImageModalOpen(true)}
        onOpenPoiModal={() => {
          setPrefillPoiCoords(null);
          setIsPoiModalOpen(true);
        }}
        onOpenLocationLayersModal={() => setIsLocationLayersModalOpen(true)}
        onOpenAccuracyTestModal={() => setIsAccuracyTestModalOpen(true)}
        onOpenServersModal={() => setIsServersModalOpen(true)}
        onOpenBallisticsEditor={() => setIsBallisticsEditorOpen(true)}
        onOpenSessions={() => setIsSessionsModalOpen(true)}
        onOpenAbout={() => setIsAboutModalOpen(true)}
        onOpenEnfusionHelp={() => setIsEnfusionHelpModalOpen(true)}
      />

      {/* Main Workspace (Split Map + Side Panel / Mobile Bottom Sheet) */}
      <div className="flex-1 relative flex flex-col md:flex-row overflow-hidden">
        {/* Map Viewport Area */}
        <div className="flex-1 relative h-full w-full">
          <MortarMap
            terrain={currentTerrain}
            mortar={mortar}
            targets={targets}
            selectedTargetId={selectedTargetId}
            solution={activeSolution}
            showGrid100m={showGrid100m}
            showPois={showPois}
            showRangeRings={showRangeRings}
            language={language}
            terrainImageConfig={terrainImageConfig}
            pois={pois}
            locationLayers={locationLayers}
            onUpdateMortar={handleUpdateMortar}
            onAddTarget={handleAddTarget}
            onUpdateTarget={handleUpdateTarget}
            onSelectTarget={setSelectedTargetId}
            onDeleteTarget={handleDeleteTarget}
            onCursorMove={setCursorCoords}
            onOpenUploadModal={() => setIsMapImageModalOpen(true)}
            onOpenHelpModal={() => setIsMapHelpModalOpen(true)}
            onAddPlaceAtCoords={handleOpenAddPoiAtCoords}
            mapInstanceRef={mapInstanceRef}
          />

          {/* Tactical HUD Overlay (Coordinates & Target status) */}
          <TacticalHUD
            cursorCoords={cursorCoords}
            mortarCoords={mortar}
            activeTargetCoords={activeTarget}
            language={language}
            milSystem={mortar.milSystem}
          />

          {/* Mobile Tab Floating Switcher */}
          <div className="md:hidden absolute bottom-16 end-4 z-30 flex flex-col gap-2">
            <button
              onClick={() => setActiveSideTab(activeSideTab === 'targets' ? 'solution' : 'targets')}
              className="p-3 rounded-full bg-slate-900 border border-slate-700 text-cyan-400 shadow-2xl flex items-center justify-center active:scale-95"
              title={t.targets}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Desktop Side Panel & Mobile Bottom Sheet */}
        <div
          className={`
            z-30 md:static md:w-[440px] lg:w-[480px] md:h-full md:border-s border-slate-800 bg-slate-950/95
            fixed bottom-0 start-0 end-0 max-h-[85vh] transition-transform duration-200
            flex flex-col shadow-2xl
          `}
        >
          {/* Desktop Tab Switcher */}
          <div className="hidden md:flex border-b border-slate-800 bg-slate-900/60 p-1.5 gap-1">
            <button
              onClick={() => setActiveSideTab('solution')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeSideTab === 'solution'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TargetIcon className="w-3.5 h-3.5" />
              <span>{t.solution}</span>
            </button>
            <button
              onClick={() => setActiveSideTab('targets')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeSideTab === 'targets'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>
                {t.targets} ({targets.length})
              </span>
            </button>
          </div>

          {/* Side Panel Content Scroll Area */}
          <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-3">
            {activeSideTab === 'solution' ? (
              <FireSolutionCard
                solution={activeSolution}
                mortar={mortar}
                mortarDef={currentMortarDef}
                target={activeTarget}
                language={language}
                isPlaceholderData={ballisticsDb.isPlaceholder ?? true}
                onUpdateMortarAltitude={(alt) => handleUpdateMortar({ altitude: alt })}
                onUpdateTargetAltitude={(alt) => {
                  if (activeTarget) {
                    handleUpdateTarget(activeTarget.id, { altitude: alt });
                  }
                }}
                onSetChargeOverride={handleSetChargeOverride}
                onOpenAdjustment={() => setIsAdjustmentModalOpen(true)}
                onUploadHeightmap={handleUploadHeightmap}
                isHeightmapAvailable={isHeightmapImageLoaded(terrainId)}
                isMobileSheetExpanded={isMobileSheetExpanded}
                onToggleMobileSheet={() => setIsMobileSheetExpanded(!isMobileSheetExpanded)}
              />
            ) : (
              <TargetManager
                targets={targets}
                selectedTargetId={selectedTargetId}
                language={language}
                onSelectTarget={(id) => {
                  setSelectedTargetId(id);
                  setActiveSideTab('solution');
                }}
                onUpdateTarget={handleUpdateTarget}
                onDeleteTarget={handleDeleteTarget}
                onClearTargets={handleClearTargets}
                onReorderTargets={setTargets}
                solutionsMap={solutionsMap}
              />
            )}
          </div>
        </div>
      </div>

      {/* MODALS */}
      {/* 1. Map Image & Calibration */}
      <MapImageCalibrationModal
        isOpen={isMapImageModalOpen}
        onClose={() => setIsMapImageModalOpen(false)}
        terrain={terrainId}
        language={language}
        imageConfig={terrainImageConfig}
        onImageConfigChanged={setTerrainImageConfig}
        onOpenHelp={() => {
          setIsMapImageModalOpen(false);
          setIsMapHelpModalOpen(true);
        }}
        onOpenEnfusionHelp={() => {
          setIsMapImageModalOpen(false);
          setIsEnfusionHelpModalOpen(true);
        }}
      />

      {/* 2. Map Image Preparation Help */}
      <MapHelpModal
        isOpen={isMapHelpModalOpen}
        onClose={() => setIsMapHelpModalOpen(false)}
        language={language}
      />

      {/* 3. EnfusionMapMaker Guide */}
      <EnfusionHelpModal
        isOpen={isEnfusionHelpModalOpen}
        onClose={() => setIsEnfusionHelpModalOpen(false)}
        language={language}
      />

      {/* 4. Terrain Dimensions & Size Settings */}
      <TerrainSettingsModal
        isOpen={isTerrainSettingsModalOpen}
        onClose={() => setIsTerrainSettingsModalOpen(false)}
        terrainId={selectedTerrainForSettings}
        terrainConfigs={terrainConfigs}
        language={language}
        onSaveTerrainSize={handleSaveTerrainSize}
        isInitialKolguyevPrompt={isInitialKolguyevPrompt}
      />

      {/* 5. Location Layers (JSON) */}
      <LocationLayersModal
        isOpen={isLocationLayersModalOpen}
        onClose={() => setIsLocationLayersModalOpen(false)}
        terrain={terrainId}
        language={language}
        layers={locationLayers}
        onLayersChanged={setLocationLayers}
      />

      {/* 6. POI & Places Editor */}
      <PoiEditorModal
        isOpen={isPoiModalOpen}
        onClose={() => {
          setIsPoiModalOpen(false);
          setPrefillPoiCoords(null);
        }}
        terrain={terrainId}
        language={language}
        pois={pois}
        onAddPoi={handleAddPoi}
        onUpdatePoi={handleUpdatePoi}
        onDeletePoi={handleDeletePoi}
        onImportPois={handleImportPois}
        autoNameDistMeters={autoNameDistMeters}
        onSetAutoNameDist={setAutoNameDistMeters}
        prefillCoords={prefillPoiCoords}
      />

      {/* 7. Accuracy Verification Test */}
      <AccuracyTestModal
        isOpen={isAccuracyTestModalOpen}
        onClose={() => setIsAccuracyTestModalOpen(false)}
        mortarDef={currentMortarDef}
        language={language}
      />

      {/* 8. Servers Tab / Modal */}
      <ServersModal
        isOpen={isServersModalOpen}
        onClose={() => setIsServersModalOpen(false)}
        language={language}
      />

      {/* 9. Fire Adjustment Tool */}
      <FireAdjustmentModal
        isOpen={isAdjustmentModalOpen}
        onClose={() => setIsAdjustmentModalOpen(false)}
        target={activeTarget}
        mortar={mortar}
        mortarDef={currentMortarDef}
        solution={activeSolution}
        language={language}
        onApplyAdjustment={handleApplyAdjustment}
      />

      {/* 10. Ballistics Editor Modal */}
      <BallisticsEditorModal
        isOpen={isBallisticsEditorOpen}
        onClose={() => setIsBallisticsEditorOpen(false)}
        database={ballisticsDb}
        language={language}
        onSaveDatabase={handleSaveBallistics}
      />

      {/* 11. Session Manager Modal */}
      <SessionManagerModal
        isOpen={isSessionsModalOpen}
        onClose={() => setIsSessionsModalOpen(false)}
        language={language}
        currentTerrain={terrainId}
        currentMortar={mortar}
        currentTargets={targets}
        selectedTargetId={selectedTargetId}
        onLoadSession={handleLoadSession}
      />

      {/* 12. About & Disclaimers Modal */}
      <AboutModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
        language={language}
      />
    </div>
  );
}
