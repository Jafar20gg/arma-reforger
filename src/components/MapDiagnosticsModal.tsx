/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import L from 'leaflet';
import { Language, TerrainConfig, TerrainId } from '../types';
import {
  TerrainImageConfig,
  generateTestPatternImage,
  saveTerrainImage,
  getDefaultBounds,
} from '../utils/imageStore';
import { mapLogger, MapLogEntry } from '../utils/mapLogger';
import {
  Activity,
  X,
  Copy,
  RefreshCw,
  Sparkles,
  Check,
  AlertTriangle,
  Info,
  Layers,
  Map as MapIcon,
  Maximize2,
} from 'lucide-react';

interface MapDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  terrain: TerrainConfig;
  imageConfig: TerrainImageConfig | null;
  language: Language;
  mapInstance: L.Map | null;
  onImageConfigChanged: (config: TerrainImageConfig | null) => void;
}

export const MapDiagnosticsModal: React.FC<MapDiagnosticsModalProps> = ({
  isOpen,
  onClose,
  terrain,
  imageConfig,
  language,
  mapInstance,
  onImageConfigChanged,
}) => {
  const [logs, setLogs] = useState<MapLogEntry[]>([]);
  const [copied, setCopied] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isGeneratingTestPattern, setIsGeneratingTestPattern] = useState(false);

  // Real-time map zoom and center
  const [currentZoom, setCurrentZoom] = useState<number | null>(null);
  const [currentCenter, setCurrentCenter] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Refresh logs & subscribe
    setLogs(mapLogger.getLogs());
    const unsub = mapLogger.subscribe(() => {
      setLogs(mapLogger.getLogs());
    });

    if (mapInstance) {
      setCurrentZoom(Number(mapInstance.getZoom().toFixed(2)));
      const center = mapInstance.getCenter();
      setCurrentCenter({
        x: Math.round(center.lng),
        y: Math.round(center.lat),
      });

      const onMove = () => {
        setCurrentZoom(Number(mapInstance.getZoom().toFixed(2)));
        const c = mapInstance.getCenter();
        setCurrentCenter({
          x: Math.round(c.lng),
          y: Math.round(c.lat),
        });
      };

      mapInstance.on('zoomend', onMove);
      mapInstance.on('moveend', onMove);

      return () => {
        unsub();
        mapInstance.off('zoomend', onMove);
        mapInstance.off('moveend', onMove);
      };
    }

    return () => unsub();
  }, [isOpen, mapInstance]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  // Test map pattern generation
  const handleTestMapPattern = async () => {
    setIsGeneratingTestPattern(true);
    try {
      mapLogger.addLog('info', `بدء توليد نمط اختبار الخريطة لـ ${terrain.id}...`);
      const testResult = await generateTestPatternImage(terrain.id, terrain.sizeMeters);
      const defaultB = getDefaultBounds(terrain.id, terrain.sizeMeters);

      const saved = await saveTerrainImage(terrain.id, testResult.blob, {
        displayBlob: testResult.blob,
        naturalWidth: testResult.width,
        naturalHeight: testResult.height,
        bounds: defaultB,
        tileSourceType: 'image',
        isCalibrated: false,
        opacity: 0.95,
      });

      onImageConfigChanged(saved);
      mapLogger.addLog('info', `تم تطبيق نمط الاختبار بنجاح (${testResult.width}x${testResult.height}px).`);

      if (mapInstance) {
        mapInstance.fitBounds(defaultB as any);
        mapInstance.invalidateSize();
      }

      showToast(language === 'ar' ? 'تم إنشاء وتطبيق صورة نمط الاختبار!' : 'Test pattern map applied!');
    } catch (err: any) {
      mapLogger.recordImageError(err.message);
      showToast(err.message || 'فشل توليد نمط الاختبار');
    } finally {
      setIsGeneratingTestPattern(false);
    }
  };

  // Reset map view
  const handleResetView = () => {
    if (!mapInstance) {
      showToast('الخريطة غير جاهزة حالياً');
      return;
    }
    const bounds = L.latLngBounds([0, 0], [terrain.sizeMeters, terrain.sizeMeters]);
    mapInstance.fitBounds(bounds);
    mapInstance.invalidateSize();
    mapLogger.addLog('info', `تمت إعادة ضبط العرض وملاءمة حدود التضاريس (${terrain.sizeMeters}م).`);
    showToast(language === 'ar' ? 'تمت إعادة ضبط العرض وملاءمة الخريطة' : 'View reset and fitted to terrain');
  };

  // Copy full diagnostics report as text
  const handleCopyReport = () => {
    const report = [
      `=== تقرير تشخيص خريطة REFORGER MORTAR MAP ===`,
      `التاريخ والوقت: ${new Date().toLocaleString()}`,
      `التضاريس: ${terrain.id} (${terrain.nameAr || terrain.name})`,
      `أبعاد التضاريس: ${terrain.sizeMeters} م × ${terrain.sizeMeters} م`,
      `حالة تحميل الصورة: ${imageConfig?.imageUrl ? 'نعم (محملة محلياً)' : 'لا توجد صورة'}`,
      `مصدر الصورة/البلاطات: ${imageConfig?.tileSourceType || 'none'}`,
      `الأبعاد الطبيعية: ${
        imageConfig?.naturalWidth && imageConfig?.naturalHeight
          ? `${imageConfig.naturalWidth} × ${imageConfig.naturalHeight} px`
          : 'غير محددة'
      }`,
      `عكس المحور الرأسي (Flip Y): ${imageConfig?.flipY ? 'مفعّل' : 'معطل'}`,
      `الحدود الحالية المستخدمة (Bounds): ${JSON.stringify(imageConfig?.bounds || getDefaultBounds(terrain.id))}`,
      `حالة المعايرة: ${imageConfig?.isCalibrated ? 'معايرة بنقطتين' : 'الأبعاد الافتراضية'}`,
      `مستوى التكبير الحالي (Zoom): ${currentZoom ?? 'غير متاح'}`,
      `مركز الرؤية الحالي: (${currentCenter?.x ?? '?'} م, ${currentCenter?.y ?? '?'} م)`,
      `عدد أخطاء الصور: ${mapLogger.getImageErrorsCount()}`,
      `عدد أخطاء الشرائح: ${mapLogger.getTileErrorsCount()}`,
      `إجمالي الأخطاء: ${mapLogger.getTotalErrorsCount()}`,
      `---------------------------------------------`,
      `آخر 20 رسالة سجل:`,
      ...logs.map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}`),
      `=============================================`,
    ].join('\n');

    navigator.clipboard.writeText(report).then(() => {
      setCopied(true);
      showToast(language === 'ar' ? 'تم نسخ تقرير التشخيص إلى الحافظة!' : 'Diagnostics copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800/80 flex items-center justify-center text-cyan-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                {language === 'ar' ? 'تشخيص الخريطة' : 'Map Diagnostics'}
              </h3>
              <p className="text-xs text-slate-400 capitalize">
                {terrain.nameAr || terrain.name} ({terrain.sizeMeters}m)
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
          {/* Toast */}
          {toastMsg && (
            <div className="p-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{toastMsg}</span>
            </div>
          )}

          {/* Action Buttons Top Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              onClick={handleTestMapPattern}
              disabled={isGeneratingTestPattern}
              className="py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold flex items-center justify-center gap-2 shadow-md transition disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{language === 'ar' ? 'اختبار الخريطة' : 'Test Pattern'}</span>
            </button>

            <button
              onClick={handleResetView}
              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center justify-center gap-2 border border-slate-700 transition"
            >
              <RefreshCw className="w-4 h-4 text-cyan-400" />
              <span>{language === 'ar' ? 'إعادة ضبط العرض' : 'Reset View'}</span>
            </button>

            <button
              onClick={handleCopyReport}
              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold flex items-center justify-center gap-2 border border-slate-700 transition"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{language === 'ar' ? 'نسخ التقرير' : 'Copy Report'}</span>
            </button>
          </div>

          {/* Diagnostic Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">
                {language === 'ar' ? 'أبعاد التضاريس' : 'Terrain Size'}
              </span>
              <span className="text-sm font-bold font-mono text-cyan-400">
                {terrain.sizeMeters.toLocaleString()} m
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">
                {language === 'ar' ? 'حالة تحميل الصورة' : 'Image Loaded'}
              </span>
              <span
                className={`text-sm font-bold flex items-center gap-1.5 ${
                  imageConfig?.imageUrl ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {imageConfig?.imageUrl ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{language === 'ar' ? 'نعم (محلي)' : 'Yes (Local)'}</span>
                  </>
                ) : (
                  <>
                    <Info className="w-4 h-4" />
                    <span>{language === 'ar' ? 'لا توجد صورة' : 'No Image'}</span>
                  </>
                )}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">
                {language === 'ar' ? 'أبعاد البكسل' : 'Pixel Resolution'}
              </span>
              <span className="text-xs font-mono font-bold text-slate-200">
                {imageConfig?.naturalWidth && imageConfig?.naturalHeight
                  ? `${imageConfig.naturalWidth} × ${imageConfig.naturalHeight} px`
                  : '—'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">
                {language === 'ar' ? 'التكبير الحالي' : 'Current Zoom'}
              </span>
              <span className="text-sm font-bold font-mono text-amber-400">
                {currentZoom ?? '—'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">
                {language === 'ar' ? 'مركز العرض الحالي' : 'Current Center'}
              </span>
              <span className="text-xs font-mono text-slate-300">
                {currentCenter ? `${currentCenter.x}m, ${currentCenter.y}m` : '—'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">
                {language === 'ar' ? 'الأخطاء المسجلة' : 'Errors Count'}
              </span>
              <span
                className={`text-sm font-bold font-mono ${
                  mapLogger.getTotalErrorsCount() > 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {mapLogger.getTotalErrorsCount()}{' '}
                <span className="text-[10px] font-normal text-slate-500">
                  ({mapLogger.getImageErrorsCount()} صور / {mapLogger.getTileErrorsCount()} بلاطات)
                </span>
              </span>
            </div>
          </div>

          {/* Detailed Configuration Details */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <h4 className="font-bold text-slate-200 flex items-center gap-1.5 text-xs">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>{language === 'ar' ? 'الحدود والمعايرة النشطة' : 'Active Bounds & Calibration'}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[10px]">
                  {language === 'ar' ? 'الحدود الحالية (CRS.Simple)' : 'Bounds (CRS.Simple)'}:
                </span>
                <span className="text-cyan-300">
                  {JSON.stringify(imageConfig?.bounds || getDefaultBounds(terrain.id))}
                </span>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[10px]">
                  {language === 'ar' ? 'حالة المعايرة والانقلاب' : 'Calibration & Flip'}:
                </span>
                <span className="text-slate-300">
                  {imageConfig?.isCalibrated
                    ? language === 'ar'
                      ? 'معايرة بنقطتين'
                      : 'Two-Point Calibrated'
                    : language === 'ar'
                    ? 'الأبعاد الافتراضية'
                    : 'Default Bounds'}{' '}
                  | {imageConfig?.flipY ? 'عكس رأسي: نعم' : 'عكس رأسي: لا'}
                </span>
              </div>
            </div>
          </div>

          {/* Logs Terminal Area */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300">
                {language === 'ar' ? 'آخر 20 رسالة سجل (Logs):' : 'Last 20 Log Messages:'}
              </span>
              <button
                onClick={() => {
                  mapLogger.clearLogs();
                  setLogs(mapLogger.getLogs());
                }}
                className="text-[10px] text-slate-500 hover:text-rose-400 transition"
              >
                {language === 'ar' ? 'مسح السجلات' : 'Clear Logs'}
              </button>
            </div>

            <div
              className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] max-h-48 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-slate-800"
              dir="ltr"
            >
              {logs.length === 0 ? (
                <div className="text-slate-600 text-center py-4">No logs recorded yet.</div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className={`flex items-start gap-2 leading-relaxed ${
                      log.level === 'error'
                        ? 'text-rose-400'
                        : log.level === 'warn'
                        ? 'text-amber-400'
                        : 'text-slate-400'
                    }`}
                  >
                    <span className="text-slate-600 shrink-0 text-[10px]">[{log.timestamp}]</span>
                    <span className="font-bold shrink-0 uppercase text-[10px]">[{log.level}]</span>
                    <span className="break-all">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            {language === 'ar'
              ? 'تساعد هذه الصفحة في تشخيص أي مشاكل في إحداثيات أو أبعاد الخريطة.'
              : 'Diagnostics assist in verifying layer bounds and Leaflet setup.'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            {language === 'ar' ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
