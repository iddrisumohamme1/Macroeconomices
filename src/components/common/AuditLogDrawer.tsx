import React from 'react';
import { AuditLogItem } from '../../types';
import { X, Lock } from 'lucide-react';

interface AuditLogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  logs: AuditLogItem[];
}

export const AuditLogDrawer: React.FC<AuditLogDrawerProps> = ({
  isOpen,
  onClose,
  logs,
}) => {
  if (!isOpen) return null;

  const getSeverityBadge = (severity: AuditLogItem['severity']) => {
    switch (severity) {
      case 'SUCCESS':
        return <span className="text-emerald-700 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded text-[10px] font-mono font-bold">SUCCESS</span>;
      case 'WARNING':
        return <span className="text-amber-700 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded text-[10px] font-mono font-bold">WARNING</span>;
      case 'CRITICAL':
        return <span className="text-rose-700 bg-rose-50 border border-rose-300 px-2 py-0.5 rounded text-[10px] font-mono font-bold">CRITICAL</span>;
      case 'INFO':
      default:
        return <span className="text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-[10px] font-mono font-bold">INFO</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border-l border-slate-200 w-full max-w-xl h-full flex flex-col shadow-2xl">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-blue-50/60">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Security &amp; Calculation Audit Trail</h3>
              <p className="text-[11px] text-slate-500">Granular tracking of all system calculations, investor authorizations &amp; data access</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {logs.map((log) => (
            <div key={log.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5 text-xs font-sans">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-slate-500 font-bold">{log.id}</span>
                  {getSeverityBadge(log.severity)}
                  <span className="text-[11px] font-mono text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                    {log.category}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">{log.timestamp}</span>
              </div>

              <div className="font-bold text-slate-900 text-xs">
                {log.message}
              </div>

              <p className="text-[11px] text-slate-600 font-sans leading-relaxed">
                {log.details}
              </p>

              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-200/80">
                <span>Source: {log.source}</span>
                <span className="truncate max-w-[180px]">Hash: {log.immutableHash}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
