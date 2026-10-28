import React from 'react';
import { SentimentGaugeData } from '../../types';
import { Activity, TrendingUp, TrendingDown, Gauge } from 'lucide-react';

interface RiskRegimeGaugeProps {
  data: SentimentGaugeData;
  onAdjustScore?: (delta: number) => void;
}

export const RiskRegimeGauge: React.FC<RiskRegimeGaugeProps> = ({ data, onAdjustScore }) => {
  const needlePct = Math.min(100, Math.max(0, ((data.score + 100) / 200) * 100));

  const getRegimeBadge = (regime: string) => {
    switch (regime) {
      case 'Aggressive Risk-On':
        return 'text-emerald-800 border-emerald-300 bg-emerald-50 font-bold';
      case 'Moderate Risk-On':
        return 'text-teal-800 border-teal-300 bg-teal-50 font-bold';
      case 'Neutral / Transition':
        return 'text-amber-800 border-amber-300 bg-amber-50 font-bold';
      case 'Moderate Risk-Off':
        return 'text-orange-800 border-orange-300 bg-orange-50 font-bold';
      case 'Severe Risk-Off':
        return 'text-rose-800 border-rose-300 bg-rose-50 font-bold';
      default:
        return 'text-slate-800 border-slate-300 bg-slate-100 font-bold';
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Gauge className="w-4 h-4 text-blue-600" />
            <span>Equity &amp; Safe-Haven Sentiment Regime Gauge</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Classifies global risk-on/risk-off regimes by synthesizing GERM40 structural momentum and USD/CHF safe-haven capital flows.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-md text-xs border ${getRegimeBadge(data.regime)}`}>
            {data.regime}
          </span>
          {onAdjustScore && (
            <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-lg p-0.5">
              <button
                onClick={() => onAdjustScore(-15)}
                className="px-2 py-0.5 text-[10px] text-slate-600 hover:text-rose-700 hover:bg-white rounded font-mono font-semibold cursor-pointer"
                title="Simulate Risk-Off Shift"
              >
                - Risk-Off
              </button>
              <button
                onClick={() => onAdjustScore(15)}
                className="px-2 py-0.5 text-[10px] text-slate-600 hover:text-emerald-700 hover:bg-white rounded font-mono font-semibold cursor-pointer"
                title="Simulate Risk-On Shift"
              >
                + Risk-On
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Meter Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
        <div className="flex justify-between items-center text-xs font-mono">
          <span className="text-rose-700 font-bold">Severe Risk-Off (-100)</span>
          <span className="text-slate-900 font-extrabold text-sm">
            {data.score > 0 ? `+${data.score}` : data.score} Score
          </span>
          <span className="text-emerald-700 font-bold">Aggressive Risk-On (+100)</span>
        </div>

        <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden relative border border-slate-300">
          <div
            className="absolute top-0 bottom-0 w-3 bg-blue-700 rounded-full shadow-md -ml-1.5 transition-all duration-300"
            style={{ left: `${needlePct}%` }}
          />
        </div>

        <p className="text-xs text-slate-600 leading-relaxed font-sans pt-1">
          {data.narrative}
        </p>
      </div>

      {/* Secondary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-500 font-semibold">GERM40 Benchmark:</span>
            <span className="font-bold text-slate-900">${data.germ40.price.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-500">24h Change:</span>
            <span
              className={`font-bold ${
                data.germ40.change24h >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {data.germ40.change24h >= 0 ? '+' : ''}
              {data.germ40.change24h}%
            </span>
          </div>
          <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200 font-sans">
            Status: <strong className="text-slate-800">{data.germ40.structuralStatus}</strong>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-500 font-semibold">USD/CHF Safe-Haven:</span>
            <span className="font-bold text-slate-900">{data.usdchf.price.toFixed(4)}</span>
          </div>
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-500">24h Change:</span>
            <span
              className={`font-bold ${
                data.usdchf.change24h >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {data.usdchf.change24h >= 0 ? '+' : ''}
              {data.usdchf.change24h}%
            </span>
          </div>
          <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200 font-sans">
            Status: <strong className="text-slate-800">{data.usdchf.structuralStatus}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
