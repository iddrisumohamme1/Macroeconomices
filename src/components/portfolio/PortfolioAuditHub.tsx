import React, { useState, useMemo } from 'react';
import { FundingAccount, TradeRecord, EconomicNewsEvent } from '../../types';
import { computePortfolioAggregate, formatCurrency } from '../../utils/quantCalculations';
import { EquityDrawdownLineChart } from './EquityDrawdownLineChart';
import { DrawdownMonitorTable } from './DrawdownMonitorTable';
import { TradeAuditLog } from './TradeAuditLog';
import {
  ShieldAlert,
  DollarSign,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Percent,
  Search,
  Filter,
  X,
  TrendingUp,
  Activity,
  Folder,
  Calendar,
  Clock,
  ExternalLink,
} from 'lucide-react';

interface PortfolioAuditHubProps {
  accounts: FundingAccount[];
  trades: TradeRecord[];
  onQuickSimulateLoss: (accountId: string, lossAmount: number) => void;
  onExportTradesCsv: () => void;
  currentUserEmail?: string;
  onOpenAddAccountModal?: () => void;
  newsEvents?: EconomicNewsEvent[];
  onNavigateToNews?: () => void;
}

export const PortfolioAuditHub: React.FC<PortfolioAuditHubProps> = ({
  accounts,
  trades,
  onQuickSimulateLoss,
  onExportTradesCsv,
  currentUserEmail,
  onOpenAddAccountModal,
  newsEvents = [],
  onNavigateToNews,
}) => {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('ALL');
  const [selectedAsset, setSelectedAsset] = useState<string>('ALL');
  const [outcomeFilter, setOutcomeFilter] = useState<'ALL' | 'WIN' | 'LOSS'>('ALL');

  // Compute aggregate metrics across all accounts & trades
  const aggregateMetrics = useMemo(() => {
    return computePortfolioAggregate(accounts, trades);
  }, [accounts, trades]);

  // Extract unique assets from trades
  const uniqueAssets = useMemo(() => {
    const set = new Set<string>();
    trades.forEach((t) => set.add(t.asset));
    return Array.from(set).sort();
  }, [trades]);

  // Accounts list for dropdowns
  const accountsList = useMemo(() => {
    return accounts.map((a) => ({ id: a.id, propFirm: a.propFirm }));
  }, [accounts]);

  // Filter trades based on search query, asset pair, account ID, and outcome
  const filteredTrades = useMemo(() => {
    return trades.filter((t) => {
      const matchAccount =
        selectedAccountId === 'ALL' || t.accountId === selectedAccountId;
      const matchAsset = selectedAsset === 'ALL' || t.asset === selectedAsset;
      const matchOutcome = outcomeFilter === 'ALL' || t.status === outcomeFilter;

      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        t.ticketId.toLowerCase().includes(q) ||
        t.asset.toLowerCase().includes(q) ||
        t.accountId.toLowerCase().includes(q) ||
        t.direction.toLowerCase().includes(q);

      return matchAccount && matchAsset && matchOutcome && matchSearch;
    });
  }, [trades, selectedAccountId, selectedAsset, outcomeFilter, searchQuery]);

  // Filtered metrics calculation (when filters are active)
  const isFiltered =
    selectedAccountId !== 'ALL' ||
    selectedAsset !== 'ALL' ||
    outcomeFilter !== 'ALL' ||
    searchQuery.trim().length > 0;

  const filteredMetrics = useMemo(() => {
    const total = filteredTrades.length;
    if (total === 0) {
      return { totalPnL: 0, winRate: 0, expectancy: 0, rMultiple: 0, wins: 0, losses: 0 };
    }
    const wins = filteredTrades.filter((t) => t.pnl > 0);
    const losses = filteredTrades.filter((t) => t.pnl < 0);
    const totalPnL = filteredTrades.reduce((acc, t) => acc + t.pnl, 0);
    const winRate = (wins.length / total) * 100;
    const avgWin = wins.length > 0 ? wins.reduce((acc, t) => acc + t.pnl, 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((acc, t) => acc + t.pnl, 0)) / losses.length : 0;
    const rMultiple = avgLoss > 0 ? avgWin / avgLoss : 0;
    const expectancy = (wins.length / total) * avgWin - (losses.length / total) * avgLoss;

    return { totalPnL, winRate, expectancy, rMultiple, wins: wins.length, losses: losses.length };
  }, [filteredTrades]);

  // Reset all filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedAccountId('ALL');
    setSelectedAsset('ALL');
    setOutcomeFilter('ALL');
  };

  // Selected account for the line chart (or first/worst if ALL)
  const currentChartAccount = useMemo(() => {
    if (selectedAccountId === 'ALL') {
      const worst = accounts.find((a) => a.id === aggregateMetrics.worstAccountId);
      return worst || accounts[0];
    }
    return accounts.find((a) => a.id === selectedAccountId) || accounts[0];
  }, [accounts, selectedAccountId, aggregateMetrics]);

  return (
    <div className="space-y-6">
      {/* Top Header & Context Description */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-lg font-bold text-white tracking-tight">
              Portfolio Performance &amp; Audit Hub
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <span aria-hidden="true">·</span>
              <span>Non-Execution Oversight</span>
              {currentUserEmail && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-emerald-400">Workspace: {currentUserEmail}</span>
                </>
              )}
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Independent risk oversight across multi-firm funded accounts. Daily starting equity captured at institutional rollover (22:00 UTC) with hard 5% daily drawdown limits.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0 text-xs text-slate-400 font-mono">
          <span>Active Accounts:</span>
          <span className="font-bold text-emerald-400">{accounts.length}</span>
          <span>·</span>
          <span>Total Trades:</span>
          <span className="font-bold text-slate-200">{trades.length}</span>
        </div>
      </div>

      {/* Primary Looker Studio Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Scorecard 1: Combined Equity Across All Accounts */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-medium">Combined Portfolio Equity</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums tracking-tight">
            {formatCurrency(aggregateMetrics.totalEquity)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-mono">
              Rollover Base: {formatCurrency(aggregateMetrics.totalDailyStartingEquity)}
            </span>
            <span
              className={`font-mono font-semibold flex items-center gap-0.5 ${
                aggregateMetrics.combinedDailyPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {aggregateMetrics.combinedDailyPnL >= 0 ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}
              {formatCurrency(aggregateMetrics.combinedDailyPnL, true)} (
              {aggregateMetrics.combinedDailyPnLPct >= 0 ? '+' : ''}
              {aggregateMetrics.combinedDailyPnLPct.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* Scorecard 2: Worst-Performing Account Distance to Drawdown */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-medium">Worst Account Distance to 5% DD</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums tracking-tight">
            <span
              className={
                aggregateMetrics.worstAccountDistance <= 0
                  ? 'text-rose-500 animate-pulse'
                  : aggregateMetrics.worstAccountDistancePct < 2.0
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }
            >
              +{formatCurrency(aggregateMetrics.worstAccountDistance)}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 truncate max-w-[140px]">
              Account: <strong className="text-slate-200">{aggregateMetrics.worstAccountId}</strong>
            </span>
            <span
              className={`font-semibold ${
                aggregateMetrics.worstAccountDistancePct < 2.0
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {aggregateMetrics.worstAccountDistancePct.toFixed(2)}% buffer
            </span>
          </div>
        </div>

        {/* Scorecard 3: Mathematical Expectancy & R-Multiple */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-medium">Mathematical Expectancy (E)</span>
            <Target className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums tracking-tight text-white flex items-baseline gap-2">
            <span
              className={
                aggregateMetrics.mathematicalExpectancy >= 0
                  ? 'text-emerald-400'
                  : 'text-rose-400'
              }
            >
              {formatCurrency(aggregateMetrics.mathematicalExpectancy, true)}
            </span>
            <span className="text-xs font-sans text-slate-400">/ trade</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">
              R-Multiple (Avg W/L): <strong className="text-slate-200">{aggregateMetrics.riskToRewardRatio.toFixed(2)}R</strong>
            </span>
            <span className="text-slate-400">
              PF: <strong className="text-slate-200">{aggregateMetrics.profitFactor.toFixed(2)}</strong>
            </span>
          </div>
        </div>

        {/* Scorecard 4: Win Rate & Loss Rate Distribution */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-medium">Win / Loss Distribution</span>
            <Percent className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums tracking-tight flex items-baseline gap-2">
            <span className="text-emerald-400">{aggregateMetrics.winRate.toFixed(1)}%</span>
            <span className="text-xs text-slate-500 font-sans">
              ({aggregateMetrics.winningTrades}W / {aggregateMetrics.losingTrades}L)
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">
              Avg Win: <span className="text-emerald-400 font-semibold">{formatCurrency(aggregateMetrics.averageWin)}</span>
            </span>
            <span className="text-slate-400">
              Avg Loss: <span className="text-rose-400 font-semibold">{formatCurrency(aggregateMetrics.averageLoss)}</span>
            </span>
          </div>
        </div>
      </div>

      {/* FOREX FACTORY RED NEWS THREAT RADAR (Prop Firm News Rule Sentinel) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <Folder className="w-4 h-4 fill-rose-500" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Forex Factory Red News Threat Radar</span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
                  Prop Firm 2-Min Rule Guard
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Live radar monitoring upcoming High-Impact Red releases affecting your funded account drawdown rules.
              </p>
            </div>
          </div>

          {onNavigateToNews && (
            <button
              onClick={onNavigateToNews}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors self-start sm:self-auto cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-rose-400" />
              <span>Open Full News Calendar</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </button>
          )}
        </div>

        {/* 3 Upcoming High-Impact Releases Mini-Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {newsEvents
            .filter((e) => e.impact === 'HIGH')
            .slice(0, 3)
            .map((evt) => (
              <div
                key={evt.id}
                className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex items-start gap-2.5 hover:border-slate-700 transition-colors"
              >
                <div className="w-7 h-7 rounded bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 mt-0.5">
                  <Folder className="w-3.5 h-3.5 fill-rose-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1 text-[11px] font-mono">
                    <span className="font-bold text-white">
                      {evt.flag} {evt.currency}
                    </span>
                    <span className="text-slate-400 text-[10px]">{evt.time}</span>
                  </div>
                  <div className="text-xs text-slate-200 font-medium truncate mt-0.5" title={evt.title}>
                    {evt.title}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-1 pt-1 border-t border-slate-900">
                    <span>Forecast: <strong className="text-slate-300">{evt.forecast || '—'}</strong></span>
                    <span className="text-rose-400 font-semibold">{evt.date}</span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* SEARCH & FILTER CONTROLS BAR */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Section title & search info */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-bold text-white">Cross-Filter Controls</span>
            <span className="text-xs text-slate-400 hidden sm:inline">
              · Filter trades by asset pair, funding account ID, or search query
            </span>
          </div>

          {/* Reset Filters CTA */}
          {isFiltered && (
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-colors self-start lg:self-auto"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset All Filters</span>
            </button>
          )}
        </div>

        {/* Input Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ticket, pair, account..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/60 rounded-lg pl-8 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* 2. Account ID Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <label className="text-[10px] text-slate-500 block leading-tight">Account ID</label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full bg-transparent text-slate-200 font-mono text-xs focus:outline-none cursor-pointer truncate"
              >
                <option value="ALL" className="bg-slate-900">All Accounts ({accounts.length})</option>
                {accountsList.map((acc) => (
                  <option key={acc.id} value={acc.id} className="bg-slate-900">
                    {acc.id} ({acc.propFirm})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Asset Pair Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <label className="text-[10px] text-slate-500 block leading-tight">Asset Pair</label>
              <select
                value={selectedAsset}
                onChange={(e) => setSelectedAsset(e.target.value)}
                className="w-full bg-transparent text-slate-200 font-mono text-xs focus:outline-none cursor-pointer truncate"
              >
                <option value="ALL" className="bg-slate-900">All Asset Pairs ({uniqueAssets.length})</option>
                {uniqueAssets.map((asset) => (
                  <option key={asset} value={asset} className="bg-slate-900">
                    {asset}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 4. Outcome Filter Tabs */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-1 text-xs">
            <button
              onClick={() => setOutcomeFilter('ALL')}
              className={`flex-1 py-1.5 rounded-md font-medium text-xs transition-colors whitespace-nowrap ${
                outcomeFilter === 'ALL'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setOutcomeFilter('WIN')}
              className={`flex-1 py-1.5 rounded-md font-medium text-xs transition-colors whitespace-nowrap ${
                outcomeFilter === 'WIN'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Wins
            </button>
            <button
              onClick={() => setOutcomeFilter('LOSS')}
              className={`flex-1 py-1.5 rounded-md font-medium text-xs transition-colors whitespace-nowrap ${
                outcomeFilter === 'LOSS'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Losses
            </button>
          </div>
        </div>

        {/* Dynamic Filtered Performance Summary Banner */}
        {isFiltered && (
          <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Filter Scope:</span>
              {selectedAccountId !== 'ALL' && (
                <span className="bg-slate-950 border border-slate-700 px-2 py-0.5 rounded text-white font-semibold">
                  Account: {selectedAccountId}
                </span>
              )}
              {selectedAsset !== 'ALL' && (
                <span className="bg-slate-950 border border-slate-700 px-2 py-0.5 rounded text-emerald-400 font-semibold">
                  Asset: {selectedAsset}
                </span>
              )}
              {outcomeFilter !== 'ALL' && (
                <span className="bg-slate-950 border border-slate-700 px-2 py-0.5 rounded text-cyan-400 font-semibold">
                  {outcomeFilter} Trades
                </span>
              )}
              {searchQuery && (
                <span className="bg-slate-950 border border-slate-700 px-2 py-0.5 rounded text-slate-300">
                  Search: "{searchQuery}"
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-slate-400">
                Matches: <strong className="text-white">{filteredTrades.length}</strong>
              </span>
              <span>·</span>
              <span className="text-slate-400">
                Net PnL:{' '}
                <strong
                  className={
                    filteredMetrics.totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }
                >
                  {formatCurrency(filteredMetrics.totalPnL, true)}
                </strong>
              </span>
              <span>·</span>
              <span className="text-slate-400">
                Win Rate:{' '}
                <strong className="text-emerald-400">
                  {filteredMetrics.winRate.toFixed(1)}%
                </strong>
              </span>
              <span>·</span>
              <span className="text-slate-400">
                Expectancy:{' '}
                <strong className="text-slate-200">
                  {formatCurrency(filteredMetrics.expectancy, true)}
                </strong>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Looker Studio Core Line Chart Anchor: Equity Curve vs Red 5% DD Marker */}
      <EquityDrawdownLineChart account={currentChartAccount} />

      {/* Hard Risk Rules & Multi-Account Drawdown Monitor Table */}
      <DrawdownMonitorTable
        accounts={accounts}
        selectedAccountId={currentChartAccount.id}
        onSelectAccount={(id) => setSelectedAccountId(id)}
        onQuickSimulateLoss={onQuickSimulateLoss}
        onOpenAddAccountModal={onOpenAddAccountModal}
      />

      {/* Filtered Trade Audit Log Journal */}
      <TradeAuditLog
        trades={filteredTrades}
        allTradesCount={trades.length}
        selectedAccountId={selectedAccountId}
        selectedAsset={selectedAsset}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelectAccount={setSelectedAccountId}
        onSelectAsset={setSelectedAsset}
        onExportCsv={onExportTradesCsv}
        onClearFilters={handleClearFilters}
        isFiltered={isFiltered}
        uniqueAssets={uniqueAssets}
        accountsList={accountsList}
      />
    </div>
  );
};
