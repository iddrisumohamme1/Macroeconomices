import React, { useState } from 'react';
import { FundingAccount, TradeRecord, EconomicNewsEvent } from '../../types';
import { X, TrendingUp, TrendingDown, AlertTriangle, ShieldCheck, Folder, ShieldAlert } from 'lucide-react';
import { calculateAccountDrawdown, formatCurrency } from '../../utils/quantCalculations';

interface SimulateTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: FundingAccount[];
  onAddTrade: (trade: TradeRecord, accountId: string, pnl: number) => void;
  newsEvents?: EconomicNewsEvent[];
}

export const SimulateTradeModal: React.FC<SimulateTradeModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onAddTrade,
  newsEvents = [],
}) => {
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || '');
  const [asset, setAsset] = useState<string>('EUR/USD');
  const [direction, setDirection] = useState<'BUY' | 'SELL'>('BUY');
  const [lotSize, setLotSize] = useState<number>(3.0);
  const [pnl, setPnl] = useState<number>(-750);
  const [riskAmount, setRiskAmount] = useState<number>(500);

  if (!isOpen) return null;

  const currentAccount = accounts.find((a) => a.id === selectedAccountId) || accounts[0];

  // Projected new equity
  const projectedEquity = currentAccount ? currentAccount.currentEquity + pnl : 0;
  const projectedDrawdown = currentAccount
    ? calculateAccountDrawdown(currentAccount.dailyStartingEquity, projectedEquity, 0.05)
    : null;

  // Check if selected pair is affected by upcoming Forex Factory Red-Folder news
  const relevantCurrencies = asset.includes('/') ? asset.split('/') : [asset.substring(0, 3), asset.substring(3, 6)];
  const relevantRedNews = newsEvents.filter(
    (e) => e.impact === 'HIGH' && relevantCurrencies.some((c) => e.currency.toUpperCase() === c.toUpperCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAccount) return;

    const rMultiple = riskAmount > 0 ? Number((pnl / riskAmount).toFixed(2)) : 0;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const newTrade: TradeRecord = {
      id: `TRD-${Math.floor(100000 + Math.random() * 900000)}`,
      accountId: selectedAccountId,
      ticketId: `${Math.floor(9840000 + Math.random() * 9999)}`,
      asset,
      direction,
      lotSize,
      openPrice: asset.includes('JPY') ? 144.20 : asset.includes('XAU') ? 2650.00 : 1.1150,
      closePrice: asset.includes('JPY') ? 144.50 : asset.includes('XAU') ? 2655.00 : 1.1180,
      pnl,
      pnlPercentage: Number(((pnl / currentAccount.currentEquity) * 100).toFixed(2)),
      rMultiple,
      commission: -Math.abs(lotSize * 6),
      openTime: now,
      closeTime: now,
      status: pnl > 0 ? 'WIN' : pnl < 0 ? 'LOSS' : 'BREAKEVEN',
      executionType: 'READ_ONLY_SYNC',
    };

    onAddTrade(newTrade, selectedAccountId, pnl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-4 sm:p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            Simulate Trade &amp; Drawdown Stress Test
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Test how trade outcomes immediately impact account distance to the hard 5% daily drawdown ceiling.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Target Account */}
          <div>
            <label className="text-slate-300 font-semibold block mb-1">Target Funding Account</label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.id} ({a.propFirm} - {formatCurrency(a.currentEquity)})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Asset */}
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Asset Pair</label>
              <select
                value={asset}
                onChange={(e) => setAsset(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
              >
                <option value="EUR/USD">EUR/USD</option>
                <option value="GBP/USD">GBP/USD</option>
                <option value="AUD/USD">AUD/USD</option>
                <option value="USD/CAD">USD/CAD</option>
                <option value="USD/CHF">USD/CHF</option>
                <option value="USD/JPY">USD/JPY</option>
                <option value="XAU/USD">XAU/USD (Gold)</option>
                <option value="BRENT/USD">BRENT/USD (Oil)</option>
              </select>
            </div>

            {/* Direction */}
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Direction</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setDirection('BUY')}
                  className={`py-2 rounded-lg font-bold transition-colors ${
                    direction === 'BUY'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'bg-slate-950 text-slate-400 border border-slate-800'
                  }`}
                >
                  BUY
                </button>
                <button
                  type="button"
                  onClick={() => setDirection('SELL')}
                  className={`py-2 rounded-lg font-bold transition-colors ${
                    direction === 'SELL'
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'bg-slate-950 text-slate-400 border border-slate-800'
                  }`}
                >
                  SELL
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Lots</label>
              <input
                type="number"
                step="0.5"
                value={lotSize}
                onChange={(e) => setLotSize(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Simulated PnL ($)</label>
              <input
                type="number"
                step="50"
                value={pnl}
                onChange={(e) => setPnl(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Risk Budget ($)</label>
              <input
                type="number"
                step="50"
                value={riskAmount}
                onChange={(e) => setRiskAmount(parseFloat(e.target.value) || 1)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>
          </div>

          {/* Quick Scenario Buttons */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setPnl(1250)}
              className="px-2.5 py-1 text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded hover:bg-emerald-500/20"
            >
              + Win (+$1,250)
            </button>
            <button
              type="button"
              onClick={() => setPnl(-1200)}
              className="px-2.5 py-1 text-[11px] bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded hover:bg-rose-500/20"
            >
              - Normal Loss (-$1,200)
            </button>
            <button
              type="button"
              onClick={() => {
                if (currentAccount) {
                  // Push account near or below 5% limit
                  const limit = currentAccount.dailyStartingEquity * 0.95;
                  setPnl(Math.round(limit - currentAccount.currentEquity - 150));
                }
              }}
              className="px-2.5 py-1 text-[11px] bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded hover:bg-amber-500/20"
            >
              ⚠️ Test DD Breach
            </button>
          </div>

          {/* Forex Factory High-Impact Red News Sentinel Warning */}
          {relevantRedNews.length > 0 && (
            <div className="bg-rose-950/40 border border-rose-800/50 rounded-xl p-3 space-y-1.5 font-sans">
              <div className="flex items-center gap-2 text-rose-300 font-bold text-xs font-mono">
                <Folder className="w-4 h-4 fill-rose-500 text-rose-500 shrink-0" />
                <span>Forex Factory Red Folder Alert ({asset})</span>
              </div>
              <p className="text-[11px] text-rose-300/90 leading-relaxed">
                <strong>{relevantRedNews[0].flag} {relevantRedNews[0].currency} {relevantRedNews[0].title}</strong> is scheduled for <strong>{relevantRedNews[0].date} at {relevantRedNews[0].time}</strong>.
              </p>
              <div className="flex items-center gap-1.5 text-[10px] text-rose-400 font-mono">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span>Prop Firm Rule: Trading within 2 minutes before/after is restricted.</span>
              </div>
            </div>
          )}

          {/* Projected Impact Preview */}
          {currentAccount && projectedDrawdown && (
            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-2 font-mono">
              <div className="text-[11px] text-slate-400 uppercase font-sans font-semibold">
                Projected Impact on Hard 5% Limit:
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Current Equity:</span>
                <span className="text-slate-200">{formatCurrency(currentAccount.currentEquity)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Projected Equity:</span>
                <span className="font-bold text-white">{formatCurrency(projectedEquity)}</span>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-slate-800/80 pt-1.5">
                <span className="text-slate-400">Projected Distance:</span>
                <span
                  className={`font-bold ${
                    projectedDrawdown.distance <= 0
                      ? 'text-rose-500 animate-pulse'
                      : projectedDrawdown.distancePct < 2.0
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  +{formatCurrency(projectedDrawdown.distance)} ({projectedDrawdown.distancePct.toFixed(2)}%)
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow transition-colors"
            >
              Apply Simulation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
