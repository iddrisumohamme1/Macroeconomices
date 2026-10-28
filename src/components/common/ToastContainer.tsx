import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ToastAlert } from '../../types';
import { ShieldAlert, AlertTriangle, X, ArrowDownRight, Info, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/quantCalculations';

interface ToastContainerProps {
  toasts: ToastAlert[];
  onDismiss: (id: string) => void;
}

interface ToastItemProps {
  toast: ToastAlert;
  onDismiss: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const duration = toast.durationMs || 6000;
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const onDismissRef = useRef(onDismiss);

  // Keep latest onDismiss reference without triggering effect re-runs
  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (isPaused) return;

    // Direct auto-dismiss timer outside of state reducer
    const dismissTimer = setTimeout(() => {
      onDismissRef.current(toast.id);
    }, duration);

    // Smooth visual progress bar
    const intervalTime = 50;
    const step = (intervalTime / duration) * 100;
    const progressTimer = setInterval(() => {
      setProgress((prev) => Math.max(0, prev - step));
    }, intervalTime);

    return () => {
      clearTimeout(dismissTimer);
      clearInterval(progressTimer);
    };
  }, [toast.id, duration, isPaused]);

  const isBreached = toast.type === 'BREACHED';
  const isThreat = toast.type === 'CRITICAL_THREAT';
  const isWarning = toast.type === 'WARNING';
  const isInfo = toast.type === 'INFO';

  const getContainerStyle = () => {
    if (isBreached) {
      return 'bg-rose-950/95 border-rose-500/80 text-rose-100 shadow-rose-950/50 ring-1 ring-rose-500/50';
    }
    if (isThreat) {
      return 'bg-amber-950/95 border-amber-500/80 text-amber-100 shadow-amber-950/50 ring-1 ring-amber-500/50';
    }
    if (isWarning) {
      return 'bg-orange-950/95 border-orange-500/80 text-orange-100 shadow-orange-950/50 ring-1 ring-orange-500/50';
    }
    // INFO
    return 'bg-slate-900/95 border-emerald-500/60 text-slate-100 shadow-emerald-950/40 ring-1 ring-emerald-500/40';
  };

  const getIcon = () => {
    if (isBreached) {
      return (
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
          <ShieldAlert className="w-5 h-5 text-rose-400" />
        </div>
      );
    }
    if (isThreat) {
      return (
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/40">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
        </div>
      );
    }
    if (isWarning) {
      return (
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-orange-500/20 text-orange-400 border border-orange-500/40">
          <AlertCircle className="w-5 h-5 text-orange-400" />
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
        <Info className="w-5 h-5 text-emerald-400" />
      </div>
    );
  };

  const getBadge = () => {
    if (isBreached) {
      return (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider font-mono bg-rose-500 text-slate-950 font-black">
          HARD VIOLATION BREACHED
        </span>
      );
    }
    if (isThreat) {
      return (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
          CRITICAL THREAT ALERT
        </span>
      );
    }
    if (isWarning) {
      return (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider font-mono bg-orange-500/20 text-orange-300 border border-orange-500/30">
          SYSTEM NOTICE
        </span>
      );
    }
    return (
      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
        SESSION EVENT
      </span>
    );
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.92 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`pointer-events-auto w-full rounded-xl p-4 shadow-2xl backdrop-blur-md border relative overflow-hidden ${getContainerStyle()}`}
    >
      {/* Top Banner & Alert Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          {getIcon()}

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              {getBadge()}
              <span className="text-[10px] font-mono text-slate-400">
                {toast.timestamp}
              </span>
            </div>

            <h4 className="text-sm font-bold mt-1 text-white leading-tight">
              {toast.title}
            </h4>
          </div>
        </div>

        {/* Dismiss Button */}
        <button
          onClick={() => onDismiss(toast.id)}
          className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors shrink-0"
          title="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Message & Drawdown Metrics */}
      <p className="text-xs text-slate-200 mt-2 leading-relaxed font-sans">
        {toast.message}
      </p>

      {/* Metric details chip */}
      {(toast.distance !== undefined || (toast.accountId && toast.accountId !== 'AUTH' && toast.accountId !== 'SYSTEM')) && (
        <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-xs font-mono">
          <span className="text-slate-300">
            Account: <strong className="text-white">{toast.accountId}</strong>
          </span>
          {toast.distance !== undefined && (
            <span
              className={`font-bold flex items-center gap-0.5 ${
                toast.distance <= 0 ? 'text-rose-400' : 'text-amber-300'
              }`}
            >
              <ArrowDownRight className="w-3.5 h-3.5" />
              {toast.distance <= 0
                ? `Breached by ${formatCurrency(Math.abs(toast.distance))}`
                : `Margin: +${formatCurrency(toast.distance)} (${toast.distancePct?.toFixed(2)}%)`}
            </span>
          )}
        </div>
      )}

      {/* Auto-Dismiss Progress Bar at the bottom edge */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30 overflow-hidden">
        <div
          className={`h-full transition-all duration-75 ${
            isBreached
              ? 'bg-rose-400'
              : isThreat
              ? 'bg-amber-400'
              : isWarning
              ? 'bg-orange-400'
              : 'bg-emerald-400'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  );
};

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div
      aria-live="assertive"
      className="fixed top-16 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
};
