import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Percent,
  Landmark,
  Scale,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Layers,
  ArrowRight,
  Filter,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  SovereignYieldItem,
  YieldSpreadPair,
  OISMeetingProbability,
  CurrentAccountItem,
  REERValuationItem,
} from '../../types';

interface YieldsAndValuationViewProps {
  sovereignYields: SovereignYieldItem[];
  yieldSpreadPairs: YieldSpreadPair[];
  oisProbabilities: OISMeetingProbability[];
  currentAccountData: CurrentAccountItem[];
  reerValuations: REERValuationItem[];
  onSelectPair?: (pair: string) => void;
}

type SubTab = 'yield_spreads' | 'ois_swaps' | 'current_account' | 'reer_valuation';

export const YieldsAndValuationView: React.FC<YieldsAndValuationViewProps> = ({
  sovereignYields,
  yieldSpreadPairs,
  oisProbabilities,
  currentAccountData,
  reerValuations,
  onSelectPair,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('yield_spreads');
  const [selectedCurrencyFilter, setSelectedCurrencyFilter] = useState<string>('ALL');

  // Filtered yields
  const filteredYields = useMemo(() => {
    if (selectedCurrencyFilter === 'ALL') return sovereignYields;
    return sovereignYields.filter((y) => y.currency === selectedCurrencyFilter);
  }, [sovereignYields, selectedCurrencyFilter]);

  // Top Yield Spread Divergences
  const topSpreadPairs = useMemo(() => {
    return [...yieldSpreadPairs].sort((a, b) => Math.abs(b.spread2YBps) - Math.abs(a.spread2YBps));
  }, [yieldSpreadPairs]);

  return (
    <div className="space-y-6">
      {/* Header Banner & Executive Overview */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Institutional Yield Spreads & Macro Valuation
                </h2>
                <p className="text-xs text-slate-500 font-sans mt-0.5">
                  Tier-1 fundamental drivers: 2-Year Sovereign Yield Differentials, Central Bank OIS Forward Swaps, External Balances, and 10-Year REER Equilibrium.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono">
              <span className="text-slate-500 text-[11px] block">Max 2Y Spread:</span>
              <span className="font-bold text-slate-900">USD/CHF (+386 bps)</span>
            </div>
            <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono">
              <span className="text-slate-500 text-[11px] block">Top REER Discount:</span>
              <span className="font-bold text-emerald-700">JPY (-31.8%)</span>
            </div>
            <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono">
              <span className="text-slate-500 text-[11px] block">Top Current Account:</span>
              <span className="font-bold text-slate-900">CHF (+7.9% GDP)</span>
            </div>
          </div>
        </div>

        {/* Sub-Tabs Navigation */}
        <div className="mt-5 pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            {[
              { id: 'yield_spreads', label: '2Y Sovereign Spreads', icon: Percent, badge: 'Driver #1' },
              { id: 'ois_swaps', label: 'OIS Rate Probabilities', icon: Landmark, badge: 'Next 3 Mtgs' },
              { id: 'current_account', label: 'Current Account & Trade', icon: Scale, badge: 'Flows' },
              { id: 'reer_valuation', label: 'REER & PPP Valuation', icon: Layers, badge: '10Y Median' },
            ].map((tab) => {
              const isActive = activeSubTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id as SubTab)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                      isActive ? 'bg-blue-700 text-blue-100' : 'bg-slate-200/70 text-slate-600'
                    }`}
                  >
                    {tab.badge}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Currency Filter */}
          <div className="flex items-center gap-1 shrink-0 text-xs">
            <span className="text-slate-500 font-mono text-[11px] hidden md:inline flex items-center gap-1">
              <Filter className="w-3 h-3" /> Filter:
            </span>
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {['ALL', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD'].map((curr) => (
                <button
                  key={curr}
                  onClick={() => setSelectedCurrencyFilter(curr)}
                  className={`px-2 py-1 rounded text-[11px] font-mono font-semibold transition-colors cursor-pointer ${
                    selectedCurrencyFilter === curr
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {curr}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SUB-TAB 1: 2Y SOVEREIGN BOND YIELD SPREADS */}
      {activeSubTab === 'yield_spreads' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Institutional Yield Primer Alert */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 flex items-start gap-3 text-xs text-blue-900">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-blue-950 block">Why 2-Year Sovereign Yield Spreads Drive Currency Trends</span>
              <p className="text-blue-800 leading-relaxed font-sans">
                While central bank policy rates change only every 6–8 weeks, 2-year government bond yields trade second-by-second in the interbank market. The 2-year spread reflects market expectations of monetary policy over a 24-month horizon. In modern floating exchange rate regimes, widening 2-year yield spreads create continuous capital inflows into the higher-yielding currency.
              </p>
            </div>
          </div>

          {/* Yields Table & Curve Slopes */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sovereign 2Y & 10Y Benchmark Table (2 cols) */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">G8 Sovereign Benchmark Yields</h3>
                  <p className="text-[11px] text-slate-500 font-sans">2-Year policy sensitivity vs 10-Year term premium</p>
                </div>
                <span className="text-[10px] font-mono text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded">
                  Updated Live Interbank
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[11px]">
                      <th className="py-2.5 px-3.5 font-medium">Economy</th>
                      <th className="py-2.5 px-3 font-medium">2Y Benchmark</th>
                      <th className="py-2.5 px-3 font-medium text-right">2Y Yield</th>
                      <th className="py-2.5 px-3 font-medium text-right">Daily Δ</th>
                      <th className="py-2.5 px-3 font-medium text-right">10Y Yield</th>
                      <th className="py-2.5 px-3 font-medium text-right">10Y-2Y Curve Slope</th>
                      <th className="py-2.5 px-3.5 font-medium text-center">Curve Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {filteredYields.map((item) => (
                      <tr key={item.currency} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3.5 font-sans font-bold text-slate-900 flex items-center gap-2">
                          <span className="text-base">{item.flag}</span>
                          <div>
                            <span className="font-mono text-xs">{item.currency}</span>
                            <span className="block text-[10px] text-slate-500 font-sans font-normal truncate max-w-[100px]">
                              {item.country}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-600 text-[11px] font-sans truncate max-w-[130px]">
                          {item.bondName2Y}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-900 tabular-nums text-xs">
                          {item.yield2Y.toFixed(2)}%
                        </td>
                        <td className="py-3 px-3 text-right tabular-nums text-[11px]">
                          <span
                            className={
                              item.dailyChangeBps > 0
                                ? 'text-emerald-700 font-semibold'
                                : item.dailyChangeBps < 0
                                ? 'text-rose-700 font-semibold'
                                : 'text-slate-500'
                            }
                          >
                            {item.dailyChangeBps > 0 ? `+${item.dailyChangeBps}` : item.dailyChangeBps} bps
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-medium text-slate-700 tabular-nums text-xs">
                          {item.yield10Y.toFixed(2)}%
                        </td>
                        <td className="py-3 px-3 text-right tabular-nums font-bold">
                          <span className={item.curveSlopeBps >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                            {item.curveSlopeBps >= 0 ? `+${item.curveSlopeBps}` : item.curveSlopeBps} bps
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          <span
                            className={`text-[10px] font-medium px-2 py-0.5 rounded border ${
                              item.curveStatus === 'Normal Upward'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : item.curveStatus === 'Inverted'
                                ? 'bg-rose-50 text-rose-800 border-rose-200 font-bold'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {item.curveStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top FX Sovereign Yield Spreads (1 col) */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900">Key 2Y Cross Spreads</h3>
                  <span className="text-[10px] font-mono text-slate-500">Base minus Quote</span>
                </div>

                <div className="mt-3 space-y-2.5">
                  {topSpreadPairs.slice(0, 6).map((pair) => (
                    <div
                      key={pair.id}
                      onClick={() => onSelectPair && onSelectPair(pair.pair)}
                      className="p-2.5 rounded-lg border border-slate-100 hover:border-blue-300 hover:bg-blue-50/30 transition-all cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                          <span>{pair.pair}</span>
                          <span
                            className={`text-[9px] font-mono px-1 py-0.2 rounded border font-semibold ${
                              pair.fxImplication === 'BULLISH_BASE'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : pair.fxImplication === 'BEARISH_BASE'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {pair.fxImplication === 'BULLISH_BASE' ? 'Yield Support' : 'Yield Drag'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                          Trend: {pair.trendDirection} ({pair.dailySpreadChangeBps > 0 ? `+${pair.dailySpreadChangeBps}` : pair.dailySpreadChangeBps} bps/day)
                        </span>
                      </div>

                      <div className="text-right">
                        <span
                          className={`font-mono font-bold text-xs tabular-nums block ${
                            pair.spread2YBps > 0 ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {pair.spread2YBps > 0 ? `+${pair.spread2YBps}` : pair.spread2YBps} bps
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          ({pair.spread2YPct > 0 ? `+${pair.spread2YPct.toFixed(2)}%` : `${pair.spread2YPct.toFixed(2)}%`})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Rule: Wide positive spreads favor carry longs</span>
                <span className="text-blue-600 font-semibold cursor-pointer">View Bias Matrix →</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: CENTRAL BANK OIS RATE PROBABILITIES */}
      {activeSubTab === 'ois_swaps' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 flex items-start gap-3 text-xs text-emerald-950">
            <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-emerald-950 block">Overnight Index Swaps (OIS) Market Pricing</span>
              <p className="text-emerald-800 leading-relaxed font-sans">
                OIS swap contracts reveal the exact monetary policy adjustments institutional money has priced in for upcoming central bank meetings. When a central bank delivers a surprise relative to OIS expectations (e.g. cutting when the market only priced a 20% probability), violent currency repricing follows.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {oisProbabilities.map((ois) => (
              <div
                key={ois.currency}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar with Central Bank Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{ois.flag}</span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 text-sm font-mono">{ois.currency}</span>
                          <span className="text-xs text-slate-500 font-sans">({ois.country})</span>
                        </div>
                        <span className="text-[11px] text-slate-600 font-sans block">{ois.bankName}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 font-mono block">Current Rate</span>
                      <span className="font-mono font-bold text-sm text-slate-900 tabular-nums">
                        {ois.currentPolicyRate.toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  {/* Summary Stance Tag */}
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-slate-500 text-[11px] font-sans">Total 2025 Easing Priced:</span>
                    <span
                      className={`font-mono font-bold ${
                        ois.totalEasedByYearEndBps < 0
                          ? 'text-rose-700'
                          : ois.totalEasedByYearEndBps > 0
                          ? 'text-emerald-700'
                          : 'text-slate-700'
                      }`}
                    >
                      {ois.totalEasedByYearEndBps > 0
                        ? `+${ois.totalEasedByYearEndBps} bps (Hikes)`
                        : `${ois.totalEasedByYearEndBps} bps (Cuts)`}
                    </span>
                  </div>

                  {/* Next 3 Meetings Breakdown */}
                  <div className="mt-3 space-y-2">
                    {ois.meetings.map((m, idx) => (
                      <div key={idx} className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                            <span>{m.meetingDate}</span>
                            <span className="text-[10px] text-slate-500 font-mono">({m.daysUntil}d)</span>
                          </div>
                          <span className="font-mono text-slate-700 font-medium">
                            Expectation: {m.expectedBpsChange > 0 ? `+${m.expectedBpsChange}` : m.expectedBpsChange} bps
                          </span>
                        </div>

                        {/* Visual Probability Distribution Bar */}
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-600 mb-1">
                            <span>Cut: {m.cutProbabilityPct}%</span>
                            <span>Pause: {m.pauseProbabilityPct}%</span>
                            {m.hikeProbabilityPct > 0 && <span>Hike: {m.hikeProbabilityPct}%</span>}
                          </div>

                          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden flex">
                            {m.cutProbabilityPct > 0 && (
                              <div
                                style={{ width: `${m.cutProbabilityPct}%` }}
                                className="bg-rose-500 h-full"
                                title={`Cut Probability: ${m.cutProbabilityPct}%`}
                              />
                            )}
                            {m.pauseProbabilityPct > 0 && (
                              <div
                                style={{ width: `${m.pauseProbabilityPct}%` }}
                                className="bg-amber-400 h-full"
                                title={`Pause Probability: ${m.pauseProbabilityPct}%`}
                              />
                            )}
                            {m.hikeProbabilityPct > 0 && (
                              <div
                                style={{ width: `${m.hikeProbabilityPct}%` }}
                                className="bg-emerald-500 h-full"
                                title={`Hike Probability: ${m.hikeProbabilityPct}%`}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-3 pt-2 text-[10px] text-slate-500 flex items-center justify-between border-t border-slate-100">
                  <span>Stance: <strong className="text-slate-800">{ois.marketStance}</strong></span>
                  <span className="font-mono">Terminal: {ois.meetings[ois.meetings.length - 1]?.terminalRatePriced?.toFixed(2)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: CURRENT ACCOUNT & TRADE BALANCES */}
      {activeSubTab === 'current_account' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-950">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-amber-950 block">Current Account & Structural Balance of Payments</span>
              <p className="text-amber-800 leading-relaxed font-sans">
                A nation's current account measures its net trade in goods and services plus net foreign investment earnings. Economies running wide structural current account surpluses (Switzerland, Japan, Eurozone) export more capital than they import, giving their currencies natural safe-haven resilience. Economies with structural deficits (US, UK, New Zealand) are reliant on continuous foreign capital inflows.
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">G8 External Balance Rankings (% of GDP)</h3>
                <p className="text-[11px] text-slate-500 font-sans">Ranked from highest structural surplus to highest deficit drag</p>
              </div>
              <span className="text-[10px] font-mono text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded">
                IMF / National Statistics
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[11px]">
                    <th className="py-2.5 px-3.5 font-medium">Rank & Currency</th>
                    <th className="py-2.5 px-3 font-medium text-right">Current Account (% GDP)</th>
                    <th className="py-2.5 px-3 font-medium text-right">Trade Balance (USD)</th>
                    <th className="py-2.5 px-3 font-medium text-right">Annual GDP Growth</th>
                    <th className="py-2.5 px-3.5 font-medium">Capital Flow Category</th>
                    <th className="py-2.5 px-3.5 font-medium">Macro Structural Rationale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {currentAccountData
                    .sort((a, b) => b.currentAccountPctGdp - a.currentAccountPctGdp)
                    .map((item, index) => (
                      <tr key={item.currency} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3.5 font-sans font-bold text-slate-900 flex items-center gap-2">
                          <span className="text-slate-400 font-mono text-xs w-4">#{index + 1}</span>
                          <span className="text-base">{item.flag}</span>
                          <div>
                            <span className="font-mono text-xs">{item.currency}</span>
                            <span className="block text-[10px] text-slate-500 font-sans font-normal truncate max-w-[90px]">
                              {item.country}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-xs tabular-nums">
                          <span
                            className={
                              item.currentAccountPctGdp > 0
                                ? 'text-emerald-700'
                                : item.currentAccountPctGdp < -3
                                ? 'text-rose-700'
                                : 'text-slate-700'
                            }
                          >
                            {item.currentAccountPctGdp > 0
                              ? `+${item.currentAccountPctGdp.toFixed(1)}%`
                              : `${item.currentAccountPctGdp.toFixed(1)}%`}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right tabular-nums text-slate-800 text-xs">
                          {item.tradeBalanceUsdBillions > 0
                            ? `+$${item.tradeBalanceUsdBillions.toFixed(1)}B`
                            : `-$${Math.abs(item.tradeBalanceUsdBillions).toFixed(1)}B`}
                        </td>
                        <td className="py-3 px-3 text-right tabular-nums text-slate-700 text-xs">
                          +{item.gdpAnnualGrowthPct.toFixed(1)}%
                        </td>
                        <td className="py-3 px-3.5">
                          <span
                            className={`text-[10px] font-sans font-semibold px-2 py-0.5 rounded border inline-block ${
                              item.flowRating === 'Structural Surplus Support'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : item.flowRating === 'Moderate Surplus'
                                ? 'bg-blue-50 text-blue-800 border-blue-200'
                                : item.flowRating === 'Twin Deficit Drag'
                                ? 'bg-rose-50 text-rose-800 border-rose-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {item.flowRating}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 font-sans text-slate-600 text-[11px] leading-relaxed max-w-[280px]">
                          {item.macroRationale}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: REAL EFFECTIVE EXCHANGE RATE (REER) & PPP VALUATION */}
      {activeSubTab === 'reer_valuation' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-4 flex items-start gap-3 text-xs text-purple-950">
            <Info className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-purple-950 block">Real Effective Exchange Rate (REER) Mean Reversion</span>
              <p className="text-purple-800 leading-relaxed font-sans">
                The REER calculates a currency's trade-weighted value against primary trading partners, adjusted for relative consumer price inflation. Over long multi-year horizons (3–5 years), currencies strongly oscillate around their purchasing power parity median. Currencies trading at extreme historical dislocations (+15% or -30%) represent cyclical long-term reversal setups.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {reerValuations
              .sort((a, b) => b.valuationPct - a.valuationPct)
              .map((item) => (
                <div
                  key={item.currency}
                  className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{item.flag}</span>
                        <div>
                          <span className="font-mono font-bold text-slate-900 text-sm">{item.currency}</span>
                          <span className="text-[10px] text-slate-500 font-sans block">{item.country}</span>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                          item.valuationPct > 10
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : item.valuationPct < -10
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    {/* Valuation Meter */}
                    <div className="mt-4 text-center">
                      <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">
                        Valuation vs 10Y Median
                      </span>
                      <span
                        className={`text-2xl font-mono font-black tabular-nums block mt-0.5 ${
                          item.valuationPct > 0 ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {item.valuationPct > 0 ? `+${item.valuationPct.toFixed(1)}%` : `${item.valuationPct.toFixed(1)}%`}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {item.valuationPct > 0 ? 'Historically Overvalued' : 'Historically Undervalued'}
                      </span>
                    </div>

                    {/* REER Index vs 10Y Median Bar */}
                    <div className="mt-4 bg-slate-50 border border-slate-100 rounded-lg p-2.5 space-y-1.5 text-xs font-mono">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Current REER:</span>
                        <span className="font-bold text-slate-900">{item.reerIndex.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">10-Year Median:</span>
                        <span className="text-slate-700">{item.tenYearMedian.toFixed(1)}</span>
                      </div>
                    </div>

                    <p className="mt-3 text-[11px] text-slate-600 font-sans leading-snug line-clamp-2">
                      {item.primaryDriver}
                    </p>
                  </div>

                  <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                    <span className="text-slate-500 font-mono">Mean Reversion:</span>
                    <span
                      className={`font-mono font-bold ${
                        item.meanReversionSignal.includes('Short')
                          ? 'text-rose-700'
                          : item.meanReversionSignal.includes('Long')
                          ? 'text-emerald-700'
                          : 'text-slate-700'
                      }`}
                    >
                      {item.meanReversionSignal}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
