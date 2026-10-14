/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MapLogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}

class MapLogger {
  private logs: MapLogEntry[] = [];
  private readonly maxLogs = 20;
  private imageErrorsCount = 0;
  private tileErrorsCount = 0;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.addLog('info', 'نظام سجلات الخريطة جاهز.');
  }

  public addLog(level: 'info' | 'warn' | 'error', message: string) {
    const entry: MapLogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      level,
      message,
    };

    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    if (level === 'error') {
      console.error(`[MapLogger] ${message}`);
    } else if (level === 'warn') {
      console.warn(`[MapLogger] ${message}`);
    } else {
      console.log(`[MapLogger] ${message}`);
    }

    this.notify();
  }

  public recordImageError(msg?: string) {
    this.imageErrorsCount++;
    this.addLog('error', msg ? `خطأ في تحميل الصورة: ${msg}` : 'خطأ في تحميل صورة الخريطة');
  }

  public recordTileError(tileKey?: string) {
    this.tileErrorsCount++;
    this.addLog('warn', tileKey ? `فشل تحميل الشريحة: ${tileKey}` : 'فشل تحميل شريحة خريطة');
  }

  public getImageErrorsCount(): number {
    return this.imageErrorsCount;
  }

  public getTileErrorsCount(): number {
    return this.tileErrorsCount;
  }

  public getTotalErrorsCount(): number {
    return this.imageErrorsCount + this.tileErrorsCount;
  }

  public getLogs(): MapLogEntry[] {
    return [...this.logs];
  }

  public clearLogs() {
    this.logs = [];
    this.imageErrorsCount = 0;
    this.tileErrorsCount = 0;
    this.addLog('info', 'تم مسح السجلات.');
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => {
      try {
        cb();
      } catch (err) {
        console.error('Error notifying log listener', err);
      }
    });
  }
}

export const mapLogger = new MapLogger();
