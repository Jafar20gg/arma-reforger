import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Crosshair,
  MapPin,
  Compass,
  Globe,
  Layers,
  Navigation,
  Sliders,
  Flame,
  Edit3,
  MoreVertical
} from 'lucide-react';
import { MAPS, getMapWithOverrides } from './data/mapsData';
import {
  MapDefinition,
  PlacementMode,
  WeaponType,
  WorldPoint,
  SavedTarget,
  Language,
  MapAppearanceSettings,
  MapPOI
} from './types/mortar';
import {
  InterfaceVisibilitySettings,
  DEFAULT_INTERFACE_VISIBILITY,
  WindSettings,
  DEFAULT_WIND_SETTINGS,
  DisplayPreferences,
  DEFAULT_DISPLAY_PREFERENCES,
  VisualCustomizationSettings,
  DEFAULT_VISUAL_CUSTOMIZATION,
} from './types/settings';
import { TacticalMap } from './components/TacticalMap';
import { BallisticPanel } from './components/BallisticPanel';
import { TargetManager } from './components/TargetManager';
import { CoordinateInputModal } from './components/CoordinateInputModal';
import { LandmarkEditModal } from './components/LandmarkEditModal';
import { Sidebar } from './components/Sidebar';
import { SettingsModal } from './components/SettingsModal';
import { UICustomizerToolbar } from './components/UICustomizerToolbar';
import { CustomizableElementWrapper } from './components/CustomizableElementWrapper';
import {
  UIElementId,
  UIElementConfig,
  LayoutProfile,
  UICustomizationState
} from './types/customization';
import {
  loadCustomizationState,
  saveCustomizationState,
  exportCustomizationToFile,
  parseCustomizationBackup,
  DEFAULT_ELEMENT_CONFIGS,
  PRESET_PROFILES
} from './utils/customizationStorage';
import { computeFireSolution } from './utils/ballistics';
import { formatGrid } from './utils/coordinates';
import { getTranslation } from './utils/i18n';
import {
  loadPersistentState,
  savePersistentState,
  loadLandmarkOverrides,
  saveLandmarkOverride,
  removeLandmarkOverride,
  clearAllLandmarkOverrides,
  AppPersistentState,
  DEFAULT_STATE,
  DEFAULT_APPEARANCE
} from './utils/storage';

export default function App() {
  const [persistedState] = useState<AppPersistentState>(() => loadPersistentState());
  const [selectedMapId, setSelectedMapId] = useState<string>(persistedState.selectedMapId);
  const [lang, setLang] = useState<Language>(persistedState.language || 'ar');
  const t = getTranslation(lang);

  const [customizationState, setCustomizationState] = useState<UICustomizationState>(() => loadCustomizationState());
  const [isCustomizing, setIsCustomizing] = useState<boolean>(false);
  const [customizerSelectedId, setCustomizerSelectedId] = useState<UIElementId>('modeToolbar');
  const [customizerPreviewing, setCustomizerPreviewing] = useState<boolean>(false);
  const [undoStack, setUndoStack] = useState<LayoutProfile[]>([]);
  const [redoStack, setRedoStack] = useState<LayoutProfile[]>([]);

  const activeProfile: LayoutProfile = useMemo(() => {
    return (
      customizationState.profiles.find(p => p.id === customizationState.activeProfileId) ||
      customizationState.profiles[0] ||
      PRESET_PROFILES[0]
    );
  }, [customizationState]);

  const [mortar, setMortar] = useState<WorldPoint>(persistedState.mortar);
  const [target, setTarget] = useState<WorldPoint>(persistedState.target);

  const [placementMode, setPlacementMode] = useState<PlacementMode>('none');
  const [weaponType, setWeaponType] = useState<WeaponType>(persistedState.weaponType);
  const [projectileId, setProjectileId] = useState<string>(persistedState.projectileId);
  const [preferredCharge, setPreferredCharge] = useState<number | undefined>(persistedState.preferredCharge);

  const [appearance, setAppearance] = useState<MapAppearanceSettings>(persistedState.appearance);

  const [landmarkOverrides, setLandmarkOverrides] = useState<Record<string, { xMeters: number; yMeters: number; altitudeMeters: number; isCustomized: boolean; updatedAt: number }>>(
    () => persistedState.landmarkOverrides || loadLandmarkOverrides()
  );

  const currentMap: MapDefinition = useMemo(() => {
    const base = MAPS[selectedMapId] || MAPS.everon;
    return getMapWithOverrides(base, landmarkOverrides);
  }, [selectedMapId, landmarkOverrides]);

  const [savedTargets, setSavedTargets] = useState<SavedTarget[]>(persistedState.savedTargets);

  const [coordModalType, setCoordModalType] = useState<'mortar' | 'target' | null>(null);
  const [editingPoi, setEditingPoi] = useState<MapPOI | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'map' | 'hud'>('map');

  const [interfaceVisibility, setInterfaceVisibility] = useState<InterfaceVisibilitySettings>(
    () => persistedState.interfaceVisibility || DEFAULT_INTERFACE_VISIBILITY
  );
  const [windSettings, setWindSettings] = useState<WindSettings>(
    () => persistedState.windSettings || DEFAULT_WIND_SETTINGS
  );
  const [displayPreferences, setDisplayPreferences] = useState<DisplayPreferences>(
    () => persistedState.displayPreferences || DEFAULT_DISPLAY_PREFERENCES
  );
  const [visualCustomization, setVisualCustomization] = useState<VisualCustomizationSettings>(
    () => persistedState.visualCustomization || DEFAULT_VISUAL_CUSTOMIZATION
  );

  const pushUndo = useCallback((current: LayoutProfile) => {
    setUndoStack(prev => [...prev.slice(-20), JSON.parse(JSON.stringify(current))]);
    setRedoStack([]);
  }, []);

  const handleSelectProfile = useCallback((profileId: string) => {
    setCustomizationState(prev => {
      const next = { ...prev, activeProfileId: profileId };
      saveCustomizationState(next);
      return next;
    });
  }, []);

  const handleUpdateElementConfig = useCallback((id: UIElementId, partial: Partial<UIElementConfig>) => {
    pushUndo(activeProfile);
    setCustomizationState(prev => {
      const updatedProfiles = prev.profiles.map(p => {
        if (p.id !== prev.activeProfileId) return p;
        return {
          ...p,
          elements: {
            ...p.elements,
            [id]: {
              ...p.elements[id],
              ...partial,
            },
          },
        };
      });
      const next = { ...prev, profiles: updatedProfiles };
      saveCustomizationState(next);
      return next;
    });
  }, [activeProfile, pushUndo]);

  const handleResetElement = useCallback((id: UIElementId) => {
    pushUndo(activeProfile);
    setCustomizationState(prev => {
      const updatedProfiles = prev.profiles.map(p => {
        if (p.id !== prev.activeProfileId) return p;
        return {
          ...p,
          elements: {
            ...p.elements,
            [id]: { ...DEFAULT_ELEMENT_CONFIGS[id] },
          },
        };
      });
      const next = { ...prev, profiles: updatedProfiles };
      saveCustomizationState(next);
      return next;
    });
  }, [activeProfile, pushUndo]);

  const handleResetLayout = useCallback(() => {
    pushUndo(activeProfile);
    setCustomizationState(prev => {
      const updatedProfiles = prev.profiles.map(p => {
        if (p.id !== prev.activeProfileId) return p;
        return {
          ...p,
          elements: { ...DEFAULT_ELEMENT_CONFIGS },
        };
      });
      const next = { ...prev, profiles: updatedProfiles };
      saveCustomizationState(next);
      return next;
    });
  }, [activeProfile, pushUndo]);

  const handleCreateProfile = useCallback((name: string) => {
    const newId = `profile-${Date.now()}`;
    const newProfile: LayoutProfile = {
      id: newId,
      name,
      nameAr: name,
      isPreset: false,
      elements: JSON.parse(JSON.stringify(activeProfile.elements)),
    };
    setCustomizationState(prev => {
      const next = {
        ...prev,
        activeProfileId: newId,
        profiles: [...prev.profiles, newProfile],
      };
      saveCustomizationState(next);
      return next;
    });
  }, [activeProfile]);

  const handleRenameProfile = useCallback((profileId: string, newName: string) => {
    setCustomizationState(prev => {
      const updatedProfiles = prev.profiles.map(p => {
        if (p.id !== profileId) return p;
        return { ...p, name: newName, nameAr: newName };
      });
      const next = { ...prev, profiles: updatedProfiles };
      saveCustomizationState(next);
      return next;
    });
  }, []);

  const handleDeleteProfile = useCallback((profileId: string) => {
    setCustomizationState(prev => {
      const updatedProfiles = prev.profiles.filter(p => p.id !== profileId);
      const nextActiveId = updatedProfiles[0]?.id || 'profile-compact';
      const next = {
        ...prev,
        activeProfileId: nextActiveId,
        profiles: updatedProfiles,
      };
      saveCustomizationState(next);
      return next;
    });
  }, []);

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const prevProfile = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    setRedoStack(prev => [...prev, JSON.parse(JSON.stringify(activeProfile))]);
    setCustomizationState(prev => {
      const updatedProfiles = prev.profiles.map(p => {
        if (p.id !== prev.activeProfileId) return p;
        return prevProfile;
      });
      const next = { ...prev, profiles: updatedProfiles };
      saveCustomizationState(next);
      return next;
    });
  }, [undoStack, activeProfile]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const nextProfile = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    setUndoStack(prev => [...prev, JSON.parse(JSON.stringify(activeProfile))]);
    setCustomizationState(prev => {
      const updatedProfiles = prev.profiles.map(p => {
        if (p.id !== prev.activeProfileId) return p;
        return nextProfile;
      });
      const next = { ...prev, profiles: updatedProfiles };
      saveCustomizationState(next);
      return next;
    });
  }, [redoStack, activeProfile]);

  const handleSaveCustomization = useCallback(() => {
    saveCustomizationState(customizationState);
    setIsCustomizing(false);
  }, [customizationState]);

  const handleCancelCustomization = useCallback(() => {
    setCustomizationState(loadCustomizationState());
    setIsCustomizing(false);
  }, []);

  const handleExportCustomization = useCallback(() => {
    exportCustomizationToFile(customizationState);
  }, [customizationState]);

  const handleImportCustomization = useCallback((jsonStr: string) => {
    const parsed = parseCustomizationBackup(jsonStr);
    if (!parsed) {
      alert('Invalid layout backup JSON file');
      return;
    }
    setCustomizationState(parsed);
    saveCustomizationState(parsed);
  }, []);

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    const stateToSave: Partial<AppPersistentState> = {
      language: lang,
      selectedMapId,
      mortar,
      target,
      weaponType,
      projectileId,
      preferredCharge,
      savedTargets,
      appearance,
      landmarkOverrides,
      interfaceVisibility,
      windSettings,
    };
    savePersistentState(stateToSave);
  }, [
    lang,
    selectedMapId,
    mortar,
    target,
    weaponType,
    projectileId,
    preferredCharge,
    savedTargets,
    appearance,
    landmarkOverrides,
    interfaceVisibility,
    windSettings,
  ]);

  const handleMapChange = (mapId: string) => {
    const nextMap = MAPS[mapId];
    if (!nextMap) return;
    setSelectedMapId(mapId);
    setMortar({
      xMeters: nextMap.defaultCenter.xMeters - 500,
      yMeters: nextMap.defaultCenter.yMeters - 300,
      altitudeMeters: nextMap.defaultCenter.altitudeMeters ?? 40,
    });
    setTarget({
      xMeters: nextMap.defaultCenter.xMeters + 700,
      yMeters: nextMap.defaultCenter.yMeters + 500,
      altitudeMeters: (nextMap.defaultCenter.altitudeMeters ?? 40) + 20,
    });
  };

  const handleWeaponChange = (weapon: WeaponType) => {
    setWeaponType(weapon);
    setPreferredCharge(undefined);
    if (weapon === 'm252') {
      setProjectileId('m821-he');
    } else {
      setProjectileId('o-832du');
    }
  };

  const handleSaveTarget = (newTgt: SavedTarget) => {
    const updated = [newTgt, ...savedTargets];
    setSavedTargets(updated);
  };

  const handleDeleteTarget = (id: string) => {
    const updated = savedTargets.filter(t => t.id !== id);
    setSavedTargets(updated);
  };

  const handleSelectSavedTarget = (tgt: SavedTarget) => {
    setTarget({
      xMeters: tgt.xMeters,
      yMeters: tgt.yMeters,
      altitudeMeters: tgt.altitudeMeters,
    });
  };

  const handleToggleAppearance = (key: keyof MapAppearanceSettings) => {
    setAppearance(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSaveLandmarkOverride = (
    id: string,
    coords: { xMeters: number; yMeters: number; altitudeMeters: number }
  ) => {
    const updated = saveLandmarkOverride(id, coords);
    setLandmarkOverrides({ ...updated });
  };

  const handleResetLandmarkOverride = (id: string) => {
    const updated = removeLandmarkOverride(id);
    setLandmarkOverrides({ ...updated });
  };

  const handleClearAllLandmarkOverrides = () => {
    clearAllLandmarkOverrides();
    setLandmarkOverrides({});
  };

  const handleRestoreState = (imported: AppPersistentState) => {
    setLang(imported.language);
    setSelectedMapId(imported.selectedMapId);
    setMortar(imported.mortar);
    setTarget(imported.target);
    setWeaponType(imported.weaponType);
    setProjectileId(imported.projectileId);
    setPreferredCharge(imported.preferredCharge);
    setSavedTargets(imported.savedTargets);
    setAppearance(imported.appearance);
    if (imported.landmarkOverrides) {
      setLandmarkOverrides(imported.landmarkOverrides);
    }
    if (imported.interfaceVisibility) {
      setInterfaceVisibility(imported.interfaceVisibility);
    }
    if (imported.windSettings) {
      setWindSettings(imported.windSettings);
    }
    if (imported.displayPreferences) {
      setDisplayPreferences(imported.displayPreferences);
    }
    if (imported.visualCustomization) {
      setVisualCustomization(imported.visualCustomization);
    }
  };

  const handleResetDefaults = () => {
    localStorage.removeItem('arma_reforger_fcs_state_v3');
    clearAllLandmarkOverrides();
    setLandmarkOverrides({});
    setInterfaceVisibility(DEFAULT_INTERFACE_VISIBILITY);
    setWindSettings(DEFAULT_WIND_SETTINGS);
    setDisplayPreferences(DEFAULT_DISPLAY_PREFERENCES);
    setVisualCustomization(DEFAULT_VISUAL_CUSTOMIZATION);
    handleRestoreState(DEFAULT_STATE);
  };

  const fullState: AppPersistentState = useMemo(() => ({
    version: 3,
    language: lang,
    selectedMapId,
    mortar,
    target,
    weaponType,
    projectileId,
    preferredCharge,
    savedTargets,
    appearance,
    landmarkOverrides,
    interfaceVisibility,
    windSettings,
    displayPreferences,
    visualCustomization,
    shooterData: persistedState.shooterData,
    customProfiles: persistedState.customProfiles,
  }), [
    lang,
    selectedMapId,
    mortar,
    target,
    weaponType,
    projectileId,
    preferredCharge,
    savedTargets,
    appearance,
    landmarkOverrides,
    interfaceVisibility,
    windSettings,
    displayPreferences,
    visualCustomization,
    persistedState.shooterData,
    persistedState.customProfiles,
  ]);

  const solution = useMemo(() => {
    return computeFireSolution({
      mortar,
      target,
      weaponType,
      projectileId,
      preferredCharge,
    });
  }, [mortar, target, weaponType, projectileId, preferredCharge]);

  const isAsideVisible = useMemo(() => {
    return Boolean(
      interfaceVisibility.showMortarPanel ||
      interfaceVisibility.showTargetPanel ||
      interfaceVisibility.showBallisticInfo ||
      interfaceVisibility.showInfoCards
    );
  }, [interfaceVisibility]);

  return (
    <div className={`min-h-screen w-full flex flex-col bg-neutral-950 text-neutral-100 font-mono select-none ${isCustomizing ? 'pt-16' : ''}`}>
      {isCustomizing && (
        <UICustomizerToolbar
          lang={lang}
          activeProfile={activeProfile}
          profiles={customizationState.profiles}
          selectedElementId={customizerSelectedId}
          isPreviewing={customizerPreviewing}
          canUndo={undoStack.length > 0}
          canRedo={redoStack.length > 0}
          onSelectElement={setCustomizerSelectedId}
          onUpdateElementConfig={handleUpdateElementConfig}
          onResetElement={handleResetElement}
          onSelectProfile={handleSelectProfile}
          onCreateProfile={handleCreateProfile}
          onRenameProfile={handleRenameProfile}
          onDeleteProfile={handleDeleteProfile}
          onTogglePreview={() => setCustomizerPreviewing(prev => !prev)}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onResetLayout={handleResetLayout}
          onSave={handleSaveCustomization}
          onCancel={handleCancelCustomization}
          onExport={handleExportCustomization}
          onImport={handleImportCustomization}
        />
      )}

      {interfaceVisibility.showAppHeader && (
        <CustomizableElementWrapper
          id="header"
          config={activeProfile.elements.header}
          isCustomizing={isCustomizing}
          isSelected={customizerSelectedId === 'header'}
          isPreviewing={customizerPreviewing}
          onSelect={setCustomizerSelectedId}
          onUpdateConfig={handleUpdateElementConfig}
          className="z-30 w-full"
          transformOrigin="top left"
        >
          <header className="bg-neutral-900 border-b border-neutral-800 px-2 sm:px-3 py-1.5 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-600 flex items-center justify-center shadow-lg shadow-amber-950/60 ring-1 ring-amber-400 shrink-0">
                <Compass className="w-4 h-4 text-neutral-950 stroke-[2.5]" />
              </div>
              <div className="flex flex-col">
                <h1 className="font-tactical text-xs sm:text-sm font-bold tracking-wider uppercase text-neutral-100 flex items-center gap-1.5">
                  <span>{t.appTitle}</span>
                  <span className="hidden sm:inline-block px-1.5 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[9px] rounded font-mono">
                    v1.8.0
                  </span>
                </h1>
                <span className="text-[9.5px] text-neutral-400 font-mono hidden md:inline">
                  {t.appSubTitle}
                </span>
              </div>
            </div>

            {interfaceVisibility.showStatusIndicators && (
              <div className="hidden lg:flex items-center gap-2 bg-neutral-950 border border-neutral-700/80 rounded-lg px-2.5 py-0.5">
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-tactical uppercase font-bold text-neutral-400">
                    {t.elevationTube}:
                  </span>
                  <span className="font-mono text-xs font-black text-emerald-400">
                    {solution.inRange ? `${solution.elevationDegrees}°` : '---°'}
                  </span>
                  <span className="text-[9px] font-mono text-emerald-500">
                    ({solution.inRange ? `${solution.elevationMils}M` : 'OOR'})
                  </span>
                </div>
                <span className="text-neutral-700">|</span>
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-tactical uppercase font-bold text-neutral-400">
                    {t.azimuth}:
                  </span>
                  <span className="font-mono text-xs font-bold text-amber-400">
                    {solution.azimuthMils} MIL
                  </span>
                  <span className="text-[9px] font-mono text-neutral-400">
                    ({solution.azimuthDegrees}°)
                  </span>
                </div>
                <span className="text-neutral-700">|</span>
                <div className="flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-500" />
                  <span className="text-[9px] font-tactical text-amber-400 font-bold uppercase">
                    {solution.inRange ? `C-${solution.chargeRings}` : '--'}
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-1 sm:gap-1.5">
              <div className="flex items-center gap-1 bg-neutral-950 border border-neutral-700/80 rounded-lg px-1.5 py-0.5">
                <Layers className="w-3 h-3 text-amber-400 shrink-0" />
                <select
                  value={selectedMapId}
                  onChange={e => handleMapChange(e.target.value)}
                  className="bg-transparent text-[11px] sm:text-xs font-tactical font-semibold text-neutral-200 focus:outline-none cursor-pointer max-w-[90px] sm:max-w-none truncate"
                >
                  {Object.values(MAPS).map(m => (
                    <option key={m.id} value={m.id} className="bg-neutral-900 text-neutral-100">
                      {lang === 'ar' ? m.nameAr : m.name} ({m.subTitle.split(' ')[0]})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
                className="flex items-center gap-1 px-2 py-0.5 bg-neutral-950 border border-neutral-700/80 rounded-lg text-[11px] font-tactical font-bold text-neutral-300 hover:text-white hover:border-amber-500 transition shadow-sm"
                title="Toggle Arabic / English"
              >
                <Globe className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="hidden sm:inline">{lang === 'en' ? 'العربية' : 'English'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center gap-1 px-2 py-0.5 bg-amber-600 hover:bg-amber-500 text-neutral-950 border border-amber-400 rounded-lg text-[11px] font-tactical font-bold transition shadow-md shadow-amber-950/60 ring-1 ring-amber-400"
                title={t.settings}
              >
                <MoreVertical className="w-3 h-3 stroke-[2.5]" />
                <span className="hidden sm:inline">{t.settings}</span>
              </button>

              {interfaceVisibility.showAdvancedControls && (
                <button
                  type="button"
                  onClick={() => setIsCustomizing(prev => !prev)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-tactical font-bold transition shadow-sm border ${
                    isCustomizing
                      ? 'bg-amber-500 text-neutral-950 border-amber-300 ring-2 ring-amber-400'
                      : 'bg-neutral-950 border-neutral-700/80 text-amber-400 hover:text-white hover:border-amber-500'
                  }`}
                  title="Customize UI Layout"
                >
                  <Edit3 className="w-3 h-3" />
                  <span className="hidden sm:inline">{lang === 'ar' ? 'تخصيص' : 'Customize UI'}</span>
                </button>
              )}

              {interfaceVisibility.showAdvancedControls && (
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(true)}
                  className="flex items-center gap-1 px-2 py-0.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 font-tactical font-bold rounded-lg text-[11px] transition border border-neutral-700"
                  title={t.sidebarTitle}
                >
                  <Sliders className="w-3 h-3 stroke-[2.5]" />
                  <span className="hidden sm:inline">{lang === 'ar' ? 'العمليات' : 'Menu'}</span>
                </button>
              )}
            </div>
          </header>
        </CustomizableElementWrapper>
      )}

      {interfaceVisibility.showNavigation && (
        <div className="lg:hidden flex items-center bg-neutral-900 border-b border-neutral-800 px-2 py-1 justify-around font-tactical text-xs font-bold">
          <button
            type="button"
            onClick={() => setMobileTab('map')}
            className={`flex-1 py-1 rounded text-center transition ${
              mobileTab === 'map'
                ? 'bg-amber-600 text-white shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            {t.tabMap}
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('hud')}
            className={`flex-1 py-1 rounded text-center transition flex items-center justify-center gap-1.5 ${
              mobileTab === 'hud'
                ? 'bg-amber-600 text-white shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <span>{t.tabFireControl}</span>
            {solution.inRange && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
        </div>
      )}

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        <section
          className={`flex-1 min-h-0 flex flex-col relative p-1.5 sm:p-2.5 ${
            mobileTab === 'map' ? 'flex h-[calc(100vh-85px)] lg:h-full' : 'hidden lg:flex lg:h-full'
          }`}
        >
          <TacticalMap
            mapDef={currentMap}
            mortar={mortar}
            target={target}
            weaponType={weaponType}
            placementMode={placementMode}
            solution={solution}
            lang={lang}
            appearance={appearance}
            visibility={interfaceVisibility}
            windSettings={windSettings}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onLanguageChange={setLang}
            isCustomizing={isCustomizing}
            customizerSelectedId={customizerSelectedId}
            customizerPreviewing={customizerPreviewing}
            elementConfigs={activeProfile.elements}
            labelOffsets={customizationState.labelOffsets}
            onMortarChange={setMortar}
            onTargetChange={setTarget}
            onModeChange={setPlacementMode}
            onToggleAppearance={handleToggleAppearance}
            onEditLandmark={poi => setEditingPoi(poi)}
            onSelectElement={setCustomizerSelectedId}
            onUpdateElementConfig={handleUpdateElementConfig}
          />
        </section>

        {isAsideVisible && (
          <CustomizableElementWrapper
            id="fireControlAside"
            config={activeProfile.elements.fireControlAside}
            isCustomizing={isCustomizing}
            isSelected={customizerSelectedId === 'fireControlAside'}
            isPreviewing={customizerPreviewing}
            onSelect={setCustomizerSelectedId}
            onUpdateConfig={handleUpdateElementConfig}
            className={`w-full lg:w-[440px] xl:w-[470px] border-t lg:border-t-0 lg:border-l border-neutral-800 bg-neutral-950/95 overflow-y-auto max-h-[calc(100vh-85px)] lg:max-h-[calc(100vh-46px)] ${
              mobileTab === 'hud' ? 'flex' : 'hidden lg:flex'
            }`}
            transformOrigin="top right"
          >
            <aside className="w-full flex flex-col p-2 sm:p-2.5 gap-2">
              {(interfaceVisibility.showMortarPanel || interfaceVisibility.showTargetPanel || interfaceVisibility.showInfoCards) && (
                <div className="grid grid-cols-2 gap-1.5">
                  {(interfaceVisibility.showMortarPanel || interfaceVisibility.showInfoCards) && (
                    <div className="flex flex-col gap-0.5 p-2 bg-neutral-900/90 border border-neutral-800 rounded-lg shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Crosshair className="w-3 h-3 text-red-500" />
                          <span className="font-tactical text-[11px] font-bold text-neutral-200">
                            {t.mortarPos}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCoordModalType('mortar')}
                          className="text-[9px] text-amber-400 hover:text-amber-300 font-mono underline"
                        >
                          {lang === 'ar' ? 'تعديل' : 'Edit'}
                        </button>
                      </div>
                      <div className="font-mono text-[11px] text-red-400 font-bold">
                        {t.grid}: {formatGrid(mortar, 8)}
                      </div>
                      <div className="text-[9px] text-neutral-400 font-mono">
                        X:{mortar.xMeters}m Y:{mortar.yMeters}m Alt:{mortar.altitudeMeters ?? 0}m
                      </div>
                    </div>
                  )}

                  {(interfaceVisibility.showTargetPanel || interfaceVisibility.showInfoCards) && (
                    <div className="flex flex-col gap-0.5 p-2 bg-neutral-900/90 border border-neutral-800 rounded-lg shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-blue-500" />
                          <span className="font-tactical text-[11px] font-bold text-neutral-200">
                            {t.targetPos}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCoordModalType('target')}
                          className="text-[9px] text-amber-400 hover:text-amber-300 font-mono underline"
                        >
                          {lang === 'ar' ? 'تعديل' : 'Edit'}
                        </button>
                      </div>
                      <div className="font-mono text-[11px] text-blue-400 font-bold">
                        {t.grid}: {formatGrid(target, 8)}
                      </div>
                      <div className="text-[9px] text-neutral-400 font-mono">
                        X:{target.xMeters}m Y:{target.yMeters}m Alt:{target.altitudeMeters ?? 0}m
                      </div>
                    </div>
                  )}
                </div>
              )}

              {interfaceVisibility.showBallisticInfo && (
                <BallisticPanel
                  solution={solution}
                  weaponType={weaponType}
                  projectileId={projectileId}
                  preferredCharge={preferredCharge}
                  mortar={mortar}
                  target={target}
                  lang={lang}
                  onWeaponChange={handleWeaponChange}
                  onProjectileChange={setProjectileId}
                  onChargeChange={setPreferredCharge}
                  onMortarAltChange={alt => setMortar(m => ({ ...m, altitudeMeters: alt }))}
                  onTargetAltChange={alt => setTarget(tgt => ({ ...tgt, altitudeMeters: alt }))}
                />
              )}

              {(interfaceVisibility.showInfoCards || interfaceVisibility.showTargetPanel) && (
                <div className="flex flex-col gap-1.5 bg-neutral-900/90 border border-neutral-800 rounded-lg p-2.5 shadow-sm">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-1">
                    <div className="flex items-center gap-1.5">
                      <Navigation className="w-3.5 h-3.5 text-amber-500" />
                      <h4 className="font-tactical text-[11px] font-bold uppercase tracking-wider text-neutral-300">
                        {t.controlPoints} ({lang === 'ar' && currentMap.nameAr ? currentMap.nameAr : currentMap.name})
                      </h4>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1 max-h-36 overflow-y-auto pr-1">
                    {currentMap.controlPoints.map(cp => (
                      <button
                        key={cp.id}
                        type="button"
                        onClick={() => {
                          setTarget({
                            xMeters: cp.xMeters,
                            yMeters: cp.yMeters,
                            altitudeMeters: cp.altitudeMeters ?? 0,
                          });
                        }}
                        className="p-1 rounded bg-neutral-950 border border-neutral-800/80 hover:border-amber-500/60 transition text-left rtl:text-right flex flex-col"
                      >
                        <span className="text-[11px] font-tactical font-semibold text-neutral-200 truncate">
                          {lang === 'ar' && cp.nameAr ? cp.nameAr : cp.name}
                          {cp.isUserCustomized ? ' *' : ''}
                        </span>
                        <span className="text-[9px] font-mono text-neutral-400">
                          {formatGrid(cp, 6)} ({cp.altitudeMeters}m)
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {interfaceVisibility.showTargetPanel && (
                <TargetManager
                  currentTarget={target}
                  savedTargets={savedTargets}
                  lang={lang}
                  onSaveTarget={handleSaveTarget}
                  onDeleteTarget={handleDeleteTarget}
                  onSelectTarget={handleSelectSavedTarget}
                />
              )}
            </aside>
          </CustomizableElementWrapper>
        )}
      </main>

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        lang={lang}
        onLanguageChange={setLang}
        selectedMapId={selectedMapId}
        onMapChange={handleMapChange}
        appearance={appearance}
        onAppearanceChange={setAppearance}
        weaponType={weaponType}
        onWeaponChange={handleWeaponChange}
        projectileId={projectileId}
        onProjectileChange={setProjectileId}
        savedTargets={savedTargets}
        onSelectTarget={handleSelectSavedTarget}
        onDeleteTarget={handleDeleteTarget}
        mortar={mortar}
        target={target}
        fullState={fullState}
        landmarkOverrides={landmarkOverrides}
        customizationState={customizationState}
        onSelectLayoutProfile={handleSelectProfile}
        onToggleCustomizer={() => {
          setIsSidebarOpen(false);
          setIsCustomizing(true);
        }}
        onResetLandmarkOverride={handleResetLandmarkOverride}
        onClearAllLandmarkOverrides={handleClearAllLandmarkOverrides}
        onRestoreState={handleRestoreState}
        onResetDefaults={handleResetDefaults}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        lang={lang}
        onLanguageChange={setLang}
        visibility={interfaceVisibility}
        onVisibilityChange={setInterfaceVisibility}
        appearance={appearance}
        onAppearanceChange={setAppearance}
        displayPreferences={displayPreferences}
        onDisplayPreferencesChange={setDisplayPreferences}
        visualCustomization={visualCustomization}
        onVisualCustomizationChange={setVisualCustomization}
        weaponType={weaponType}
        onWeaponChange={handleWeaponChange}
        projectileId={projectileId}
        onProjectileChange={setProjectileId}
        preferredCharge={preferredCharge}
        onChargeChange={setPreferredCharge}
        windSettings={windSettings}
        onWindChange={setWindSettings}
        solution={solution}
        selectedMapId={selectedMapId}
        onMapChange={handleMapChange}
        onResetAppearance={() => setAppearance(DEFAULT_APPEARANCE)}
        onResetInterface={() => setInterfaceVisibility(DEFAULT_INTERFACE_VISIBILITY)}
        onRestoreDefaultLayout={handleResetLayout}
      />

      {coordModalType && (
        <CoordinateInputModal
          isOpen={true}
          type={coordModalType}
          currentPoint={coordModalType === 'mortar' ? mortar : target}
          mapDef={currentMap}
          lang={lang}
          onClose={() => setCoordModalType(null)}
          onApply={newPoint => {
            if (coordModalType === 'mortar') {
              setMortar(newPoint);
            } else {
              setTarget(newPoint);
            }
          }}
        />
      )}

      {editingPoi && (
        <LandmarkEditModal
          isOpen={true}
          poi={editingPoi}
          mapDef={currentMap}
          lang={lang}
          onClose={() => setEditingPoi(null)}
          onSaveOverride={handleSaveLandmarkOverride}
          onResetOverride={handleResetLandmarkOverride}
        />
      )}
    </div>
  );
}
