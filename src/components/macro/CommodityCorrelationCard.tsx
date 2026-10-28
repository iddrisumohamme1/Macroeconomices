import React from 'react';
import { CommodityCorrelation } from '../../types';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface CommodityCorrelationProps {
  commodity?: CommodityCorrelation;
  commodities?: CommodityCorrelation[];
}

export const CommodityCorrelationCard: React.FC<CommodityCorrelationProps> = ({
  commodity,
  commodities,
}) => {
  const items = commodity ? [commodity] : commodities || [];

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.commodity}
          className="bg-slate-50 border border-slate-200 rounded-xl p-4 transition-all hover:border-blue-300"
        >
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                {item.commodity}
              </span>
              <div className="text-sm font-bold text-slate-900 font-mono">
                {item.benchmark}
              </div>
            </div>
            <div className="text-right">
              <div className="text-base font-extrabold text-slate-900 font-mono tabular-nums">
                ${item.currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div
                className={`text-xs font-bold flex items-center justify-end gap-0.5 font-mono ${
                  item.change24h >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {item.change24h >= 0 ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {item.change24h >= 0 ? '+' : ''}
                {item.change24h}% 24h
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {item.correlations.map((corr) => {
              const isPositive = corr.correlationCoefficient > 0;
              const absCoef = Math.abs(corr.correlationCoefficient);
              const barWidth = `${absCoef * 100}%`;

              return (
                <div key={corr.pair} className="text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-800">{corr.pair}</span>
                      <span className="text-slate-500 font-mono">({corr.currency})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-mono font-bold tabular-nums ${
                          corr.correlationCoefficient >= 0.5
                            ? 'text-emerald-700'
                            : corr.correlationCoefficient <= -0.5
                            ? 'text-amber-700'
                            : 'text-slate-600'
                        }`}
                      >
                        {corr.correlationCoefficient >= 0 ? '+' : ''}
                        {corr.correlationCoefficient.toFixed(2)} r
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                        hist: {corr.historicalAverage.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Correlation visual bar */}
                  <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden flex">
                    {isPositive ? (
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: barWidth }}
                      />
                    ) : (
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-500"
                        style={{ width: barWidth }}
                      />
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed pt-0.5">
                    {corr.economicRationale}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
