import React, { useState } from 'react';
import { TerrainId, Language } from '../types';
import {
  TerrainImageConfig,
  saveTerrainImage,
  deleteTerrainImage,
  storeTileFolder,
  computeCalibrationBounds,
  getDefaultBounds,
  RECOIL_MAP_PRESETS,
  RecoilMapPreset,
} from '../utils/imageStore';
import { parseGridReference } from '../utils/coordinates';
import { translations } from '../i18n/translations';
import {
  Image as ImageIcon,
  Upload,
  Trash2,
  Sliders,
  Check,
  X,
  RotateCcw,
  HelpCircle,
  Link,
  ShieldCheck,
  Crosshair,
  FolderOpen,
  Layers,
  Globe,
  Sparkles,
  ExternalLink,
  Download,
} from 'lucide-react';

interface MapImageCalibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  terrain: TerrainId;
  language: Language;
  imageConfig: TerrainImageConfig | null;
  onImageConfigChanged: (config: TerrainImageConfig | null) => void;
  onOpenHelp: () => void;
  onOpenEnfusionHelp?: () => void;
  onSelectTerrain?: (t: TerrainId) => void;
  initialTab?: 'recoil' | 'image' | 'folder' | 'url';
}

export const MapImageCalibrationModal: React.FC<MapImageCalibrationModalProps> = ({
  isOpen,
  onClose,
  terrain,
  language,
  imageConfig,
  onImageConfigChanged,
  onOpenHelp,
  onOpenEnfusionHelp,
  onSelectTerrain,
  initialTab = 'recoil',
}) => {
  const t = translations[language];

  const [activeTab, setActiveTab] = useState<'recoil' | 'image' | 'folder' | 'url'>(initialTab);
  const [opacity, setOpacity] = useState<number>(imageConfig?.opacity ?? 0.85);
  const [tileUrl, setTileUrl] = useState<string>(imageConfig?.tileUrlTemplate ?? '');
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);
  const [isUploadingFolder, setIsUploadingFolder] = useState<boolean>(false);

  // 2-point calibration inputs
  const [p1U, setP1U] = useState<number>(0.1);
  const [p1V, setP1V] = useState<number>(0.1);
  const [p1CoordInput, setP1CoordInput] = useState<string>('010 110');

  const [p2U, setP2U] = useState<number>(0.9);
  const [p2V, setP2V] = useState<number>(0.9);
  const [p2CoordInput, setP2CoordInput] = useState<string>('110 010');

  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), 2500);
  };

  const handleApplyRecoilComposite = async (targetTerrain: TerrainId = terrain) => {
    const preset = RECOIL_MAP_PRESETS[targetTerrain];
    if (!preset) return;
    try {
      const bounds = getDefaultBounds(targetTerrain, preset.sizeMeters);
      const savedConfig = await saveTerrainImage(targetTerrain, null, {
        imageUrl: preset.compositeUrl,
        externalImageUrl: preset.compositeUrl,
        opacity,
        tileSourceType: 'image',
        tileUrlTemplate: '',
        bounds,
        isCalibrated: true,
      });
      if (targetTerrain === terrain) {
        onImageConfigChanged(savedConfig);
      } else if (onSelectTerrain) {
        onSelectTerrain(targetTerrain);
        onImageConfigChanged(savedConfig);
      }
      showToast(
        language === 'ar'
          ? `تم تطبيق خريطة ${preset.nameAr} المجمعة من recoil.org بنجاح!`
          : `${preset.name} composite map applied from recoil.org!`
      );
    } catch (err) {
      alert('فشل في حفظ مصدر الخريطة.');
      console.error(err);
    }
  };

  const handleApplyRecoilTiles = async (targetTerrain: TerrainId = terrain) => {
    const preset = RECOIL_MAP_PRESETS[targetTerrain];
    if (!preset) return;
    try {
      const bounds = getDefaultBounds(targetTerrain, preset.sizeMeters);
      const savedConfig = await saveTerrainImage(targetTerrain, null, {
        imageUrl: null,
        externalImageUrl: undefined,
        opacity,
        tileSourceType: 'recoil',
        tileUrlTemplate: preset.tileUrlTemplate,
        bounds,
        isCalibrated: true,
      });
      if (targetTerrain === terrain) {
        onImageConfigChanged(savedConfig);
      } else if (onSelectTerrain) {
        onSelectTerrain(targetTerrain);
        onImageConfigChanged(savedConfig);
      }
      showToast(
        language === 'ar'
          ? `تم تفعيل خادم بلاطات ${preset.nameAr} من recoil.org!`
          : `${preset.name} live tile layer from recoil.org activated!`
      );
    } catch (err) {
      alert('فشل في تفعيل خادم البلاطات.');
      console.error(err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const savedConfig = await saveTerrainImage(terrain, file, {
        opacity,
        tileSourceType: 'image',
        tileUrlTemplate: tileUrl,
        bounds: getDefaultBounds(terrain),
        isCalibrated: false,
      });
      onImageConfigChanged(savedConfig);
      showToast('تم تحميل وحفظ صورة الخريطة محلياً في IndexedDB!');
    } catch (err) {
      alert('فشل في حفظ الصورة محلياً.');
      console.error(err);
    }
    e.target.value = '';
  };

  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingFolder(true);
    try {
      const fileList = Array.from(files);
      const count = await storeTileFolder(terrain, fileList);
      const updated = await saveTerrainImage(terrain, null, {
        opacity,
        tileSourceType: 'folder',
        tileFolderCount: count,
        bounds: getDefaultBounds(terrain),
      });
      onImageConfigChanged(updated);
      showToast(`تم استيراد ${count} بلاطة محلياً من مجلد EnfusionMapMaker بنجاح!`);
    } catch (err) {
      alert('تعذر استيراد مجلد البلاطات.');
      console.error(err);
    } finally {
      setIsUploadingFolder(false);
    }
    e.target.value = '';
  };

  const handleDeleteImageOrTiles = async () => {
    if (window.confirm('هل تريد حذف صورة الخريطة والبلاطات المخزنة لهذا التضاريس من جهازك؟')) {
      await deleteTerrainImage(terrain);
      onImageConfigChanged(null);
      showToast('تم حذف مصدر الخريطة من المتصفح.');
    }
  };

  const handleOpacityChange = async (val: number) => {
    setOpacity(val);
    const updated = await saveTerrainImage(terrain, imageConfig?.imageBlob ?? null, {
      opacity: val,
      bounds: imageConfig?.bounds,
      isCalibrated: imageConfig?.isCalibrated,
      tileUrlTemplate: tileUrl,
      tileSourceType: imageConfig?.tileSourceType,
    });
    onImageConfigChanged(updated);
  };

  const handleSaveTileUrl = async () => {
    const updated = await saveTerrainImage(terrain, imageConfig?.imageBlob ?? null, {
      opacity,
      bounds: imageConfig?.bounds,
      isCalibrated: imageConfig?.isCalibrated,
      tileSourceType: 'url',
      tileUrlTemplate: tileUrl.trim(),
    });
    onImageConfigChanged(updated);
    showToast('تم حفظ رابط قالب البلاطات!');
  };

  const handleApplyCalibration = async () => {
    const p1Parsed = parseGridReference(p1CoordInput);
    const p2Parsed = parseGridReference(p2CoordInput);

    if (!p1Parsed || !p2Parsed) {
      alert('إحداثيات غير صالحة. يرجى إدخال 6 أو 8 أرقام للشبكة (مثال: 045112).');
      return;
    }

    const calculatedBounds = computeCalibrationBounds(
      { imgU: p1U, imgV: p1V, worldX: p1Parsed.x, worldY: p1Parsed.y },
      { imgU: p2U, imgV: p2V, worldX: p2Parsed.x, worldY: p2Parsed.y }
    );

    if (!calculatedBounds) {
      alert('تعذر حساب الأبعاد. تأكد من أن النقطتين متباعدتان في الصورة.');
      return;
    }

    const updated = await saveTerrainImage(terrain, imageConfig?.imageBlob ?? null, {
      opacity,
      bounds: calculatedBounds,
      isCalibrated: true,
      tileUrlTemplate: tileUrl,
      tileSourceType: imageConfig?.tileSourceType,
    });
    onImageConfigChanged(updated);
    setIsCalibrating(false);
    showToast('تمت معايرة أبعاد الخريطة بنجاح!');
  };

  const handleResetCalibration = async () => {
    const defaultB = getDefaultBounds(terrain);
    const updated = await saveTerrainImage(terrain, imageConfig?.imageBlob ?? null, {
      opacity,
      bounds: defaultB,
      isCalibrated: false,
      tileUrlTemplate: tileUrl,
      tileSourceType: imageConfig?.tileSourceType,
    });
    onImageConfigChanged(updated);
    showToast('تمت استعادة الأبعاد الافتراضية للتضاريس.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ImageIcon className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-base font-bold text-slate-100">
                {language === 'ar' ? 'مصدر خريطة التضاريس والبلاطات' : 'Map Imagery & Tiles'}
              </h3>
              <p className="text-xs text-slate-400 capitalize">{terrain}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenHelp}
              className="p-1.5 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-slate-800 transition flex items-center gap-1 text-xs"
              title={t.howToPrepareMap}
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">{t.howToPrepareMap}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Status Toast */}
          {statusMsg && (
            <div className="p-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>{statusMsg}</span>
            </div>
          )}

          {/* Privacy & Storage Guarantee */}
          <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-cyan-300 text-xs flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {language === 'ar'
                ? 'يتم تخزين الصور والبلاطات محلياً فقط على جهازك (IndexedDB)، ولا يتم رفعها أو تخزينها على أي خادم خارجي.'
                : 'All images and map tiles are stored strictly on this device (IndexedDB) and are never uploaded.'}
            </p>
          </div>

          {/* Source Tabs */}
          <div className="flex rounded-xl bg-slate-950 border border-slate-800 p-1 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('recoil')}
              className={`flex-1 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'recoil' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{language === 'ar' ? 'خرائط Recoil.org' : 'Recoil.org'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('image')}
              className={`flex-1 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'image' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'صورة لقطة شاشة' : 'Single Image'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('folder')}
              className={`flex-1 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'folder' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>EnfusionMapMaker</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`flex-1 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'url' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Link className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'رابط ويب' : 'Tile URL'}</span>
            </button>
          </div>

          {/* TAB 0: Recoil.org Maps (Everon, Arland, Kolguyev) */}
          {activeTab === 'recoil' && (
            <div className="space-y-4">
              {/* Attribution Banner */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
                    <Globe className="w-4 h-4" />
                    <span>{language === 'ar' ? 'خرائط مشروع reforger.recoil.org' : 'reforger.recoil.org Project Maps'}</span>
                  </div>
                  <a
                    href="https://reforger.recoil.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    <span>reforger.recoil.org</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {language === 'ar'
                    ? 'خرائط عالية الدقة أُنشئت بواسطة Nick Ludlam عبر EnfusionMapMaker. يمكنك تطبيق الخريطة المجمعة الكاملة (Composite Map) فائقة الوضوح، أو تفعيل خادم البلاطات التفاعلي المباشر.'
                    : 'High-resolution maps created by Nick Ludlam using EnfusionMapMaker. You can load full composite maps or stream live interactive tiles.'}
                </p>
              </div>

              {/* Current Terrain Preset Highlight Card */}
              {(() => {
                const currentPreset = RECOIL_MAP_PRESETS[terrain];
                if (!currentPreset) return null;
                const isCurrentActive =
                  imageConfig?.tileSourceType === 'recoil' ||
                  imageConfig?.imageUrl === currentPreset.compositeUrl ||
                  imageConfig?.externalImageUrl === currentPreset.compositeUrl;

                return (
                  <div className="p-3.5 rounded-xl bg-slate-950 border-2 border-cyan-500/50 space-y-3 shadow-lg">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-100 text-sm">
                            {language === 'ar' ? currentPreset.nameAr : currentPreset.name}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                            {currentPreset.sizeMeters >= 1000
                              ? `${currentPreset.sizeMeters / 1000} × ${currentPreset.sizeMeters / 1000} km`
                              : `${currentPreset.sizeMeters} m`}
                          </span>
                          {isCurrentActive && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              <span>{language === 'ar' ? 'الخريطة النشطة' : 'Active'}</span>
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          {language === 'ar' ? currentPreset.descriptionAr : currentPreset.description}
                        </p>
                      </div>
                    </div>

                    {/* Preview Thumbnail */}
                    <div className="w-full h-28 rounded-lg overflow-hidden relative border border-slate-800 bg-slate-900 group">
                      <img
                        src={currentPreset.thumbUrl}
                        alt={currentPreset.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = currentPreset.compositeUrl;
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-2.5">
                        <span className="text-[10px] font-mono text-cyan-300 font-semibold bg-slate-950/80 px-2 py-0.5 rounded">
                          {terrain === 'kolguyev' ? '4200 × 4200 px' : terrain === 'everon' ? '2159 × 2158 px' : '1699 × 1489 px'}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleApplyRecoilComposite(terrain)}
                        className="py-2 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{language === 'ar' ? 'تطبيق الخريطة المجمعة الكاملة' : 'Load Composite Map'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleApplyRecoilTiles(terrain)}
                        className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>{language === 'ar' ? 'تفعيل خادم البلاطات المباشر' : 'Stream Live Tiles'}</span>
                      </button>
                    </div>

                    {/* Direct Links */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                      <a
                        href={currentPreset.compositeUrl}
                        download={`${terrain}_composite.jpg`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-cyan-300 flex items-center gap-1 font-mono transition"
                      >
                        <Download className="w-3 h-3" />
                        <span>{language === 'ar' ? 'تحميل صورة JPG الأصلية للقرص' : 'Download Full JPG'}</span>
                      </a>
                      <a
                        href={currentPreset.pageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-cyan-300 flex items-center gap-1 transition"
                      >
                        <span>{language === 'ar' ? 'عرض على recoil.org' : 'View on recoil.org'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                );
              })()}

              {/* Other Recoil Maps List */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-300 block">
                  {language === 'ar' ? 'جميع خرائط Recoil.org المتاحة:' : 'All Available Recoil.org Maps:'}
                </span>

                <div className="grid grid-cols-1 gap-2">
                  {(Object.keys(RECOIL_MAP_PRESETS) as TerrainId[]).map((tId) => {
                    const preset = RECOIL_MAP_PRESETS[tId];
                    const isSelected = terrain === tId;

                    return (
                      <div
                        key={tId}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 transition ${
                          isSelected
                            ? 'bg-slate-900 border-cyan-800/80'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={preset.thumbUrl}
                            alt={preset.name}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-800 shrink-0"
                            loading="lazy"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-slate-200">
                                {language === 'ar' ? preset.nameAr : preset.name}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">
                                {preset.sizeMeters / 1000} km
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 truncate max-w-[200px] sm:max-w-[280px]">
                              {language === 'ar' ? preset.descriptionAr : preset.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleApplyRecoilComposite(tId)}
                            className="px-2.5 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 font-bold text-[11px] transition"
                            title={language === 'ar' ? 'تطبيق الخريطة المجمعة' : 'Apply Composite'}
                          >
                            {language === 'ar' ? 'خريطة كاملة' : 'Composite'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApplyRecoilTiles(tId)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-[11px] transition"
                            title={language === 'ar' ? 'تفعيل البلاطات' : 'Apply Tiles'}
                          >
                            {language === 'ar' ? 'بلاطات' : 'Tiles'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: Single Screenshot Image */}
          {activeTab === 'image' && (
            <div className="space-y-3">
              <div className="bg-slate-950/60 border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-xl p-5 text-center transition">
                <input
                  type="file"
                  id="map-image-input"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label htmlFor="map-image-input" className="cursor-pointer flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-slate-800 text-cyan-400 flex items-center justify-center shadow">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-xs text-slate-200">
                    {imageConfig?.imageUrl ? 'استبدال صورة الخريطة الحالية' : t.uploadMapImage}
                  </span>
                  <span className="text-[11px] text-slate-400">PNG, JPG أو WebP (لقطة شاشة من اللعبة)</span>
                </label>
              </div>
            </div>
          )}

          {/* TAB 2: EnfusionMapMaker Tile Folder */}
          {activeTab === 'folder' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">
                    {language === 'ar' ? 'مجلد بلاطات EnfusionMapMaker' : 'EnfusionMapMaker Tile Folder'}
                  </span>
                  {onOpenEnfusionHelp && (
                    <button
                      type="button"
                      onClick={onOpenEnfusionHelp}
                      className="text-cyan-400 hover:text-cyan-300 text-[11px] font-semibold flex items-center gap-1"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>{language === 'ar' ? 'دليل إعداد البلاطات' : 'Guide'}</span>
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {language === 'ar'
                    ? 'اختر مجلد البلاطات المقطوعة (الذي يحتوي على مجلدات الأرقام z/x/y.png). سيتم حفظها محلياً في IndexedDB للعمل أوفلاين.'
                    : 'Select the sliced tile folder (containing {z}/{x}/{y}.png directories). Tiles are cached locally in IndexedDB.'}
                </p>

                <div className="pt-2">
                  <label className="cursor-pointer w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition">
                    <FolderOpen className="w-4 h-4" />
                    <span>
                      {isUploadingFolder
                        ? language === 'ar'
                          ? 'جارِ استيراد البلاطات محلياً...'
                          : 'Importing tiles locally...'
                        : language === 'ar'
                        ? 'اختيار مجلد البلاطات'
                        : 'Select Tile Folder'}
                    </span>
                    <input
                      type="file"
                      // @ts-expect-error webkitdirectory is standard for folder picker
                      webkitdirectory=""
                      directory=""
                      multiple
                      className="hidden"
                      onChange={handleFolderUpload}
                      disabled={isUploadingFolder}
                    />
                  </label>
                </div>

                {imageConfig?.tileFolderCount ? (
                  <div className="text-[11px] text-emerald-400 font-mono pt-1 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    <span>
                      {language === 'ar'
                        ? `تم استيراد ${imageConfig.tileFolderCount} بلاطة لهذا التضاريس`
                        : `${imageConfig.tileFolderCount} tiles imported for this terrain`}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {/* TAB 3: Custom Tile URL Template */}
          {activeTab === 'url' && (
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <label className="text-xs font-semibold text-slate-300 block flex items-center gap-1.5">
                <Link className="w-3.5 h-3.5 text-cyan-400" />
                <span>{t.customTileUrl}</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://example.com/tiles/{z}/{x}/{y}.png"
                  value={tileUrl}
                  onChange={(e) => setTileUrl(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-500"
                  dir="ltr"
                />
                <button
                  onClick={handleSaveTileUrl}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition"
                >
                  {t.saveTileUrl}
                </button>
              </div>
            </div>
          )}

          {/* Opacity & Current Status Controls */}
          {(imageConfig?.imageUrl || imageConfig?.tileSourceType === 'folder' || imageConfig?.tileUrlTemplate) && (
            <div className="space-y-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  <span>
                    {imageConfig.tileSourceType === 'folder'
                      ? 'مجلد بلاطات EnfusionMapMaker نشط'
                      : imageConfig.tileSourceType === 'url'
                      ? 'خادم البلاطات المخصص نشط'
                      : 'صورة الخريطة نشطة'}
                  </span>
                </span>
                <button
                  onClick={handleDeleteImageOrTiles}
                  className="px-2.5 py-1 rounded bg-rose-950/50 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-medium flex items-center gap-1 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t.deleteImage}</span>
                </button>
              </div>

              {/* Opacity Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-300 font-medium">
                  <span>{t.imageOpacity}</span>
                  <span className="font-mono text-cyan-400">{Math.round(opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={opacity}
                  onChange={(e) => handleOpacityChange(Number(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>

              {/* 2-point Calibration Option for single image */}
              {imageConfig?.imageUrl && (
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <div className="text-[11px] text-slate-400 font-mono">
                    {imageConfig.isCalibrated ? (
                      <span className="text-amber-300">أبعاد مخصصة معايرة</span>
                    ) : (
                      <span>تغطي كامل الجزيرة افتراضياً</span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsCalibrating(!isCalibrating)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center gap-1 transition"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>{t.calibrateImage}</span>
                    </button>
                    {imageConfig.isCalibrated && (
                      <button
                        onClick={handleResetCalibration}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                        title={t.resetCalibration}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Calibration 2-point Tool */}
          {isCalibrating && (
            <div className="bg-slate-950 p-4 rounded-xl border border-amber-500/40 space-y-3">
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Crosshair className="w-4 h-4 text-amber-400" />
                <span>أداة معايرة النقطتين المرجعيتين</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {/* Point 1 */}
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
                  <span className="text-xs font-bold text-cyan-400 block">{t.point1}</span>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      max="1"
                      value={p1U}
                      onChange={(e) => setP1U(Number(e.target.value))}
                      className="w-1/2 bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-center font-mono text-cyan-300"
                      placeholder="U (0..1)"
                    />
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      max="1"
                      value={p1V}
                      onChange={(e) => setP1V(Number(e.target.value))}
                      className="w-1/2 bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-center font-mono text-cyan-300"
                      placeholder="V (0..1)"
                    />
                  </div>
                  <input
                    type="text"
                    value={p1CoordInput}
                    onChange={(e) => setP1CoordInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 font-mono text-amber-300"
                    placeholder="Grid (e.g. 020 100)"
                  />
                </div>

                {/* Point 2 */}
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
                  <span className="text-xs font-bold text-cyan-400 block">{t.point2}</span>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      max="1"
                      value={p2U}
                      onChange={(e) => setP2U(Number(e.target.value))}
                      className="w-1/2 bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-center font-mono text-cyan-300"
                      placeholder="U (0..1)"
                    />
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      max="1"
                      value={p2V}
                      onChange={(e) => setP2V(Number(e.target.value))}
                      className="w-1/2 bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-center font-mono text-cyan-300"
                      placeholder="V (0..1)"
                    />
                  </div>
                  <input
                    type="text"
                    value={p2CoordInput}
                    onChange={(e) => setP2CoordInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 font-mono text-amber-300"
                    placeholder="Grid (e.g. 100 020)"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setIsCalibrating(false)}
                  className="px-3 py-1.5 rounded bg-slate-800 text-slate-400 text-xs"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={handleApplyCalibration}
                  className="px-4 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{t.applyCalibration}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
