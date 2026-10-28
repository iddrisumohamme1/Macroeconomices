import React from 'react';
import { TradeRecord } from '../../types';
import { FileSpreadsheet, Download, ArrowUpRight, ArrowDownRight, X, Clock } from 'lucide-react';
import { formatCurrency } from '../../utils/quantCalculations';

interface TradeAuditLogProps {
  trades: TradeRecord[];
  allTradesCount: number;
  selectedAccountId: string;
  selectedAsset: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectAccount: (accountId: string) => void;
  onSelectAsset: (asset: string) => void;
  onExportCsv: () => void;
  onClearFilters: () => void;
  isFiltered: boolean;
  uniqueAssets: string[];
  accountsList: { id: string; propFirm: string }[];
}

export const TradeAuditLog: React.FC<TradeAuditLogProps> = ({
  trades,
  allTradesCount,
  onSelectAccount,
  onSelectAsset,
  onExportCsv,
  onClearFilters,
  isFiltered,
}) => {
  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm sm:text-base font-semibold text-slate-100 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
              Trade Performance Journal &amp; Audit Log
            </h3>
            <span className="text-[10px] sm:text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              {trades.length} of {allTradesCount} records
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Strict read-only investor API statements &amp; CSV audits.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Quick Clear if filtered */}
          {isFiltered && (
            <button
              onClick={onClearFilters}
              className="flex items-center gap-1 px-2.5 py-1 text-xs text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}

          {/* Export CSV */}
          <button
            onClick={onExportCsv}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* MOBILE TRADE CARDS LIST (< sm screens) */}
      <div className="sm:hidden space-y-2.5">
        {trades.length === 0 ? (
          <div className="py-8 text-center text-slate-400 font-sans text-xs">
            <p className="font-semibold text-slate-300">No trades match filters.</p>
            {isFiltered && (
              <button
                onClick={onClearFilters}
                className="mt-2 px-3 py-1 text-xs text-slate-200 bg-slate-800 rounded border border-slate-700"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          trades.map((trade) => {
            const isWin = trade.pnl > 0;
            return (
              <div
                key={trade.id}
                className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 text-xs font-mono space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        trade.direction === 'BUY'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {trade.direction}
                    </span>
                    <button
                      onClick={() => onSelectAsset(trade.asset)}
                      className="font-bold text-white hover:text-emerald-400 text-sm"
                    >
                      {trade.asset}
                    </button>
                    <span className="text-slate-400 text-[11px]">
                      {trade.lotSize.toFixed(1)} lots
                    </span>
                  </div>

                  <span
                    className={`inline-flex items-center gap-0.5 font-bold text-sm ${
                      isWin ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {isWin ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    {formatCurrency(trade.pnl, true)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-900/50 px-2 py-1.5 rounded">
                  <span>
                    Acc: <button onClick={() => onSelectAccount(trade.accountId)} className="text-slate-200 underline font-semibold">{trade.accountId}</button>
                  </span>
                  <span>
                    R-Mult: <strong className={trade.rMultiple >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{trade.rMultiple >= 0 ? '+' : ''}{trade.rMultiple.toFixed(2)}R</strong>
                  </span>
                  <span>#{trade.ticketId}</span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                  <span>{trade.openPrice} → {trade.closePrice}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {trade.closeTime}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DESKTOP TRADE LOG TABLE (>= sm screens) */}
      <div className="hidden sm:block overflow-x-auto -mx-5 px-5">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-medium">
              <th className="py-2.5 pr-3 pl-1">Ticket ID</th>
              <th className="py-2.5 px-3">Account ID</th>
              <th className="py-2.5 px-3">Asset Pair</th>
              <th className="py-2.5 px-2 text-center">Dir</th>
              <th className="py-2.5 px-3 text-right">Lots</th>
              <th className="py-2.5 px-3 text-right">Open / Close Price</th>
              <th className="py-2.5 px-3 text-right">Realized PnL</th>
              <th className="py-2.5 px-3 text-right">R-Multiple</th>
              <th className="py-2.5 px-3 text-center">Data Isolation</th>
              <th className="py-2.5 pl-3 text-right">Execution Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {trades.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-10 text-center text-slate-400 font-sans text-xs">
                  <div className="max-w-sm mx-auto space-y-2">
                    <p className="font-semibold text-slate-300">No trades match current search and filter criteria.</p>
                    <p className="text-[11px] text-slate-500">
                      Try selecting "All Accounts", "All Asset Pairs", or clearing the search query.
                    </p>
                    {isFiltered && (
                      <button
                        onClick={onClearFilters}
                        className="mt-2 px-3 py-1 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 transition-colors inline-block"
                      >
                        Reset All Filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              trades.map((trade) => {
                const isWin = trade.pnl > 0;
                return (
                  <tr key={trade.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 pr-3 pl-1 font-semibold text-slate-200">
                      #{trade.ticketId}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-300 text-[11px] whitespace-nowrap">
                      <button
                        onClick={() => onSelectAccount(trade.accountId)}
                        className="hover:text-emerald-400 hover:underline transition-colors"
                        title={`Filter by account ${trade.accountId}`}
                      >
                        {trade.accountId}
                      </button>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-white whitespace-nowrap">
                      <button
                        onClick={() => onSelectAsset(trade.asset)}
                        className="hover:text-emerald-400 hover:underline transition-colors font-mono"
                        title={`Filter by asset ${trade.asset}`}
                      >
                        {trade.asset}
                      </button>
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          trade.direction === 'BUY'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {trade.direction}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-slate-300">
                      {trade.lotSize.toFixed(1)}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-slate-400 text-[11px]">
                      {trade.openPrice} → {trade.closePrice}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums font-bold whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-0.5 ${
                          isWin ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isWin ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3" />
                        )}
                        {formatCurrency(trade.pnl, true)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums font-bold">
                      <span className={trade.rMultiple >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {trade.rMultiple >= 0 ? '+' : ''}{trade.rMultiple.toFixed(2)}R
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span className="text-[10px] bg-slate-950 text-slate-400 border border-slate-800 px-2 py-0.5 rounded font-sans">
                        {trade.executionType === 'READ_ONLY_SYNC' ? 'Investor Read-Only' : 'CSV Audit Ingest'}
                      </span>
                    </td>
                    <td className="py-2.5 pl-3 text-right text-slate-500 text-[11px] tabular-nums whitespace-nowrap">
                      {trade.closeTime}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
