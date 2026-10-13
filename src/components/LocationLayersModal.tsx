import React, { useState } from 'react';
import { TerrainId, LocationLayer, LocationItem, Language } from '../types';
import { saveLocationLayer, deleteLocationLayer } from '../utils/imageStore';
import { translations } from '../i18n/translations';
import {
  Layers,
  Upload,
  Download,
  Trash2,
  Check,
  X,
  Eye,
  EyeOff,
  Palette,
  Compass,
  FileJson,
  Plus,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface LocationLayersModalProps {
  isOpen: boolean;
  onClose: () => void;
  terrain: TerrainId;
  language: Language;
  layers: LocationLayer[];
  onLayersChanged: (updated: LocationLayer[]) => void;
}

export const LocationLayersModal: React.FC<LocationLayersModalProps> = ({
  isOpen,
  onClose,
  terrain,
  language,
  layers,
  onLayersChanged,
}) => {
  const t = translations[language];

  // Importer workflow state
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [rawItems, setRawItems] = useState<any[]>([]);
  const [detectedKeys, setDetectedKeys] = useState<string[]>([]);
  const [layerName, setLayerName] = useState<string>('Supplies');
  const [layerColor, setLayerColor] = useState<string>('#38bdf8'); // Cyan default

  // Field mappings
  const [nameField, setNameField] = useState<string>('name');
  const [eastField, setEastField] = useState<string>('x');
  const [northField, setNorthField] = useState<string>('z'); // Enfusion Z is North
  const [heightField, setHeightField] = useState<string>('y'); // Enfusion Y is Height

  if (!isOpen) return null;

  const currentTerrainLayers = layers.filter((l) => l.terrain === terrain);

  const handleToggleVisibility = async (layer: LocationLayer) => {
    const updated = { ...layer, isVisible: !layer.isVisible };
    await saveLocationLayer(updated);
    onLayersChanged(
      layers.map((l) => (l.id === layer.id ? updated : l))
    );
  };

  const handleDeleteLayer = async (layerId: string) => {
    if (window.confirm('هل تريد حذف هذه الطبقة ومواقعها المخزنة محلياً؟')) {
      await deleteLocationLayer(layerId);
      onLayersChanged(layers.filter((l) => l.id !== layerId));
    }
  };

  const handleExportLayer = (layer: LocationLayer) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(layer, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `${terrain}-${layer.name.toLowerCase().replace(/\s+/g, '_')}-layer.json`);
    document.body.appendChild(dl);
    dl.click();
    dl.remove();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        let items: any[] = [];

        if (Array.isArray(json)) {
          items = json;
        } else if (Array.isArray(json.items)) {
          items = json.items;
        } else if (Array.isArray(json.objects)) {
          items = json.objects;
        } else if (Array.isArray(json.features)) {
          // GeoJSON features
          items = json.features.map((f: any) => ({
            name: f.properties?.name || f.id || 'Point',
            x: f.geometry?.coordinates?.[0] || 0,
            z: f.geometry?.coordinates?.[1] || 0,
            y: f.geometry?.coordinates?.[2] || 0,
            ...f.properties,
          }));
        } else {
          // Object with key values
          items = Object.values(json).filter((v) => typeof v === 'object');
        }

        if (items.length === 0) {
          alert('الملف لا يحتوي على قائمة مواقع قابلة للقراءة.');
          return;
        }

        setRawItems(items);
        const first = items[0] || {};
        const keys = Object.keys(first);
        setDetectedKeys(keys);

        // Auto-detect common keys
        const lowerKeys = keys.map((k) => k.toLowerCase());
        const foundName = keys.find((k) => ['name', 'label', 'title', 'id', 'type'].includes(k.toLowerCase())) || keys[0] || 'name';
        const foundEast = keys.find((k) => ['x', 'east', 'posx', 'easting'].includes(k.toLowerCase())) || 'x';
        // Enfusion uses Z for North!
        const foundNorth = keys.find((k) => ['z', 'north', 'posz', 'northing'].includes(k.toLowerCase())) ||
                           keys.find((k) => k.toLowerCase() === 'y') || 'z';
        const foundHeight = keys.find((k) => ['y', 'height', 'alt', 'elevation', 'posy'].includes(k.toLowerCase())) || 'y';

        setNameField(foundName);
        setEastField(foundEast);
        setNorthField(foundNorth);
        setHeightField(foundHeight);

        // Derive name from file
        const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setLayerName(baseName || 'Custom Layer');

        setIsImporting(true);
      } catch (err) {
        alert('تعذر قراءة ملف JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleFinishImport = async () => {
    if (!layerName.trim()) {
      alert('يرجى تحديد اسم للطبقة.');
      return;
    }

    const parsedItems: LocationItem[] = [];

    rawItems.forEach((item, index) => {
      // Extract coordinates
      let x = Number(item[eastField]);
      let y = Number(item[northField]);
      let height = heightField && item[heightField] !== undefined ? Number(item[heightField]) : undefined;

      // Handle nested positions like pos: [x, y, z] or position: [x, z, y]
      if (isNaN(x) && Array.isArray(item.pos)) {
        x = Number(item.pos[0]);
        y = Number(item.pos[2]); // Z is North
        height = Number(item.pos[1]);
      } else if (isNaN(x) && Array.isArray(item.position)) {
        x = Number(item.position[0]);
        y = Number(item.position[2]);
        height = Number(item.position[1]);
      }

      if (!isNaN(x) && !isNaN(y)) {
        const nameVal = item[nameField] !== undefined ? String(item[nameField]) : `Location ${index + 1}`;
        parsedItems.push({
          id: `item-${Date.now()}-${index}`,
          name: nameVal,
          x: Math.round(x),
          y: Math.round(y),
          height: height !== undefined && !isNaN(height) ? Math.round(height) : undefined,
          raw: item,
        });
      }
    });

    if (parsedItems.length === 0) {
      alert('لم يتم العثور على إحداثيات صالحة باستخدام الحقول المحددة.');
      return;
    }

    const newLayer: LocationLayer = {
      id: `layer-${Date.now()}`,
      terrain,
      name: layerName.trim(),
      color: layerColor,
      isVisible: true,
      items: parsedItems,
      createdAt: Date.now(),
    };

    await saveLocationLayer(newLayer);
    onLayersChanged([...layers, newLayer]);
    setIsImporting(false);
  };

  const presetLayers = [
    { name: 'Supplies', nameAr: 'إمدادات ونقاط تموين', color: '#38bdf8' },
    { name: 'Vehicles', nameAr: 'مركبات وآليات', color: '#10b981' },
    { name: 'Refuel', nameAr: 'محطات وقود', color: '#f59e0b' },
    { name: 'Repair', nameAr: 'ورش تصليح وصيانة', color: '#8b5cf6' },
    { name: 'Cap Points', nameAr: 'نقاط سيطرة (Capture)', color: '#ef4444' },
    { name: 'MOB Spawns', nameAr: 'نقاط انتشار رئيسية MOB', color: '#06b6d4' },
    { name: 'FIA Caches', nameAr: 'مخابئ أسلحة FIA', color: '#eab308' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-base font-bold text-slate-100">
                {language === 'ar' ? 'طبقات المواقع والمعالم (JSON)' : 'Location Layers (JSON)'}
              </h3>
              <p className="text-xs text-slate-400 capitalize">
                {terrain} • {currentTerrainLayers.length} {language === 'ar' ? 'طبقة نشطة' : 'layers'}
              </p>
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
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Mapping & Importer screen */}
          {isImporting ? (
            <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/50 space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-cyan-300">
                  {language === 'ar' ? 'مطابقة حقول الإحداثيات والاسم' : 'Map Fields & Coordinates'}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {rawItems.length} {language === 'ar' ? 'نقطة تم رصدها' : 'points parsed'}
                </span>
              </div>

              {/* Layer name & quick presets */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-300 font-semibold block">اسم الطبقة ولونها</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={layerName}
                    onChange={(e) => setLayerName(e.target.value)}
                    placeholder="e.g. Supplies, Vehicles, MOB Spawns"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                  <input
                    type="color"
                    value={layerColor}
                    onChange={(e) => setLayerColor(e.target.value)}
                    className="w-10 h-8 rounded bg-transparent cursor-pointer border border-slate-700"
                  />
                </div>
                {/* Presets */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {presetLayers.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => {
                        setLayerName(p.name);
                        setLayerColor(p.color);
                      }}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 flex items-center gap-1"
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                      <span>{language === 'ar' ? p.nameAr : p.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Enfusion Coordinate Notice */}
              <div className="p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-800/50 text-[11px] text-cyan-200">
                💡 <span className="font-bold">نظام محرك Enfusion:</span> الإحداثي <span className="font-mono text-cyan-300">X</span> هو الشرق (East)، والإحداثي <span className="font-mono text-amber-300">Z</span> هو الشمال (North)، والإحداثي <span className="font-mono text-purple-300">Y</span> هو الارتفاع (Height/Altitude).
              </div>

              {/* Dropdowns for fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">حقل الاسم (Name)</label>
                  <select
                    value={nameField}
                    onChange={(e) => setNameField(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
                  >
                    {detectedKeys.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-cyan-400 font-mono block mb-1">حقل الشرق (East - X)</label>
                  <select
                    value={eastField}
                    onChange={(e) => setEastField(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-cyan-300 font-mono"
                  >
                    {detectedKeys.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-amber-400 font-mono block mb-1">حقل الشمال (North - Z or Y)</label>
                  <select
                    value={northField}
                    onChange={(e) => setNorthField(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-amber-300 font-mono"
                  >
                    {detectedKeys.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-purple-400 font-mono block mb-1">حقل الارتفاع (Height - اختياري)</label>
                  <select
                    value={heightField}
                    onChange={(e) => setHeightField(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-purple-300 font-mono"
                  >
                    <option value="">-- بدون ارتفاع --</option>
                    {detectedKeys.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sample preview */}
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 font-mono">معاينة أول عنصر:</span>
                <div className="text-[11px] font-mono text-slate-300 truncate" dir="ltr">
                  Name: {String(rawItems[0]?.[nameField])} | X: {rawItems[0]?.[eastField]} | Y: {rawItems[0]?.[northField]}
                </div>
              </div>

              {/* Finish buttons */}
              <div className="flex justify-end gap-2 pt-1 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsImporting(false)}
                  className="px-3 py-1.5 rounded bg-slate-800 text-slate-400 text-xs"
                >
                  {t.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleFinishImport}
                  className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>حفظ الطبقة وتفعيلها على الخريطة</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Import button box */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div>
                  <h4 className="font-bold text-slate-200">استيراد ملف مواقع جديد (JSON)</h4>
                  <p className="text-[11px] text-slate-400">
                    يدعم ملفات أداة المواقع والخرائط، مع شاشة مطابقة لحقول الإحداثيات
                  </p>
                </div>

                <label className="cursor-pointer px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-950 transition shrink-0">
                  <Upload className="w-3.5 h-3.5" />
                  <span>استيراد ملف JSON</span>
                  <input
                    type="file"
                    accept=".json,application/json"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </label>
              </div>

              {/* Layers List */}
              <div className="space-y-2.5">
                <span className="text-xs font-semibold text-slate-400 block">
                  الطبقات المحفوظة محلياً على الجهاز ({currentTerrainLayers.length})
                </span>

                {currentTerrainLayers.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                    لا توجد طبقات مواقع مستوردة لهذا التضاريس. يمكنك استيراد ملفات مثل مخابئ الأسلحة، نقاط التزود، أو المركبات.
                  </div>
                ) : (
                  currentTerrainLayers.map((layer) => (
                    <div
                      key={layer.id}
                      className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Visibility toggle button */}
                        <button
                          onClick={() => handleToggleVisibility(layer)}
                          className={`p-2 rounded-lg border transition ${
                            layer.isVisible
                              ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                              : 'bg-slate-900 border-slate-800 text-slate-500'
                          }`}
                          title={layer.isVisible ? 'إخفاء من الخريطة' : 'إظهار على الخريطة'}
                        >
                          {layer.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>

                        <div
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: layer.color }}
                        />

                        <div className="min-w-0">
                          <h5 className="font-bold text-xs text-slate-200 truncate">{layer.name}</h5>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {layer.items.length} {language === 'ar' ? 'موقع / نقطة' : 'points'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleExportLayer(layer)}
                          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                          title="تصدير الطبقة (JSON)"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteLayer(layer.id)}
                          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400"
                          title="حذف الطبقة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
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
