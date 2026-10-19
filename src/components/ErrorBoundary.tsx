import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2, Copy, Check } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      copied: false,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Tactical Fire Control System - Uncaught Exception:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetState = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    } catch (e) {
      console.error('Failed to clear storage:', e);
      window.location.reload();
    }
  };

  private handleCopyDiagnostics = () => {
    const { error, errorInfo } = this.state;
    const diagText = `=== ARMA REFORGER FCS ERROR REPORT ===
Time: ${new Date().toISOString()}
URL: ${window.location.href}
UserAgent: ${navigator.userAgent}
Error: ${error?.name}: ${error?.message}
Stack:
${error?.stack || 'No stack'}
Component Stack:
${errorInfo?.componentStack || 'No component stack'}`;

    navigator.clipboard.writeText(diagText).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2500);
    });
  };

  public render() {
    if (this.state.hasError) {
      const isArabic = document.documentElement.lang === 'ar' || document.documentElement.dir === 'rtl';

      return (
        <div
          dir={isArabic ? 'rtl' : 'ltr'}
          className="min-h-screen w-full flex items-center justify-center p-4 bg-neutral-950 text-neutral-100 font-mono select-none"
        >
          <div className="w-full max-w-xl bg-neutral-900 border border-red-500/80 rounded-xl shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3 border-b border-neutral-800 pb-3">
              <div className="w-10 h-10 rounded-lg bg-red-950/80 border border-red-500/80 flex items-center justify-center text-red-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <h1 className="font-tactical text-base font-bold text-red-400 uppercase tracking-wider">
                  {isArabic ? 'تنبيه: حدث خطأ غير متوقع في النظام' : 'SYSTEM MALFUNCTION – RUNTIME ERROR'}
                </h1>
                <span className="text-xs text-neutral-400 font-mono">
                  Arma Reforger Fire Control System
                </span>
              </div>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed font-sans">
              {isArabic
                ? 'واجه التطبيق استثناءً غير متوقع أثناء المعالجة أو العرض. يمكنك محاولة إعادة التحميل أو مسح الذاكرة المؤقتة المحلية لاستعادة الإعدادات الأصلية.'
                : 'The application encountered an unexpected runtime exception. You can reload the page or reset cached local data to restore factory settings.'}
            </p>

            {this.state.error && (
              <div className="bg-neutral-950 border border-red-900/50 rounded-lg p-3 text-xs font-mono text-red-300 max-h-48 overflow-y-auto">
                <div className="font-bold text-red-400 mb-1">
                  {this.state.error.name}: {this.state.error.message}
                </div>
                {this.state.error.stack && (
                  <pre className="text-[10px] text-neutral-500 whitespace-pre-wrap overflow-x-auto font-mono">
                    {this.state.error.stack}
                  </pre>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={this.handleCopyDiagnostics}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-700 hover:border-amber-500 text-neutral-300 text-xs font-tactical transition"
              >
                {this.state.copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
                <span>{this.state.copied ? (isArabic ? 'تم النسخ!' : 'Copied!') : (isArabic ? 'نسخ التقرير' : 'Copy Diagnostics')}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={this.handleResetState}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/70 border border-red-700 hover:bg-red-900/80 text-red-300 text-xs font-tactical transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isArabic ? 'مسح الذاكرة وإعادة الضبط' : 'Reset Cache & Defaults'}</span>
                </button>
                <button
                  type="button"
                  onClick={this.handleReload}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-neutral-950 font-tactical font-bold text-xs transition shadow-md"
                >
                  <RefreshCw className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{isArabic ? 'إعادة تحميل' : 'Reload App'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
