import React from 'react';
import { FundingAccount } from '../../types';
import { ShieldCheck, ShieldAlert, AlertTriangle, AlertCircle, TrendingDown, Plus } from 'lucide-react';
import { formatCurrency } from '../../utils/quantCalculations';

interface DrawdownMonitorTableProps {
  accounts: FundingAccount[];
  selectedAccountId: string;
  onSelectAccount: (id: string) => void;
  onQuickSimulateLoss: (accountId: string, lossAmount: number) => void;
  onOpenAddAccountModal?: () => void;
}

export const DrawdownMonitorTable: React.FC<DrawdownMonitorTableProps> = ({
  accounts,
  selectedAccountId,
  onSelectAccount,
  onQuickSimulateLoss,
  onOpenAddAccountModal,
}) => {
  const getStatusBadge = (status: FundingAccount['status'], distancePct: number) => {
    switch (status) {
      case 'Safe':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <ShieldCheck className="w-3 h-3" />
            Safe ({distancePct.toFixed(2)}%)
          </span>
        );
      case 'Caution':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <AlertCircle className="w-3 h-3" />
            Caution ({distancePct.toFixed(2)}%)
          </span>
        );
      case 'Warning':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/30">
            <AlertTriangle className="w-3 h-3" />
            Warning ({distancePct.toFixed(2)}%)
          </span>
        );
      case 'Critical Threat':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 animate-pulse">
            <ShieldAlert className="w-3 h-3" />
            Critical ({distancePct.toFixed(2)}%)
          </span>
        );
      case 'Breached':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold bg-rose-600/30 text-rose-300 border border-rose-500">
            <ShieldAlert className="w-3 h-3" />
            BREACHED
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-slate-100 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            Multi-Account Hard Risk Rules &amp; Drawdown Ceilings
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Hard Rule: 5% Daily Loss Ceiling locked strictly at broker rollover (22:00 UTC).
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onOpenAddAccountModal && (
            <button
              onClick={onOpenAddAccountModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Account</span>
            </button>
          )}
          <div className="text-[10px] sm:text-[11px] text-slate-400 font-mono bg-slate-950 px-2.5 py-1.5 rounded border border-slate-800">
            Distance = Live Equity - (Starting Equity × 0.95)
          </div>
        </div>
      </div>

      {/* MOBILE RESPONSIVE CARD VIEW (< sm screens) */}
      <div className="sm:hidden space-y-3">
        {accounts.map((acc) => {
          const isSelected = selectedAccountId === acc.id;
          const isBreached = acc.distanceToViolation <= 0;

          return (
            <div
              key={acc.id}
              onClick={() => onSelectAccount(acc.id)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-800/90 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30'
                  : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      isSelected ? 'bg-emerald-400' : 'bg-slate-600'
                    }`}
                  />
                  <span className="font-mono font-bold text-xs text-white truncate">
                    {acc.id}
                  </span>
                  <span className="text-[10px] text-slate-400 font-sans">
                    ({acc.propFirm})
                  </span>
                  {acc.connectionType === 'INVESTOR_PASSWORD_READONLY' && (
                    <span className="text-[9px] font-mono font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded">
                      Read-Only
                    </span>
                  )}
                </div>
                {getStatusBadge(acc.status, acc.distancePct)}
              </div>

              {/* Card Financial Details */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-3 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/50">
                <div>
                  <span className="text-[10px] text-slate-500 block">Live Equity</span>
                  <span className="font-bold text-white tabular-nums">
                    {formatCurrency(acc.currentEquity)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">5% DD Ceiling</span>
                  <span className="font-semibold text-rose-400 tabular-nums">
                    {formatCurrency(acc.dailyDrawdownCeiling)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Rollover Base (22:00)</span>
                  <span className="text-slate-300 tabular-nums">
                    {formatCurrency(acc.dailyStartingEquity)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Buffer Distance</span>
                  <span
                    className={`font-bold tabular-nums ${
                      isBreached
                        ? 'text-rose-500'
                        : acc.distancePct < 2.0
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {acc.distanceToViolation > 0 ? '+' : ''}
                    {formatCurrency(acc.distanceToViolation)}
                  </span>
                </div>
              </div>

              {/* Stress Test Action */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/50">
                <span className="text-[10px] text-slate-500">
                  {isSelected ? '✓ Chart Anchor Active' : 'Tap to focus on chart'}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickSimulateLoss(acc.id, 500);
                  }}
                  className="px-2.5 py-1 text-xs font-sans text-rose-400 active:bg-rose-500/20 bg-rose-500/10 border border-rose-500/30 rounded-lg transition-colors inline-flex items-center gap-1"
                >
                  <TrendingDown className="w-3 h-3" />
                  <span>-$500 Stress Test</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* DESKTOP / TABLET DATA TABLE (>= sm screens) */}
      <div className="hidden sm:block overflow-x-auto -mx-5 px-5">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-medium">
              <th className="py-2.5 pr-4 pl-1">Funding Account ID</th>
              <th className="py-2.5 px-3">Tier &amp; Firm</th>
              <th className="py-2.5 px-3 text-right">Daily Starting Eq (22:00 UTC)</th>
              <th className="py-2.5 px-3 text-right">5% Hard Ceiling</th>
              <th className="py-2.5 px-3 text-right">Current Live Equity</th>
              <th className="py-2.5 px-3 text-right">Distance to Violation</th>
              <th className="py-2.5 px-3 text-center">Safety Status</th>
              <th className="py-2.5 pl-3 text-right">Stress Test</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {accounts.map((acc) => {
              const isSelected = selectedAccountId === acc.id;
              const isBreached = acc.distanceToViolation <= 0;

              return (
                <tr
                  key={acc.id}
                  onClick={() => onSelectAccount(acc.id)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-slate-800/80 text-white'
                      : 'hover:bg-slate-800/40 text-slate-300'
                  }`}
                >
                  <td className="py-3 pr-4 pl-1 font-bold whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          isSelected ? 'bg-emerald-400' : 'bg-slate-600'
                        }`}
                      />
                      <span className="text-white">{acc.id}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-sans whitespace-nowrap">
                    <div className="text-slate-200 font-medium">{acc.propFirm}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-slate-500">{acc.accountType}</span>
                      {acc.connectionType === 'INVESTOR_PASSWORD_READONLY' && (
                        <span className="text-[9px] font-mono font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                          Read-Only Investor
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums text-slate-300">
                    {formatCurrency(acc.dailyStartingEquity)}
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums font-semibold text-rose-400">
                    {formatCurrency(acc.dailyDrawdownCeiling)}
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums font-bold text-white">
                    {formatCurrency(acc.currentEquity)}
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums">
                    <span
                      className={`font-bold ${
                        isBreached
                          ? 'text-rose-500'
                          : acc.distancePct < 2.0
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {acc.distanceToViolation > 0 ? '+' : ''}
                      {formatCurrency(acc.distanceToViolation)}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    {getStatusBadge(acc.status, acc.distancePct)}
                  </td>
                  <td className="py-3 pl-3 text-right whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onQuickSimulateLoss(acc.id, 500);
                      }}
                      className="px-2 py-1 text-[11px] font-sans text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded transition-colors inline-flex items-center gap-1"
                      title="Simulate -$500 loss on this account"
                    >
                      <TrendingDown className="w-3 h-3" />
                      <span>-$500</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
