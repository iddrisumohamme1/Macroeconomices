import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, RotateCcw, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
  resetKey?: string | number; // Passing activeTab as key enables automatic reset on tab change
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Apex FX ErrorBoundary caught an exception:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public componentDidUpdate(prevProps: ErrorBoundaryProps) {
    // If the resetKey changed (e.g. user clicked a different tab), automatically reset the boundary
    if (this.props.resetKey !== prevProps.resetKey && this.state.hasError) {
      this.handleReset();
    }
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleClearCacheAndReset = () => {
    try {
      localStorage.removeItem('apex_active_tab');
      sessionStorage.clear();
    } catch {}
    this.handleReset();
  };

  public render() {
    if (this.state.hasError) {
      const { fallbackTitle = 'Module Rendering Interrupted' } = this.props;
      const errorMessage = this.state.error?.message || 'An unexpected runtime evaluation occurred';

      return (
        <div className="w-full my-6 bg-white border border-rose-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0 shadow-2xs">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-bold text-rose-700 uppercase tracking-wider">
                    Defensive Shield Active
                  </span>
                  <span className="text-xs text-slate-400" aria-hidden="true">·</span>
                  <span className="text-xs text-slate-500 font-mono">Isolated Fault</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  {fallbackTitle}
                </h3>
                <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
                  The active macro workspace encountered a temporary rendering condition. The defensive sentinel
                  isolated the fault to prevent an entire screen unmount. Your navigation bar and other analytical
                  modules remain fully operational.
                </p>
              </div>
            </div>

            {/* Quick Recovery Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                title="Restore default stable workspace"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Restore Stable View</span>
              </button>

              <button
                onClick={this.handleClearCacheAndReset}
                className="flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                title="Purge cached tab memory and reset to primary Currency Bias view"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Purge Cache &amp; Reset</span>
              </button>
            </div>
          </div>

          {/* Diagnostic Details Accordion */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <button
              onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
              className="flex items-center gap-1.5 text-xs font-mono text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <span>Technical Diagnostics</span>
              {this.state.showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {this.state.showDetails && (
              <div className="mt-3 p-3.5 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800 space-y-2">
                <div className="text-rose-400 font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
                  <span>Error: {errorMessage}</span>
                </div>
                {this.state.errorInfo?.componentStack && (
                  <pre className="text-[11px] text-slate-400 leading-normal overflow-x-auto whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack.trim()}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
