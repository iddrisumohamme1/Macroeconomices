import React from 'react';
import { COTPositionItem } from '../../types';
import { BarChart2, Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface COTPositioningViewProps {
  cotPositions: COTPositionItem[];
}

export const COTPositioningView: React.FC<COTPositioningViewProps> = ({ cotPositions = [] }) => {
  const safePositions = cotPositions || [];
  const getZScoreColor = (z: number) => {
    if (z >= 2.0) return 'text-rose-700 bg-rose-50 border-rose-300 font-extrabold';
    if (z >= 1.0) return 'text-emerald-700 bg-emerald-50 border-emerald-300 font-bold';
    if (z <= -2.0) return 'text-rose-700 bg-rose-50 border-rose-300 font-extrabold';
    if (z <= -1.0) return 'text-rose-700 bg-rose-50 border-rose-200 font-bold';
    return 'text-slate-700 bg-slate-100 border-slate-300';
  };

  const getBiasPill = (bias: COTPositionItem['institutionalBias']) => {
    switch (bias) {
      case 'Crowded Long':
        return (
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-rose-600" />
            <span>Crowded Long (Overbought)</span>
          </span>
        );
      case 'Bullish Accumulation':
        return (
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-600" />
            <span>Bullish Accumulation</span>
          </span>
        );
      case 'Neutral':
        return (
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
            <Minus className="w-3 h-3 text-slate-500" />
            <span>Neutral / Balanced</span>
          </span>
        );
      case 'Bearish Distribution':
        return (
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
            <TrendingDown className="w-3 h-3 text-rose-600" />
            <span>Bearish Distribution</span>
          </span>
        );
      case 'Crowded Short':
        return (
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
            <TrendingDown className="w-3 h-3 text-rose-700" />
            <span>Crowded Short (Squeeze Alert)</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Blue & Light */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800 rounded-2xl p-6 sm:p-7 text-white shadow-lg shadow-blue-900/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-blue-100 text-xs font-mono font-semibold">
              <BarChart2 className="w-3.5 h-3.5 text-blue-200" />
              <span>CFTC Commitments of Traders (COT) Institutional Flow</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              Institutional Positioning &amp; 10-Year Z-Scores
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
              Tracking Non-Commercial (Hedge Funds &amp; Large Speculators) net futures positioning against Commercial Hedgers.
              Identifies trade crowding, structural liquidity imbalances, and potential short-squeeze reversals.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3.5 shrink-0 text-xs font-mono text-blue-100">
            <Calendar className="w-4 h-4 text-blue-200" />
            <span>Updated: Every Friday 19:30 UTC</span>
          </div>
        </div>
      </div>

      {/* Grid of COT Currency Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {safePositions.map((c) => {
          const totalContracts = (c.nonCommercialLong || 0) + (c.nonCommercialShort || 0);
          const longPct = totalContracts > 0 ? (c.nonCommercialLong / totalContracts) * 100 : 50;

          return (
            <div
              key={c.currency}
              className="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all space-y-3.5"
            >
              {/* Card Header: Currency & Stance */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{c.flag}</span>
                  <div>
                    <span className="text-base font-extrabold text-slate-900 font-mono block">
                      {c.currency}
                    </span>
                    <span className="text-xs text-slate-500 font-sans">{c.symbol}</span>
                  </div>
                </div>

                <div
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${getZScoreColor(
                    c.zScore10Yr
                  )}`}
                  title="10-Year Statistical Z-Score"
                >
                  Z: {c.zScore10Yr > 0 ? `+${c.zScore10Yr}` : c.zScore10Yr}
                </div>
              </div>

              {/* Bias Chip */}
              <div>{getBiasPill(c.institutionalBias)}</div>

              {/* Net Position Metric */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Net Positioning:</span>
                  <span
                    className={`font-bold ${
                      c.nonCommercialNet > 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {c.nonCommercialNet > 0 ? `+${c.nonCommercialNet.toLocaleString()}` : c.nonCommercialNet.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-400">
                  <span>Weekly Change:</span>
                  <span
                    className={`font-semibold ${
                      c.netChange1W >= 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {c.netChange1W >= 0
                      ? `+${c.netChange1W.toLocaleString()}`
                      : c.netChange1W.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Long vs Short Proportion Bar */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                  <span>Longs: {c.nonCommercialLong.toLocaleString()}</span>
                  <span>Shorts: {c.nonCommercialShort.toLocaleString()}</span>
                </div>

                <div className="w-full bg-rose-200 h-2 rounded-full overflow-hidden flex">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-300"
                    style={{ width: `${longPct}%` }}
                    title={`Longs: ${longPct.toFixed(1)}%`}
                  />
                </div>
              </div>

              {/* Percentile Rationale */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 font-mono">
                <span>10-Yr Percentile:</span>
                <span className="font-bold text-slate-800">{c.percentile10Yr}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
