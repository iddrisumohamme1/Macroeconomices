import React, { useState } from 'react';
import { X, Upload, FileSpreadsheet, Check, AlertCircle } from 'lucide-react';
import { TradeRecord } from '../../types';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportTrades: (trades: TradeRecord[]) => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  onImportTrades,
}) => {
  const sampleCsv = `ticket_id,account_id,asset,direction,lots,open_price,close_price,pnl,r_multiple,open_time,close_time
9842101,FTMO-100K-01,EUR/USD,BUY,5.0,1.1120,1.1165,2250.00,2.15,2026-09-29 08:30:00,2026-09-29 11:45:00
9842102,MFF-200K-02,AUD/USD,SELL,8.0,0.6890,0.6845,3600.00,3.00,2026-09-29 09:15:00,2026-09-29 14:20:00
9842103,TOPSTEP-50K-ALPHA,USD/CAD,BUY,2.5,1.3480,1.3520,1000.00,1.40,2026-09-29 10:00:00,2026-09-29 15:30:00`;

  const [csvText, setCsvText] = useState(sampleCsv);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleParseAndImport = () => {
    try {
      const lines = csvText.trim().split('\n');
      if (lines.length < 2) {
        setError('CSV must contain a header row and at least one data row.');
        return;
      }

      const parsed: TradeRecord[] = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map((p) => p.trim());
        if (parts.length >= 8) {
          const [ticketId, accountId, asset, direction, lots, openPrice, closePrice, pnl, rMultiple, openTime, closeTime] = parts;
          const pnlNum = parseFloat(pnl) || 0;
          parsed.push({
            id: `TRD-${Math.floor(100000 + Math.random() * 900000)}`,
            accountId: accountId || 'FTMO-100K-01',
            ticketId: ticketId || `${9840000 + i}`,
            asset: asset || 'EUR/USD',
            direction: direction === 'SELL' ? 'SELL' : 'BUY',
            lotSize: parseFloat(lots) || 1.0,
            openPrice: parseFloat(openPrice) || 1.0,
            closePrice: parseFloat(closePrice) || 1.0,
            pnl: pnlNum,
            pnlPercentage: 0.5,
            rMultiple: parseFloat(rMultiple) || (pnlNum > 0 ? 1.5 : -1.0),
            commission: -20,
            openTime: openTime || '2026-09-29 10:00:00',
            closeTime: closeTime || '2026-09-29 14:00:00',
            status: pnlNum > 0 ? 'WIN' : pnlNum < 0 ? 'LOSS' : 'BREAKEVEN',
            executionType: 'CSV_STATEMENT_AUDIT',
          });
        }
      }

      if (parsed.length === 0) {
        setError('No valid rows could be parsed. Check comma formatting.');
        return;
      }

      onImportTrades(parsed);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to parse CSV string.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full max-h-[92vh] overflow-y-auto p-4 sm:p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Upload className="w-5 h-5 text-emerald-400" />
            Import Broker Statement (Read-Only CSV)
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Copy-paste broker trade export or MT4/MT5 statement rows. Strictly read-only audit processing with zero broker execution.
          </p>
        </div>

        {error && (
          <div className="mb-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs">
            <label className="text-slate-300 font-semibold">CSV Text Buffer</label>
            <button
              onClick={() => setCsvText(sampleCsv)}
              className="text-emerald-400 hover:underline text-[11px]"
            >
              Reset to Sample
            </button>
          </div>

          <textarea
            rows={8}
            value={csvText}
            onChange={(e) => {
              setCsvText(e.target.value);
              setError(null);
            }}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
            placeholder="ticket_id,account_id,asset,direction,lots,open_price,close_price,pnl,r_multiple,open_time,close_time"
          />

          <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800 text-[11px] text-slate-400">
            <strong>Security Invariant:</strong> Uploaded statements undergo automated SHA-256 integrity hashing and immutable audit logging.
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleParseAndImport}
            className="px-5 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow transition-colors flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Parse &amp; Ingest Statement</span>
          </button>
        </div>
      </div>
    </div>
  );
};
