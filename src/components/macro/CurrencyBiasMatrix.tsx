import React, { useState, useMemo } from 'react';
import {
  CurrencyBiasItem,
  DivergencePairItem,
  SovereignYieldItem,
  REERValuationItem,
} from '../../types';
import {
  Scale,
  TrendingUp,
  TrendingDown,
  Minus,
  Sliders,
  Award,
  ChevronRight,
  Info,
  Percent,
  Layers,
} from 'lucide-react';

interface CurrencyBiasMatrixProps {
  biases: CurrencyBiasItem[];
  divergencePairs: DivergencePairItem[];
  sovereignYields?: SovereignYieldItem[];
  reerValuations?: REERValuationItem[];
  onNavigateToYields?: () => void;
}

export const CurrencyBiasMatrix: React.FC<CurrencyBiasMatrixProps> = ({
  biases = [],
  divergencePairs = [],
  sovereignYields = [],
  reerValuations = [],
  onNavigateToYields,
}) => {
  const [filterStance, setFilterStance] = useState<'ALL' | 'BULLISH' | 'BEARISH' | 'NEUTRAL'>('ALL');
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyBiasItem | null>(null);

  const yieldMap = useMemo(() => {
    const map = new Map<string, SovereignYieldItem>();
    sovereignYields.forEach((y) => map.set(y.currency, y));
    return map;
  }, [sovereignYields]);

  const reerMap = useMemo(() => {
    const map = new Map<string, REERValuationItem>();
    reerValuations.forEach((r) => map.set(r.currency, r));
    return map;
  }, [reerValuations]);


  const filteredBiases = useMemo(() => {
    return (biases || []).filter((b) => {
      if (filterStance === 'BULLISH') return b.biasScore > 15;
      if (filterStance === 'BEARISH') return b.biasScore < -15;
      if (filterStance === 'NEUTRAL') return b.biasScore >= -15 && b.biasScore <= 15;
      return true;
    });
  }, [biases, filterStance]);

  const strongestCurrency = biases.length > 0 ? biases[0] : null;
  const weakestCurrency = biases.length > 0 ? biases[biases.length - 1] : null;

  const getScoreBadgeColor = (score: number) => {
    if (score >= 50) return 'text-emerald-700 bg-emerald-50 border-emerald-300';
    if (score > 15) return 'text-emerald-700 bg-emerald-50/80 border-emerald-200';
    if (score <= -50) return 'text-rose-700 bg-rose-50 border-rose-300';
    if (score < -15) return 'text-rose-700 bg-rose-50/80 border-rose-200';
    return 'text-slate-700 bg-slate-100 border-slate-300';
  };

  const getMeterColor = (score: number) => {
    if (score > 15) return 'bg-emerald-500';
    if (score < -15) return 'bg-rose-500';
    return 'bg-amber-500';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Institutional Macro Overview in Blue Theme */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800 rounded-2xl p-6 sm:p-7 text-white shadow-lg shadow-blue-900/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-blue-100 text-xs font-mono font-semibold">
              <Scale className="w-3.5 h-3.5 text-blue-200" />
              <span>Currency Bias &amp; Macro Scoring</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              Currency Bias &amp; Divergence Scanner
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
              Synthesizing 4 core macroeconomic pillars: Central Bank Interest Rates, CPI Inflation Differentials,
              Labor/Growth momentum, and CFTC Institutional Flow into normalized -100 to +100 directional biases.
            </p>
          </div>

          {/* Quick Divergence Highlight Box */}
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3.5 shrink-0 self-stretch sm:self-auto">
            <div className="text-center px-2">
              <div className="text-[10px] text-blue-200 font-mono uppercase font-semibold">#1 Strongest</div>
              <div className="text-sm font-bold text-emerald-300 font-mono mt-0.5">
                {strongestCurrency ? `${strongestCurrency.flag} ${strongestCurrency.currency} (${strongestCurrency.biasScore > 0 ? '+' : ''}${strongestCurrency.biasScore})` : '—'}
              </div>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div className="text-center px-2">
              <div className="text-[10px] text-blue-200 font-mono uppercase font-semibold">#8 Weakest</div>
              <div className="text-sm font-bold text-rose-300 font-mono mt-0.5">
                {weakestCurrency ? `${weakestCurrency.flag} ${weakestCurrency.currency} (${weakestCurrency.biasScore})` : '—'}
              </div>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div className="text-center px-2">
              <div className="text-[10px] text-blue-200 font-mono uppercase font-semibold">Max Spread</div>
              <div className="text-sm font-bold text-sky-200 font-mono mt-0.5">
                +{(strongestCurrency?.biasScore ?? 0) - (weakestCurrency?.biasScore ?? 0)} pts
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Yields & Valuation Quick Launcher Banner */}
      {onNavigateToYields && (
        <div className="bg-white border border-blue-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg shrink-0">
              <Percent className="w-4 h-4" />
            </span>
            <span className="text-xs text-slate-700">
              <strong className="text-slate-900 font-semibold">Institutional Sovereign Yields &amp; REER Valuation:</strong> Track 2-Year bond yield spreads, forward central bank OIS cut probabilities, and 10-year purchasing power parity.
            </span>
          </div>
          <button
            onClick={onNavigateToYields}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold font-mono transition-colors cursor-pointer shrink-0"
          >
            <span>Open Yields &amp; Valuation</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* SECTION 1: Strongest vs. Weakest Divergence Pair Recommendations */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-mono">
              High-Probability Divergence Pairs (Strongest vs. Weakest)
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono hidden sm:inline">
            Ranked by Macro Spread
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {divergencePairs.map((p) => {
            const isBuy = p.bias.includes('BUY');
            return (
              <div
                key={p.id}
                className="bg-white hover:bg-slate-50/80 border border-slate-200 hover:border-blue-300 rounded-xl p-4 transition-all duration-150 flex flex-col justify-between shadow-xs hover:shadow-md"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-slate-900 tracking-wide font-mono">
                        {p.pair}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border font-mono ${
                          isBuy
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                            : 'text-rose-700 bg-rose-50 border-rose-200'
                        }`}
                      >
                        {p.bias}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-mono block">Spread</span>
                      <span
                        className={`text-xs font-bold font-mono ${
                          p.divergenceScore > 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {p.divergenceScore > 0 ? `+${p.divergenceScore}` : p.divergenceScore}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-sans">
                    {p.strategicCatalyst}
                  </p>

                  {/* Enhanced Fundamental Differential Metrics */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Real Yield Spread</span>
                      <span className="text-slate-800 font-semibold">
                        {p.carryYieldPct > 0 ? `+${p.carryYieldPct.toFixed(2)}%` : `${p.carryYieldPct.toFixed(2)}%`}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">2Y Sovereign Spread</span>
                      {(() => {
                        const baseY = yieldMap.get(p.baseCurrency)?.yield2Y;
                        const quoteY = yieldMap.get(p.quoteCurrency)?.yield2Y;
                        if (baseY !== undefined && quoteY !== undefined) {
                          const diffBps = Math.round((baseY - quoteY) * 100);
                          return (
                            <span className={`font-bold ${diffBps >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                              {diffBps > 0 ? `+${diffBps}` : diffBps} bps
                            </span>
                          );
                        }
                        return <span className="text-slate-500 font-normal">N/A</span>;
                      })()}
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">COT Institutional</span>
                      <span className="text-emerald-700 font-semibold truncate block">
                        {p.cotAlignment}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Target Stop/Take</span>
                      <span className="text-slate-800 font-semibold">
                        <span className="text-amber-700">{p.suggestedStopLossPips}p</span> /{' '}
                        <span className="text-emerald-700">{p.suggestedTakeProfitPips}p</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: Currency Bias Master Table (8 Major Currencies) */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-600" />
              <span>G8 Currency Relative Strength Matrix</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select any currency to inspect the 4-factor macroeconomic attribution breakdown.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-mono">
            <button
              onClick={() => setFilterStance('ALL')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                filterStance === 'ALL' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All (8)
            </button>
            <button
              onClick={() => setFilterStance('BULLISH')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                filterStance === 'BULLISH' ? 'bg-emerald-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              Bullish
            </button>
            <button
              onClick={() => setFilterStance('BEARISH')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                filterStance === 'BEARISH' ? 'bg-rose-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-rose-700'
              }`}
            >
              Bearish
            </button>
            <button
              onClick={() => setFilterStance('NEUTRAL')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                filterStance === 'NEUTRAL' ? 'bg-amber-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-amber-700'
              }`}
            >
              Neutral
            </button>
          </div>
        </div>

        {/* Master Bias Grid */}
        <div className="divide-y divide-slate-100">
          {filteredBiases.map((b) => {
            const isBullish = b.biasScore > 15;
            const isBearish = b.biasScore < -15;

            return (
              <div
                key={b.currency}
                onClick={() => setSelectedCurrency(selectedCurrency?.currency === b.currency ? null : b)}
                className="p-4 hover:bg-slate-50/80 transition-colors cursor-pointer"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Rank, Flag, Currency & Stance */}
                  <div className="flex items-center gap-3.5 min-w-[220px]">
                    <span className="text-xs font-mono font-bold text-slate-400 w-4">
                      #{b.rank}
                    </span>
                    <span className="text-2xl">{b.flag}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-slate-900 font-mono">{b.currency}</span>
                        <span className="text-xs text-slate-500 font-sans">({b.country})</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono flex-wrap">
                        <span>CB: <strong className="text-slate-800">{b.centralBankStance}</strong></span>
                        {yieldMap.has(b.currency) && (
                          <>
                            <span aria-hidden="true" className="text-slate-300">·</span>
                            <span>2Y: <strong className="text-slate-800">{yieldMap.get(b.currency)!.yield2Y.toFixed(2)}%</strong></span>
                          </>
                        )}
                        {reerMap.has(b.currency) && (
                          <>
                            <span aria-hidden="true" className="text-slate-300">·</span>
                            <span className={reerMap.get(b.currency)!.valuationPct > 0 ? 'text-rose-600 font-semibold' : 'text-emerald-700 font-semibold'}>
                              REER: {reerMap.get(b.currency)!.valuationPct > 0 ? `+${reerMap.get(b.currency)!.valuationPct.toFixed(1)}%` : `${reerMap.get(b.currency)!.valuationPct.toFixed(1)}%`}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Center: Normalized Bias Gauge Meter */}
                  <div className="flex-1 max-w-md space-y-1">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-slate-500 flex items-center gap-1 font-sans">
                        {isBullish ? (
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                        ) : isBearish ? (
                          <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                        ) : (
                          <Minus className="w-3.5 h-3.5 text-amber-600" />
                        )}
                        <span className="font-semibold text-slate-700">{b.biasLabel}</span>
                      </span>
                      <span className="font-bold text-slate-900">
                        {b.biasScore > 0 ? `+${b.biasScore}` : b.biasScore} / 100
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                      <div
                        className={`h-full transition-all duration-300 ${getMeterColor(b.biasScore)}`}
                        style={{ width: `${Math.min(100, Math.max(5, (Math.abs(b.biasScore) / 100) * 100))}%` }}
                      />
                    </div>
                  </div>

                  {/* Right: Score Pill & View Factors CTA */}
                  <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
                    <span
                      className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md border ${getScoreBadgeColor(
                        b.biasScore
                      )}`}
                    >
                      {b.biasScore > 0 ? `+${b.biasScore}` : b.biasScore} pts
                    </span>

                    <button
                      type="button"
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                    >
                      {selectedCurrency?.currency === b.currency ? 'Hide Factors ▲' : 'View Factors ▼'}
                    </button>
                  </div>
                </div>

                {/* Collapsible Factor Breakdown Modal/Card */}
                {selectedCurrency?.currency === b.currency && (
                  <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 animate-in fade-in duration-150">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase font-mono block font-semibold">1. Interest Rate Differential</span>
                      <div className="text-xs font-bold text-slate-900 font-mono">
                        Weight: {b.ratesWeight > 0 ? `+${b.ratesWeight}` : b.ratesWeight} pts
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug">
                        Yield advantage vs G10 currency basket.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase font-mono block font-semibold">2. Inflation Trajectory (CPI)</span>
                      <div className="text-xs font-bold text-slate-900 font-mono">
                        Weight: {b.inflationWeight > 0 ? `+${b.inflationWeight}` : b.inflationWeight} pts
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug">
                        Sticky inflation supports prolonged rates.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase font-mono block font-semibold">3. Growth &amp; Labor Market</span>
                      <div className="text-xs font-bold text-slate-900 font-mono">
                        Weight: {b.growthJobsWeight > 0 ? `+${b.growthJobsWeight}` : b.growthJobsWeight} pts
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug">
                        Unemployment rates &amp; GDP resilience.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase font-mono block font-semibold">4. COT Institutional Positioning</span>
                      <div className="text-xs font-bold text-slate-900 font-mono">
                        Weight: {b.cotWeight > 0 ? `+${b.cotWeight}` : b.cotWeight} pts
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug">
                        CFTC non-commercial hedge fund net flow.
                      </p>
                    </div>

                    <div className="md:col-span-2 lg:col-span-4 mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 font-mono">
                      <span><strong>Key Upcoming Event:</strong> {b.nextKeyRelease}</span>
                      <span className="text-slate-700 italic">{b.primaryDriver}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
