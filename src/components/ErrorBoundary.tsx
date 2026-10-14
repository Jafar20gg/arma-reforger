import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2, ExternalLink } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Tactical ErrorBoundary caught an unhandled error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetAll = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      // Optional: clear indexedDB cache if needed
    } catch {
      // ignore
    }
    window.location.href = window.location.pathname;
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          dir="rtl"
          className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 font-sans selection:bg-amber-500 selection:text-black"
        >
          <div className="w-full max-w-lg bg-slate-900/90 border border-red-500/30 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-3 text-red-400 mb-4 pb-3 border-b border-slate-800">
              <div className="p-2.5 bg-red-950/80 border border-red-500/40 rounded-xl">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-slate-100">حدث خطأ غير متوقع في الخريطة</h1>
                <p className="text-xs text-slate-400">Tactical Map Error Recovery System</p>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              لمنع ظهور الصفحة البيضاء، قام نظام الحماية بإيقاف الانهيار. يمكنك إعادة تحميل التطبيق بأمان
              أو تفريغ البيانات التالفة.
            </p>

            {this.state.error && (
              <div className="bg-slate-950/80 rounded-lg p-3 text-xs text-red-300/90 font-mono mb-4 overflow-x-auto border border-red-900/40">
                {this.state.error.toString()}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <button
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition shadow-lg shadow-amber-500/20 text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                إعادة تحميل الصفحة
              </button>

              <button
                onClick={this.handleResetAll}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-red-900/40 text-slate-300 hover:text-red-300 border border-slate-700 hover:border-red-600/40 rounded-xl transition text-sm"
              >
                <Trash2 className="w-4 h-4" />
                إعادة ضبط البيانات
              </button>
            </div>

            <div className="pt-4 border-t border-slate-800 flex flex-col gap-2 text-xs text-slate-400">
              <span className="font-medium text-slate-300">أو فتح خريطة اللعبة مباشرة:</span>
              <div className="flex gap-2">
                <a
                  href="https://app.tacops.gg/m/everon"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 bg-slate-800/80 hover:bg-slate-700 text-cyan-400 rounded-lg border border-slate-700 transition"
                >
                  TacOps Everon <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href="https://reforger.recoil.org/everon"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 bg-slate-800/80 hover:bg-slate-700 text-emerald-400 rounded-lg border border-slate-700 transition"
                >
                  Recoil Everon <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
