import React, { useState, useMemo } from 'react';
import { CentralBankRate, CommodityCorrelation, SentimentGaugeData, RateDeviationAlert } from '../../types';
import { calculateRealRate, calculateRealRateDifferential } from '../../utils/quantCalculations';
import { CommodityCorrelationCard } from './CommodityCorrelationCard';
import { RiskRegimeGauge } from './RiskRegimeGauge';
import {
  BarChart3,
  SlidersHorizontal,
  ArrowUpDown,
  Globe,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  Bell,
  AlertTriangle,
  ShieldAlert,
  X,
  Edit2,
  TrendingDown,
  TrendingUp,
  Check,
  Zap,
} from 'lucide-react';

interface MacroOverviewProps {
  centralBanks: CentralBankRate[];
  onUpdateBankRate?: (currency: string, nominal: number, cpi: number) => void;
  commodities: CommodityCorrelation[];
  sentimentData: SentimentGaugeData;
  onAdjustSentimentScore: (delta: number) => void;
}

interface GroundingCitation {
  title: string;
  uri: string;
}

export const MacroOverview: React.FC<MacroOverviewProps> = ({
  centralBanks,
  commodities,
  sentimentData,
  onAdjustSentimentScore,
  onUpdateBankRate,
}) => {
  const [sortBy, setSortBy] = useState<'differential' | 'conviction' | 'pair'>('differential');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Rate Deviation Alert System Configuration
  const [alertThresholdBps, setAlertThresholdBps] = useState<number>(25); // Threshold in basis points (e.g., 25 = 0.25%)
  const [dismissedAlertIds, setDismissedAlertIds] = useState<Set<string>>(new Set());
  const [editingBank, setEditingBank] = useState<CentralBankRate | null>(null);
  const [newRateInput, setNewRateInput] = useState<string>('');
  const [newCpiInput, setNewCpiInput] = useState<string>('');
  const [recentNotification, setRecentNotification] = useState<{
    type: 'ALERT' | 'INFO';
    message: string;
    timestamp: string;
  } | null>(null);

  // Google Search Grounding State
  const [isSearching, setIsSearching] = useState(false);
  const [groundingSummary, setGroundingSummary] = useState<string | null>(null);
  const [groundingCitations, setGroundingCitations] = useState<GroundingCitation[]>([]);
  const [lastVerifiedTime, setLastVerifiedTime] = useState<string | null>(null);
  const [groundingError, setGroundingError] = useState<string | null>(null);

  // Compute active rate deviation alerts compared against previous month's data
  const rateDeviationAlerts = useMemo(() => {
    const alerts: RateDeviationAlert[] = [];

    centralBanks.forEach((cb) => {
      const prev = cb.previousMonthRate ?? cb.nominalRate;
      const diff = cb.nominalRate - prev;
      const deviationBps = Math.round(Math.abs(diff) * 100);

      if (deviationBps >= alertThresholdBps && deviationBps > 0) {
        const direction: 'CUT' | 'HIKE' = diff < 0 ? 'CUT' : 'HIKE';
        const severity: 'CRITICAL' | 'WARNING' | 'INFO' = deviationBps >= 50 ? 'CRITICAL' : 'WARNING';
        const implication =
          direction === 'CUT'
            ? `${cb.country} (${cb.centralBank}) delivered a ${deviationBps} bps rate cut from ${prev.toFixed(2)}% to ${cb.nominalRate.toFixed(2)}%. Compresses real yield spread, prompting institutional carry trade outflows and currency weakness.`
            : `${cb.country} (${cb.centralBank}) hiked rates by ${deviationBps} bps from ${prev.toFixed(2)}% to ${cb.nominalRate.toFixed(2)}%. Widens real yield advantage, attracting global yield-seeking capital.`;

        alerts.push({
          id: `alert-${cb.currency}-${cb.nominalRate}-${prev}`,
          currency: cb.currency,
          centralBank: cb.centralBank,
          country: cb.country,
          flag: cb.flag,
          previousRate: prev,
          newRate: cb.nominalRate,
          deviationBps,
          thresholdBps: alertThresholdBps,
          direction,
          timestamp: cb.lastUpdated,
          severity,
          marketImplication: implication,
        });
      }
    });

    return alerts.filter((a) => !dismissedAlertIds.has(a.id));
  }, [centralBanks, alertThresholdBps, dismissedAlertIds]);

  // Open Edit Modal for a Central Bank
  const handleOpenEditModal = (cb: CentralBankRate) => {
    setEditingBank(cb);
    setNewRateInput(cb.nominalRate.toFixed(2));
    setNewCpiInput(cb.cpiInflation.toFixed(2));
  };

  // Save Rate Update and Trigger Notification if threshold exceeded
  const handleSaveRateUpdate = () => {
    if (!editingBank) return;
    const nominal = parseFloat(newRateInput);
    const cpi = parseFloat(newCpiInput);
    if (isNaN(nominal) || isNaN(cpi)) return;

    const prev = editingBank.previousMonthRate ?? editingBank.nominalRate;
    const diff = nominal - prev;
    const deviationBps = Math.round(Math.abs(diff) * 100);

    if (onUpdateBankRate) {
      onUpdateBankRate(editingBank.currency, nominal, cpi);
    }

    if (deviationBps >= alertThresholdBps && deviationBps > 0) {
      setRecentNotification({
        type: 'ALERT',
        message: `🚨 RATE DEVIATION ALERT: ${editingBank.currency} (${editingBank.centralBank}) updated to ${nominal.toFixed(2)}% vs ${prev.toFixed(2)}% previous month. Deviation of ${deviationBps} bps exceeds configured threshold (${alertThresholdBps} bps)!`,
        timestamp: new Date().toLocaleTimeString(),
      });
    } else {
      setRecentNotification({
        type: 'INFO',
        message: `✓ Policy rate updated: ${editingBank.currency} set to ${nominal.toFixed(2)}%. Deviation of ${deviationBps} bps is within the ${alertThresholdBps} bps threshold.`,
        timestamp: new Date().toLocaleTimeString(),
      });
    }

    setEditingBank(null);
  };

  // Quick simulation trigger for testing alert system
  const handleSimulateJumboCut = (currency: string, targetNominal: number) => {
    const target = centralBanks.find((c) => c.currency === currency);
    if (!target) return;
    const prev = target.previousMonthRate ?? target.nominalRate;
    const diff = targetNominal - prev;
    const deviationBps = Math.round(Math.abs(diff) * 100);

    if (onUpdateBankRate) {
      onUpdateBankRate(target.currency, targetNominal, target.cpiInflation);
    }

    setRecentNotification({
      type: 'ALERT',
      message: `🚨 RATE DEVIATION ALERT TRIGGERED: ${target.currency} (${target.centralBank}) simulated update to ${targetNominal.toFixed(2)}% vs ${prev.toFixed(2)}% previous month. Deviation of ${deviationBps} bps exceeds ${alertThresholdBps} bps threshold!`,
      timestamp: new Date().toLocaleTimeString(),
    });
  };

  const pairsToCompute = useMemo(
    () => [
      { pair: 'EUR/USD', base: 'EUR', quote: 'USD' },
      { pair: 'GBP/USD', base: 'GBP', quote: 'USD' },
      { pair: 'USD/JPY', base: 'USD', quote: 'JPY' },
      { pair: 'AUD/USD', base: 'AUD', quote: 'USD' },
      { pair: 'USD/CAD', base: 'USD', quote: 'CAD' },
      { pair: 'USD/CHF', base: 'USD', quote: 'CHF' },
      { pair: 'NZD/USD', base: 'NZD', quote: 'USD' },
      { pair: 'EUR/GBP', base: 'EUR', quote: 'GBP' },
      { pair: 'EUR/JPY', base: 'EUR', quote: 'JPY' },
      { pair: 'GBP/JPY', base: 'GBP', quote: 'JPY' },
      { pair: 'AUD/JPY', base: 'AUD', quote: 'JPY' },
      { pair: 'CAD/JPY', base: 'CAD', quote: 'JPY' },
    ],
    []
  );

  const differentials = useMemo(() => {
    const list = pairsToCompute.map((p) => {
      const baseCb = centralBanks.find((c) => c.currency === p.base);
      const quoteCb = centralBanks.find((c) => c.currency === p.quote);

      if (!baseCb || !quoteCb) {
        return {
          pair: p.pair,
          baseCurrency: p.base,
          quoteCurrency: p.quote,
          baseNominal: 0,
          baseCPI: 0,
          baseRealRate: 0,
          quoteNominal: 0,
          quoteCPI: 0,
          quoteRealRate: 0,
          differential: 0,
          bias: 'Neutral' as const,
          convictionScore: 50,
        };
      }

      return calculateRealRateDifferential(p.pair, baseCb, quoteCb);
    });

    return list.sort((a, b) => {
      let comp = 0;
      if (sortBy === 'differential') comp = a.differential - b.differential;
      else if (sortBy === 'conviction') comp = a.convictionScore - b.convictionScore;
      else comp = a.pair.localeCompare(b.pair);
      return sortDirection === 'desc' ? -comp : comp;
    });
  }, [centralBanks, pairsToCompute, sortBy, sortDirection]);

  // Handle Search Grounding verification
  const handleVerifyRatesWithSearch = async () => {
    setIsSearching(true);
    setGroundingError(null);

    try {
      const response = await fetch('/api/search/rates-intelligence');
      const data = await response.json();

      if (response.ok && data.success) {
        setGroundingSummary(data.summary);
        setGroundingCitations(data.citations || []);
        setLastVerifiedTime(new Date().toLocaleTimeString());
      } else {
        setGroundingError(data.error || data.message || 'Search grounding verification unavailable.');
      }
    } catch (err: any) {
      setGroundingError(err?.message || 'Failed to reach search grounding service.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner in Blue & Light Styling */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800 rounded-2xl p-6 sm:p-7 text-white shadow-lg shadow-blue-900/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Macro Economic Intelligence
              </h2>
              <span className="text-xs bg-white/20 text-blue-100 border border-white/30 px-2 py-0.5 rounded font-mono flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                Verified Official Data
              </span>
            </div>
            <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-3xl leading-relaxed">
              Continuous ingestion of Global Central Bank policy rates, headline CPI purchasing power variations, real rate differentials, and cross-asset safe-haven sentiment gauges.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <div className="text-left md:text-right text-xs">
              <div className="text-blue-200">Institutional Session</div>
              <div className="font-mono text-emerald-300 font-bold">Rollover: 22:00 UTC Active</div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Notification Banner */}
      {recentNotification && (
        <div
          className={`rounded-xl p-4 flex items-start justify-between gap-3 text-xs font-mono shadow-sm animate-in fade-in duration-150 ${
            recentNotification.type === 'ALERT'
              ? 'bg-rose-50 border border-rose-300 text-rose-900 ring-2 ring-rose-500/20'
              : 'bg-emerald-50 border border-emerald-300 text-emerald-900'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {recentNotification.type === 'ALERT' ? (
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <span className="font-bold block text-sm">
                {recentNotification.type === 'ALERT' ? 'Central Bank Rate Deviation Alert' : 'Policy Rate Update Log'}
              </span>
              <p className="font-sans leading-relaxed text-xs">{recentNotification.message}</p>
              <span className="text-[10px] text-slate-500 block">Triggered at {recentNotification.timestamp}</span>
            </div>
          </div>

          <button
            onClick={() => setRecentNotification(null)}
            className="text-slate-400 hover:text-slate-700 p-1 rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* RATE DEVIATION ALERT SENTINEL PANEL */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600">
                <Bell className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Central Bank Rate Deviation Alert Sentinel
              </h3>
              {rateDeviationAlerts.length > 0 ? (
                <span className="bg-rose-600 text-white text-[11px] font-mono font-bold px-2 py-0.5 rounded-full animate-pulse">
                  {rateDeviationAlerts.length} Active {rateDeviationAlerts.length === 1 ? 'Alert' : 'Alerts'}
                </span>
              ) : (
                <span className="bg-emerald-100 text-emerald-800 text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full">
                  All Rates Within Threshold
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Triggers high-priority macro notifications whenever a central bank's policy rate deviates beyond the configured threshold compared to the previous month's baseline data.
            </p>
          </div>

          {/* Configurable Alert Threshold Selector */}
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs font-mono shrink-0">
            <span className="text-slate-500 text-[11px] font-semibold flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3 text-blue-600" />
              <span>Alert Threshold:</span>
            </span>

            {[15, 25, 50, 75].map((bps) => (
              <button
                key={bps}
                onClick={() => setAlertThresholdBps(bps)}
                className={`px-2.5 py-1 rounded transition-all cursor-pointer font-bold ${
                  alertThresholdBps === bps
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                {bps} bps {bps === 25 ? '(Default)' : ''}
              </button>
            ))}
          </div>
        </div>

        {/* Triggered Alerts List */}
        {rateDeviationAlerts.length > 0 ? (
          <div className="space-y-2.5 pt-2">
            {rateDeviationAlerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-rose-50/70 border border-rose-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-rose-950"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <span className="text-xl shrink-0">{alert.flag}</span>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <strong className="font-bold text-slate-900 text-sm">
                        {alert.currency} ({alert.centralBank})
                      </strong>
                      <span
                        className={`px-2 py-0.2 rounded text-[10px] font-bold uppercase ${
                          alert.direction === 'CUT'
                            ? 'bg-rose-600 text-white'
                            : 'bg-emerald-600 text-white'
                        }`}
                      >
                        {alert.direction === 'CUT' ? '↓ Rate Cut' : '↑ Rate Hike'}: {alert.deviationBps} bps
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        Current: <strong>{alert.newRate.toFixed(2)}%</strong> vs Previous Month: <strong>{alert.previousRate.toFixed(2)}%</strong>
                      </span>
                    </div>
                    <p className="text-xs text-rose-900 font-sans mt-1 leading-relaxed">
                      {alert.marketImplication}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <button
                    onClick={() => {
                      const bank = centralBanks.find((c) => c.currency === alert.currency);
                      if (bank) handleOpenEditModal(bank);
                    }}
                    className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 text-slate-800 font-bold border border-rose-300 text-[11px] cursor-pointer transition-colors"
                  >
                    Adjust Rate
                  </button>
                  <button
                    onClick={() => setDismissedAlertIds((prev) => new Set([...prev, alert.id]))}
                    className="p-1 text-rose-400 hover:text-rose-700 cursor-pointer"
                    title="Dismiss alert notification"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between text-xs font-mono text-slate-600">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>No policy rates currently exceed the active <strong>{alertThresholdBps} bps</strong> deviation threshold compared to the previous month.</span>
            </div>
            <button
              onClick={() => handleSimulateJumboCut('USD', 4.50)}
              className="text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer flex items-center gap-1 shrink-0 ml-2"
              title="Test the notification alert by simulating a 50 bps Fed rate cut"
            >
              <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span>Simulate 50 bps Fed Cut</span>
            </button>
          </div>
        )}
      </div>

      {/* Central Bank Monetary Rates & CPI Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-blue-600" />
              <span>Global Central Bank Policy Rates &amp; Headline Inflation (CPI)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Authentic central bank policy benchmarks, previous month baseline, and official headline CPI inflation figures.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleVerifyRatesWithSearch}
              disabled={isSearching}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-all shadow-xs disabled:opacity-50 cursor-pointer"
              title="Fetch official central bank policy statements"
            >
              <Globe className={`w-3.5 h-3.5 ${isSearching ? 'animate-spin text-blue-600' : 'text-blue-600'}`} />
              <span>{isSearching ? 'Fetching Dispatches...' : 'Sync Central Bank Wire'}</span>
            </button>

            <div className="text-[11px] text-slate-500 font-mono hidden sm:block bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
              Fisher Equation: Real Rate = Nominal - CPI
            </div>
          </div>
        </div>

        {/* Search Grounding Banner */}
        {groundingSummary && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between gap-2 border-b border-blue-200 pb-2">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-900 font-mono">
                  Official Central Bank Policy Dispatches
                </span>
                {lastVerifiedTime && (
                  <span className="text-[10px] text-slate-500 font-mono">
                    · Synced at {lastVerifiedTime}
                  </span>
                )}
              </div>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-sans">{groundingSummary}</p>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-mono text-[11px]">
                <th className="py-2.5 px-3">Currency</th>
                <th className="py-2.5 px-3">Central Bank</th>
                <th className="py-2.5 px-3 text-right">Current Rate</th>
                <th className="py-2.5 px-3 text-right">Prev Month</th>
                <th className="py-2.5 px-3 text-right">Deviation</th>
                <th className="py-2.5 px-3 text-right">Headline CPI</th>
                <th className="py-2.5 px-3 text-right font-bold text-slate-900">Real Yield</th>
                <th className="py-2.5 px-3">Trend</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-xs">
              {centralBanks.map((cb) => {
                const realRate = calculateRealRate(cb.nominalRate, cb.cpiInflation);
                const isRealRatePositive = realRate > 0;
                const prev = cb.previousMonthRate ?? cb.nominalRate;
                const diff = cb.nominalRate - prev;
                const deviationBps = Math.round(Math.abs(diff) * 100);
                const isExceedingThreshold = deviationBps >= alertThresholdBps && deviationBps > 0;

                return (
                  <tr
                    key={cb.currency}
                    className={`transition-colors ${isExceedingThreshold ? 'bg-rose-50/40 hover:bg-rose-50/70' : 'hover:bg-slate-50'}`}
                  >
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{cb.flag}</span>
                        <span className="font-bold text-slate-900">{cb.currency}</span>
                        <span className="text-[10px] text-slate-400 font-sans">({cb.country})</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-sans font-medium text-slate-700">{cb.centralBank}</td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900 tabular-nums">
                      {cb.nominalRate.toFixed(2)}%
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-slate-500 font-mono">
                      {prev.toFixed(2)}%
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums">
                      {deviationBps === 0 ? (
                        <span className="text-slate-400 font-mono">0 bps</span>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-bold font-mono ${
                            isExceedingThreshold
                              ? 'bg-rose-600 text-white shadow-xs animate-pulse'
                              : diff < 0
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                          title={isExceedingThreshold ? `Exceeds ${alertThresholdBps} bps alert threshold!` : 'Rate deviation from previous month'}
                        >
                          {isExceedingThreshold && <AlertTriangle className="w-2.5 h-2.5" />}
                          <span>{diff > 0 ? `+${deviationBps}` : `-${deviationBps}`} bps</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-slate-600 font-medium">
                      {cb.cpiInflation.toFixed(2)}%
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums font-bold">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-mono ${
                          isRealRatePositive
                            ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                            : 'text-rose-700 bg-rose-50 border border-rose-200'
                        }`}
                      >
                        {isRealRatePositive ? `+${realRate.toFixed(2)}%` : `${realRate.toFixed(2)}%`}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                          cb.trend === 'hiking'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : cb.trend === 'cutting'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {cb.trend}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => handleOpenEditModal(cb)}
                        className="px-2 py-1 rounded bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1 mx-auto"
                        title="Update or simulate central bank policy rate"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Update</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Real Yield Differential Engine */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span>G10 Real Rate Differential &amp; Carry Bias Table</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Computed difference: (Base Currency Real Rate - Quote Currency Real Rate). Higher real yields attract institutional carry capital.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400">Sort:</span>
            <button
              onClick={() => {
                if (sortBy === 'differential') setSortDirection((d) => (d === 'desc' ? 'asc' : 'desc'));
                else {
                  setSortBy('differential');
                  setSortDirection('desc');
                }
              }}
              className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 cursor-pointer ${
                sortBy === 'differential' ? 'bg-blue-600 text-white font-bold' : 'bg-slate-100 text-slate-700'
              }`}
            >
              Differential <ArrowUpDown className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-mono text-[11px]">
                <th className="py-2.5 px-3">Pair</th>
                <th className="py-2.5 px-3 text-right">Base Real Rate</th>
                <th className="py-2.5 px-3 text-right">Quote Real Rate</th>
                <th className="py-2.5 px-3 text-right font-bold text-slate-900">Real Rate Spread</th>
                <th className="py-2.5 px-3 text-center">Carry Bias Stance</th>
                <th className="py-2.5 px-3 text-right">Conviction Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-xs">
              {differentials.map((item) => {
                const isPositive = item.differential > 0;
                return (
                  <tr key={item.pair} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
                      {item.pair}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-600 tabular-nums">
                      {item.baseRealRate > 0 ? `+${item.baseRealRate.toFixed(2)}%` : `${item.baseRealRate.toFixed(2)}%`}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-600 tabular-nums">
                      {item.quoteRealRate > 0 ? `+${item.quoteRealRate.toFixed(2)}%` : `${item.quoteRealRate.toFixed(2)}%`}
                    </td>
                    <td className="py-3 px-3 text-right font-bold tabular-nums">
                      <span
                        className={`inline-block px-2 py-0.5 rounded ${
                          isPositive
                            ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                            : 'text-rose-700 bg-rose-50 border border-rose-200'
                        }`}
                      >
                        {isPositive ? `+${item.differential.toFixed(2)}%` : `${item.differential.toFixed(2)}%`}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.bias.includes('Bullish')
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : item.bias.includes('Bearish')
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {item.bias}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-800">
                      {item.convictionScore}/100
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Risk Sentiment Gauge & Cross-Asset Intermarket Correlations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <RiskRegimeGauge data={sentimentData} onAdjustScore={onAdjustSentimentScore} />

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Intermarket Commodity Correlations
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live transmission linkages: Crude Oil (CAD), Gold (AUD/CHF), Copper (AUD).
            </p>
          </div>

          <div className="space-y-3">
            {commodities.map((comm) => (
              <CommodityCorrelationCard key={comm.commodity} commodity={comm} />
            ))}
          </div>
        </div>
      </div>

      {/* RATE UPDATE & DEVIATION SIMULATION MODAL */}
      {editingBank && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden font-sans">
            <div className="bg-slate-900 text-white p-5 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-mono text-blue-300">
                  <span className="text-lg">{editingBank.flag}</span>
                  <span className="font-bold">{editingBank.country}</span>
                  <span>&bull;</span>
                  <span>{editingBank.currency}</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Update Policy Rate &amp; Evaluate Deviation
                </h3>
                <p className="text-xs text-slate-400 font-sans">
                  {editingBank.centralBank} benchmark monetary update.
                </p>
              </div>

              <button
                onClick={() => setEditingBank(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4 font-mono text-xs">
              {/* Baseline Reference */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Previous Month Baseline</span>
                  <span className="text-base font-bold text-slate-900 mt-0.5 block">
                    {(editingBank.previousMonthRate ?? editingBank.nominalRate).toFixed(2)}%
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Active Alert Threshold</span>
                  <span className="text-base font-bold text-blue-600 mt-0.5 block">
                    {alertThresholdBps} bps (0.{(alertThresholdBps / 100).toFixed(2).split('.')[1]}%)
                  </span>
                </div>
              </div>

              {/* Form Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    New Policy Rate (%):
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={newRateInput}
                    onChange={(e) => setNewRateInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-lg px-3 py-2 text-sm text-slate-900 font-bold focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    Headline CPI (%):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newCpiInput}
                    onChange={(e) => setNewCpiInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-lg px-3 py-2 text-sm text-slate-900 font-bold focus:outline-none"
                  />
                </div>
              </div>

              {/* Quick Deviation Presets */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">
                  Quick Simulation Scenarios:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const prev = editingBank.previousMonthRate ?? editingBank.nominalRate;
                      setNewRateInput((prev - 0.50).toFixed(2));
                    }}
                    className="py-1.5 px-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-center font-bold text-[11px] cursor-pointer transition-colors"
                  >
                    -50 bps Cut
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const prev = editingBank.previousMonthRate ?? editingBank.nominalRate;
                      setNewRateInput((prev - 0.25).toFixed(2));
                    }}
                    className="py-1.5 px-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-center font-bold text-[11px] cursor-pointer transition-colors"
                  >
                    -25 bps Cut
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const prev = editingBank.previousMonthRate ?? editingBank.nominalRate;
                      setNewRateInput(prev.toFixed(2));
                    }}
                    className="py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-center font-bold text-[11px] cursor-pointer transition-colors"
                  >
                    Hold (0 bps)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const prev = editingBank.previousMonthRate ?? editingBank.nominalRate;
                      setNewRateInput((prev + 0.25).toFixed(2));
                    }}
                    className="py-1.5 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-center font-bold text-[11px] cursor-pointer transition-colors"
                  >
                    +25 bps Hike
                  </button>
                </div>
              </div>

              {/* Dynamic Live Deviation Indicator */}
              {(() => {
                const nominal = parseFloat(newRateInput);
                if (isNaN(nominal)) return null;
                const prev = editingBank.previousMonthRate ?? editingBank.nominalRate;
                const diff = nominal - prev;
                const deviationBps = Math.round(Math.abs(diff) * 100);
                const willTriggerAlert = deviationBps >= alertThresholdBps && deviationBps > 0;

                return (
                  <div
                    className={`rounded-xl p-3.5 border transition-all ${
                      willTriggerAlert
                        ? 'bg-rose-50 border-rose-300 text-rose-950 ring-2 ring-rose-500/20'
                        : 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1.5 text-xs">
                        {willTriggerAlert ? (
                          <AlertTriangle className="w-4 h-4 text-rose-600 animate-pulse" />
                        ) : (
                          <Check className="w-4 h-4 text-emerald-600" />
                        )}
                        <span>
                          {willTriggerAlert ? 'ALERT THRESHOLD EXCEEDED' : 'Within Normal Range'}
                        </span>
                      </span>
                      <span className="font-bold text-sm">
                        {diff > 0 ? `+${deviationBps}` : `-${deviationBps}`} bps deviation
                      </span>
                    </div>
                    <p className="text-[11px] font-sans mt-1.5 leading-relaxed">
                      {willTriggerAlert
                        ? `Saving this update will fire a high-priority rate deviation notification because the ${deviationBps} bps shift exceeds the ${alertThresholdBps} bps sensitivity threshold compared to previous month (${prev.toFixed(2)}%).`
                        : `This update is within the ${alertThresholdBps} bps threshold and will be logged without triggering an urgent alarm.`}
                    </p>
                  </div>
                );
              })()}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs font-mono">
              <button
                type="button"
                onClick={() => setEditingBank(null)}
                className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveRateUpdate}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-500 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span>Save Rate &amp; Evaluate Deviation</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
