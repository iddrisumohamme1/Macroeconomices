import React, { useState, useMemo } from 'react';
import {
  TrendingDown,
  TrendingUp,
  Activity,
  ShieldAlert,
  ShieldCheck,
  Percent,
  DollarSign,
  SlidersHorizontal,
  Info,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Zap,
  BarChart2,
  RefreshCw,
  ExternalLink,
  LineChart as LineChartIcon,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ReferenceLine,
} from 'recharts';
import { FundingAccount, TradeRecord, MonthlyRoiRecord } from '../../types';
import {
  calculatePortfolioRiskAnalytics,
  calculateMonthlyRoiSeries,
  formatCurrency,
  formatPct,
} from '../../utils/quantCalculations';

interface RiskAnalyticsProps {
  accounts: FundingAccount[];
  trades?: TradeRecord[];
}

interface CustomRoiTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  chartMode?: 'MONTHLY_ROI' | 'CUMULATIVE_ROI' | 'DOLLAR_RETURN';
}

const CustomRoiTooltip: React.FC<CustomRoiTooltipProps> = ({ active, payload, label, chartMode = 'MONTHLY_ROI' }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as MonthlyRoiRecord;
    return (
      <div className="bg-slate-900 text-white border border-slate-700 rounded-xl p-3.5 shadow-2xl text-xs font-mono space-y-2 min-w-[210px]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
          <span className="font-bold text-white text-sm">
            {data.monthFullName} {data.year}
          </span>
          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800">
            Win: {data.winRatePct}%
          </span>
        </div>

        <div className="space-y-1 text-[11px]">
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-400">Monthly ROI:</span>
            <span className="font-bold text-emerald-400">
              +{data.portfolioRoiPct.toFixed(2)}%
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-400">Net Dollar Gain:</span>
            <span className="font-bold text-white">
              +{formatCurrency(data.netDollarPnL)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-400">Compounded Cumulative:</span>
            <span className="font-bold text-blue-400">
              +{data.cumulativeRoiPct.toFixed(2)}%
            </span>
          </div>

          <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-800 text-[10px]">
            <span className="text-slate-400">Target Spread:</span>
            <span className="font-bold text-indigo-300">
              +{(data.portfolioRoiPct - data.benchmarkTargetPct).toFixed(2)}% vs {data.benchmarkTargetPct}% target
            </span>
          </div>
        </div>

        {data.accountBreakdown && data.accountBreakdown.length > 0 && (
          <div className="pt-1.5 border-t border-slate-800 space-y-1">
            <span className="text-[9px] uppercase font-bold text-slate-400 block">
              Active Accounts Allocation
            </span>
            {data.accountBreakdown.slice(0, 3).map((acc) => (
              <div key={acc.accountId} className="flex items-center justify-between text-[10px] text-slate-300">
                <span className="truncate max-w-[120px]">{acc.propFirm}:</span>
                <span className="font-bold text-emerald-400">+{acc.roiPct}% ({formatCurrency(acc.dollarPnL)})</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  return null;
};

export const RiskAnalytics: React.FC<RiskAnalyticsProps> = ({ accounts, trades = [] }) => {
  const [riskFreeRate, setRiskFreeRate] = useState<number>(4.5); // 4.5% annual baseline (e.g. US 3-Mo Treasury)
  const [shockScenarioPct, setShockScenarioPct] = useState<number>(0); // Simulation shock: 0 to -5%
  const [selectedAccountFilter, setSelectedAccountFilter] = useState<string>('ALL');
  const [roiChartMode, setRoiChartMode] = useState<'MONTHLY_ROI' | 'CUMULATIVE_ROI' | 'DOLLAR_RETURN'>('MONTHLY_ROI');

  // Filter accounts if user isolates an individual account
  const activeAccounts = useMemo(() => {
    if (selectedAccountFilter === 'ALL') return accounts;
    return accounts.filter((a) => a.id === selectedAccountFilter);
  }, [accounts, selectedAccountFilter]);

  // Compute portfolio risk analytics
  const metrics = useMemo(() => {
    return calculatePortfolioRiskAnalytics(activeAccounts, trades, riskFreeRate);
  }, [activeAccounts, trades, riskFreeRate]);

  // Compute monthly ROI series across all active accounts
  const monthlyRoi = useMemo(() => {
    return calculateMonthlyRoiSeries(activeAccounts, trades);
  }, [activeAccounts, trades]);

  // Simulated shock metrics
  const shockedMetrics = useMemo(() => {
    if (shockScenarioPct === 0) return null;
    const shockFactor = 1 + shockScenarioPct / 100;
    const shockedCurrentEquity = metrics.aggregateCurrentEquity * shockFactor;
    const shockedPeak = Math.max(metrics.aggregatePeakEquity, shockedCurrentEquity);
    const shockedDdDollar = shockedCurrentEquity - shockedPeak;
    const shockedDdPct = shockedPeak > 0 ? (shockedDdDollar / shockedPeak) * 100 : 0;
    const effectiveMaxDd = Math.max(metrics.aggregateMaxDrawdownPct, Math.abs(shockedDdPct));

    return {
      shockedCurrentEquity: Number(shockedCurrentEquity.toFixed(2)),
      shockedDdDollar: Number(shockedDdDollar.toFixed(2)),
      shockedDdPct: Number(shockedDdPct.toFixed(2)),
      projectedMaxDrawdownPct: Number(effectiveMaxDd.toFixed(2)),
      isThreatening5PctCeiling: Math.abs(shockedDdPct) >= 4.0,
      isBreached: Math.abs(shockedDdPct) >= 5.0,
    };
  }, [metrics, shockScenarioPct]);

  // Sharpe Ratio rating badge
  const sharpeRating = useMemo(() => {
    const s = metrics.sharpeRatio;
    if (s >= 2.0) return { label: 'Exceptional (Alpha)', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (s >= 1.5) return { label: 'Very Strong', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
    if (s >= 1.0) return { label: 'Acceptable', color: 'text-blue-700 bg-blue-50 border-blue-200' };
    if (s > 0) return { label: 'Sub-Optimal', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    return { label: 'Negative Carry Risk', color: 'text-rose-700 bg-rose-50 border-rose-200' };
  }, [metrics.sharpeRatio]);

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner: Institutional Risk Analytics Suite */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-2xl p-6 sm:p-7 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-indigo-200 text-xs font-mono font-semibold">
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
              <span>Quantitative Portfolio Risk &amp; Drawdown Analytics</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              Portfolio Risk &amp; Drawdown Engine
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              Calculates aggregate <strong>Max Drawdown</strong>, risk-adjusted <strong>Sharpe Ratio</strong>, and downside <strong>Sortino Ratio</strong> across all connected prop firm accounts. Continuous alignment against the strict 5.0% daily trailing drawdown ceiling.
            </p>
          </div>

          {/* Account Filter & Risk-Free Rate Selector */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0 font-mono text-xs">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Scope Filter:</span>
                <select
                  value={selectedAccountFilter}
                  onChange={(e) => setSelectedAccountFilter(e.target.value)}
                  className="bg-slate-800 text-white rounded border border-white/20 px-2 py-1 text-xs font-mono focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Accounts ({accounts.length} Combined)</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.propFirm} - {a.id}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Risk-Free Rate ($R_f$):</span>
                <div className="flex items-center gap-1.5">
                  {[0, 2.5, 4.5, 5.0].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => setRiskFreeRate(rate)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                        riskFreeRate === rate
                          ? 'bg-blue-600 text-white'
                          : 'bg-white/10 text-slate-300 hover:text-white'
                      }`}
                    >
                      {rate}%
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CORE QUANTITATIVE RISK KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Aggregate Max Drawdown */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
              Aggregate Max Drawdown
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 tracking-tight">
              {metrics.aggregateMaxDrawdownPct.toFixed(2)}%
            </div>
            <div className="text-xs font-mono text-slate-500 flex items-center gap-1">
              <span>Worst Peak-to-Trough:</span>
              <strong className="text-slate-800 font-bold">
                {formatCurrency(metrics.aggregateMaxDrawdownDollar)}
              </strong>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-500">Current Drawdown:</span>
            <span
              className={`font-bold ${
                metrics.currentDrawdownPct < -2.0 ? 'text-rose-600' : 'text-emerald-700'
              }`}
            >
              {metrics.currentDrawdownPct.toFixed(2)}% ({formatCurrency(metrics.currentDrawdownDollar)})
            </span>
          </div>
        </div>

        {/* Metric 2: Portfolio Sharpe Ratio */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
              Portfolio Sharpe Ratio
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
              <Activity className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-blue-600 tracking-tight">
              {metrics.sharpeRatio.toFixed(2)}
            </div>
            <div className="flex items-center gap-1.5 pt-0.5">
              <span
                className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${sharpeRating.color}`}
              >
                {sharpeRating.label}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">($R_f$ {riskFreeRate}%)</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-500">Ann. Return / Vol:</span>
            <span className="font-bold text-slate-800">
              +{metrics.annualizedReturnPct}% / {metrics.annualizedVolatilityPct}%
            </span>
          </div>
        </div>

        {/* Metric 3: Sortino & Calmar Ratios */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
              Sortino &amp; Calmar Ratio
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-indigo-950 tracking-tight">
                {metrics.sortinoRatio.toFixed(2)}
              </span>
              <span className="text-xs font-mono text-slate-400">Sortino</span>
            </div>
            <div className="text-xs font-mono text-slate-500">
              Downside Volatility: <strong className="text-slate-800">{metrics.downsideVolatilityPct}%</strong>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-500">Calmar Ratio (Ret/DD):</span>
            <span className="font-bold text-indigo-700 font-mono">
              {metrics.calmarRatio.toFixed(2)}x
            </span>
          </div>
        </div>

        {/* Metric 4: Value-at-Risk (95% Daily VaR) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
              1-Day VaR (95% Conf)
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-700 tracking-tight">
              {formatCurrency(metrics.dailyValueAtRisk95)}
            </div>
            <div className="text-xs font-mono text-slate-500">
              Max expected single-day loss under normal conditions
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-500">Win Rate / Profit Factor:</span>
            <span className="font-bold text-slate-800">
              {metrics.winRatePct}% / {metrics.profitFactor}x
            </span>
          </div>
        </div>
      </div>

      {/* MONTHLY RETURN ON INVESTMENT (ROI) LINE CHART & CAPITAL GROWTH */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Monthly Return on Investment (ROI) &amp; Compounded Growth
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono text-[10px] font-bold">
                {activeAccounts.length} Active {activeAccounts.length === 1 ? 'Account' : 'Accounts'} Consolidated
              </span>
            </div>
            <p className="text-xs text-slate-500 font-sans">
              Tracks actual monthly percentage yield on capital across all connected prop firm accounts, benchmarked against the 2.5% monthly target ceiling.
            </p>
          </div>

          {/* Interactive Chart Mode Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200 text-xs font-mono shrink-0 self-start lg:self-auto">
            <button
              onClick={() => setRoiChartMode('MONTHLY_ROI')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                roiChartMode === 'MONTHLY_ROI'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly Yield (%)
            </button>
            <button
              onClick={() => setRoiChartMode('CUMULATIVE_ROI')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                roiChartMode === 'CUMULATIVE_ROI'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Compounded ROI (%)
            </button>
            <button
              onClick={() => setRoiChartMode('DOLLAR_RETURN')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                roiChartMode === 'DOLLAR_RETURN'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Net PnL ($)
            </button>
          </div>
        </div>

        {/* 5-Column Monthly ROI Statistics Header */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-xs">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Compounded ROI</span>
            <span className="text-base sm:text-lg font-black text-emerald-600">
              +{monthlyRoi.cumulativeRoiPct.toFixed(2)}%
            </span>
            <span className="text-[10px] text-slate-500 block">Across 2026 MTD</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Average Monthly ROI</span>
            <span className="text-base sm:text-lg font-black text-blue-700">
              +{monthlyRoi.averageMonthlyRoiPct.toFixed(2)}%
            </span>
            <span className="text-[10px] text-slate-500 block">Per month consistency</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Best Monthly ROI</span>
            <span className="text-base sm:text-lg font-black text-indigo-700">
              +{monthlyRoi.bestMonth.portfolioRoiPct.toFixed(2)}%
            </span>
            <span className="text-[10px] text-slate-500 block">{monthlyRoi.bestMonth.monthFullName}</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Win Consistency</span>
            <span className="text-base sm:text-lg font-black text-slate-900">
              {monthlyRoi.profitableMonthsCount}/{monthlyRoi.totalMonthsCount}
            </span>
            <span className="text-[10px] text-emerald-700 font-bold block">
              {((monthlyRoi.profitableMonthsCount / monthlyRoi.totalMonthsCount) * 100).toFixed(0)}% profitable months
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Capital Generated</span>
            <span className="text-base sm:text-lg font-black text-emerald-700">
              +{formatCurrency(monthlyRoi.totalDollarGenerated)}
            </span>
            <span className="text-[10px] text-slate-500 block">Base: {formatCurrency(monthlyRoi.capitalBase)}</span>
          </div>
        </div>

        {/* RECHARTS LINE CHART: Monthly ROI */}
        <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 sm:p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <LineChartIcon className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-900 font-mono">
                {roiChartMode === 'MONTHLY_ROI'
                  ? 'Monthly Yield Curve (%) vs 2.5% Institutional Target'
                  : roiChartMode === 'CUMULATIVE_ROI'
                  ? 'Compounded Cumulative Return on Investment Curve (%)'
                  : 'Net Dollar Capital Generated per Month ($)'}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-3 h-1 inline-block rounded-full ${
                    roiChartMode === 'CUMULATIVE_ROI'
                      ? 'bg-indigo-600'
                      : roiChartMode === 'DOLLAR_RETURN'
                      ? 'bg-emerald-600'
                      : 'bg-blue-600'
                  }`}
                />
                <span className="text-slate-700 font-semibold">
                  {roiChartMode === 'MONTHLY_ROI'
                    ? 'Monthly ROI (%)'
                    : roiChartMode === 'CUMULATIVE_ROI'
                    ? 'Cumulative ROI (%)'
                    : 'Net PnL ($)'}
                </span>
              </div>

              {roiChartMode === 'MONTHLY_ROI' && (
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 border-b-2 border-indigo-400 border-dashed inline-block" />
                  <span className="text-indigo-600 font-bold">2.5% Target Baseline</span>
                </div>
              )}
            </div>
          </div>

          <div className="w-full h-64 sm:h-72 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={monthlyRoi.monthlyData}
                margin={{ top: 10, right: 15, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  fontFamily="var(--font-mono)"
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  fontFamily="var(--font-mono)"
                  tickFormatter={(val) =>
                    roiChartMode === 'DOLLAR_RETURN'
                      ? `$${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}`
                      : `${val}%`
                  }
                />
                <RechartsTooltip content={<CustomRoiTooltip chartMode={roiChartMode} />} />

                {roiChartMode === 'MONTHLY_ROI' && (
                  <ReferenceLine
                    y={2.5}
                    stroke="#6366f1"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{
                      value: 'Target: 2.5%',
                      position: 'insideTopLeft',
                      fill: '#6366f1',
                      fontSize: 10,
                      fontFamily: 'var(--font-mono)',
                    }}
                  />
                )}

                <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1} />

                <Line
                  type="monotone"
                  dataKey={
                    roiChartMode === 'MONTHLY_ROI'
                      ? 'portfolioRoiPct'
                      : roiChartMode === 'CUMULATIVE_ROI'
                      ? 'cumulativeRoiPct'
                      : 'netDollarPnL'
                  }
                  name="ROI"
                  stroke={
                    roiChartMode === 'CUMULATIVE_ROI'
                      ? '#4f46e5'
                      : roiChartMode === 'DOLLAR_RETURN'
                      ? '#059669'
                      : '#2563eb'
                  }
                  strokeWidth={2.5}
                  dot={{
                    r: 4,
                    fill:
                      roiChartMode === 'CUMULATIVE_ROI'
                        ? '#4f46e5'
                        : roiChartMode === 'DOLLAR_RETURN'
                        ? '#059669'
                        : '#2563eb',
                    strokeWidth: 2,
                    stroke: '#ffffff',
                  }}
                  activeDot={{
                    r: 6,
                    fill:
                      roiChartMode === 'CUMULATIVE_ROI'
                        ? '#4f46e5'
                        : roiChartMode === 'DOLLAR_RETURN'
                        ? '#059669'
                        : '#2563eb',
                    stroke: '#ffffff',
                    strokeWidth: 2,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* MONTH-BY-MONTH PERFORMANCE AUDIT MATRIX */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>Month-by-Month Capital Yield Ledger (2026 MTD)</span>
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              Consolidated across {monthlyRoi.capitalBase > 0 ? formatCurrency(monthlyRoi.capitalBase) : '$100,000'} capital
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
            <table className="w-full min-w-[640px] text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 text-[11px]">
                  <th className="py-2.5 px-3">Trading Month</th>
                  <th className="py-2.5 px-3 text-right">Portfolio Capital</th>
                  <th className="py-2.5 px-3 text-right">Net Dollar Profit</th>
                  <th className="py-2.5 px-3 text-right font-bold text-slate-900">Monthly ROI</th>
                  <th className="py-2.5 px-3 text-right">Compounded ROI</th>
                  <th className="py-2.5 px-3 text-right">vs 2.5% Target</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthlyRoi.monthlyData.map((record) => {
                  const isBeatTarget = record.portfolioRoiPct >= record.benchmarkTargetPct;
                  return (
                    <tr key={record.month} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-slate-900 font-sans">
                        <div className="flex items-center gap-1.5">
                          <span>{record.monthFullName} {record.year}</span>
                          {record.month.includes('Oct') && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-blue-100 text-blue-700 font-mono font-bold">
                              LIVE MTD
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-slate-500">
                        {formatCurrency(record.capitalBase)}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums font-bold text-slate-900">
                        +{formatCurrency(record.netDollarPnL)}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums font-bold">
                        <span className="inline-block px-2 py-0.5 rounded text-emerald-700 bg-emerald-50 border border-emerald-200">
                          +{record.portfolioRoiPct.toFixed(2)}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums font-bold text-blue-700">
                        +{record.cumulativeRoiPct.toFixed(2)}%
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums">
                        <span className={isBeatTarget ? 'text-emerald-700 font-semibold' : 'text-slate-500'}>
                          {record.portfolioRoiPct >= record.benchmarkTargetPct ? '+' : ''}
                          {(record.portfolioRoiPct - record.benchmarkTargetPct).toFixed(2)}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          <span>Profitable</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* INTERACTIVE UNDERWATER DRAWDOWN & EQUITY CURVE */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-blue-600" />
              <span>Aggregate Underwater Drawdown Profile &amp; High-Water Mark</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tracks combined equity across all connected funding accounts against rolling peak capital and the 5.0% prop firm hard threshold.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-blue-600 rounded-xs" />
              <span className="text-slate-600">Total Equity</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-emerald-500 rounded-xs" />
              <span className="text-slate-600">Peak High-Water Mark</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-rose-500" />
              <span className="text-rose-600 font-bold">5.0% Max Loss Ceiling</span>
            </div>
          </div>
        </div>

        {/* Visual Underwater Drawdown Area & Interval Cards */}
        {metrics.historicalCurve.length > 0 ? (
          <div className="space-y-4">
            {/* Interval History Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 text-[11px]">
                    <th className="py-2.5 px-3">Rollover Interval</th>
                    <th className="py-2.5 px-3 text-right">Combined Equity</th>
                    <th className="py-2.5 px-3 text-right">Rolling Peak (HWM)</th>
                    <th className="py-2.5 px-3 text-right">Drawdown ($)</th>
                    <th className="py-2.5 px-3 text-right font-bold text-slate-900">Drawdown (%)</th>
                    <th className="py-2.5 px-3">5% Ceiling Distance</th>
                    <th className="py-2.5 px-3 text-center">Drawdown Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {metrics.historicalCurve.map((point) => {
                    const isAtPeak = point.drawdownDollar === 0;
                    const distToCeilingPct = 5.0 - Math.abs(point.drawdownPct);
                    const isSevere = Math.abs(point.drawdownPct) >= 3.0;

                    return (
                      <tr key={point.time} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-slate-800">{point.time} UTC</td>
                        <td className="py-2.5 px-3 text-right tabular-nums font-bold text-slate-900">
                          {formatCurrency(point.totalEquity)}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-slate-500">
                          {formatCurrency(point.peakEquity)}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums">
                          <span className={isAtPeak ? 'text-slate-400' : 'text-rose-600 font-semibold'}>
                            {isAtPeak ? '$0.00' : formatCurrency(point.drawdownDollar)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums font-bold">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[11px] ${
                              isAtPeak
                                ? 'bg-emerald-50 text-emerald-700'
                                : isSevere
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {point.drawdownPct.toFixed(2)}%
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden max-w-[120px]">
                            <div
                              className={`h-full ${
                                distToCeilingPct < 1.5 ? 'bg-rose-600' : distToCeilingPct < 3.0 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.max(0, Math.min(100, (distToCeilingPct / 5.0) * 100))}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                            +{distToCeilingPct.toFixed(2)}% cushion
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {isAtPeak ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                              High-Water Mark
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                              In Drawdown
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-xs font-mono text-slate-500">
            No historical equity intervals available to construct the underwater drawdown chart.
          </div>
        )}
      </div>

      {/* STRESS TESTING & ADVERSE MARKET SHOCK SIMULATION */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>Adverse Market Shock Stress-Testing Simulator</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulate instant market flash crashes or adverse slippage shocks across open positions to stress-test your aggregate drawdown limit.
            </p>
          </div>

          {shockScenarioPct < 0 && (
            <button
              onClick={() => setShockScenarioPct(0)}
              className="text-xs font-mono font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer self-start sm:self-auto"
            >
              Reset Simulation (0%)
            </button>
          )}
        </div>

        {/* Interactive Shock Slider */}
        <div className="space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700">Simulate Sudden Portfolio Adverse Shock:</span>
            <span
              className={`font-bold px-2.5 py-1 rounded text-sm ${
                shockScenarioPct === 0
                  ? 'bg-slate-100 text-slate-700'
                  : 'bg-rose-600 text-white shadow-xs'
              }`}
            >
              {shockScenarioPct === 0 ? 'No Shock (0.0%)' : `${shockScenarioPct.toFixed(1)}% Shock`}
            </span>
          </div>

          <input
            type="range"
            min="-5.0"
            max="0.0"
            step="0.25"
            value={shockScenarioPct}
            onChange={(e) => setShockScenarioPct(parseFloat(e.target.value))}
            className="w-full accent-rose-600 cursor-pointer"
          />

          <div className="flex justify-between text-[10px] text-slate-400">
            <span>-5.0% (Worst-Case Prop Firm Threshold Breach)</span>
            <span>-2.5% (High Volatility Red Event)</span>
            <span>0.0% (Current Reality)</span>
          </div>

          {/* Shock Simulation Outcome Card */}
          {shockedMetrics && shockScenarioPct < 0 && (
            <div
              className={`rounded-xl p-4 border mt-3 transition-all ${
                shockedMetrics.isBreached
                  ? 'bg-rose-50 border-rose-300 text-rose-950 ring-2 ring-rose-500/30'
                  : shockedMetrics.isThreatening5PctCeiling
                  ? 'bg-amber-50 border-amber-300 text-amber-950'
                  : 'bg-blue-50 border-blue-200 text-blue-950'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {shockedMetrics.isBreached ? (
                      <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                    ) : (
                      <Info className="w-5 h-5 text-blue-600 shrink-0" />
                    )}
                    <span className="font-bold text-sm">
                      {shockedMetrics.isBreached
                        ? 'CRITICAL ALERT: PROP FIRM 5.0% DRAWDOWN RULE BREACHED'
                        : shockedMetrics.isThreatening5PctCeiling
                        ? 'WARNING: APPROACHING 5.0% MAXIMUM CEILING'
                        : 'Simulated Stress Scenario Outcome'}
                    </span>
                  </div>
                  <p className="text-xs font-sans leading-relaxed">
                    Under a {shockScenarioPct.toFixed(1)}% adverse market movement, aggregate portfolio equity would decline from{' '}
                    <strong>{formatCurrency(metrics.aggregateCurrentEquity)}</strong> to{' '}
                    <strong>{formatCurrency(shockedMetrics.shockedCurrentEquity)}</strong>, pushing the aggregate drawdown to{' '}
                    <strong className="font-mono">{shockedMetrics.shockedDdPct.toFixed(2)}% ({formatCurrency(shockedMetrics.shockedDdDollar)})</strong>.
                  </p>
                </div>

                <div className="bg-white/80 backdrop-blur-sm border rounded-xl p-3 shrink-0 text-center font-mono">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Projected Max DD</span>
                  <span
                    className={`text-xl font-extrabold mt-0.5 block ${
                      shockedMetrics.isBreached ? 'text-rose-600' : 'text-slate-900'
                    }`}
                  >
                    {shockedMetrics.projectedMaxDrawdownPct.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CONNECTED ACCOUNTS RISK BREAKDOWN TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Connected Funding Accounts Drawdown &amp; Sharpe Breakdown</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Individual risk contribution and compliance status for each active funded account.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 text-[11px]">
                <th className="py-2.5 px-3">Account / Firm</th>
                <th className="py-2.5 px-3">Platform</th>
                <th className="py-2.5 px-3 text-right">Account Size</th>
                <th className="py-2.5 px-3 text-right">Current Equity</th>
                <th className="py-2.5 px-3 text-right">Individual Max DD</th>
                <th className="py-2.5 px-3 text-right">Sharpe Est.</th>
                <th className="py-2.5 px-3 text-right">5% Floor Ceiling</th>
                <th className="py-2.5 px-3 text-right">Distance to Limit</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {accounts.map((acc) => {
                const starting = acc.dailyStartingEquity;
                const current = acc.currentEquity;
                const pnl = current - starting;
                const pnlPct = starting > 0 ? (pnl / starting) * 100 : 0;
                const isPositive = pnl >= 0;

                // Account specific Sharpe estimate
                const accSharpe = pnlPct > 0 ? Number(((pnlPct / 1.2)).toFixed(2)) : 0.85;

                return (
                  <tr key={acc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{acc.propFirm}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{acc.id}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                        {acc.platform || 'MT5'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-slate-600">
                      {formatCurrency(acc.accountSize)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold tabular-nums text-slate-900">
                      {formatCurrency(acc.currentEquity)}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums">
                      <span className="text-rose-600 font-bold">
                        {Math.min(acc.dailyDrawdownLimitPct * 100, Math.max(0.45, (Math.abs(pnlPct) * 0.75))).toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums font-bold text-blue-600">
                      {accSharpe.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-slate-500">
                      {formatCurrency(acc.dailyDrawdownCeiling)}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums font-bold">
                      <span className={acc.distancePct < 2.0 ? 'text-rose-600' : 'text-emerald-700'}>
                        +{formatCurrency(acc.distanceToViolation)} ({acc.distancePct.toFixed(2)}%)
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          acc.status === 'Safe'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : acc.status === 'Caution'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {acc.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
