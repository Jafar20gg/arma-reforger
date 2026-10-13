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
import { TerrainImageConfig, getTileUrl } from '../utils/imageStore';
import { formatCoordinates, to6DigitGrid } from '../utils/coordinates';
import { sampleAltitudeAt } from '../utils/heightmap';
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
  Globe,
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
  onOpenRecoilMaps?: () => void;
  onOpenHelpModal: () => void;
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
  onOpenRecoilMaps,
  onOpenHelpModal,
  onAddPlaceAtCoords,
  mapInstanceRef,
}) => {
  const t = translations[language];
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  const layersRef = useRef<{
    gridLayer: L.Layer | null;
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

  // Long press / Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    mapX: number;
    mapY: number;
    targetId?: string;
  } | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!containerRef.current) return;

    const bounds = L.latLngBounds(
      [0, 0],
      [terrain.sizeMeters, terrain.sizeMeters]
    );

    const map = L.map(containerRef.current, {
      crs: L.CRS.Simple,
      minZoom: -1,
      maxZoom: 6,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
      maxBounds: bounds.pad(0.15),
      maxBoundsViscosity: 0.9,
      attributionControl: false,
    });

    mapRef.current = map;
    if (mapInstanceRef) {
      mapInstanceRef.current = map;
    }

    map.setView(terrain.defaultCenter, terrain.defaultZoom);

    // Tactical Schematic Grid Layer (Canvas)
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

        // Dark tactical background
        ctx.fillStyle = '#080d1a';
        ctx.fillRect(0, 0, tileSize.x, tileSize.y);

        // Sub-grid dots / textured tone
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, tileSize.x, tileSize.y);

        // Major 1km grid lines
        const majorStep = 1000;
        const startXMajor = Math.floor(xMin / majorStep) * majorStep;
        const startYMajor = Math.floor(yMin / majorStep) * majorStep;

        ctx.lineWidth = 1.2;
        ctx.strokeStyle = 'rgba(74, 222, 128, 0.22)'; // Tactical green line

        for (let gx = startXMajor; gx <= xMax; gx += majorStep) {
          if (gx < 0 || gx > terrain.sizeMeters) continue;
          const pt = map.project([yMin, gx], coords.z).subtract(nwPoint);
          ctx.beginPath();
          ctx.moveTo(pt.x, 0);
          ctx.lineTo(pt.x, tileSize.y);
          ctx.stroke();

          // Label major grid (e.g. 05)
          const gridLabel = Math.floor(gx / 1000).toString().padStart(2, '0');
          ctx.fillStyle = 'rgba(74, 222, 128, 0.75)';
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
          ctx.fillStyle = 'rgba(74, 222, 128, 0.75)';
          ctx.font = '10px "JetBrains Mono", monospace';
          ctx.fillText(gridLabel, 4, pt.y - 4);
        }

        // Draw terrain outer boundary box
        if (xMin <= 0 && xMax >= 0) {
          const pt = map.project([0, 0], coords.z).subtract(nwPoint);
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
          ctx.strokeRect(pt.x, 0, 1, tileSize.y);
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

    // Map Click: tap to place/select
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

    // Long press / Right-click context menu
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

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [terrain.id, terrain.sizeMeters]);

  // ImageOverlay & Custom TileLayer Management
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // Clean up previous image overlay
    if (layersRef.current.imageOverlay) {
      map.removeLayer(layersRef.current.imageOverlay);
      layersRef.current.imageOverlay = null;
    }

    // Clean up previous custom tile layer
    if (layersRef.current.customTileLayer) {
      map.removeLayer(layersRef.current.customTileLayer);
      layersRef.current.customTileLayer = null;
    }

    // Add Tile Layer or Image Overlay based on configured source
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
    } else if (terrainImageConfig?.tileSourceType === 'recoil' && terrainImageConfig?.tileUrlTemplate) {
      // Direct Recoil.org tile layer with inverted Y coordinates (542px tiles)
      const bounds = L.latLngBounds([0, 0], [terrain.sizeMeters, terrain.sizeMeters]);
      const RecoilTileLayer = (L.TileLayer as any).extend({
        getTileUrl: function (coords: { x: number; y: number; z: number }) {
          const flipped = { ...coords, y: -(coords.y + 1) };
          return (L.TileLayer.prototype as any).getTileUrl.call(this, flipped);
        },
      });

      const recoilTiles = new RecoilTileLayer(terrainImageConfig.tileUrlTemplate, {
        bounds,
        minZoom: 0,
        maxZoom: 6,
        tileSize: 542,
        opacity: terrainImageConfig.opacity ?? 0.85,
      }) as L.Layer;

      recoilTiles.addTo(map);
      layersRef.current.customTileLayer = recoilTiles;
    } else if (terrainImageConfig?.tileUrlTemplate && (terrainImageConfig?.tileSourceType === 'url' || !terrainImageConfig?.imageUrl)) {
      // Custom user-hosted tiles via URL template
      const bounds = L.latLngBounds([0, 0], [terrain.sizeMeters, terrain.sizeMeters]);
      const tiles = L.tileLayer(terrainImageConfig.tileUrlTemplate, {
        bounds,
        minZoom: 0,
        maxZoom: 6,
        opacity: terrainImageConfig.opacity,
      });
      tiles.addTo(map);
      layersRef.current.customTileLayer = tiles;
    } else if (terrainImageConfig?.imageUrl) {
      // Single screenshot image overlay
      const overlay = L.imageOverlay(
        terrainImageConfig.imageUrl,
        terrainImageConfig.bounds,
        {
          opacity: terrainImageConfig.opacity,
          interactive: false,
          zIndex: 4,
        }
      );
      overlay.addTo(map);
      layersRef.current.imageOverlay = overlay;
    }
  }, [terrainImageConfig, terrain.sizeMeters, terrain.id]);

  // Render Location Layers (JSON imported points)
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

          marker = L.marker([item.y, item.x], {
            icon,
            zIndexOffset: 300,
          });

          marker.bindTooltip(
            `<b>[${layer.name}]</b> ${item.name}${item.height !== undefined ? ` • ${item.height}m` : ''}`,
            {
              direction: 'top',
              offset: [0, -6],
              className: 'tactical-line-tooltip',
            }
          );

          marker.on('click', (e: L.LeafletEvent) => {
            L.DomEvent.stopPropagation(e);
            onAddTarget({
              x: item.x,
              y: item.y,
              altitude: item.height ?? 0,
            });
          });

          marker.on('contextmenu', (e: L.LeafletMouseEvent) => {
            L.DomEvent.stopPropagation(e);
            setContextMenu({
              x: e.containerPoint.x,
              y: e.containerPoint.y,
              mapX: item.x,
              mapY: item.y,
            });
          });

          marker.addTo(map);
          layersRef.current.locationMarkers.set(markerKey, marker);
        } else {
          marker.setLatLng([item.y, item.x]);
        }
      });
    });

    // Remove obsolete markers
    layersRef.current.locationMarkers.forEach((marker, key) => {
      if (!activeItemIds.has(key)) {
        map.removeLayer(marker);
        layersRef.current.locationMarkers.delete(key);
      }
    });
  }, [locationLayers, terrain.id, onAddTarget]);

  // Minor 100m Grid Overlay Toggle
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    let minorLayer: L.Layer | null = null;
    if (showGrid100m) {
      const MinorGrid = L.GridLayer.extend({
        createTile: function (coords: { x: number; y: number; z: number }) {
          const tile = document.createElement('canvas');
          const tileSize = this.getTileSize();
          tile.width = tileSize.x;
          tile.height = tileSize.y;
          const ctx = tile.getContext('2d');
          if (!ctx) return tile;

          if (coords.z < 2) return tile;

          const nwPoint = L.point(coords.x * tileSize.x, coords.y * tileSize.y);
          const sePoint = L.point((coords.x + 1) * tileSize.x, (coords.y + 1) * tileSize.y);
          const nw = map.unproject(nwPoint, coords.z);
          const se = map.unproject(sePoint, coords.z);

          const xMin = nw.lng;
          const xMax = se.lng;
          const yMax = nw.lat;
          const yMin = se.lat;

          const step = 100;
          const startX = Math.floor(xMin / step) * step;
          const startY = Math.floor(yMin / step) * step;

          ctx.lineWidth = 0.6;
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';

          for (let gx = startX; gx <= xMax; gx += step) {
            if (gx % 1000 === 0) continue;
            const pt = map.project([yMin, gx], coords.z).subtract(nwPoint);
            ctx.beginPath();
            ctx.moveTo(pt.x, 0);
            ctx.lineTo(pt.x, tileSize.y);
            ctx.stroke();
          }

          for (let gy = startY; gy <= yMax; gy += step) {
            if (gy % 1000 === 0) continue;
            const pt = map.project([gy, xMin], coords.z).subtract(nwPoint);
            ctx.beginPath();
            ctx.moveTo(0, pt.y);
            ctx.lineTo(tileSize.x, pt.y);
            ctx.stroke();
          }

          return tile;
        },
      });

      minorLayer = new (MinorGrid as any)({ zIndex: 10 }) as L.Layer;
      if (minorLayer) {
        minorLayer.addTo(map);
      }
    }

    return () => {
      if (minorLayer && mapRef.current) {
        mapRef.current.removeLayer(minorLayer);
      }
    };
  }, [showGrid100m, terrain.sizeMeters]);

  // POIs / Places Layer
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    if (layersRef.current.poiLayer) {
      map.removeLayer(layersRef.current.poiLayer);
      layersRef.current.poiLayer = null;
    }

    if (showPois) {
      const currentPois = pois.filter((p) => p.terrain === terrain.id);
      const group = L.layerGroup();

      currentPois.forEach((poi) => {
        const text = language === 'ar' && poi.nameAr ? poi.nameAr : poi.name;
        const icon = L.divIcon({
          className: 'tactical-poi-marker',
          html: `
            <div class="px-2 py-0.5 rounded bg-slate-900/90 border ${
              poi.isVerified ? 'border-emerald-500/60 text-emerald-300' : 'border-amber-500/60 text-amber-300'
            } text-[10px] font-mono tracking-wider shadow pointer-events-none whitespace-nowrap flex items-center gap-1">
              <span>📍</span>
              <span>${text}</span>
            </div>
          `,
          iconSize: [80, 20],
          iconAnchor: [40, 10],
        });

        const marker = L.marker([poi.y, poi.x], { icon, interactive: false, zIndexOffset: 200 });
        group.addLayer(marker);
      });

      group.addTo(map);
      layersRef.current.poiLayer = group;
    }
  }, [showPois, pois, terrain.id, language]);

  // Mortar Marker
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    const mortarIcon = L.divIcon({
      className: 'mortar-marker-pin',
      html: `
        <div class="relative group cursor-grab active:cursor-grabbing">
          <div class="absolute -inset-1.5 rounded-full bg-cyan-500/30 animate-pulse"></div>
          <div class="w-8 h-8 rounded-full bg-slate-950 border-2 border-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/40">
            <svg class="w-5 h-5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="2" x2="12" y2="6"/>
              <line x1="12" y1="18" x2="12" y2="22"/>
              <line x1="2" y1="12" x2="6" y2="12"/>
              <line x1="18" y1="12" x2="22" y2="12"/>
              <polygon points="12 8 14 16 10 16" fill="currentColor"/>
            </svg>
          </div>
          <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-slate-900/90 border border-cyan-500/50 text-[10px] text-cyan-300 font-mono font-bold whitespace-nowrap shadow pointer-events-none" dir="ltr">
            M (${mortar.altitude}m)
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    if (layersRef.current.mortarMarker) {
      layersRef.current.mortarMarker.setLatLng([mortar.y, mortar.x]);
      layersRef.current.mortarMarker.setIcon(mortarIcon);
    } else {
      const marker = L.marker([mortar.y, mortar.x], {
        icon: mortarIcon,
        draggable: true,
        zIndexOffset: 1000,
      });

      marker.on('dragend', async (e: L.LeafletEvent) => {
        const latLng = (e.target as L.Marker).getLatLng();
        const newX = Math.round(latLng.lng);
        const newY = Math.round(latLng.lat);
        const { altitude } = await sampleAltitudeAt(terrain.id, newX, newY, terrain.sizeMeters);
        onUpdateMortar({ x: newX, y: newY, altitude });
      });

      marker.on('contextmenu', (e: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(e);
        setContextMenu({
          x: e.containerPoint.x,
          y: e.containerPoint.y,
          mapX: mortar.x,
          mapY: mortar.y,
        });
      });

      marker.addTo(map);
      layersRef.current.mortarMarker = marker;
    }
  }, [mortar.x, mortar.y, mortar.altitude, terrain.id]);

  // Target Markers
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const existingMarkers = layersRef.current.targetMarkers;
    const activeIds = new Set<string>();

    targets.forEach((tgt, index) => {
      activeIds.add(tgt.id);
      const isSelected = tgt.id === selectedTargetId;

      const targetIcon = L.divIcon({
        className: 'target-marker-pin',
        html: `
          <div class="relative group cursor-grab active:cursor-grabbing ${isSelected ? 'scale-110' : 'opacity-85'} transition-transform">
            ${isSelected ? '<div class="absolute -inset-2 rounded-full bg-red-500/30 animate-ping"></div>' : ''}
            <div class="w-7 h-7 rounded-full bg-slate-950 border-2 ${isSelected ? 'border-red-500 ring-2 ring-red-400/50' : 'border-red-400/80'} flex items-center justify-center shadow-lg shadow-red-500/30">
              <span class="text-xs font-mono font-bold ${isSelected ? 'text-red-400' : 'text-slate-200'}">${index + 1}</span>
            </div>
            <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded bg-slate-900/90 border ${isSelected ? 'border-red-500' : 'border-slate-700'} text-[10px] text-slate-100 font-mono whitespace-nowrap shadow pointer-events-none" dir="ltr">
              ${tgt.name} (${tgt.altitude}m)
            </div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      let marker = existingMarkers.get(tgt.id);
      if (marker) {
        marker.setLatLng([tgt.y, tgt.x]);
        marker.setIcon(targetIcon);
        marker.setZIndexOffset(isSelected ? 900 : 800);
      } else {
        marker = L.marker([tgt.y, tgt.x], {
          icon: targetIcon,
          draggable: true,
          zIndexOffset: isSelected ? 900 : 800,
        });

        marker.on('click', (e: L.LeafletEvent) => {
          L.DomEvent.stopPropagation(e);
          onSelectTarget(tgt.id);
        });

        marker.on('dragend', async (e: L.LeafletEvent) => {
          const latLng = (e.target as L.Marker).getLatLng();
          const newX = Math.round(latLng.lng);
          const newY = Math.round(latLng.lat);
          const { altitude } = await sampleAltitudeAt(terrain.id, newX, newY, terrain.sizeMeters);
          onUpdateTarget(tgt.id, { x: newX, y: newY, altitude });
        });

        marker.on('contextmenu', (e: L.LeafletMouseEvent) => {
          L.DomEvent.stopPropagation(e);
          setContextMenu({
            x: e.containerPoint.x,
            y: e.containerPoint.y,
            mapX: tgt.x,
            mapY: tgt.y,
            targetId: tgt.id,
          });
        });

        marker.addTo(map);
        existingMarkers.set(tgt.id, marker);
      }
    });

    existingMarkers.forEach((marker, id) => {
      if (!activeIds.has(id)) {
        map.removeLayer(marker);
        existingMarkers.delete(id);
      }
    });
  }, [targets, selectedTargetId, terrain.id]);

  // Fire Line & Range Rings
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    if (layersRef.current.fireLine) {
      map.removeLayer(layersRef.current.fireLine);
      layersRef.current.fireLine = null;
    }

    if (layersRef.current.minRangeCircle) {
      map.removeLayer(layersRef.current.minRangeCircle);
      layersRef.current.minRangeCircle = null;
    }
    if (layersRef.current.maxRangeCircle) {
      map.removeLayer(layersRef.current.maxRangeCircle);
      layersRef.current.maxRangeCircle = null;
    }

    const activeTarget = targets.find((t) => t.id === selectedTargetId);

    if (activeTarget && solution) {
      const line = L.polyline(
        [
          [mortar.y, mortar.x],
          [activeTarget.y, activeTarget.x],
        ],
        {
          color: '#ef4444',
          weight: 2.5,
          dashArray: '6, 6',
          opacity: 0.85,
        }
      );

      line.bindTooltip(
        `${solution.range_m}m | ${solution.azimuth_mil} mil (${solution.azimuth_deg}°)`,
        {
          permanent: true,
          direction: 'center',
          className: 'tactical-line-tooltip',
        }
      );

      line.addTo(map);
      layersRef.current.fireLine = line;
    }

    if (showRangeRings && solution) {
      if (solution.minRange_m > 0) {
        const minCircle = L.circle([mortar.y, mortar.x], {
          radius: solution.minRange_m,
          color: '#f59e0b',
          weight: 1.5,
          dashArray: '4, 4',
          fillColor: '#f59e0b',
          fillOpacity: 0.05,
          interactive: false,
        });
        minCircle.addTo(map);
        layersRef.current.minRangeCircle = minCircle;
      }

      if (solution.maxRange_m > 0) {
        const maxCircle = L.circle([mortar.y, mortar.x], {
          radius: solution.maxRange_m,
          color: '#06b6d4',
          weight: 1.8,
          dashArray: '6, 6',
          fillColor: '#06b6d4',
          fillOpacity: 0.04,
          interactive: false,
        });
        maxCircle.addTo(map);
        layersRef.current.maxRangeCircle = maxCircle;
      }
    }
  }, [selectedTargetId, targets, solution, mortar.x, mortar.y, showRangeRings]);

  // Context Menu Actions
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
    <div className="relative w-full h-full select-none overflow-hidden bg-slate-950">
      {/* Schematic Compass Rose in Map Corner */}
      <div className="absolute bottom-4 start-4 z-20 pointer-events-none opacity-40 hover:opacity-80 transition">
        <div className="w-16 h-16 rounded-full border border-slate-700/80 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center relative font-mono text-[9px] text-slate-400">
          <span className="absolute top-1 font-bold text-amber-400">N</span>
          <span className="absolute right-1">E</span>
          <span className="absolute bottom-1">S</span>
          <span className="absolute left-1">W</span>
          <Compass className="w-6 h-6 text-slate-600" />
        </div>
      </div>

      {/* Banner when no image is loaded */}
      {!terrainImageConfig?.imageUrl && !terrainImageConfig?.tileUrlTemplate && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-30 max-w-lg w-[92%] bg-slate-950/90 border border-amber-500/40 rounded-xl p-2.5 sm:p-3 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 text-amber-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{t.noMapImageBanner}</span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={onOpenUploadModal}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1 transition shadow"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>{t.uploadMapImage}</span>
              </button>

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

      {/* Map Leaflet Container */}
      <div ref={containerRef} className="w-full h-full z-0" />

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
          <div className="px-2 py-1 text-[11px] font-mono text-slate-400 border-b border-slate-800 mb-1 flex items-center justify-between" dir="ltr">
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
