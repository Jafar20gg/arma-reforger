/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  FireMissionSolution,
  Language,
  LocationLayer,
  MortarState,
  POI,
  Target,
  TerrainConfig,
} from '../types';
import { TerrainImageConfig, getTileUrl, fetchSiteTileMeta } from '../utils/imageStore';
import { formatCoordinates, to6DigitGrid } from '../utils/coordinates';
import { sampleAltitudeAt } from '../utils/heightmap';
import { mapLogger } from '../utils/mapLogger';
import { translations } from '../i18n/translations';
import {
  Crosshair,
  MapPin,
  Trash2,
  Image as ImageIcon,
  HelpCircle,
  Plus,
  Compass,
  AlertCircle,
  Activity,
  Maximize2,
  Upload,
} from 'lucide-react';

interface MortarMapProps {
  terrain: TerrainConfig;
  mortar: MortarState;
  targets: Target[];
  selectedTargetId: string | null;
  solution: FireMissionSolution | null;
  showGrid100m: boolean;
  showPois: boolean;
  showRangeRings: boolean;
  language: Language;
  terrainImageConfig: TerrainImageConfig | null;
  pois: POI[];
  locationLayers?: LocationLayer[];
  onUpdateMortar: (updates: Partial<MortarState>) => void;
  onAddTarget: (coords: { x: number; y: number; altitude: number }) => void;
  onUpdateTarget: (id: string, updates: Partial<Target>) => void;
  onSelectTarget: (id: string) => void;
  onDeleteTarget: (id: string) => void;
  onCursorMove: (coords: { x: number; y: number } | null) => void;
  onOpenUploadModal: () => void;
  onOpenHelpModal: () => void;
  onOpenDiagnostics?: () => void;
  onOpenExternalMaps?: () => void;
  onAddPlaceAtCoords: (coords: { x: number; y: number }) => void;
  mapInstanceRef?: React.MutableRefObject<L.Map | null>;
}

export const MortarMap: React.FC<MortarMapProps> = ({
  terrain,
  mortar,
  targets,
  selectedTargetId,
  solution,
  showGrid100m,
  showPois,
  showRangeRings,
  language,
  terrainImageConfig,
  pois,
  locationLayers = [],
  onUpdateMortar,
  onAddTarget,
  onUpdateTarget,
  onSelectTarget,
  onDeleteTarget,
  onCursorMove,
  onOpenUploadModal,
  onOpenHelpModal,
  onOpenDiagnostics,
  onOpenExternalMaps,
  onAddPlaceAtCoords,
  mapInstanceRef,
}) => {
  const t = translations[language];
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  const layersRef = useRef<{
    gridLayer: L.Layer | null;
    siteTileLayer: L.Layer | null;
    imageOverlay: L.ImageOverlay | null;
    customTileLayer: L.Layer | null;
    mortarMarker: L.Marker | null;
    targetMarkers: Map<string, L.Marker>;
    locationMarkers: Map<string, L.Marker>;
    fireLine: L.Polyline | null;
    minRangeCircle: L.Circle | null;
    maxRangeCircle: L.Circle | null;
    poiLayer: L.LayerGroup | null;
  }>({
    gridLayer: null,
    siteTileLayer: null,
    imageOverlay: null,
    customTileLayer: null,
    mortarMarker: null,
    targetMarkers: new Map(),
    locationMarkers: new Map(),
    fireLine: null,
    minRangeCircle: null,
    maxRangeCircle: null,
    poiLayer: null,
  });

  const [siteAttribution, setSiteAttribution] = useState<string | null>(null);

  // Long press / Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    mapX: number;
    mapY: number;
    targetId?: string;
  } | null>(null);

  // Fit map view to terrain bounds
  const handleFitToTerrain = () => {
    if (!mapRef.current) return;
    const bounds = L.latLngBounds([0, 0], [terrain.sizeMeters, terrain.sizeMeters]);
    mapRef.current.fitBounds(bounds, { padding: [20, 20], maxZoom: 4 });
    mapRef.current.invalidateSize();
    mapLogger.addLog('info', `تم تطبيق ملاءمة الخريطة لـ ${terrain.nameAr || terrain.name} (${terrain.sizeMeters}م)`);
  };

  // ---------------------------------------------------------------------------
  // INITIALIZE LEAFLET MAP
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!containerRef.current) return;

    const bounds = L.latLngBounds([0, 0], [terrain.sizeMeters, terrain.sizeMeters]);

    // Calculate initial minZoom based on viewport width/height
    const containerWidth = containerRef.current.clientWidth || 800;
    const initialMinZoom = containerWidth < 600 ? -2 : -1.5;

    const map = L.map(containerRef.current, {
      crs: L.CRS.Simple,
      minZoom: initialMinZoom,
      maxZoom: 6,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
      maxBounds: bounds.pad(0.2),
      maxBoundsViscosity: 0.85,
      attributionControl: false,
    });

    mapRef.current = map;
    if (mapInstanceRef) {
      mapInstanceRef.current = map;
    }

    map.setView(terrain.defaultCenter, terrain.defaultZoom);
    map.fitBounds(bounds, { padding: [15, 15] });

    mapLogger.addLog(
      'info',
      `تم تهيئة خريطة Leaflet لتضاريس ${terrain.id} (الحجم: ${terrain.sizeMeters}م)`
    );

    // ---------------------------------------------------------------------------
    // ALWAYS-VISIBLE FALLBACK SCHEMATIC BACKGROUND LAYER (Canvas)
    // ---------------------------------------------------------------------------
    const TacticalGridLayer = L.GridLayer.extend({
      createTile: function (coords: { x: number; y: number; z: number }) {
        const tile = document.createElement('canvas');
        const tileSize = this.getTileSize();
        tile.width = tileSize.x;
        tile.height = tileSize.y;
        const ctx = tile.getContext('2d');
        if (!ctx) return tile;

        const nwPoint = L.point(coords.x * tileSize.x, coords.y * tileSize.y);
        const sePoint = L.point((coords.x + 1) * tileSize.x, (coords.y + 1) * tileSize.y);
        const nw = map.unproject(nwPoint, coords.z);
        const se = map.unproject(sePoint, coords.z);

        const xMin = nw.lng;
        const xMax = se.lng;
        const yMax = nw.lat;
        const yMin = se.lat;

        // Dark tactical fallback background
        ctx.fillStyle = '#080d1a';
        ctx.fillRect(0, 0, tileSize.x, tileSize.y);

        // Subtle textured dots
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, tileSize.x, tileSize.y);

        // 100m Minor Grid Lines (drawn when zoomed in)
        if (coords.z >= 2) {
          const minorStep = 100;
          const startXMinor = Math.floor(xMin / minorStep) * minorStep;
          const startYMinor = Math.floor(yMin / minorStep) * minorStep;

          ctx.lineWidth = 0.5;
          ctx.strokeStyle = 'rgba(74, 222, 128, 0.08)';

          for (let gx = startXMinor; gx <= xMax; gx += minorStep) {
            if (gx < 0 || gx > terrain.sizeMeters) continue;
            const pt = map.project([yMin, gx], coords.z).subtract(nwPoint);
            ctx.beginPath();
            ctx.moveTo(pt.x, 0);
            ctx.lineTo(pt.x, tileSize.y);
            ctx.stroke();
          }

          for (let gy = startYMinor; gy <= yMax; gy += minorStep) {
            if (gy < 0 || gy > terrain.sizeMeters) continue;
            const pt = map.project([gy, xMin], coords.z).subtract(nwPoint);
            ctx.beginPath();
            ctx.moveTo(0, pt.y);
            ctx.lineTo(tileSize.x, pt.y);
            ctx.stroke();
          }
        }

        // Major 1km Grid Lines
        const majorStep = 1000;
        const startXMajor = Math.floor(xMin / majorStep) * majorStep;
        const startYMajor = Math.floor(yMin / majorStep) * majorStep;

        ctx.lineWidth = 1.2;
        ctx.strokeStyle = 'rgba(74, 222, 128, 0.28)';

        for (let gx = startXMajor; gx <= xMax; gx += majorStep) {
          if (gx < 0 || gx > terrain.sizeMeters) continue;
          const pt = map.project([yMin, gx], coords.z).subtract(nwPoint);
          ctx.beginPath();
          ctx.moveTo(pt.x, 0);
          ctx.lineTo(pt.x, tileSize.y);
          ctx.stroke();

          // Label major grid line (e.g. 05)
          const gridLabel = Math.floor(gx / 1000).toString().padStart(2, '0');
          ctx.fillStyle = 'rgba(74, 222, 128, 0.85)';
          ctx.font = '10px "JetBrains Mono", monospace';
          ctx.fillText(gridLabel, pt.x + 4, 14);
        }

        for (let gy = startYMajor; gy <= yMax; gy += majorStep) {
          if (gy < 0 || gy > terrain.sizeMeters) continue;
          const pt = map.project([gy, xMin], coords.z).subtract(nwPoint);
          ctx.beginPath();
          ctx.moveTo(0, pt.y);
          ctx.lineTo(tileSize.x, pt.y);
          ctx.stroke();

          const gridLabel = Math.floor(gy / 1000).toString().padStart(2, '0');
          ctx.fillStyle = 'rgba(74, 222, 128, 0.85)';
          ctx.font = '10px "JetBrains Mono", monospace';
          ctx.fillText(gridLabel, 4, pt.y - 4);
        }

        // Outer terrain boundary outline
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
        ctx.lineWidth = 1.5;

        // Bottom edge (y=0)
        if (0 >= yMin && 0 <= yMax) {
          const pt = map.project([0, Math.max(0, xMin)], coords.z).subtract(nwPoint);
          ctx.strokeRect(0, pt.y, tileSize.x, 1);
        }
        // Top edge (y=sizeMeters)
        if (terrain.sizeMeters >= yMin && terrain.sizeMeters <= yMax) {
          const pt = map.project([terrain.sizeMeters, Math.max(0, xMin)], coords.z).subtract(nwPoint);
          ctx.strokeRect(0, pt.y, tileSize.x, 1);
        }

        return tile;
      },
    });

    const gridBase = new (TacticalGridLayer as any)({ bounds }) as L.Layer;
    gridBase.addTo(map);
    layersRef.current.gridLayer = gridBase;

    // Mouse movement HUD tracking
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      const x = Math.max(0, Math.min(terrain.sizeMeters, Math.round(e.latlng.lng)));
      const y = Math.max(0, Math.min(terrain.sizeMeters, Math.round(e.latlng.lat)));
      onCursorMove({ x, y });
    });

    map.on('mouseout', () => {
      onCursorMove(null);
    });

    // Tap on map to add/select target
    map.on('click', async (e: L.LeafletMouseEvent) => {
      setContextMenu(null);

      const clickX = Math.round(e.latlng.lng);
      const clickY = Math.round(e.latlng.lat);
      if (clickX < 0 || clickX > terrain.sizeMeters || clickY < 0 || clickY > terrain.sizeMeters) {
        return;
      }

      const { altitude } = await sampleAltitudeAt(terrain.id, clickX, clickY, terrain.sizeMeters);
      onAddTarget({ x: clickX, y: clickY, altitude });
    });

    // Right-click / Long press context menu
    map.on('contextmenu', (e: L.LeafletMouseEvent) => {
      const clickX = Math.round(e.latlng.lng);
      const clickY = Math.round(e.latlng.lat);
      setContextMenu({
        x: e.containerPoint.x,
        y: e.containerPoint.y,
        mapX: clickX,
        mapY: clickY,
      });
    });

    // Resize observer to ensure map.invalidateSize() is called
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(containerRef.current);

    // Initial size invalidation after layout settle
    const timer = setTimeout(() => {
      map.invalidateSize();
      map.fitBounds(bounds, { padding: [15, 15] });
    }, 100);

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, [terrain.id, terrain.sizeMeters]);

  // ---------------------------------------------------------------------------
  // IMAGE OVERLAY, SITE TILES & CUSTOM TILE LAYER MANAGEMENT
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    let isCancelled = false;

    // Remove previous site tile layer
    if (layersRef.current.siteTileLayer) {
      map.removeLayer(layersRef.current.siteTileLayer);
      layersRef.current.siteTileLayer = null;
    }

    // Remove previous image overlay
    if (layersRef.current.imageOverlay) {
      map.removeLayer(layersRef.current.imageOverlay);
      layersRef.current.imageOverlay = null;
    }

    // Remove previous tile layer
    if (layersRef.current.customTileLayer) {
      map.removeLayer(layersRef.current.customTileLayer);
      layersRef.current.customTileLayer = null;
    }

    // 1. Check if the site ships its own tiles at ./tiles/{terrain}/meta.json
    fetchSiteTileMeta(terrain.id).then((siteMeta) => {
      if (isCancelled || !mapRef.current) return;

      if (siteMeta) {
        const bounds = L.latLngBounds([0, 0], [siteMeta.sizeMeters || terrain.sizeMeters, siteMeta.sizeMeters || terrain.sizeMeters]);
        const tileUrl = `./tiles/${terrain.id}/{z}/{x}/{y}.${siteMeta.format || 'webp'}`;

        const siteLayer = L.tileLayer(tileUrl, {
          bounds,
          tileSize: siteMeta.tileSize || 256,
          minZoom: siteMeta.minZoom ?? 0,
          maxZoom: siteMeta.maxZoom ?? 6,
          tms: siteMeta.yOrder === 'tms',
          opacity: terrainImageConfig?.opacity ?? 0.88,
          errorTileUrl: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', // graceful transparent tile on 404
          attribution: siteMeta.attribution,
        });

        siteLayer.on('tileerror', (e) => {
          mapLogger.recordTileError(e.error?.message || 'Missing tile');
        });

        siteLayer.addTo(map);
        layersRef.current.siteTileLayer = siteLayer;
        setSiteAttribution(siteMeta.attribution);
        mapLogger.addLog(
          'info',
          `تم تفعيل بلاطات الخريطة التلقائية لـ ${terrain.id} من مجلد الموقع (${siteMeta.attribution})`
        );
      } else {
        setSiteAttribution(null);
      }
    });

    if (terrainImageConfig?.tileSourceType === 'folder') {
      // Local tiles loaded from EnfusionMapMaker folder via IndexedDB
      const bounds = L.latLngBounds([0, 0], [terrain.sizeMeters, terrain.sizeMeters]);
      const FolderLayer = (L.GridLayer as any).extend({
        createTile: function (coords: { x: number; y: number; z: number }) {
          const tile = document.createElement('img');
          tile.style.width = '256px';
          tile.style.height = '256px';
          tile.style.opacity = String(terrainImageConfig.opacity ?? 0.85);
          tile.style.pointerEvents = 'none';

          getTileUrl(terrain.id, coords.z, coords.x, coords.y)
            .then((url) => {
              if (url) {
                tile.src = url;
              } else {
                tile.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
              }
            })
            .catch(() => {
              tile.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
            });

          return tile;
        },
      });

      const folderTiles = new FolderLayer({
        bounds,
        minZoom: 0,
        maxZoom: 6,
      }) as L.Layer;

      folderTiles.addTo(map);
      layersRef.current.customTileLayer = folderTiles;
      mapLogger.addLog('info', `تم تفعيل طبقة الشرائح المحلية لـ ${terrain.id}`);
    } else if (terrainImageConfig?.tileUrlTemplate && terrainImageConfig?.tileSourceType === 'url') {
      // User-entered custom tile URL template (optional, advanced)
      const bounds = L.latLngBounds([0, 0], [terrain.sizeMeters, terrain.sizeMeters]);
      const tiles = L.tileLayer(terrainImageConfig.tileUrlTemplate, {
        bounds,
        minZoom: 0,
        maxZoom: 6,
        opacity: terrainImageConfig.opacity,
      });

      tiles.on('tileerror', (e) => {
        mapLogger.recordTileError(e.error?.message);
      });

      tiles.addTo(map);
      layersRef.current.customTileLayer = tiles;
      mapLogger.addLog('info', `تم تفعيل طبقة الشرائح المخصصة: ${terrainImageConfig.tileUrlTemplate}`);
    } else if (terrainImageConfig?.imageUrl) {
      // Local ImageOverlay in CRS.Simple with bounds [[0, 0], [sizeMeters, sizeMeters]] or calibrated bounds
      const bounds = terrainImageConfig.bounds || [
        [0, 0],
        [terrain.sizeMeters, terrain.sizeMeters],
      ];

      const overlay = L.imageOverlay(terrainImageConfig.imageUrl, bounds, {
        opacity: terrainImageConfig.opacity ?? 0.85,
        interactive: false,
        zIndex: 4,
      });

      overlay.on('load', () => {
        mapLogger.addLog('info', `تم تحميل وعرض طبقة صورة الخريطة لـ ${terrain.id} بنجاح.`);

        // Handle vertical axis flip ("عكس المحور الرأسي") if enabled
        const imgEl = overlay.getElement();
        if (imgEl && terrainImageConfig.flipY) {
          imgEl.style.transform = `${imgEl.style.transform || ''} scaleY(-1)`.trim();
          imgEl.style.transformOrigin = 'center center';
        }
      });

      overlay.on('error', () => {
        mapLogger.recordImageError('فشل عنصر Leaflet ImageOverlay في عرض الصورة.');
      });

      overlay.addTo(map);
      layersRef.current.imageOverlay = overlay;

      // Fit bounds to the terrain or calibrated image bounds
      map.fitBounds(bounds as any, { padding: [15, 15] });
      map.invalidateSize();
    }

    return () => {
      isCancelled = true;
    };
  }, [terrainImageConfig, terrain.sizeMeters, terrain.id]);

  // ---------------------------------------------------------------------------
  // LOCATION LAYERS (JSON imported points)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const activeItemIds = new Set<string>();

    (locationLayers || []).forEach((layer) => {
      if (!layer.isVisible || layer.terrain !== terrain.id) return;

      layer.items.forEach((item) => {
        const markerKey = `${layer.id}-${item.id}`;
        activeItemIds.add(markerKey);

        let marker = layersRef.current.locationMarkers.get(markerKey);
        if (!marker) {
          const icon = L.divIcon({
            className: 'location-layer-marker',
            html: `
              <div style="
                display: flex;
                align-items: center;
                justify-content: center;
                width: 14px;
                height: 14px;
                border-radius: 50%;
                background: ${layer.color};
                border: 1.5px solid #0f172a;
                box-shadow: 0 0 6px ${layer.color}aa;
                cursor: pointer;
              ">
                <div style="width: 4px; height: 4px; border-radius: 50%; background: #ffffff;"></div>
              </div>
            `,
            iconSize: [14, 14],
            iconAnchor: [7, 7],
          });

          marker = L.marker([item.y, item.x], { icon }).addTo(map);
          marker.bindTooltip(
            `<b>${item.name}</b><br><span style="font-family: monospace; font-size: 10px;">GRID: ${to6DigitGrid(
              item.x,
              item.y
            )}</span>`,
            { direction: 'top', offset: [0, -8], opacity: 0.95 }
          );

          marker.on('click', () => {
            onAddTarget({ x: item.x, y: item.y, altitude: item.height || 0 });
          });

          layersRef.current.locationMarkers.set(markerKey, marker);
        } else {
          marker.setLatLng([item.y, item.x]);
        }
      });
    });

    layersRef.current.locationMarkers.forEach((marker, key) => {
      if (!activeItemIds.has(key)) {
        map.removeLayer(marker);
        layersRef.current.locationMarkers.delete(key);
      }
    });
  }, [locationLayers, terrain.id]);

  // ---------------------------------------------------------------------------
  // POIS (POINTS OF INTEREST)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    if (layersRef.current.poiLayer) {
      map.removeLayer(layersRef.current.poiLayer);
      layersRef.current.poiLayer = null;
    }

    if (!showPois) return;

    const currentPois = pois.filter((p) => p.terrain === terrain.id);
    const poiGroup = L.layerGroup();

    currentPois.forEach((poi) => {
      const poiIcon = L.divIcon({
        className: 'poi-custom-marker',
        html: `
          <div style="display: flex; flex-direction: column; align-items: center; pointer-events: auto;">
            <div style="
              width: 8px;
              height: 8px;
              background-color: #38bdf8;
              border: 1px solid #0f172a;
              border-radius: 50%;
              box-shadow: 0 0 4px #38bdf8;
            "></div>
            <span style="
              color: #f8fafc;
              font-size: 10px;
              font-weight: 600;
              text-shadow: 1px 1px 2px #000, -1px -1px 2px #000;
              margin-top: 2px;
              white-space: nowrap;
            ">${language === 'ar' ? poi.nameAr || poi.name : poi.name}</span>
          </div>
        `,
        iconSize: [80, 24],
        iconAnchor: [40, 4],
      });

      const marker = L.marker([poi.y, poi.x], { icon: poiIcon });
      marker.on('click', async () => {
        const { altitude } = await sampleAltitudeAt(terrain.id, poi.x, poi.y, terrain.sizeMeters);
        onAddTarget({ x: poi.x, y: poi.y, altitude });
      });
      marker.addTo(poiGroup);
    });

    poiGroup.addTo(map);
    layersRef.current.poiLayer = poiGroup;
  }, [pois, showPois, terrain.id, language]);

  // ---------------------------------------------------------------------------
  // MORTAR POSITION MARKER & RANGE RINGS
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // Mortar Marker
    if (!layersRef.current.mortarMarker) {
      const mortarIcon = L.divIcon({
        className: 'mortar-marker-icon',
        html: `
          <div style="
            width: 28px;
            height: 28px;
            background: rgba(8, 145, 178, 0.9);
            border: 2px solid #22d3ee;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 12px rgba(34, 211, 238, 0.7);
            cursor: move;
          ">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="22" y1="12" x2="18" y2="12"></line>
              <line x1="6" y1="12" x2="2" y2="12"></line>
              <line x1="12" y1="6" x2="12" y2="2"></line>
              <line x1="12" y1="22" x2="12" y2="18"></line>
            </svg>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([mortar.y, mortar.x], {
        icon: mortarIcon,
        draggable: true,
        zIndexOffset: 1000,
      }).addTo(map);

      marker.on('dragend', async (e: any) => {
        const latlng = e.target.getLatLng();
        const newX = Math.round(latlng.lng);
        const newY = Math.round(latlng.lat);
        const { altitude } = await sampleAltitudeAt(terrain.id, newX, newY, terrain.sizeMeters);
        onUpdateMortar({ x: newX, y: newY, altitude });
      });

      layersRef.current.mortarMarker = marker;
    } else {
      layersRef.current.mortarMarker.setLatLng([mortar.y, mortar.x]);
    }

    // Range Rings
    if (layersRef.current.minRangeCircle) {
      map.removeLayer(layersRef.current.minRangeCircle);
      layersRef.current.minRangeCircle = null;
    }
    if (layersRef.current.maxRangeCircle) {
      map.removeLayer(layersRef.current.maxRangeCircle);
      layersRef.current.maxRangeCircle = null;
    }

    if (showRangeRings) {
      layersRef.current.minRangeCircle = L.circle([mortar.y, mortar.x], {
        radius: 60,
        color: '#f43f5e',
        weight: 1.5,
        dashArray: '3, 4',
        fill: false,
        interactive: false,
      }).addTo(map);

      layersRef.current.maxRangeCircle = L.circle([mortar.y, mortar.x], {
        radius: 3500,
        color: '#06b6d4',
        weight: 1.5,
        dashArray: '6, 6',
        fill: true,
        fillColor: '#06b6d4',
        fillOpacity: 0.03,
        interactive: false,
      }).addTo(map);
    }
  }, [mortar, showRangeRings, terrain.id, terrain.sizeMeters]);

  // ---------------------------------------------------------------------------
  // TARGET MARKERS & BALLISTIC FIRE LINE
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const currentTargetIds = new Set(targets.map((t) => t.id));

    // Remove targets that no longer exist
    layersRef.current.targetMarkers.forEach((marker, id) => {
      if (!currentTargetIds.has(id)) {
        map.removeLayer(marker);
        layersRef.current.targetMarkers.delete(id);
      }
    });

    targets.forEach((target, index) => {
      const isSelected = target.id === selectedTargetId;
      let marker = layersRef.current.targetMarkers.get(target.id);

      const targetIcon = L.divIcon({
        className: 'target-marker-icon',
        html: `
          <div style="
            width: ${isSelected ? '26px' : '22px'};
            height: ${isSelected ? '26px' : '22px'};
            background: ${isSelected ? 'rgba(239, 68, 68, 0.95)' : 'rgba(220, 38, 38, 0.75)'};
            border: 2px solid ${isSelected ? '#fecaca' : '#f87171'};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 ${isSelected ? '14px rgba(239, 68, 68, 0.9)' : '6px rgba(239, 68, 68, 0.5)'};
            color: #ffffff;
            font-size: 11px;
            font-weight: 800;
            cursor: pointer;
          ">
            ${index + 1}
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

      if (!marker) {
        marker = L.marker([target.y, target.x], {
          icon: targetIcon,
          draggable: true,
          zIndexOffset: isSelected ? 900 : 800,
        }).addTo(map);

        marker.on('click', () => onSelectTarget(target.id));

        marker.on('dragend', async (e: any) => {
          const latlng = e.target.getLatLng();
          const newX = Math.round(latlng.lng);
          const newY = Math.round(latlng.lat);
          const { altitude } = await sampleAltitudeAt(terrain.id, newX, newY, terrain.sizeMeters);
          onUpdateTarget(target.id, { x: newX, y: newY, altitude });
        });

        layersRef.current.targetMarkers.set(target.id, marker);
      } else {
        marker.setLatLng([target.y, target.x]);
        marker.setIcon(targetIcon);
        marker.setZIndexOffset(isSelected ? 900 : 800);
      }
    });

    // Fire Solution Line
    if (layersRef.current.fireLine) {
      map.removeLayer(layersRef.current.fireLine);
      layersRef.current.fireLine = null;
    }

    const activeTarget = targets.find((t) => t.id === selectedTargetId) || targets[0];
    if (activeTarget) {
      layersRef.current.fireLine = L.polyline(
        [
          [mortar.y, mortar.x],
          [activeTarget.y, activeTarget.x],
        ],
        {
          color: '#f59e0b',
          weight: 2,
          dashArray: '5, 5',
          interactive: false,
        }
      ).addTo(map);
    }
  }, [targets, selectedTargetId, mortar, terrain.id, terrain.sizeMeters]);

  // Context Menu handlers
  const handleSetMortarFromMenu = async () => {
    if (!contextMenu) return;
    const { altitude } = await sampleAltitudeAt(
      terrain.id,
      contextMenu.mapX,
      contextMenu.mapY,
      terrain.sizeMeters
    );
    onUpdateMortar({ x: contextMenu.mapX, y: contextMenu.mapY, altitude });
    setContextMenu(null);
  };

  const handleSetTargetFromMenu = async () => {
    if (!contextMenu) return;
    const { altitude } = await sampleAltitudeAt(
      terrain.id,
      contextMenu.mapX,
      contextMenu.mapY,
      terrain.sizeMeters
    );
    onAddTarget({ x: contextMenu.mapX, y: contextMenu.mapY, altitude });
    setContextMenu(null);
  };

  const handleAddPlaceFromMenu = () => {
    if (!contextMenu) return;
    onAddPlaceAtCoords({ x: contextMenu.mapX, y: contextMenu.mapY });
    setContextMenu(null);
  };

  const handleDeleteFromMenu = () => {
    if (contextMenu?.targetId) {
      onDeleteTarget(contextMenu.targetId);
    }
    setContextMenu(null);
  };

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-slate-950 flex-1">
      {/* Schematic Compass Rose in Map Corner */}
      <div className="absolute bottom-4 start-4 z-20 pointer-events-none opacity-50 hover:opacity-90 transition">
        <div className="w-16 h-16 rounded-full border border-slate-700/80 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center relative font-mono text-[9px] text-slate-400">
          <span className="absolute top-1 font-bold text-amber-400">N</span>
          <span className="absolute right-1">E</span>
          <span className="absolute bottom-1">S</span>
          <span className="absolute left-1">W</span>
          <Compass className="w-6 h-6 text-slate-600" />
        </div>
      </div>

      {/* Floating Map Controls: "ملاءمة الخريطة" & "تشخيص الخريطة" & "خرائط خارجية" */}
      <div className="absolute top-3 end-3 z-30 flex flex-col gap-1.5">
        <button
          onClick={handleFitToTerrain}
          className="p-2 rounded-lg bg-slate-900/90 border border-slate-700/90 hover:border-cyan-500 text-cyan-400 hover:text-white shadow-xl backdrop-blur-md flex items-center gap-1.5 text-xs font-semibold transition"
          title={language === 'ar' ? 'ملاءمة الخريطة كاملة' : 'Fit Entire Terrain'}
        >
          <Maximize2 className="w-4 h-4" />
          <span className="hidden sm:inline">{language === 'ar' ? 'ملاءمة الخريطة' : 'Fit Map'}</span>
        </button>

        {onOpenDiagnostics && (
          <button
            onClick={onOpenDiagnostics}
            className="p-2 rounded-lg bg-slate-900/90 border border-slate-700/90 hover:border-cyan-500 text-slate-300 hover:text-cyan-300 shadow-xl backdrop-blur-md flex items-center gap-1.5 text-xs font-semibold transition"
            title={language === 'ar' ? 'تشخيص الخريطة' : 'Map Diagnostics'}
          >
            <Activity className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">{language === 'ar' ? 'التشخيص' : 'Diagnostics'}</span>
          </button>
        )}

        {onOpenExternalMaps && (
          <button
            onClick={onOpenExternalMaps}
            className="p-2 rounded-lg bg-slate-900/90 border border-emerald-500/40 hover:border-emerald-400 text-emerald-400 hover:text-white shadow-xl backdrop-blur-md flex items-center gap-1.5 text-xs font-semibold transition"
            title={language === 'ar' ? 'خرائط اللعبة الخارجية (TacOps / Recoil)' : 'External Game Maps'}
          >
            <Compass className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">{language === 'ar' ? 'خرائط خارجية' : 'Ext Maps'}</span>
          </button>
        )}
      </div>

      {/* On-Map Attribution Text (EnfusionMapMaker / Site Tiles) */}
      {siteAttribution && (
        <div className="absolute bottom-2 start-2 z-30 max-w-[280px] sm:max-w-md bg-slate-950/85 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800 text-[10px] text-slate-300 flex items-center gap-1.5 shadow-lg select-none pointer-events-auto">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
          <span className="truncate font-mono">{siteAttribution}</span>
        </div>
      )}

      {/* Banner when no image or site tiles are loaded */}
      {!terrainImageConfig?.imageUrl && !terrainImageConfig?.tileUrlTemplate && !siteAttribution && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-30 max-w-xl w-[92%] bg-slate-950/95 border border-cyan-500/50 rounded-xl p-3 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-cyan-200 text-xs">
              <ImageIcon className="w-4 h-4 shrink-0 text-cyan-400" />
              <span>
                {language === 'ar'
                  ? `لا توجد صورة خريطة لـ ${terrain.nameAr || terrain.name}:`
                  : `No map image loaded for ${terrain.name}:`}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={onOpenUploadModal}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'رفع صورة الخريطة' : 'Upload Map'}</span>
              </button>

              {onOpenExternalMaps && (
                <button
                  onClick={onOpenExternalMaps}
                  className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 transition shadow"
                  title={language === 'ar' ? 'فتح خريطة اللعبة في TacOps أو Recoil' : 'Open in TacOps or Recoil'}
                >
                  <Compass className="w-3.5 h-3.5 text-emerald-300" />
                  <span>{language === 'ar' ? 'خرائط اللعبة' : 'Game Maps'}</span>
                </button>
              )}

              {onOpenDiagnostics && (
                <button
                  onClick={onOpenDiagnostics}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold flex items-center gap-1 transition border border-slate-700"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'تشخيص' : 'Diagnostics'}</span>
                </button>
              )}

              <button
                onClick={onOpenHelpModal}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition"
                title={t.howToPrepareMap}
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map Leaflet Container (Explicit height and width) */}
      <div ref={containerRef} className="w-full h-full min-h-[300px] z-0" />

      {/* Context Menu / Long Press Modal */}
      {contextMenu && (
        <div
          className="absolute z-50 bg-slate-900 border border-slate-700/80 rounded-lg shadow-2xl p-1.5 min-w-[200px] backdrop-blur-md animate-in fade-in zoom-in-95 duration-100"
          style={{
            top: Math.min(window.innerHeight - 180, Math.max(10, contextMenu.y - 20)),
            left: Math.min(window.innerWidth - 220, Math.max(10, contextMenu.x - 20)),
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="px-2 py-1 text-[11px] font-mono text-slate-400 border-b border-slate-800 mb-1 flex items-center justify-between"
            dir="ltr"
          >
            <span>GRID: {to6DigitGrid(contextMenu.mapX, contextMenu.mapY)}</span>
            <span className="text-[10px] text-slate-500">
              {contextMenu.mapX}m, {contextMenu.mapY}m
            </span>
          </div>

          <button
            onClick={handleSetMortarFromMenu}
            className="w-full text-start flex items-center gap-2 px-2.5 py-1.5 text-xs text-cyan-300 hover:bg-cyan-950/40 rounded transition-colors"
          >
            <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t.setAsMortar}</span>
          </button>

          <button
            onClick={handleSetTargetFromMenu}
            className="w-full text-start flex items-center gap-2 px-2.5 py-1.5 text-xs text-red-300 hover:bg-red-950/40 rounded transition-colors"
          >
            <MapPin className="w-3.5 h-3.5 text-red-400" />
            <span>{t.setAsTarget}</span>
          </button>

          <button
            onClick={handleAddPlaceFromMenu}
            className="w-full text-start flex items-center gap-2 px-2.5 py-1.5 text-xs text-emerald-300 hover:bg-emerald-950/40 rounded transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t.addPlace}</span>
          </button>

          {contextMenu.targetId && (
            <button
              onClick={handleDeleteFromMenu}
              className="w-full text-start flex items-center gap-2 px-2.5 py-1.5 text-xs text-rose-400 hover:bg-rose-950/40 rounded transition-colors border-t border-slate-800/80 mt-1"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>{t.deleteTarget}</span>
            </button>
          )}

          <button
            onClick={() => setContextMenu(null)}
            className="w-full text-start px-2.5 py-1 text-[10px] text-slate-500 hover:text-slate-300 mt-1 text-center"
          >
            {t.cancel}
          </button>
        </div>
      )}
    </div>
  );
};
