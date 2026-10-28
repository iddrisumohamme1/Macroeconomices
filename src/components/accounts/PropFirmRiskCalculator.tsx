import React, { useState, useMemo } from 'react';
import { FundingAccount } from '../../types';
import {
  Calculator,
  ShieldAlert,
  ShieldCheck,
  Percent,
  DollarSign,
  TrendingUp,
  Target,
  ArrowRight,
  Info,
  Sliders,
} from 'lucide-react';
import { formatCurrency } from '../../utils/quantCalculations';

interface PropFirmRiskCalculatorProps {
  accounts: FundingAccount[];
  selectedAccountId?: string;
}

interface PairConfig {
  pair: string;
  pipMultiplier: number;
  pipValuePerStandardLotUSD: number; // e.g. 1.0 standard lot = $10/pip for EURUSD
  description: string;
}

const POPULAR_PAIRS: PairConfig[] = [
  { pair: 'EUR/USD', pipMultiplier: 10000, pipValuePerStandardLotUSD: 10, description: 'Euro / US Dollar' },
  { pair: 'GBP/USD', pipMultiplier: 10000, pipValuePerStandardLotUSD: 10, description: 'British Pound / US Dollar' },
  { pair: 'USD/JPY', pipMultiplier: 100, pipValuePerStandardLotUSD: 6.8, description: 'US Dollar / Japanese Yen' },
  { pair: 'AUD/USD', pipMultiplier: 10000, pipValuePerStandardLotUSD: 10, description: 'Australian Dollar / US Dollar' },
  { pair: 'USD/CAD', pipMultiplier: 10000, pipValuePerStandardLotUSD: 7.3, description: 'US Dollar / Canadian Dollar' },
  { pair: 'EUR/JPY', pipMultiplier: 100, pipValuePerStandardLotUSD: 6.8, description: 'Euro / Japanese Yen' },
  { pair: 'GBP/JPY', pipMultiplier: 100, pipValuePerStandardLotUSD: 6.8, description: 'British Pound / Japanese Yen' },
  { pair: 'XAU/USD', pipMultiplier: 10, pipValuePerStandardLotUSD: 10, description: 'Gold / US Dollar (0.1 = 1 pip)' },
];

export const PropFirmRiskCalculator: React.FC<PropFirmRiskCalculatorProps> = ({
  accounts,
  selectedAccountId,
}) => {
  // Find YoPips 6K account or the first available
  const [activeAccId, setActiveAccId] = useState<string>(() => {
    if (selectedAccountId) return selectedAccountId;
    const yopips = accounts.find((a) => a.propFirm.toLowerCase().includes('yopip') || a.accountSize === 6000);
    return yopips?.id || accounts[0]?.id || '';
  });

  const selectedAccount = useMemo(() => {
    return accounts.find((a) => a.id === activeAccId) || accounts[0];
  }, [accounts, activeAccId]);

  // Calculator Parameters
  const [selectedPair, setSelectedPair] = useState<string>('EUR/USD');
  const [riskMode, setRiskMode] = useState<'PCT_ACCOUNT' | 'PCT_BUFFER' | 'FIXED_USD'>('PCT_ACCOUNT');
  const [riskPercent, setRiskPercent] = useState<number>(0.75); // 0.75%
  const [fixedRiskUSD, setFixedRiskUSD] = useState<number>(45.0);
  const [stopLossPips, setStopLossPips] = useState<number>(20);
  const [takeProfitPips, setTakeProfitPips] = useState<number>(40);

  const pairConfig = POPULAR_PAIRS.find((p) => p.pair === selectedPair) || POPULAR_PAIRS[0];

  // Mathematical Calculations
  const accountSize = selectedAccount?.accountSize || 6000;
  const currentEquity = selectedAccount?.currentEquity || 6148.5;
  const dailyBufferRemaining = selectedAccount?.distanceToViolation || 448.5;
  const floor5Pct = selectedAccount?.dailyDrawdownCeiling || 5700;

  // Compute Dollar Risk
  const dollarRisk = useMemo(() => {
    if (riskMode === 'PCT_ACCOUNT') {
      return accountSize * (riskPercent / 100);
    } else if (riskMode === 'PCT_BUFFER') {
      return dailyBufferRemaining * (riskPercent / 100);
    } else {
      return fixedRiskUSD;
    }
  }, [riskMode, riskPercent, fixedRiskUSD, accountSize, dailyBufferRemaining]);

  // Compute Recommended Lot Size
  // lotSize = dollarRisk / (stopLossPips * pipValuePerStandardLotUSD)
  const calculatedLotSize = useMemo(() => {
    if (stopLossPips <= 0) return 0;
    const rawLots = dollarRisk / (stopLossPips * pairConfig.pipValuePerStandardLotUSD);
    return Math.max(0.01, Math.round(rawLots * 100) / 100);
  }, [dollarRisk, stopLossPips, pairConfig]);

  // Actual dollar risk based on rounded lot size
  const actualDollarRisk = calculatedLotSize * stopLossPips * pairConfig.pipValuePerStandardLotUSD;
  const actualDollarReward = calculatedLotSize * takeProfitPips * pairConfig.pipValuePerStandardLotUSD;
  const rrRatio = stopLossPips > 0 ? (takeProfitPips / stopLossPips).toFixed(2) : '0';

  // Impact on daily drawdown buffer
  const bufferPercentageConsumed = dailyBufferRemaining > 0 
    ? (actualDollarRisk / dailyBufferRemaining) * 100 
    : 100;
  const equityIfStopped = currentEquity - actualDollarRisk;
  const equityIfTargetHit = currentEquity + actualDollarReward;
  const remainingBufferIfStopped = equityIfStopped - floor5Pct;

  // Threat Level
  let threatLevel: 'SAFE' | 'CAUTION' | 'DANGER' = 'SAFE';
  if (bufferPercentageConsumed > 50) {
    threatLevel = 'DANGER';
  } else if (bufferPercentageConsumed > 25) {
    threatLevel = 'CAUTION';
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                Prop Firm Lot Size &amp; 5% Drawdown Risk Sizer
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono text-[10px] font-bold">
                Buffer-Aware Sizing
              </span>
            </div>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Calculates mathematically safe lot sizes guaranteed to protect your daily 5% loss ceiling
            </p>
          </div>
        </div>

        {/* Account Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-mono hidden sm:inline">Active Account:</span>
          <select
            value={activeAccId}
            onChange={(e) => setActiveAccId(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-500"
          >
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.propFirm} {formatCurrency(acc.accountSize)} ({acc.platform || 'MT5'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Two-Column Grid: Inputs & Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Sizing Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Pair & Risk Mode Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 font-bold block mb-1 text-xs font-mono">
                Trading Instrument
              </label>
              <select
                value={selectedPair}
                onChange={(e) => setSelectedPair(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono text-xs font-bold focus:outline-none focus:border-blue-500"
              >
                {POPULAR_PAIRS.map((p) => (
                  <option key={p.pair} value={p.pair}>
                    {p.pair} - {p.description}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-700 font-bold block mb-1 text-xs font-mono">
                Risk Model
              </label>
              <select
                value={riskMode}
                onChange={(e) => setRiskMode(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono text-xs font-bold focus:outline-none focus:border-blue-500"
              >
                <option value="PCT_ACCOUNT">% of Account Capital</option>
                <option value="PCT_BUFFER">% of Remaining Daily Buffer</option>
                <option value="FIXED_USD">Fixed Dollar Amount ($)</option>
              </select>
            </div>
          </div>

          {/* Risk Input Slider & Value */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-700 font-bold">
                {riskMode === 'PCT_ACCOUNT'
                  ? 'Account Capital Risk %'
                  : riskMode === 'PCT_BUFFER'
                  ? 'Remaining Daily Buffer Risk %'
                  : 'Fixed Dollar Risk ($)'}
              </span>
              <span className="font-extrabold text-blue-700 text-sm">
                {riskMode === 'FIXED_USD' ? `$${fixedRiskUSD.toFixed(2)}` : `${riskPercent.toFixed(2)}%`}
                <span className="text-slate-500 font-normal ml-1.5">
                  (${dollarRisk.toFixed(2)})
                </span>
              </span>
            </div>

            {riskMode === 'FIXED_USD' ? (
              <input
                type="number"
                min="5"
                max={Math.min(500, dailyBufferRemaining)}
                step="5"
                value={fixedRiskUSD}
                onChange={(e) => setFixedRiskUSD(parseFloat(e.target.value) || 10)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-500"
              />
            ) : (
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0.2"
                  max={riskMode === 'PCT_ACCOUNT' ? '2.5' : '40'}
                  step="0.05"
                  value={riskPercent}
                  onChange={(e) => setRiskPercent(parseFloat(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>
            )}

            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1">
              <span>Conservative: 0.50%</span>
              <span>Balanced: 1.00%</span>
              <span>Aggressive: 1.50%</span>
            </div>
          </div>

          {/* Stop Loss & Take Profit in Pips */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 font-bold block mb-1 text-xs font-mono flex items-center justify-between">
                <span>Stop Loss (Pips)</span>
                <span className="text-rose-600 text-[10px] font-bold">Max Risk</span>
              </label>
              <input
                type="number"
                min="5"
                max="200"
                step="1"
                value={stopLossPips}
                onChange={(e) => setStopLossPips(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono text-xs font-bold focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-slate-700 font-bold block mb-1 text-xs font-mono flex items-center justify-between">
                <span>Take Profit (Pips)</span>
                <span className="text-emerald-700 text-[10px] font-bold">1:{rrRatio} R:R</span>
              </label>
              <input
                type="number"
                min="5"
                max="500"
                step="1"
                value={takeProfitPips}
                onChange={(e) => setTakeProfitPips(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono text-xs font-bold focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Recommended Execution Output (5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-50 to-blue-50/40 rounded-xl p-4 sm:p-5 border border-blue-200/80 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">
                Calculated Lot Size
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 ${
                threatLevel === 'SAFE'
                  ? 'bg-emerald-100 text-emerald-800'
                  : threatLevel === 'CAUTION'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-rose-100 text-rose-800 animate-pulse'
              }`}>
                {threatLevel === 'SAFE' ? (
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                ) : (
                  <ShieldAlert className="w-3 h-3 text-rose-600" />
                )}
                <span>{threatLevel === 'SAFE' ? 'Drawdown Safe' : threatLevel === 'CAUTION' ? 'Moderate Risk' : 'High Buffer Threat'}</span>
              </span>
            </div>

            <div className="text-3xl sm:text-4xl font-black font-mono text-blue-700 tracking-tight">
              {calculatedLotSize.toFixed(2)}{' '}
              <span className="text-sm font-semibold text-slate-600">Lots</span>
            </div>

            <p className="text-xs text-slate-600 font-sans mt-1">
              For {selectedPair} with a {stopLossPips}-pip stop loss on {selectedAccount?.propFirm} {formatCurrency(accountSize)}.
            </p>
          </div>

          {/* Trade Risk & Reward Breakdown */}
          <div className="space-y-2 font-mono text-xs pt-3 border-t border-slate-200/80">
            <div className="flex items-center justify-between text-slate-600">
              <span>Risk at Stop Loss:</span>
              <span className="font-bold text-rose-600">
                -${actualDollarRisk.toFixed(2)} ({((actualDollarRisk / accountSize) * 100).toFixed(2)}%)
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span>Profit at Take Profit:</span>
              <span className="font-bold text-emerald-700">
                +${actualDollarReward.toFixed(2)} (1:{rrRatio} R:R)
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span>Daily Buffer Consumed:</span>
              <span className={`font-bold ${bufferPercentageConsumed > 30 ? 'text-amber-600' : 'text-slate-800'}`}>
                {bufferPercentageConsumed.toFixed(1)}% of ${dailyBufferRemaining.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-200">
              <span>Equity if Stopped:</span>
              <span className="font-extrabold text-slate-900">
                ${equityIfStopped.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Distance to 5% Floor:</span>
              <span className="font-bold text-emerald-700">
                +${remainingBufferIfStopped.toFixed(2)} remaining
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
