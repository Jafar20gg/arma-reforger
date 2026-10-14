/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { TerrainId, Language } from '../types';
import {
  TerrainImageConfig,
  saveTerrainImage,
  deleteTerrainImage,
  storeTileFolder,
  computeCalibrationBounds,
  getDefaultBounds,
  processLocalImageFile,
  RECOIL_TERRAIN_INFO,
  CalibrationPoint,
} from '../utils/imageStore';
import { parseGridReference, formatCoordinates } from '../utils/coordinates';
import { mapLogger } from '../utils/mapLogger';
import { translations } from '../i18n/translations';
import {
  Image as ImageIcon,
  Upload,
  FolderOpen,
  Link,
  Trash2,
  Check,
  AlertTriangle,
  HelpCircle,
  X,
  ExternalLink,
  ShieldCheck,
  RotateCw,
  Crosshair,
  Sliders,
  Sparkles,
  Info,
  Maximize2,
  RefreshCw,
} from 'lucide-react';

interface MapImageCalibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  terrain: TerrainId;
  language: Language;
  imageConfig: TerrainImageConfig | null;
  onImageConfigChanged: (config: TerrainImageConfig | null) => void;
  onSelectTerrain?: (t: TerrainId) => void;
  initialTab?: 'image' | 'folder' | 'url';
  onOpenHelp: () => void;
  onOpenEnfusionHelp?: () => void;
  onOpenDiagnostics?: () => void;
}

export const MapImageCalibrationModal: React.FC<MapImageCalibrationModalProps> = ({
  isOpen,
  onClose,
  terrain,
  language,
  imageConfig,
  onImageConfigChanged,
  onSelectTerrain,
  initialTab = 'image',
  onOpenHelp,
  onOpenEnfusionHelp,
  onOpenDiagnostics,
}) => {
  const t = translations[language];

  // Active Source Tab: 'image' (Local file), 'folder' (EnfusionMapMaker), 'url' (Advanced custom URL)
  const [activeTab, setActiveTab] = useState<'image' | 'folder' | 'url'>(initialTab);

  // Calibration and settings state
  const [opacity, setOpacity] = useState<number>(imageConfig?.opacity ?? 0.85);
  const [flipY, setFlipY] = useState<boolean>(imageConfig?.flipY ?? false);
  const [tileUrl, setTileUrl] = useState<string>(imageConfig?.tileUrlTemplate ?? '');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Image Uploading / Processing state
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [processProgress, setProcessProgress] = useState<string | null>(null);
  const [isUploadingFolder, setIsUploadingFolder] = useState(false);

  // Two-Point Calibration UI State
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationMode, setCalibrationMode] = useState<'full' | 'twopoint'>('full');
  const [selectedPointIndex, setSelectedPointIndex] = useState<1 | 2>(1);

  // Normalized preview coords: imgU (0..1 from left), imgV (0..1 from top)
  const [p1U, setP1U] = useState<number>(imageConfig?.calibrationPoints?.[0]?.imgU ?? 0.1);
  const [p1V, setP1V] = useState<number>(imageConfig?.calibrationPoints?.[0]?.imgV ?? 0.1);
  const [p1CoordInput, setP1CoordInput] = useState<string>(
    imageConfig?.calibrationPoints?.[0]
      ? `${Math.round(imageConfig.calibrationPoints[0].worldX)}, ${Math.round(
          imageConfig.calibrationPoints[0].worldY
        )}`
      : '020080'
  );

  const [p2U, setP2U] = useState<number>(imageConfig?.calibrationPoints?.[1]?.imgU ?? 0.9);
  const [p2V, setP2V] = useState<number>(imageConfig?.calibrationPoints?.[1]?.imgV ?? 0.9);
  const [p2CoordInput, setP2CoordInput] = useState<string>(
    imageConfig?.calibrationPoints?.[1]
      ? `${Math.round(imageConfig.calibrationPoints[1].worldX)}, ${Math.round(
          imageConfig.calibrationPoints[1].worldY
        )}`
      : '100020'
  );

  const previewCanvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (imageConfig) {
      setOpacity(imageConfig.opacity ?? 0.85);
      setFlipY(imageConfig.flipY ?? false);
      setTileUrl(imageConfig.tileUrlTemplate ?? '');
      if (imageConfig.isCalibrated) {
        setCalibrationMode('twopoint');
      }
    }
  }, [imageConfig, terrain]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setStatusMsg(msg);
    setErrorMsg(null);
    setTimeout(() => setStatusMsg(null), 3500);
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setStatusMsg(null);
  };

  // ---------------------------------------------------------------------------
  // 1. RELIABLE LOCAL FILE PROCESSING (PNG / JPG / WebP up to 4200+ px)
  // ---------------------------------------------------------------------------
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingImage(true);
    setProcessProgress(
      language === 'ar' ? 'جارٍ فحص ومعالجة أبعاد الصورة...' : 'Analyzing and preparing image dimensions...'
    );
    setErrorMsg(null);

    try {
      mapLogger.addLog('info', `بدء قراءة ملف الصورة المحلي (${file.name}, ${(file.size / 1024 / 1024).toFixed(1)} MB)`);

      const processed = await processLocalImageFile(file, 4096);

      if (processed.isDownscaled) {
        setProcessProgress(
          language === 'ar'
            ? `تم تحسين الصورة بنجاح إلى دقة ${processed.width}×${processed.height} لتسريع العرض، مع الاحتفاظ بالأصل.`
            : `Image optimized to ${processed.width}x${processed.height} for display.`
        );
      }

      const defaultB = getDefaultBounds(terrain);

      const savedConfig = await saveTerrainImage(terrain, processed.originalBlob, {
        displayBlob: processed.displayBlob,
        naturalWidth: processed.width,
        naturalHeight: processed.height,
        opacity,
        flipY,
        tileSourceType: 'image',
        bounds: defaultB,
        isCalibrated: false,
      });

      onImageConfigChanged(savedConfig);
      mapLogger.addLog(
        'info',
        `تم حفظ صورة الخريطة لـ ${terrain} محلياً بنجاح (${processed.width}x${processed.height}px).`
      );
      showToast(
        language === 'ar'
          ? `تم تحميل وحفظ صورة ${terrain} محلياً (${processed.width} × ${processed.height} بكسل).`
          : `Map image loaded locally (${processed.width} × ${processed.height} px).`
      );
    } catch (err: any) {
      mapLogger.recordImageError(err.message || 'فشل معالجة الصورة');
      showError(err.message || (language === 'ar' ? 'فشل تحميل الصورة.' : 'Failed to load image.'));
    } finally {
      setIsProcessingImage(false);
      setProcessProgress(null);
      e.target.value = '';
    }
  };

  // ---------------------------------------------------------------------------
  // 2. TOGGLE "عكس المحور الرأسي" (FLIP Y)
  // ---------------------------------------------------------------------------
  const handleToggleFlipY = async () => {
    const newFlip = !flipY;
    setFlipY(newFlip);

    if (imageConfig) {
      const updated = await saveTerrainImage(terrain, imageConfig.imageBlob ?? null, {
        opacity,
        flipY: newFlip,
        bounds: imageConfig.bounds,
        isCalibrated: imageConfig.isCalibrated,
        tileSourceType: imageConfig.tileSourceType,
        tileUrlTemplate: tileUrl,
        naturalWidth: imageConfig.naturalWidth,
        naturalHeight: imageConfig.naturalHeight,
      });
      onImageConfigChanged(updated);
      mapLogger.addLog('info', `تم تغيير عكس المحور الرأسي لخريطة ${terrain} إلى: ${newFlip ? 'نعم' : 'لا'}`);
      showToast(
        newFlip
          ? language === 'ar'
            ? 'تم تفعيل عكس المحور الرأسي.'
            : 'Vertical flip enabled.'
          : language === 'ar'
          ? 'تم إلغاء عكس المحور الرأسي.'
          : 'Vertical flip disabled.'
      );
    }
  };

  // ---------------------------------------------------------------------------
  // 3. ENFUSION MAP MAKER FOLDER TILES (LOCAL STORAGE)
  // ---------------------------------------------------------------------------
  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingFolder(true);
    setErrorMsg(null);
    try {
      const fileList = Array.from(files);
      const count = await storeTileFolder(terrain, fileList);
      const updated = await saveTerrainImage(terrain, null, {
        opacity,
        flipY,
        tileSourceType: 'folder',
        tileFolderCount: count,
        bounds: getDefaultBounds(terrain),
      });
      onImageConfigChanged(updated);
      showToast(
        language === 'ar'
          ? `تم استيراد ${count} شريحة محلياً من مجلد EnfusionMapMaker بنجاح!`
          : `Imported ${count} tiles locally from EnfusionMapMaker folder!`
      );
    } catch (err: any) {
      mapLogger.recordImageError(err.message);
      showError(language === 'ar' ? 'تعذر استيراد مجلد الشرائح.' : 'Failed to import tile folder.');
    } finally {
      setIsUploadingFolder(false);
      e.target.value = '';
    }
  };

  // ---------------------------------------------------------------------------
  // 4. ADVANCED CUSTOM TILE URL TEMPLATE
  // ---------------------------------------------------------------------------
  const handleSaveTileUrl = async () => {
    const trimmed = tileUrl.trim();
    const updated = await saveTerrainImage(terrain, imageConfig?.imageBlob ?? null, {
      opacity,
      flipY,
      bounds: imageConfig?.bounds,
      isCalibrated: imageConfig?.isCalibrated,
      tileSourceType: trimmed ? 'url' : 'none',
      tileUrlTemplate: trimmed,
    });
    onImageConfigChanged(updated);
    showToast(language === 'ar' ? 'تم حفظ قالب رابط الشرائح المخصص.' : 'Custom tile URL template saved.');
  };

  // ---------------------------------------------------------------------------
  // 5. DELETE STORED IMAGERY
  // ---------------------------------------------------------------------------
  const handleDeleteImageOrTiles = async () => {
    if (
      window.confirm(
        language === 'ar'
          ? 'هل تريد بالتأكيد إزالة صورة الخريطة والشرائح المخزنة لهذا التضاريس من جهازك؟'
          : 'Are you sure you want to delete stored map image and tiles for this terrain?'
      )
    ) {
      await deleteTerrainImage(terrain);
      onImageConfigChanged(null);
      showToast(language === 'ar' ? 'تم حذف ملف الخريطة من المتصفح.' : 'Map imagery removed from browser.');
    }
  };

  // ---------------------------------------------------------------------------
  // 6. OPACITY ADJUSTMENT
  // ---------------------------------------------------------------------------
  const handleOpacityChange = async (val: number) => {
    setOpacity(val);
    const updated = await saveTerrainImage(terrain, imageConfig?.imageBlob ?? null, {
      opacity: val,
      flipY,
      bounds: imageConfig?.bounds,
      isCalibrated: imageConfig?.isCalibrated,
      tileUrlTemplate: tileUrl,
      tileSourceType: imageConfig?.tileSourceType,
    });
    onImageConfigChanged(updated);
  };

  // ---------------------------------------------------------------------------
  // 7. TWO-POINT CALIBRATION
  // ---------------------------------------------------------------------------
  const handlePreviewClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!previewCanvasRef.current) return;
    const rect = previewCanvasRef.current.getBoundingClientRect();
    const u = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const v = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    if (selectedPointIndex === 1) {
      setP1U(u);
      setP1V(v);
    } else {
      setP2U(u);
      setP2V(v);
    }
  };

  const handleApplyFullTerrainBounds = async () => {
    const defaultB = getDefaultBounds(terrain);
    const updated = await saveTerrainImage(terrain, imageConfig?.imageBlob ?? null, {
      opacity,
      flipY,
      bounds: defaultB,
      isCalibrated: false,
      tileUrlTemplate: tileUrl,
      tileSourceType: imageConfig?.tileSourceType,
    });
    onImageConfigChanged(updated);
    setCalibrationMode('full');
    setIsCalibrating(false);
    mapLogger.addLog('info', `تم تطبيق أبعاد التضاريس الكاملة (${defaultB[1][0]}م).`);
    showToast(language === 'ar' ? 'تم ضبط الصورة لتغطي التضاريس كاملة.' : 'Full terrain bounds applied.');
  };

  const handleApplyTwoPointCalibration = async () => {
    // Parse user inputs for point 1 and 2 (can be 6-digit grid like 045112 or X, Y in meters)
    const parseCoordOrGrid = (input: string) => {
      const parts = input.split(/[, ]+/).filter(Boolean);
      if (parts.length === 2) {
        const x = parseFloat(parts[0]);
        const y = parseFloat(parts[1]);
        if (!isNaN(x) && !isNaN(y)) return { x, y };
      }
      return parseGridReference(input);
    };

    const p1Parsed = parseCoordOrGrid(p1CoordInput);
    const p2Parsed = parseCoordOrGrid(p2CoordInput);

    if (!p1Parsed || !p2Parsed) {
      showError(
        language === 'ar'
          ? 'إحداثيات غير صالحة. يرجى إدخال 6 أرقام للشبكة (مثل 045112) أو أمتار (مثل 4500, 11200).'
          : 'Invalid coordinates. Enter 6-digit grid or meters (e.g. 4500, 11200).'
      );
      return;
    }

    const p1: CalibrationPoint = {
      imgU: p1U,
      imgV: p1V,
      worldX: p1Parsed.x,
      worldY: p1Parsed.y,
    };
    const p2: CalibrationPoint = {
      imgU: p2U,
      imgV: p2V,
      worldX: p2Parsed.x,
      worldY: p2Parsed.y,
    };

    const calculatedBounds = computeCalibrationBounds(p1, p2);

    if (!calculatedBounds) {
      showError(
        language === 'ar'
          ? 'تعذر حساب المعايرة. تأكد من أن النقطتين 1 و 2 متباعدتان قطرياً على الصورة.'
          : 'Could not compute bounds. Ensure points 1 and 2 are well-separated.'
      );
      return;
    }

    const updated = await saveTerrainImage(terrain, imageConfig?.imageBlob ?? null, {
      opacity,
      flipY,
      bounds: calculatedBounds,
      isCalibrated: true,
      calibrationPoints: [p1, p2],
      tileUrlTemplate: tileUrl,
      tileSourceType: imageConfig?.tileSourceType,
    });

    onImageConfigChanged(updated);
    setIsCalibrating(false);
    mapLogger.addLog(
      'info',
      `تمت معايرة خريطة ${terrain} بنقطتين بنجاح: P1(${p1.worldX}, ${p1.worldY}), P2(${p2.worldX}, ${p2.worldY})`
    );
    showToast(language === 'ar' ? 'تمت معايرة أبعاد الخريطة بدقة وحفظها!' : 'Map calibrated successfully!');
  };

  const recoilInfo = RECOIL_TERRAIN_INFO[terrain];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800/80 flex items-center justify-center text-cyan-400">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                {language === 'ar' ? 'مصدر خريطة التضاريس والمعايرة' : 'Terrain Map Image & Calibration'}
              </h3>
              <p className="text-xs text-slate-400 capitalize">
                {recoilInfo ? recoilInfo.nameAr || recoilInfo.name : terrain}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {onOpenDiagnostics && (
              <button
                onClick={onOpenDiagnostics}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold flex items-center gap-1 transition"
                title={language === 'ar' ? 'تشخيص الخريطة' : 'Diagnostics'}
              >
                <span>{language === 'ar' ? 'التشخيص' : 'Diagnostics'}</span>
              </button>
            )}

            <button
              onClick={onOpenHelp}
              className="p-1.5 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-slate-800 transition"
              title={t.howToPrepareMap}
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Status / Error banners */}
          {statusMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 shrink-0" />
              <span>{statusMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Privacy & Zero-Hotlink Guarantee */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed text-[11px]">
              <p className="font-semibold text-slate-200">
                {language === 'ar'
                  ? 'خصوصية وأمان: يتم تخزين الصور والشرائح محلياً على جهازك فقط (IndexedDB).'
                  : 'Privacy Guarantee: Images and tiles are kept strictly in your local browser storage (IndexedDB).'}
              </p>
              <p className="text-slate-400 mt-0.5">
                {language === 'ar'
                  ? 'لا يتم رفع الصور لأي خادم ولا يتم استهلاك باندويث خارجي دون إذنك.'
                  : 'Zero external hotlinking. Images stay completely private on your device.'}
              </p>
            </div>
          </div>

          {/* External Reference Link (Opens in new tab with credit) */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-cyan-400 shrink-0" />
              <div className="text-[11px]">
                <span className="text-slate-300 font-semibold">
                  {language === 'ar' ? 'خرائط مرجعية من Nick Ludlam:' : 'Reference maps by Nick Ludlam:'}
                </span>
                <span className="text-slate-400 block">
                  {language === 'ar'
                    ? 'يمكنك تنزيل الخريطة يدوياً من موقعه ثم رفعها كصورة محلية أدناه.'
                    : 'Download the map from reforger.recoil.org and upload it below.'}
                </span>
              </div>
            </div>
            <a
              href={recoilInfo?.pageUrl || 'https://reforger.recoil.org/'}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1.5 shrink-0 transition"
            >
              <span>reforger.recoil.org</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Source Tabs */}
          <div className="flex rounded-xl bg-slate-950 border border-slate-800 p-1 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('image')}
              className={`flex-1 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'image' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'صورة محلية (PNG/JPG)' : 'Local Image'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('folder')}
              className={`flex-1 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'folder' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'مجلد الشرائح' : 'Tile Folder'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`flex-1 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'url' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Link className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'رابط شرائح مخصص' : 'Custom URL'}</span>
            </button>
          </div>

          {/* TAB 1: LOCAL IMAGE */}
          {activeTab === 'image' && (
            <div className="space-y-4">
              {/* File Upload Box */}
              <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-xl p-5 text-center transition bg-slate-950/60">
                <input
                  type="file"
                  id="map-image-upload"
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isProcessingImage}
                />
                <label
                  htmlFor="map-image-upload"
                  className="cursor-pointer flex flex-col items-center justify-center gap-2"
                >
                  <div className="w-12 h-12 rounded-full bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-200 block text-sm">
                      {isProcessingImage
                        ? language === 'ar'
                          ? 'جارٍ فحص ومعالجة الصورة...'
                          : 'Processing image...'
                        : language === 'ar'
                        ? 'اختر صورة الخريطة من جهازك'
                        : 'Choose map image file'}
                    </span>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      {language === 'ar'
                        ? 'يدعم صيغ PNG أو JPG أو WebP (حتى 4200 × 4200 بكسل).'
                        : 'Supports PNG, JPG, or WebP (up to 4200×4200 px).'}
                    </span>
                  </div>
                </label>

                {processProgress && (
                  <div className="mt-3 text-cyan-300 font-mono text-[11px] bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                    {processProgress}
                  </div>
                )}
              </div>

              {/* Current Image Details & Active Options */}
              {imageConfig?.imageUrl && (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>{language === 'ar' ? 'الصورة الحالية محملة وجاهزة' : 'Current Map Image Loaded'}</span>
                    </span>
                    {imageConfig.naturalWidth && imageConfig.naturalHeight && (
                      <span className="font-mono text-[11px] text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                        {imageConfig.naturalWidth} × {imageConfig.naturalHeight} px
                      </span>
                    )}
                  </div>

                  {/* Vertical Flip Toggle ("عكس المحور الرأسي") */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <div>
                      <span className="font-semibold text-slate-200 block">
                        {language === 'ar' ? 'عكس المحور الرأسي (Flip Vertical)' : 'Flip Vertical Axis (Flip Y)'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {language === 'ar'
                          ? 'استخدم هذا الخيار إذا ظهرت الصورة مقلوبة رأساً على عقب.'
                          : 'Enable if the image appears upside-down.'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleToggleFlipY}
                      className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
                        flipY
                          ? 'bg-amber-600 text-white shadow'
                          : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>{flipY ? (language === 'ar' ? 'مفعّل' : 'On') : (language === 'ar' ? 'معطل' : 'Off')}</span>
                    </button>
                  </div>

                  {/* Calibration Choice: Full Terrain vs Two-Point */}
                  <div className="space-y-2">
                    <span className="font-semibold text-slate-300 block">
                      {language === 'ar' ? 'مطابقة أبعاد الصورة على الخريطة:' : 'Map Bounds Calibration:'}
                    </span>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={handleApplyFullTerrainBounds}
                        className={`p-2.5 rounded-lg border text-start transition flex flex-col justify-between ${
                          calibrationMode === 'full' && !imageConfig.isCalibrated
                            ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span className="font-bold text-xs">
                          {language === 'ar' ? 'تغطي الخريطة كاملة' : 'Full Terrain Bounds'}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-1">
                          {language === 'ar'
                            ? 'للصور المربعة التي تغطي الجزيرة بالكامل من الحافة للحافة.'
                            : 'For square full-island images.'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setCalibrationMode('twopoint');
                          setIsCalibrating(true);
                        }}
                        className={`p-2.5 rounded-lg border text-start transition flex flex-col justify-between ${
                          isCalibrating || imageConfig.isCalibrated
                            ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span className="font-bold text-xs">
                          {language === 'ar' ? 'معايرة بنقطتين' : 'Two-Point Calibration'}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-1">
                          {language === 'ar'
                            ? 'للصور المستطيلة أو الجزئية (لقطات الشاشة غير المربعة).'
                            : 'For cropped/partial screenshots.'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Interactive Two-Point Calibration Panel */}
                  {isCalibrating && (
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-cyan-500/40 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                          <Crosshair className="w-4 h-4 text-cyan-400" />
                          <span>{language === 'ar' ? 'المعايرة بنقطتين مرجعيتين' : 'Two-Point Calibration'}</span>
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {language === 'ar'
                            ? 'انقر على النقطة في الصورة وأدخل إحداثياتها'
                            : 'Click point on image & enter coords'}
                        </span>
                      </div>

                      {/* Interactive Canvas/Preview Box */}
                      <div
                        ref={previewCanvasRef}
                        onClick={handlePreviewClick}
                        className="relative w-full h-48 bg-slate-950 rounded-lg overflow-hidden border border-slate-700 cursor-crosshair select-none"
                      >
                        <img
                          src={imageConfig.imageUrl}
                          alt="Calibration preview"
                          className={`w-full h-full object-contain pointer-events-none ${
                            flipY ? 'scale-y-[-1]' : ''
                          }`}
                        />

                        {/* Point 1 Marker */}
                        <div
                          className="absolute w-4 h-4 -ml-2 -mt-2 rounded-full border-2 border-cyan-400 bg-cyan-500/40 flex items-center justify-center text-[9px] font-bold text-white shadow"
                          style={{ left: `${p1U * 100}%`, top: `${p1V * 100}%` }}
                        >
                          1
                        </div>

                        {/* Point 2 Marker */}
                        <div
                          className="absolute w-4 h-4 -ml-2 -mt-2 rounded-full border-2 border-amber-400 bg-amber-500/40 flex items-center justify-center text-[9px] font-bold text-white shadow"
                          style={{ left: `${p2U * 100}%`, top: `${p2V * 100}%` }}
                        >
                          2
                        </div>
                      </div>

                      {/* Point Selection Tabs */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedPointIndex(1)}
                          className={`p-2 rounded-lg border text-start transition ${
                            selectedPointIndex === 1
                              ? 'bg-cyan-950 border-cyan-400 text-cyan-200'
                              : 'bg-slate-950 border-slate-800 text-slate-400'
                          }`}
                        >
                          <div className="font-bold flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block"></span>
                            <span>{language === 'ar' ? 'النقطة الأولى (1)' : 'Point 1'}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1">
                            U: {(p1U * 100).toFixed(0)}%, V: {(p1V * 100).toFixed(0)}%
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedPointIndex(2)}
                          className={`p-2 rounded-lg border text-start transition ${
                            selectedPointIndex === 2
                              ? 'bg-amber-950 border-amber-400 text-amber-200'
                              : 'bg-slate-950 border-slate-800 text-slate-400'
                          }`}
                        >
                          <div className="font-bold flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
                            <span>{language === 'ar' ? 'النقطة الثانية (2)' : 'Point 2'}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1">
                            U: {(p2U * 100).toFixed(0)}%, V: {(p2V * 100).toFixed(0)}%
                          </div>
                        </button>
                      </div>

                      {/* Coordinates Inputs */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">
                            {language === 'ar'
                              ? 'إحداثيات النقطة 1 (شبكة 6 أرقام أو أمتار):'
                              : 'Point 1 Grid or Meters:'}
                          </label>
                          <input
                            type="text"
                            value={p1CoordInput}
                            onChange={(e) => setP1CoordInput(e.target.value)}
                            placeholder="e.g. 020080 or 2000, 8000"
                            className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 font-mono text-xs text-white"
                            dir="ltr"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">
                            {language === 'ar'
                              ? 'إحداثيات النقطة 2 (شبكة 6 أرقام أو أمتار):'
                              : 'Point 2 Grid or Meters:'}
                          </label>
                          <input
                            type="text"
                            value={p2CoordInput}
                            onChange={(e) => setP2CoordInput(e.target.value)}
                            placeholder="e.g. 100020 or 10000, 2000"
                            className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 font-mono text-xs text-white"
                            dir="ltr"
                          />
                        </div>
                      </div>

                      {/* Apply Two-Point Button */}
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleApplyTwoPointCalibration}
                          className="flex-1 py-2 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{language === 'ar' ? 'تطبيق وحفظ المعايرة' : 'Apply Calibration'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsCalibrating(false)}
                          className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
                        >
                          {language === 'ar' ? 'إلغاء' : 'Cancel'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ENFUSIONMAPMAKER FOLDER TILES */}
          {activeTab === 'folder' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="font-bold text-slate-200 block text-xs">
                  {language === 'ar' ? 'استيراد مجلد شرائح EnfusionMapMaker' : 'Import EnfusionMapMaker Tiles'}
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {language === 'ar'
                    ? 'إذا قمت بتوليد الشرائح محلياً بأداة EnfusionMapMaker على حاسوبك، يمكنك اختيار مجلد الشرائح وسيتم حفظها في قاعدة بيانات المتصفح.'
                    : 'If you generated tiles locally using EnfusionMapMaker, pick the folder and they will be stored offline in IndexedDB.'}
                </p>
              </div>

              <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-xl p-5 text-center transition bg-slate-950/60">
                <input
                  type="file"
                  id="folder-tiles-upload"
                  // @ts-ignore
                  webkitdirectory=""
                  directory=""
                  multiple
                  onChange={handleFolderUpload}
                  className="hidden"
                  disabled={isUploadingFolder}
                />
                <label
                  htmlFor="folder-tiles-upload"
                  className="cursor-pointer flex flex-col items-center justify-center gap-2"
                >
                  <div className="w-12 h-12 rounded-full bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
                    <FolderOpen className="w-6 h-6" />
                  </div>
                  <span className="font-bold text-slate-200 block text-sm">
                    {isUploadingFolder
                      ? language === 'ar'
                        ? 'جارٍ استيراد الشرائح وتخزينها محلياً...'
                        : 'Importing tiles into local database...'
                      : language === 'ar'
                      ? 'اختر مجلد الشرائح من القرص'
                      : 'Choose Tile Folder'}
                  </span>
                </label>
              </div>

              {onOpenEnfusionHelp && (
                <button
                  type="button"
                  onClick={onOpenEnfusionHelp}
                  className="text-cyan-400 hover:underline flex items-center gap-1 text-[11px]"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'شرح كيفية توليد الشرائح بأداة EnfusionMapMaker' : 'How to generate tiles with EnfusionMapMaker'}</span>
                </button>
              )}
            </div>
          )}

          {/* TAB 3: ADVANCED USER-ENTERED CUSTOM URL */}
          {activeTab === 'url' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="font-bold text-slate-200 block text-xs">
                  {language === 'ar' ? 'قالب رابط الشرائح المخصص (خيار متقدم)' : 'Custom Tile URL Template (Advanced)'}
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {language === 'ar'
                    ? 'هذا الحقل فارغ افتراضياً. إذا كان لديك خادم شرائح خاص بك أو محلي (مثل localhost)، يمكنك إدخال الرابط هنا مع معاملات {z}/{x}/{y}.'
                    : 'Empty by default. If you host your own tile server, enter the URL template with {z}/{x}/{y}.'}
                </p>
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  value={tileUrl}
                  onChange={(e) => setTileUrl(e.target.value)}
                  placeholder="https://your-server.com/tiles/{z}/{x}/{y}.png"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 font-mono text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  dir="ltr"
                />

                <button
                  type="button"
                  onClick={handleSaveTileUrl}
                  className="py-2 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'حفظ الرابط المخصص' : 'Save Custom Tile URL'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Common Settings: Opacity Slider & Delete Button */}
          {imageConfig && (
            <div className="pt-2 border-t border-slate-800 space-y-3">
              {/* Opacity */}
              <div className="flex items-center justify-between gap-4">
                <span className="font-semibold text-slate-300">
                  {language === 'ar' ? 'شفافية طبقة الخريطة:' : 'Layer Opacity:'}
                </span>
                <div className="flex items-center gap-2 flex-1 max-w-xs">
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={opacity}
                    onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                  <span className="font-mono text-xs text-cyan-400 w-9 text-end">
                    {Math.round(opacity * 100)}%
                  </span>
                </div>
              </div>

              {/* Delete Stored Imagery */}
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleDeleteImageOrTiles}
                  className="text-rose-400 hover:text-rose-300 flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded hover:bg-rose-950/40 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'حذف بيانات الخريطة المخزنة لهذا التضاريس' : 'Delete stored imagery'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            {language === 'ar'
              ? 'تُحفظ جميع التعديلات محلياً وتعمل فورياً على الخريطة.'
              : 'All adjustments apply immediately to the map.'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition shadow"
          >
            {language === 'ar' ? 'تم' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};
