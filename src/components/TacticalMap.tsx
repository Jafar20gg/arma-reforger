import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import L from 'leaflet';
import {
  Crosshair,
  MapPin,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Flag,
  Truck,
  Building,
  Mountain,
  Ruler,
  RotateCcw,
  MoreVertical,
  Globe,
  Wind,
  X,
} from 'lucide-react';
import {
  MapDefinition,
  PlacementMode,
  WeaponType,
  WorldPoint,
  Language,
  FireSolution,
  MapAppearanceSettings,
  MapPOI,
  POICategory
} from '../types/mortar';
import {
  InterfaceVisibilitySettings,
  WindSettings
} from '../types/settings';
import { BALLISTIC_DATA } from '../data/ballisticData';
import {
  latLngToWorld,
  worldToLatLng,
  calculateEuclideanDistance,
  calculateSlantDistance,
  calculateAzimuth,
  formatGrid,
  calculateScaleBarMetrics,
  formatDistance
} from '../utils/coordinates';
import { getTranslation } from '../utils/i18n';
import { CustomizableElementWrapper } from './CustomizableElementWrapper';
import { UIElementId, UIElementConfig, LandmarkLabelOffset } from '../types/customization';
import { DEFAULT_ELEMENT_CONFIGS } from '../utils/customizationStorage';

interface TacticalMapProps {
  mapDef: MapDefinition;
  mortar: WorldPoint;
  target: WorldPoint;
  weaponType: WeaponType;
  placementMode: PlacementMode;
  solution: FireSolution;
  lang: Language;
  appearance: MapAppearanceSettings;
  visibility?: InterfaceVisibilitySettings;
  windSettings?: WindSettings;
  onOpenSettings?: () => void;
  onLanguageChange?: (lang: Language) => void;
  isCustomizing?: boolean;
  customizerSelectedId?: UIElementId;
  customizerPreviewing?: boolean;
  elementConfigs?: Record<UIElementId, UIElementConfig>;
  labelOffsets?: Record<string, LandmarkLabelOffset>;
  onMortarChange: (point: WorldPoint) => void;
  onTargetChange: (point: WorldPoint) => void;
  onModeChange: (mode: PlacementMode) => void;
  onToggleAppearance?: (key: keyof MapAppearanceSettings) => void;
  onEditLandmark?: (poi: MapPOI) => void;
  onSelectElement?: (id: UIElementId) => void;
  onUpdateElementConfig?: (id: UIElementId, partial: Partial<UIElementConfig>) => void;
}

const KN = 12.501;

const ReforgerEnfusionCRS = L.Util.extend({}, L.CRS, {
  projection: L.Projection.LonLat,
  transformation: new L.Transformation(1 / KN, 0, -1 / KN, 0),
  scale(zoom: number) {
    return Math.pow(2, zoom);
  },
  zoom(scale: number) {
    return Math.log(scale) / Math.LN2;
  },
  distance(p1: L.LatLng, p2: L.LatLng) {
    const dx = p2.lng - p1.lng;
    const dy = p2.lat - p1.lat;
    return Math.sqrt(dx * dx + dy * dy);
  },
  infinite: true,
}) as unknown as L.CRS;

const InvertedYTileLayer = L.TileLayer.extend({
  getTileUrl(coords: { x: number; y: number; z: number }): string {
    const adjustedCoords = {
      ...coords,
      y: -(coords.y + 1),
    };
    return (L.TileLayer.prototype as any).getTileUrl.call(this, adjustedCoords);
  },
});

export const TacticalMap: React.FC<TacticalMapProps> = ({
  mapDef,
  mortar,
  target,
  weaponType,
  placementMode,
  solution,
  lang,
  appearance,
  visibility,
  windSettings,
  onOpenSettings,
  onLanguageChange,
  isCustomizing = false,
  customizerSelectedId = 'modeToolbar',
  customizerPreviewing = false,
  elementConfigs,
  labelOffsets,
  onMortarChange,
  onTargetChange,
  onModeChange,
  onToggleAppearance,
  onSelectElement,
  onUpdateElementConfig,
}) => {
  const configs = elementConfigs || DEFAULT_ELEMENT_CONFIGS;
  const t = getTranslation(lang);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const poiLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const gridLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const rulerLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const rangeCirclesGroupRef = useRef<L.LayerGroup | null>(null);
  const mortarMarkerRef = useRef<L.Marker | null>(null);
  const targetMarkerRef = useRef<L.Marker | null>(null);
  const trajectoryLineRef = useRef<L.Polyline | null>(null);
  const distanceBadgeRef = useRef<L.Marker | null>(null);

  const [mapLoading, setMapLoading] = useState(true);
  const [showErrorBanner, setShowErrorBanner] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(mapDef.defaultZoom);
  const [cursorPos, setCursorPos] = useState<WorldPoint | null>(null);

  const [customRulerStart, setCustomRulerStart] = useState<WorldPoint | null>(null);
  const [customRulerEnd, setCustomRulerEnd] = useState<WorldPoint | null>(null);

  const activeMeasureStart = customRulerStart || mortar;
  const activeMeasureEnd = customRulerEnd || target;
  const horizontalDist = calculateEuclideanDistance(activeMeasureStart, activeMeasureEnd);
  const slantDist = calculateSlantDistance(activeMeasureStart, activeMeasureEnd);
  const deltaH = (activeMeasureEnd.altitudeMeters ?? 0) - (activeMeasureStart.altitudeMeters ?? 0);
  const measureAzimuth = calculateAzimuth(activeMeasureStart, activeMeasureEnd, weaponType);

  const scaleMetrics = useMemo(() => {
    return calculateScaleBarMetrics(currentZoom, mapDef);
  }, [currentZoom, mapDef]);

  const getCategoryColor = useCallback((cat: POICategory): string => {
    switch (cat) {
      case 'base-primary':
        return '#ef4444';
      case 'base-secondary':
        return '#3b82f6';
      case 'motorpool':
        return '#10b981';
      case 'settlement-primary':
        return '#a855f7';
      case 'settlement-secondary':
        return '#64748b';
      case 'airfield':
        return '#eab308';
      case 'hill':
        return '#06b6d4';
      case 'farm':
        return '#14b8a6';
      default:
        return '#94a3b8';
    }
  }, []);

  const getCategoryIconSvg = useCallback((cat: POICategory): string => {
    switch (cat) {
      case 'base-primary':
        return '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>';
      case 'base-secondary':
        return '<path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5M12 12h.01M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5M19.1 4.9C23 8.8 23 15.2 19.1 19.1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>';
      case 'motorpool':
        return '<rect x="1" y="3" width="15" height="13" rx="2" stroke="currentColor" stroke-width="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" stroke="currentColor" stroke-width="2"/><circle cx="5.5" cy="18.5" r="2.5" stroke="currentColor" stroke-width="2"/><circle cx="18.5" cy="18.5" r="2.5" stroke="currentColor" stroke-width="2"/>';
      case 'settlement-primary':
      case 'settlement-secondary':
        return '<rect x="4" y="2" width="16" height="20" rx="2" stroke="currentColor" stroke-width="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" stroke="currentColor" stroke-width="2"/>';
      case 'airfield':
        return '<path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z" stroke="currentColor" stroke-width="1.8"/>';
      case 'hill':
        return '<path d="m8 3 4 8 5-5 5 15H2L8 3z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
      default:
        return '<circle cx="12" cy="12" r="6" stroke="currentColor" stroke-width="2"/>';
    }
  }, []);

  const createMortarIcon = useCallback(() => {
    const showGrid = visibility ? visibility.showGridReferences : true;
    const labelText = t.mortar || 'MORTAR';
    const gridText = showGrid ? ` (${formatGrid(mortar, 6)})` : '';
    return L.divIcon({
      className: 'mortar-marker-icon',
      html: `
        <div class="relative flex flex-col items-center">
          <div class="w-9 h-9 rounded-full bg-red-600/90 border-2 border-white flex items-center justify-center shadow-lg shadow-red-950/80 ring-2 ring-red-500/50">
            <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
            </svg>
          </div>
          <div class="mt-1 px-1.5 py-0.5 bg-neutral-900/90 text-red-400 font-mono text-[10px] font-bold border border-red-500/60 rounded shadow whitespace-nowrap">
            ${labelText}${gridText}
          </div>
        </div>
      `,
      iconSize: [80, 56],
      iconAnchor: [40, 18],
    });
  }, [mortar, visibility, t.mortar]);

  const createTargetIcon = useCallback(() => {
    const showGrid = visibility ? visibility.showGridReferences : true;
    const labelText = t.target || 'TARGET';
    const gridText = showGrid ? ` (${formatGrid(target, 6)})` : '';
    return L.divIcon({
      className: 'target-marker-icon',
      html: `
        <div class="relative flex flex-col items-center">
          <div class="w-9 h-9 rounded-full bg-blue-600/90 border-2 border-white flex items-center justify-center shadow-lg shadow-blue-950/80 ring-2 ring-blue-500/50">
            <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="12" cy="12" r="7" />
              <line x1="12" y1="2" x2="12" y2="22" />
              <line x1="2" y1="12" x2="22" y2="12" />
            </svg>
          </div>
          <div class="mt-1 px-1.5 py-0.5 bg-neutral-900/90 text-blue-400 font-mono text-[10px] font-bold border border-blue-500/60 rounded shadow whitespace-nowrap">
            ${labelText}${gridText}
          </div>
        </div>
      `,
      iconSize: [80, 56],
      iconAnchor: [40, 18],
    });
  }, [target, visibility, t.target]);

  const createDistanceBadgeIcon = useCallback(
    (dist: number, az: { degrees: number; mils: number }, sol: FireSolution) => {
      const showDistance = visibility ? visibility.showDistanceMeasurements : true;
      const showElev = visibility ? visibility.showElevationInfo : true;
      const distStr = formatDistance(dist, appearance.distanceUnit);
      return L.divIcon({
        className: 'measurement-badge-wrapper',
        html: `
          <div class="measurement-badge flex items-center gap-1.5 border border-amber-500/80 bg-neutral-950/95 px-2.5 py-1 rounded shadow-xl">
            ${showDistance ? `<span class="text-amber-400 font-bold text-xs">${distStr}</span><span class="text-neutral-500 text-[10px]">|</span>` : ''}
            <span class="text-amber-300 font-mono text-[11px] font-semibold">${az.mils} MIL</span>
            <span class="text-neutral-400 text-[9px]">(${az.degrees}°)</span>
            ${
              sol.inRange && showElev
                ? `
              <span class="text-neutral-500 text-[10px]">|</span>
              <span class="text-emerald-400 font-mono text-[11px] font-bold">${sol.elevationDegrees}°</span>
            `
                : ''
            }
          </div>
        `,
        iconSize: [190, 28],
        iconAnchor: [95, 14],
      });
    },
    [appearance.distanceUnit, visibility]
  );

  const createPoiIcon = useCallback((poi: MapPOI) => {
    const color = getCategoryColor(poi.category);
    const iconSvg = getCategoryIconSvg(poi.category);
    const displayName = lang === 'ar' ? (poi.nameAr || poi.name) : poi.name;
    const gridStr = poi.grid || formatGrid(poi, 8);
    const isThreeLine = appearance.threeLineLabels;
    const textSize = appearance.labelSize === 'small' ? 'text-[9px]' : appearance.labelSize === 'large' ? 'text-[11px]' : 'text-[10px]';
    const bgOpacity = appearance.labelOpacity ?? 0.94;
    const showPlaceNames = visibility ? visibility.showPlaceNames : appearance.showLabels;
    const offset = labelOffsets?.[poi.id];
    const offsetStyle = offset ? `transform: translate(${offset.dx}px, ${offset.dy}px);` : '';

    return L.divIcon({
      className: 'tactical-poi-marker',
      html: `
        <div class="relative flex flex-col items-center pointer-events-none select-none text-center" dir="${lang === 'ar' ? 'rtl' : 'ltr'}" style="${offsetStyle} width: 220px;">
          <div class="w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-neutral-900 ring-2 pointer-events-none" style="background-color: ${color}; border-color: #0b0f17; ring-color: ${color}80;">
            <svg class="w-3.5 h-3.5 text-neutral-950 stroke-[2.2]" viewBox="0 0 24 24" fill="none">
              ${iconSvg}
            </svg>
          </div>
          ${showPlaceNames ? `
            <div class="mt-1 px-2 py-0.5 rounded shadow-xl border backdrop-blur-md max-w-[200px] pointer-events-none"
                 style="background: rgba(9, 13, 22, ${bgOpacity}); border-color: ${color}90; border-bottom-width: 2px; border-bottom-color: ${color};">
              <div class="font-tactical font-bold text-neutral-100 ${textSize} leading-tight truncate text-center" style="text-shadow: 0 1px 3px rgba(0,0,0,0.95);">
                ${displayName}
                ${poi.isUserCustomized ? '<span class="text-amber-400 ml-1 font-mono text-[9px]">*</span>' : ''}
              </div>
              ${isThreeLine ? `
                <div class="flex items-center justify-center gap-1.5 text-[9px] font-mono text-neutral-300 mt-0.5" dir="ltr">
                  <span class="text-amber-400 font-semibold">${gridStr}</span>
                  <span class="text-neutral-500">•</span>
                  <span class="text-neutral-300">${poi.altitudeMeters}m</span>
                </div>
              ` : ''}
            </div>
          ` : ''}
        </div>
      `,
      iconSize: [220, isThreeLine ? 60 : 44],
      iconAnchor: [110, 12],
    });
  }, [lang, appearance.showLabels, appearance.threeLineLabels, appearance.labelSize, appearance.labelOpacity, visibility, getCategoryColor, getCategoryIconSvg, labelOffsets]);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    setMapLoading(true);
    setShowErrorBanner(false);

    const southWest = worldToLatLng({ xMeters: mapDef.worldBounds.minX, yMeters: mapDef.worldBounds.minY }, mapDef);
    const northEast = worldToLatLng({ xMeters: mapDef.worldBounds.maxX, yMeters: mapDef.worldBounds.maxY }, mapDef);
    const bounds = L.latLngBounds(L.latLng(southWest.lat, southWest.lng), L.latLng(northEast.lat, northEast.lng));

    if (leafletMapRef.current) {
      leafletMapRef.current.remove();
      leafletMapRef.current = null;
    }

    const initialCenter = worldToLatLng(mapDef.defaultCenter, mapDef);
    const map = L.map(mapContainerRef.current, {
      crs: ReforgerEnfusionCRS,
      center: [initialCenter.lat, initialCenter.lng],
      zoom: mapDef.defaultZoom,
      minZoom: mapDef.minZoom,
      maxZoom: mapDef.maxZoom,
      zoomControl: false,
      attributionControl: false,
      maxBounds: bounds.pad(0.12),
      maxBoundsViscosity: 0.85,
    });
    leafletMapRef.current = map;

    map.on('zoomend', () => {
      setCurrentZoom(map.getZoom());
    });

    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      const world = latLngToWorld({ lat: e.latlng.lat, lng: e.latlng.lng }, mapDef);
      setCursorPos(world);
    });

    let errorCount = 0;
    const tileLayer = new (InvertedYTileLayer as any)(mapDef.tileUrlTemplate, {
      minZoom: mapDef.minZoom,
      maxZoom: mapDef.maxZoom,
      tileSize: mapDef.tileSize,
      zoomReverse: true,
      noWrap: true,
      bounds: bounds,
    });

    tileLayer.on('loading', () => {
      setMapLoading(true);
    });
    tileLayer.on('load', () => {
      setMapLoading(false);
      setShowErrorBanner(false);
    });
    tileLayer.on('tileerror', () => {
      errorCount++;
      if (errorCount > 8) {
        setShowErrorBanner(true);
        setMapLoading(false);
      }
    });

    tileLayer.addTo(map);
    tileLayerRef.current = tileLayer;

    gridLayerGroupRef.current = L.layerGroup().addTo(map);
    poiLayerGroupRef.current = L.layerGroup().addTo(map);
    rulerLayerGroupRef.current = L.layerGroup().addTo(map);
    rangeCirclesGroupRef.current = L.layerGroup().addTo(map);

    const mortarLatLng = worldToLatLng(mortar, mapDef);
    const mortarMarker = L.marker([mortarLatLng.lat, mortarLatLng.lng], {
      icon: createMortarIcon(),
      draggable: true,
      zIndexOffset: 1000,
    }).addTo(map);

    mortarMarker.on('drag', () => {
      const pos = mortarMarker.getLatLng();
      const worldPos = latLngToWorld({ lat: pos.lat, lng: pos.lng }, mapDef);
      onMortarChange({ ...mortar, xMeters: worldPos.xMeters, yMeters: worldPos.yMeters });
    });
    mortarMarkerRef.current = mortarMarker;

    const targetLatLng = worldToLatLng(target, mapDef);
    const targetMarker = L.marker([targetLatLng.lat, targetLatLng.lng], {
      icon: createTargetIcon(),
      draggable: true,
      zIndexOffset: 1000,
    }).addTo(map);

    targetMarker.on('drag', () => {
      const pos = targetMarker.getLatLng();
      const worldPos = latLngToWorld({ lat: pos.lat, lng: pos.lng }, mapDef);
      onTargetChange({ ...target, xMeters: worldPos.xMeters, yMeters: worldPos.yMeters });
    });
    targetMarkerRef.current = targetMarker;

    const polyline = L.polyline(
      [[mortarLatLng.lat, mortarLatLng.lng], [targetLatLng.lat, targetLatLng.lng]],
      {
        color: '#f59e0b',
        weight: 2.5,
        dashArray: '6, 6',
        opacity: 0.85,
      }
    ).addTo(map);
    trajectoryLineRef.current = polyline;

    const midLat = (mortarLatLng.lat + targetLatLng.lat) / 2;
    const midLng = (mortarLatLng.lng + targetLatLng.lng) / 2;
    const badge = L.marker([midLat, midLng], {
      icon: createDistanceBadgeIcon(horizontalDist, measureAzimuth, solution),
      interactive: false,
    }).addTo(map);
    distanceBadgeRef.current = badge;

    const resizeObserver = new ResizeObserver(() => {
      if (leafletMapRef.current) {
        leafletMapRef.current.invalidateSize();
      }
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    const initTimer = setTimeout(() => {
      if (leafletMapRef.current) {
        leafletMapRef.current.invalidateSize();
      }
    }, 150);

    return () => {
      clearTimeout(initTimer);
      resizeObserver.disconnect();
      map.remove();
      leafletMapRef.current = null;
    };
  }, [mapDef.id]);

  useEffect(() => {
    if (!leafletMapRef.current || !gridLayerGroupRef.current) return;
    const group = gridLayerGroupRef.current;
    group.clearLayers();
    if (!appearance.showGridLines) return;

    const { minX, maxX, minY, maxY } = mapDef.worldBounds;
    const step = 1000;

    for (let x = minX + step; x < maxX; x += step) {
      const p1 = worldToLatLng({ xMeters: x, yMeters: minY }, mapDef);
      const p2 = worldToLatLng({ xMeters: x, yMeters: maxY }, mapDef);
      L.polyline([[p1.lat, p1.lng], [p2.lat, p2.lng]], {
        color: 'rgba(255, 255, 255, 0.12)',
        weight: 1,
        dashArray: '2, 6',
        interactive: false,
      }).addTo(group);
    }

    for (let y = minY + step; y < maxY; y += step) {
      const p1 = worldToLatLng({ xMeters: minX, yMeters: y }, mapDef);
      const p2 = worldToLatLng({ xMeters: maxX, yMeters: y }, mapDef);
      L.polyline([[p1.lat, p1.lng], [p2.lat, p2.lng]], {
        color: 'rgba(255, 255, 255, 0.12)',
        weight: 1,
        dashArray: '2, 6',
        interactive: false,
      }).addTo(group);
    }
  }, [mapDef, appearance.showGridLines]);

  useEffect(() => {
    if (!leafletMapRef.current || !poiLayerGroupRef.current) return;
    const layerGroup = poiLayerGroupRef.current;
    layerGroup.clearLayers();

    const showLocationMarkers = visibility ? visibility.showLocationMarkers : true;
    if (!showLocationMarkers) return;

    const controlPoints = mapDef.controlPoints || [];
    controlPoints.forEach(poi => {
      if (!appearance.showBases && (poi.category === 'base-primary' || poi.category === 'base-secondary')) {
        return;
      }
      if (!appearance.showMotorpools && poi.category === 'motorpool') {
        return;
      }
      if (!appearance.showTowns && (poi.category === 'settlement-primary' || poi.category === 'settlement-secondary')) {
        return;
      }
      if (!appearance.showHills && poi.category === 'hill') {
        return;
      }

      const poiLatLng = worldToLatLng(poi, mapDef);
      const marker = L.marker([poiLatLng.lat, poiLatLng.lng], {
        icon: createPoiIcon(poi),
        zIndexOffset: poi.category === 'base-primary' ? 800 : 500,
        interactive: false,
      });
      marker.addTo(layerGroup);
    });
  }, [
    mapDef,
    appearance,
    visibility,
    createPoiIcon,
  ]);

  useEffect(() => {
    if (!leafletMapRef.current || !rangeCirclesGroupRef.current) return;
    const group = rangeCirclesGroupRef.current;
    group.clearLayers();

    const showRangeCircles = visibility ? visibility.showRangeCircles : true;
    if (!showRangeCircles) return;

    const generateCirclePoints = (center: WorldPoint, radiusMeters: number, steps = 64) => {
      const latLngs: [number, number][] = [];
      for (let i = 0; i < steps; i++) {
        const theta = (i / steps) * 2 * Math.PI;
        const x = center.xMeters + radiusMeters * Math.cos(theta);
        const y = center.yMeters + radiusMeters * Math.sin(theta);
        const pt = worldToLatLng({ xMeters: x, yMeters: y }, mapDef);
        latLngs.push([pt.lat, pt.lng]);
      }
      return latLngs;
    };

    const weapon = BALLISTIC_DATA[weaponType === 'b2b14' ? 'b2b14' : 'm252'];
    const shell = weapon.defaultRounds.find(r => r.id === solution.projectileId) || weapon.defaultRounds[0];
    const globalMin = Math.min(...shell.charges.map(c => c.minRange));
    const globalMax = Math.max(...shell.charges.map(c => c.maxRange));
    const activeCharge = shell.charges.find(c => c.rings === solution.chargeRings) || shell.charges[0];
    const activeMax = activeCharge ? activeCharge.maxRange : globalMax;

    const minPts = generateCirclePoints(mortar, globalMin);
    L.polygon(minPts, {
      color: '#ef4444',
      weight: 1.8,
      dashArray: '4, 4',
      fillColor: '#ef4444',
      fillOpacity: 0.05,
      interactive: false,
    }).addTo(group);

    if (activeMax > globalMin && activeMax < globalMax) {
      const activePts = generateCirclePoints(mortar, activeMax);
      L.polygon(activePts, {
        color: '#f59e0b',
        weight: 1.8,
        dashArray: '5, 5',
        fillColor: '#f59e0b',
        fillOpacity: 0.04,
        interactive: false,
      }).addTo(group);
    }

    const maxPts = generateCirclePoints(mortar, globalMax);
    L.polygon(maxPts, {
      color: '#10b981',
      weight: 2,
      dashArray: '6, 6',
      fillColor: '#10b981',
      fillOpacity: 0.03,
      interactive: false,
    }).addTo(group);
  }, [mortar, mapDef, weaponType, solution, visibility]);

  useEffect(() => {
    if (!leafletMapRef.current || !mortarMarkerRef.current) return;
    const latLng = worldToLatLng(mortar, mapDef);
    mortarMarkerRef.current.setLatLng([latLng.lat, latLng.lng]);
    mortarMarkerRef.current.setIcon(createMortarIcon());
  }, [mortar, mapDef, createMortarIcon]);

  useEffect(() => {
    if (!leafletMapRef.current || !targetMarkerRef.current) return;
    const latLng = worldToLatLng(target, mapDef);
    targetMarkerRef.current.setLatLng([latLng.lat, latLng.lng]);
    targetMarkerRef.current.setIcon(createTargetIcon());
  }, [target, mapDef, createTargetIcon]);

  useEffect(() => {
    if (!trajectoryLineRef.current || !distanceBadgeRef.current) return;
    const showRangeLines = visibility ? visibility.showRangeLines : true;
    const showDistance = visibility ? visibility.showDistanceMeasurements : true;

    if (!showRangeLines) {
      trajectoryLineRef.current.setStyle({ opacity: 0 });
    } else {
      trajectoryLineRef.current.setStyle({ opacity: 0.85 });
    }

    if (!showDistance && !showRangeLines) {
      (distanceBadgeRef.current as any).setOpacity?.(0);
      return;
    }
    if (!showDistance) {
      (distanceBadgeRef.current as any).setOpacity?.(0);
    } else {
      (distanceBadgeRef.current as any).setOpacity?.(1);
    }

    const mLatLng = worldToLatLng(mortar, mapDef);
    const tLatLng = worldToLatLng(target, mapDef);
    trajectoryLineRef.current.setLatLngs([
      [mLatLng.lat, mLatLng.lng],
      [tLatLng.lat, tLatLng.lng],
    ]);

    const midLat = (mLatLng.lat + tLatLng.lat) / 2;
    const midLng = (mLatLng.lng + tLatLng.lng) / 2;
    distanceBadgeRef.current.setLatLng([midLat, midLng]);
    distanceBadgeRef.current.setIcon(createDistanceBadgeIcon(horizontalDist, measureAzimuth, solution));
  }, [mortar, target, mapDef, horizontalDist, measureAzimuth, solution, visibility, createDistanceBadgeIcon]);

  useEffect(() => {
    if (!leafletMapRef.current || !rulerLayerGroupRef.current) return;
    const group = rulerLayerGroupRef.current;
    group.clearLayers();

    if (customRulerStart && customRulerEnd) {
      const p1 = worldToLatLng(customRulerStart, mapDef);
      const p2 = worldToLatLng(customRulerEnd, mapDef);
      L.polyline([[p1.lat, p1.lng], [p2.lat, p2.lng]], {
        color: '#06b6d4',
        weight: 3,
        dashArray: '4, 4',
      }).addTo(group);

      L.circleMarker([p1.lat, p1.lng], {
        radius: 6,
        color: '#0891b2',
        fillColor: '#06b6d4',
        fillOpacity: 1,
      }).addTo(group);

      L.circleMarker([p2.lat, p2.lng], {
        radius: 6,
        color: '#0891b2',
        fillColor: '#06b6d4',
        fillOpacity: 1,
      }).addTo(group);
    }
  }, [customRulerStart, customRulerEnd, mapDef]);

  useEffect(() => {
    if (!leafletMapRef.current) return;
    const map = leafletMapRef.current;
    map.off('click');
    map.on('click', (e: L.LeafletMouseEvent) => {
      const clickWorld = latLngToWorld({ lat: e.latlng.lat, lng: e.latlng.lng }, mapDef);
      if (placementMode === 'place-mortar') {
        onMortarChange({ ...mortar, xMeters: clickWorld.xMeters, yMeters: clickWorld.yMeters });
      } else if (placementMode === 'place-target') {
        onTargetChange({ ...target, xMeters: clickWorld.xMeters, yMeters: clickWorld.yMeters });
      } else if (placementMode === 'measure') {
        if (!customRulerStart || (customRulerStart && customRulerEnd)) {
          setCustomRulerStart(clickWorld);
          setCustomRulerEnd(null);
        } else {
          setCustomRulerEnd(clickWorld);
        }
      }
    });
  }, [placementMode, mortar, target, mapDef, customRulerStart, customRulerEnd, onMortarChange, onTargetChange]);

  const handleZoomIn = () => leafletMapRef.current?.zoomIn();
  const handleZoomOut = () => leafletMapRef.current?.zoomOut();
  const handleCenterMortar = () => {
    if (!leafletMapRef.current) return;
    const m = worldToLatLng(mortar, mapDef);
    leafletMapRef.current.panTo([m.lat, m.lng], { animate: true });
  };
  const handleCenterTarget = () => {
    if (!leafletMapRef.current) return;
    const tgt = worldToLatLng(target, mapDef);
    leafletMapRef.current.panTo([tgt.lat, tgt.lng], { animate: true });
  };
  const handleFitBoth = () => {
    if (!leafletMapRef.current) return;
    const m = worldToLatLng(mortar, mapDef);
    const tgt = worldToLatLng(target, mapDef);
    const bounds = L.latLngBounds([[m.lat, m.lng], [tgt.lat, tgt.lng]]);
    leafletMapRef.current.fitBounds(bounds.pad(0.35), { animate: true });
  };
  const handleRetryTiles = () => {
    if (!leafletMapRef.current || !tileLayerRef.current) return;
    setMapLoading(true);
    setShowErrorBanner(false);
    tileLayerRef.current.redraw();
  };

  const bearingDeg = solution.azimuthDegrees || 0;
  const windDir = windSettings?.directionDeg ?? 270;
  const windSpd = windSettings?.speedMps ?? 0;
  const relWindAngleRad = ((windDir - bearingDeg) * Math.PI) / 180;
  const crosswindSpeed = Number((windSpd * Math.sin(relWindAngleRad)).toFixed(1));
  const longWindSpeed = Number((windSpd * Math.cos(relWindAngleRad)).toFixed(1));
  const crosswindCorrectionMils = Math.round(crosswindSpeed * 4.2);
  const longCorrectionMils = Math.round(longWindSpeed * 2.8);

  const showNav = visibility ? visibility.showNavigation : true;
  const showCoords = visibility ? visibility.showCoordinates : true;
  const showControls = visibility ? visibility.showMapControls : true;

  return (
    <div className="relative w-full h-full flex flex-col bg-neutral-950 overflow-hidden border border-neutral-800 rounded-lg shadow-2xl">
      <div
        className="z-[500] absolute top-2 sm:top-2.5 inset-x-2 sm:inset-x-3 flex flex-wrap items-center justify-between gap-1.5 pointer-events-none"
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {showNav ? (
            <CustomizableElementWrapper
              id="modeToolbar"
              config={configs.modeToolbar}
              isCustomizing={isCustomizing}
              isSelected={customizerSelectedId === 'modeToolbar'}
              isPreviewing={customizerPreviewing}
              onSelect={onSelectElement || (() => {})}
              onUpdateConfig={onUpdateElementConfig || (() => {})}
              className="pointer-events-auto"
              transformOrigin="top left"
            >
              <div className="flex items-center gap-1 bg-neutral-900/90 backdrop-blur-md p-0.5 sm:p-1 rounded-lg border border-neutral-700/80 shadow-xl">
                <button
                  type="button"
                  onClick={() => onModeChange(placementMode === 'place-mortar' ? 'none' : 'place-mortar')}
                  className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                    placementMode === 'place-mortar'
                      ? 'bg-red-600 text-white shadow-md shadow-red-900/50 ring-1 ring-red-400'
                      : 'text-neutral-300 hover:text-white hover:bg-neutral-800/80'
                  }`}
                >
                  <Crosshair className="w-3.5 h-3.5 text-red-300" />
                  <span>{t.modePlaceMortar}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onModeChange(placementMode === 'place-target' ? 'none' : 'place-target')}
                  className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                    placementMode === 'place-target'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-900/50 ring-1 ring-blue-400'
                      : 'text-neutral-300 hover:text-white hover:bg-neutral-800/80'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 text-blue-300" />
                  <span>{t.modePlaceTarget}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (placementMode === 'measure') {
                      onModeChange('none');
                      setCustomRulerStart(null);
                      setCustomRulerEnd(null);
                    } else {
                      onModeChange('measure');
                    }
                  }}
                  className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                    placementMode === 'measure'
                      ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/50 ring-1 ring-cyan-400'
                      : 'text-neutral-300 hover:text-white hover:bg-neutral-800/80'
                  }`}
                >
                  <Ruler className="w-3.5 h-3.5 text-cyan-300" />
                  <span>{t.rulerTool.split(' ')[0]}</span>
                </button>
              </div>
            </CustomizableElementWrapper>
          ) : (
            placementMode !== 'none' && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-600 text-neutral-950 font-tactical font-bold text-xs shadow-lg pointer-events-auto">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                <span>
                  {placementMode === 'place-mortar' ? t.modePlaceMortar : placementMode === 'place-target' ? t.modePlaceTarget : t.rulerTool}
                </span>
                <button
                  type="button"
                  onClick={() => onModeChange('none')}
                  className="p-0.5 hover:bg-amber-700 rounded text-neutral-950"
                  title={t.close}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )
          )}
        </div>

        <div className="flex items-center gap-1.5 pointer-events-auto">
          {showCoords && (
            <CustomizableElementWrapper
              id="hudCoordinates"
              config={configs.hudCoordinates}
              isCustomizing={isCustomizing}
              isSelected={customizerSelectedId === 'hudCoordinates'}
              isPreviewing={customizerPreviewing}
              onSelect={onSelectElement || (() => {})}
              onUpdateConfig={onUpdateElementConfig || (() => {})}
              className="pointer-events-auto"
              transformOrigin="top right"
            >
              <div className="hidden sm:flex items-center gap-2 bg-neutral-900/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-neutral-700/80 shadow-xl font-mono text-xs">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-neutral-400 text-[10px]">{t.mortar.charAt(0)}:</span>
                  <span className="text-red-400 font-semibold">
                    {(visibility ? visibility.showGridReferences : true) ? formatGrid(mortar, 8) : `${mortar.xMeters},${mortar.yMeters}`}
                  </span>
                </div>
                <span className="text-neutral-600">|</span>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span className="text-neutral-400 text-[10px]">{t.target.charAt(0)}:</span>
                  <span className="text-blue-400 font-semibold">
                    {(visibility ? visibility.showGridReferences : true) ? formatGrid(target, 8) : `${target.xMeters},${target.yMeters}`}
                  </span>
                </div>
                {(visibility ? visibility.showElevationInfo : true) && (
                  <>
                    <span className="text-neutral-600">|</span>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/50">
                      <span className="text-emerald-400 text-[9px] font-bold">{lang === 'ar' ? 'الارتفاع:' : 'ELEV:'}</span>
                      <span className="text-emerald-300 font-black">
                        {solution.inRange ? `${solution.elevationDegrees}°` : (lang === 'ar' ? 'خارج المدى' : 'OOR')}
                      </span>
                      <span className="text-[9px] text-emerald-400 font-mono">
                        ({solution.inRange ? `${solution.elevationMils}M` : '----'})
                      </span>
                    </div>
                  </>
                )}
              </div>
            </CustomizableElementWrapper>
          )}

          {showControls && (
            <CustomizableElementWrapper
              id="mapControls"
              config={configs.mapControls}
              isCustomizing={isCustomizing}
              isSelected={customizerSelectedId === 'mapControls'}
              isPreviewing={customizerPreviewing}
              onSelect={onSelectElement || (() => {})}
              onUpdateConfig={onUpdateElementConfig || (() => {})}
              className="pointer-events-auto"
              transformOrigin="top right"
            >
              <div className="flex items-center gap-0.5 bg-neutral-900/90 backdrop-blur-md p-0.5 rounded-lg border border-neutral-700/80 shadow-xl">
                <button
                  type="button"
                  onClick={handleCenterMortar}
                  title={t.centerMortar}
                  className="p-1 text-neutral-300 hover:text-red-400 hover:bg-neutral-800 rounded transition"
                >
                  <Crosshair className="w-3.5 h-3.5 text-red-400" />
                </button>
                <button
                  type="button"
                  onClick={handleCenterTarget}
                  title={t.centerTarget}
                  className="p-1 text-neutral-300 hover:text-blue-400 hover:bg-neutral-800 rounded transition"
                >
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                </button>
                <button
                  type="button"
                  onClick={handleFitBoth}
                  title="Fit View"
                  className="p-1 text-neutral-300 hover:text-amber-400 hover:bg-neutral-800 rounded transition"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
                <span className="w-px h-3.5 bg-neutral-700 my-auto mx-0.5" />
                <button
                  type="button"
                  onClick={handleZoomIn}
                  title="Zoom In"
                  className="p-1 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded transition"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleZoomOut}
                  title="Zoom Out"
                  className="p-1 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded transition"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </CustomizableElementWrapper>
          )}

          {onLanguageChange && (
            <button
              type="button"
              onClick={() => onLanguageChange(lang === 'en' ? 'ar' : 'en')}
              className="flex items-center gap-1 px-2.5 py-1 bg-neutral-900/95 hover:bg-neutral-800 text-amber-400 hover:text-amber-300 border border-neutral-700/90 rounded-lg text-xs font-tactical font-bold shadow-xl backdrop-blur-md transition pointer-events-auto"
              title="Toggle Language"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="text-[11px]">{lang === 'en' ? 'العربية' : 'English'}</span>
            </button>
          )}

          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="flex items-center gap-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-neutral-950 border border-amber-400 rounded-lg text-xs font-tactical font-bold shadow-xl transition shadow-amber-950/60 ring-1 ring-amber-400 pointer-events-auto"
              title={t.settings}
            >
              <MoreVertical className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">{t.settings}</span>
            </button>
          )}
        </div>
      </div>

      {appearance.showCompass && (visibility ? visibility.showCompass : true) && (
        <div className="z-[500] absolute top-14 right-2 sm:right-3 pointer-events-none">
          <CustomizableElementWrapper
            id="compass"
            config={configs.compass}
            isCustomizing={isCustomizing}
            isSelected={customizerSelectedId === 'compass'}
            isPreviewing={customizerPreviewing}
            onSelect={onSelectElement || (() => {})}
            onUpdateConfig={onUpdateElementConfig || (() => {})}
            className="pointer-events-auto"
            transformOrigin="top right"
          >
            <div className="bg-neutral-950/90 backdrop-blur-md p-1.5 rounded-xl border border-neutral-700/80 shadow-2xl flex flex-col items-center gap-0.5 select-none">
              <div className="relative w-10 h-10 rounded-full border border-neutral-700 bg-neutral-900/90 flex items-center justify-center shadow-inner">
                <span className="absolute top-0.5 text-[7px] font-black text-red-500 font-tactical">N</span>
                <span className="absolute bottom-0.5 text-[7px] font-bold text-neutral-400 font-tactical">S</span>
                <span className="absolute right-0.5 text-[7px] font-bold text-neutral-400 font-tactical">E</span>
                <span className="absolute left-0.5 text-[7px] font-bold text-neutral-400 font-tactical">W</span>
                <div className="w-1 h-7 flex flex-col items-center justify-between pointer-events-none">
                  <div className="w-0 h-0 border-l-[2.5px] border-r-[2.5px] border-b-[11px] border-l-transparent border-r-transparent border-b-red-500 filter drop-shadow" />
                  <div className="w-0 h-0 border-l-[2.5px] border-r-[2.5px] border-t-[11px] border-l-transparent border-r-transparent border-t-neutral-400" />
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 border border-neutral-950 shadow z-10" />
              </div>
              <div className="text-[7.5px] font-mono text-neutral-400 text-center leading-none">
                <span className="text-amber-400 font-semibold">{cursorPos ? formatGrid(cursorPos, 6) : 'TRUE N'}</span>
              </div>
            </div>
          </CustomizableElementWrapper>
        </div>
      )}

      {Boolean(visibility?.showWindIndicators && windSettings?.enabled) && (
        <div
          className="z-[500] absolute top-14 left-2 sm:left-3 pointer-events-auto"
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
        >
          <div className="bg-neutral-950/95 backdrop-blur-md px-3 py-2 rounded-xl border border-cyan-500/80 shadow-2xl flex flex-col gap-1 text-xs font-mono text-cyan-300 min-w-[210px]">
            <div className="flex items-center justify-between border-b border-cyan-900/60 pb-1">
              <div className="flex items-center gap-1.5 font-tactical font-bold text-white text-[11px]">
                <Wind className="w-3.5 h-3.5 text-cyan-400" />
                <span>{t.windSettings}</span>
              </div>
              <span className="text-[9px] font-bold text-amber-400">
                {windSettings?.speedMps} {t.windSpeedMps} ({windSettings?.directionDeg}°)
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-[10px]">
              <div>
                <span className="text-neutral-400 text-[9px] block font-tactical">{t.crosswind}</span>
                <span className="font-bold text-amber-300">{crosswindSpeed} m/s</span>
                <span className="text-[9px] text-neutral-400 block font-mono">
                  {crosswindCorrectionMils > 0 ? `+${crosswindCorrectionMils}` : crosswindCorrectionMils} MIL
                </span>
              </div>
              <div>
                <span className="text-neutral-400 text-[9px] block font-tactical">{t.longitudinalWind}</span>
                <span className="font-bold text-cyan-300">{longWindSpeed} m/s</span>
                <span className="text-[9px] text-neutral-400 block font-mono">
                  {longCorrectionMils > 0 ? `+${longCorrectionMils}` : longCorrectionMils} MIL
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {onToggleAppearance && (visibility ? visibility.showMapLayers : true) && (
        <div className="z-[500] absolute bottom-9 sm:bottom-10 left-2 sm:left-3 pointer-events-none">
          <CustomizableElementWrapper
            id="quickFilters"
            config={configs.quickFilters}
            isCustomizing={isCustomizing}
            isSelected={customizerSelectedId === 'quickFilters'}
            isPreviewing={customizerPreviewing}
            onSelect={onSelectElement || (() => {})}
            onUpdateConfig={onUpdateElementConfig || (() => {})}
            className="pointer-events-auto"
            transformOrigin="bottom left"
          >
            <div className="flex items-center gap-0.5 sm:gap-1 bg-neutral-900/90 backdrop-blur-md p-0.5 sm:p-1 rounded-lg border border-neutral-800 shadow-xl">
              <button
                type="button"
                onClick={() => onToggleAppearance('showBases')}
                className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-[11px] font-tactical font-semibold transition ${
                  appearance.showBases
                    ? 'bg-red-950/80 text-red-300 border border-red-500/60'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                <Flag className="w-3 h-3 text-red-400" />
                <span className="hidden sm:inline">Bases</span>
              </button>
              <button
                type="button"
                onClick={() => onToggleAppearance('showMotorpools')}
                className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-[11px] font-tactical font-semibold transition ${
                  appearance.showMotorpools
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/60'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                <Truck className="w-3 h-3 text-emerald-400" />
                <span className="hidden sm:inline">Vehicles</span>
              </button>
              <button
                type="button"
                onClick={() => onToggleAppearance('showTowns')}
                className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-[11px] font-tactical font-semibold transition ${
                  appearance.showTowns
                    ? 'bg-purple-950/80 text-purple-300 border border-purple-500/60'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                <Building className="w-3 h-3 text-purple-400" />
                <span className="hidden sm:inline">Towns</span>
              </button>
              <button
                type="button"
                onClick={() => onToggleAppearance('showHills')}
                className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-[11px] font-tactical font-semibold transition ${
                  appearance.showHills
                    ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/60'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                <Mountain className="w-3 h-3 text-cyan-400" />
                <span className="hidden sm:inline">Peaks</span>
              </button>
            </div>
          </CustomizableElementWrapper>
        </div>
      )}

      {appearance.showScaleBar && (
        <div className="z-[500] absolute bottom-9 sm:bottom-10 right-2 sm:right-3 pointer-events-none">
          <CustomizableElementWrapper
            id="scaleBar"
            config={configs.scaleBar}
            isCustomizing={isCustomizing}
            isSelected={customizerSelectedId === 'scaleBar'}
            isPreviewing={customizerPreviewing}
            onSelect={onSelectElement || (() => {})}
            onUpdateConfig={onUpdateElementConfig || (() => {})}
            className="pointer-events-auto"
            transformOrigin="bottom right"
          >
            <div className="bg-neutral-950/90 backdrop-blur-md px-2 py-1 rounded-lg border border-neutral-700/80 shadow-2xl flex flex-col gap-0.5 font-mono text-[9px] sm:text-[10px]">
              <div className="flex items-center justify-between text-neutral-300 font-tactical font-semibold">
                <span>0</span>
                <span>
                  {scaleMetrics.distanceMeters >= 1000
                    ? `${(scaleMetrics.distanceMeters / 2000).toFixed(1)} km`
                    : `${Math.round(scaleMetrics.distanceMeters / 2)} m`}
                </span>
                <span className="text-amber-400 font-bold">{scaleMetrics.label}</span>
              </div>
              <div
                className="h-1.5 rounded-sm border border-neutral-600 flex overflow-hidden shadow-inner"
                style={{ width: `${scaleMetrics.barWidthPx}px` }}
              >
                <div className="flex-1 bg-amber-500" />
                <div className="flex-1 bg-neutral-900 border-x border-neutral-700" />
                <div className="flex-1 bg-amber-500" />
                <div className="flex-1 bg-neutral-900" />
              </div>
              <div className="text-[8px] text-neutral-400 font-mono text-center">
                {mapDef.name} ({Math.round((1 / (mapDef.coordinateTransform.xScale * Math.pow(2, currentZoom))) * 10) / 10} m/px)
              </div>
            </div>
          </CustomizableElementWrapper>
        </div>
      )}

      {placementMode === 'measure' && (
        <div className="z-[500] absolute top-14 left-1/2 -translate-x-1/2 pointer-events-none">
          <CustomizableElementWrapper
            id="rulerHud"
            config={configs.rulerHud}
            isCustomizing={isCustomizing}
            isSelected={customizerSelectedId === 'rulerHud'}
            isPreviewing={customizerPreviewing}
            onSelect={onSelectElement || (() => {})}
            onUpdateConfig={onUpdateElementConfig || (() => {})}
            className="pointer-events-auto"
            transformOrigin="top center"
          >
            <div className="bg-neutral-950/95 border border-cyan-500/80 px-3.5 py-2 rounded-xl shadow-2xl text-xs font-mono text-cyan-300 flex flex-col gap-1 backdrop-blur-md min-w-[260px]">
              <div className="flex items-center justify-between border-b border-cyan-800/60 pb-1">
                <div className="flex items-center gap-1.5 font-tactical font-bold text-white text-[11px]">
                  <Ruler className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{t.rulerTool}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCustomRulerStart(null);
                    setCustomRulerEnd(null);
                  }}
                  className="flex items-center gap-1 text-[9px] text-neutral-400 hover:text-white transition"
                  title={t.clearRuler}
                >
                  <RotateCcw className="w-2.5 h-2.5 text-cyan-400" />
                  <span>{t.clearRuler}</span>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[10px] pt-0.5">
                <div>
                  <span className="text-neutral-400 text-[9px]">{t.horizontalDist}: </span>
                  <span className="text-white font-bold">{formatDistance(horizontalDist, appearance.distanceUnit)}</span>
                </div>
                <div>
                  <span className="text-neutral-400 text-[9px]">{t.slantRange}: </span>
                  <span className="text-amber-400 font-bold">{formatDistance(slantDist, appearance.distanceUnit)}</span>
                </div>
                <div>
                  <span className="text-neutral-400 text-[9px]">{t.heightDiff}: </span>
                  <span className={`font-bold ${deltaH >= 0 ? 'text-emerald-400' : 'text-blue-400'}`}>
                    {deltaH > 0 ? `+${deltaH}` : deltaH}m
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400 text-[9px]">{t.azimuth}: </span>
                  <span className="text-amber-300 font-bold">{measureAzimuth.mils} MIL ({measureAzimuth.degrees}°)</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-[8px] text-neutral-400 border-t border-cyan-900/60 pt-0.5">
                <span>A: {formatGrid(activeMeasureStart, 8)}</span>
                <span>B: {formatGrid(activeMeasureEnd, 8)}</span>
              </div>
            </div>
          </CustomizableElementWrapper>
        </div>
      )}

      {(placementMode === 'place-mortar' || placementMode === 'place-target') && (
        <div className="z-[500] absolute top-14 left-1/2 -translate-x-1/2 bg-neutral-900/95 border border-amber-500/80 px-3 py-1 rounded-full shadow-2xl text-[11px] font-semibold text-amber-300 flex items-center gap-1.5 animate-bounce pointer-events-none">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
          <span>
            {placementMode === 'place-mortar' && `${t.modePlaceMortar}: ${t.modeReady}`}
            {placementMode === 'place-target' && `${t.modePlaceTarget}: ${t.modeReady}`}
          </span>
        </div>
      )}

      {showErrorBanner && (
        <div className="z-[500] absolute bottom-10 inset-x-4 max-w-lg mx-auto bg-red-950/95 border border-red-500/80 p-2.5 rounded-lg shadow-2xl backdrop-blur-md text-red-200 text-xs flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 font-bold text-red-300">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{t.mapLoadError}</span>
          </div>
          <p className="text-neutral-300 text-[10px] leading-relaxed">
            {t.mapSourceNote} ({mapDef.name})
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <button
              type="button"
              onClick={handleRetryTiles}
              className="flex items-center gap-1 bg-red-800 hover:bg-red-700 text-white px-2 py-0.5 rounded text-[11px] font-semibold transition"
            >
              <RefreshCw className="w-3 h-3" />
              <span>{t.retryMap}</span>
            </button>
            <a
              href={mapDef.externalMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-2 py-0.5 rounded text-[11px] font-semibold transition border border-neutral-600"
            >
              <ExternalLink className="w-3 h-3" />
              <span>{t.openExternalMap}</span>
            </a>
          </div>
        </div>
      )}

      {mapLoading && (
        <div className="z-[450] absolute top-14 right-3 flex items-center gap-1.5 bg-neutral-900/90 border border-neutral-700 px-2.5 py-1 rounded-md shadow-lg text-[11px] text-neutral-300 backdrop-blur-sm pointer-events-none">
          <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
          <span>{t.mapLoading}</span>
        </div>
      )}

      <div
        ref={mapContainerRef}
        className="w-full h-full cursor-crosshair map-touch-container"
        style={{ minHeight: '380px' }}
      />

      {(visibility ? visibility.showBottomToolbar : true) && (
        <div className="z-[500] absolute bottom-1 inset-x-2 sm:inset-x-3 pointer-events-none">
          <CustomizableElementWrapper
            id="mapBottomBar"
            config={configs.mapBottomBar}
            isCustomizing={isCustomizing}
            isSelected={customizerSelectedId === 'mapBottomBar'}
            isPreviewing={customizerPreviewing}
            onSelect={onSelectElement || (() => {})}
            onUpdateConfig={onUpdateElementConfig || (() => {})}
            className="pointer-events-auto w-full"
            transformOrigin="bottom left"
          >
            <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
              <div className="bg-neutral-900/85 backdrop-blur-sm px-2 py-0.5 rounded border border-neutral-800 shadow flex items-center gap-1.5">
                <span className="text-neutral-200 font-semibold">{mapDef.name}</span>
                <span className="text-neutral-600">|</span>
                <span>Z:{currentZoom}</span>
                <span className="text-neutral-600 hidden sm:inline">|</span>
                <span className="text-amber-400 hidden sm:inline">{mapDef.controlPoints.length} POIs</span>
                {cursorPos && (
                  <>
                    <span className="text-neutral-600 hidden md:inline">|</span>
                    <span className="text-neutral-300 hidden md:inline">Grid: {formatGrid(cursorPos, 8)}</span>
                  </>
                )}
              </div>
              <div className="bg-neutral-900/85 backdrop-blur-sm px-2 py-0.5 rounded border border-neutral-800 shadow">
                <span>Arma Reforger FCS</span>
              </div>
            </div>
          </CustomizableElementWrapper>
        </div>
      )}
    </div>
  );
};
