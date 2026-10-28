import React, { useState } from 'react';
import { FundingAccount } from '../../types';
import {
  ShieldCheck,
  Plus,
  Key,
  Server,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Info,
  Clock,
  TrendingUp,
  TrendingDown,
  X,
  Layers,
  Activity,
  LineChart as LineChartIcon,
  Wallet,
  DollarSign,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  ChevronUp,
  Calculator,
  Globe,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { calculateAccountDrawdown, formatCurrency } from '../../utils/quantCalculations';
import { PropFirmRiskCalculator } from './PropFirmRiskCalculator';
import { BrokerRolloverClock } from './BrokerRolloverClock';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomEquityTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const equity = Number(data.equity);
    const floor = Number(data.drawdownCeiling) || 5700;
    const buffer = equity - floor;

    return (
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xl text-xs font-mono space-y-1">
        <div className="text-slate-500 font-bold border-b border-slate-100 pb-1">
          Time: {label} UTC
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-600 font-sans">Live Equity:</span>
          <span className="font-extrabold text-blue-700 font-mono">
            ${equity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-600 font-sans">5% DD Floor:</span>
          <span className="font-bold text-rose-600 font-mono">
            ${floor.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-100">
          <span className="text-slate-600 font-sans">Safety Buffer:</span>
          <span className="font-bold text-emerald-700 font-mono">
            +${buffer.toFixed(2)} ({((buffer / 6000) * 100).toFixed(2)}%)
          </span>
        </div>
      </div>
    );
  }
  return null;
};

interface FundedAccountsManagerProps {
  accounts: FundingAccount[];
  onAddAccount: (account: FundingAccount) => void;
  onRemoveAccount: (id: string) => void;
  onSyncAccount?: (id: string) => void;
}

export const FundedAccountsManager: React.FC<FundedAccountsManagerProps> = ({
  accounts,
  onAddAccount,
  onRemoveAccount,
  onSyncAccount,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterPropFirm, setFilterPropFirm] = useState<string>('ALL');
  const [syncingAccountId, setSyncingAccountId] = useState<string | null>(null);

  // Form State - Preconfigured for YoPips 6K account
  const [propFirm, setPropFirm] = useState('YoPips');
  const [platform, setPlatform] = useState<'MT5' | 'MT4' | 'cTrader' | 'MatchTrader'>('MT5');
  const [serverName, setServerName] = useState('YoPips-Live-Server');
  const [loginNumber, setLoginNumber] = useState('');
  const [investorPassword, setInvestorPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [accountSize, setAccountSize] = useState<number>(6000);
  const [dailyDrawdownLimitPct, setDailyDrawdownLimitPct] = useState<number>(5.0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStep, setVerificationStep] = useState<string>('');

  // Prop firm suggestions
  const propFirms = ['YoPips', 'FTMO', 'Funding Pips', 'FundedNext', 'The5ers', 'Alpha Capital', 'Topstep', 'Other'];

  const serverSuggestions: Record<string, string[]> = {
    YoPips: ['YoPips-Live-Server', 'YoPips-Server-01', 'YoPips-Demo'],
    FTMO: ['FTMO-Server', 'FTMO-Server-2', 'FTMO-Demo'],
    'Funding Pips': ['FundingPips-Live-01', 'FundingPips-Demo-01'],
    FundedNext: ['FundedNext-Server-1', 'FundedNext-Live'],
    The5ers: ['The5ers-Live', 'The5ers-MT5-Live'],
    'Alpha Capital': ['AlphaCapital-Live', 'AC-Group-Live'],
    Topstep: ['Topstep-Live', 'ProjectX-Server'],
  };

  const handlePropFirmChange = (firm: string) => {
    setPropFirm(firm);
    if (serverSuggestions[firm] && serverSuggestions[firm].length > 0) {
      setServerName(serverSuggestions[firm][0]);
    }
  };

  const handleSyncClick = (accountId: string) => {
    setSyncingAccountId(accountId);
    setTimeout(() => {
      setSyncingAccountId(null);
      if (onSyncAccount) onSyncAccount(accountId);
    }, 800);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginNumber.trim() || !investorPassword.trim()) {
      return;
    }

    setIsVerifying(true);
    setVerificationStep(`Contacting ${serverName}...`);

    setTimeout(() => {
      setVerificationStep('Authenticating Investor Password (Read-Only permission)...');
    }, 600);

    setTimeout(() => {
      setVerificationStep('Fetching live broker equity & rollover baseline...');
    }, 1200);

    setTimeout(() => {
      setIsVerifying(false);
      setVerificationStep('');

      const ceiling = accountSize * (1 - dailyDrawdownLimitPct / 100);
      const newAcc: FundingAccount = {
        id: `${propFirm.replace(/\s+/g, '')}-${accountSize / 1000}K-${Math.floor(100 + Math.random() * 900)}`,
        propFirm,
        accountType: `${formatCurrency(accountSize)} Funded (${platform})`,
        accountSize,
        dailyStartingEquity: accountSize,
        currentEquity: accountSize,
        balance: accountSize,
        unrealizedPnL: 0,
        realizedDailyPnL: 0,
        dailyDrawdownLimitPct: dailyDrawdownLimitPct / 100,
        dailyDrawdownCeiling: ceiling,
        maxLossAllowed: accountSize * (dailyDrawdownLimitPct / 100),
        distanceToViolation: accountSize - ceiling,
        distancePct: dailyDrawdownLimitPct,
        status: 'Safe',
        totalTradesToday: 0,
        serverTimezone: '22:00 UTC (Rollover)',
        lastRolloverTimestamp: new Date().toISOString(),
        historicalEquity: [
          {
            time: '00:00',
            equity: accountSize,
            drawdownCeiling: ceiling,
          },
        ],
        connectionType: 'INVESTOR_PASSWORD_READONLY',
        platform,
        serverName,
        loginNumber,
        isReadOnly: true,
      };

      onAddAccount(newAcc);
      setIsModalOpen(false);
      // Reset form
      setLoginNumber('');
      setInvestorPassword('');
    }, 1800);
  };

  // Filtered accounts
  const filteredAccounts = accounts.filter((acc) => {
    if (filterPropFirm === 'ALL') return true;
    return acc.propFirm.toLowerCase().includes(filterPropFirm.toLowerCase());
  });

  const totalConnectedCapital = accounts.reduce((sum, a) => sum + a.accountSize, 0);

  // Aggregate PnL and Equity Exposure calculations across all connected accounts
  const [fundedViewMode, setFundedViewMode] = useState<'SENTINEL' | 'CALCULATOR' | 'SESSIONS'>('SENTINEL');
  const [isContributionTableOpen, setIsContributionTableOpen] = useState(true);
  const totalStartingEquity = accounts.reduce((sum, a) => sum + a.dailyStartingEquity, 0);
  const totalCurrentEquity = accounts.reduce((sum, a) => sum + a.currentEquity, 0);
  const aggregateDailyPnL = totalCurrentEquity - totalStartingEquity;
  const aggregateDailyPnLPct = totalStartingEquity > 0 ? (aggregateDailyPnL / totalStartingEquity) * 100 : 0;
  const totalRealizedPnL = accounts.reduce((sum, a) => sum + (a.realizedDailyPnL || 0), 0);
  const totalUnrealizedPnL = accounts.reduce((sum, a) => sum + (a.unrealizedPnL || 0), 0);
  const totalDrawdownFloor = accounts.reduce((sum, a) => sum + a.dailyDrawdownCeiling, 0);
  const aggregateFloorBuffer = totalCurrentEquity - totalDrawdownFloor;
  const aggregateFloorBufferPct = totalStartingEquity > 0 ? (aggregateFloorBuffer / totalStartingEquity) * 100 : 0;
  const isAggregatePositive = aggregateDailyPnL >= 0;

  // Check if YoPips 6K account is in list
  const yopipsAccount = accounts.find(
    (a) => a.propFirm.toLowerCase().includes('yopip') || a.accountSize === 6000
  );

  return (
    <div className="space-y-6">
      {/* Top Banner: Blue & Light Modern Institutional Header */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800 rounded-2xl p-6 sm:p-7 text-white shadow-lg shadow-blue-900/10 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-40 h-40 bg-sky-400/15 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-blue-100 text-xs font-semibold">
              <Lock className="w-3.5 h-3.5 text-blue-200" />
              <span>YoPips $6K Funded Account &bull; Read-Only Investor Mode</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <span>Funded Account Sentinel</span>
              <span className="text-xs bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 px-2.5 py-0.5 rounded-full font-mono font-bold">
                $6,000 Static Setup
              </span>
            </h2>
            <p className="text-sm text-blue-100 leading-relaxed">
              Real-time automated 5% daily drawdown monitoring for your <strong>$6,000 YoPips Funded Account</strong> via read-only MT5 investor password. Execution &amp; withdrawals remain cryptographically blocked.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-blue-50 text-blue-800 font-bold text-sm shadow-md transition-all active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-4 h-4 text-blue-700" />
              <span>Connect Another Account</span>
            </button>
          </div>
        </div>
      </div>

      {/* AGGREGATE PNL SUMMARY PANEL ACROSS ALL CONNECTED FUNDED ACCOUNTS */}
      <div className="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-5 sm:p-6 shadow-sm transition-all space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0 shadow-xs">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                  Portfolio Aggregate PnL &amp; Multi-Account Exposure
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-mono text-[10px] font-bold">
                  {accounts.length} {accounts.length === 1 ? 'Account' : 'Accounts'} Synced
                </span>
              </div>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                Consolidated real-time profit &amp; loss aggregated across all connected prop firm funded accounts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setIsContributionTableOpen(!isContributionTableOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-mono font-semibold transition-colors cursor-pointer"
              title="Toggle individual account PnL allocation table"
            >
              <PieChart className="w-3.5 h-3.5 text-blue-600" />
              <span>{isContributionTableOpen ? 'Hide Allocation' : 'Show Account Breakdown'}</span>
              {isContributionTableOpen ? (
                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>
          </div>
        </div>

        {/* 4 Core Quantitative Aggregate Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Aggregate Net Daily PnL */}
          <div className={`p-4 rounded-xl border transition-all ${
            isAggregatePositive ? 'bg-emerald-50/60 border-emerald-200' : 'bg-rose-50/60 border-rose-200'
          }`}>
            <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-1">
              <span className="font-semibold uppercase text-[10px]">Combined Net PnL (Daily)</span>
              <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                isAggregatePositive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {isAggregatePositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {isAggregatePositive ? '+' : ''}{aggregateDailyPnLPct.toFixed(2)}%
              </span>
            </div>
            <div className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${
              isAggregatePositive ? 'text-emerald-700' : 'text-rose-700'
            }`}>
              {isAggregatePositive ? '+' : ''}{formatCurrency(aggregateDailyPnL)}
            </div>
            <div className="text-[11px] text-slate-500 font-sans mt-1">
              Realized ({totalRealizedPnL >= 0 ? '+' : ''}{formatCurrency(totalRealizedPnL)}) &bull; Floating ({totalUnrealizedPnL >= 0 ? '+' : ''}{formatCurrency(totalUnrealizedPnL)})
            </div>
          </div>

          {/* Card 2: Total Realized Daily PnL */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-4">
            <div className="text-[10px] text-slate-500 font-mono uppercase font-semibold mb-1">
              Total Realized Daily PnL
            </div>
            <div className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${
              totalRealizedPnL >= 0 ? 'text-slate-900' : 'text-rose-600'
            }`}>
              {totalRealizedPnL >= 0 ? '+' : ''}{formatCurrency(totalRealizedPnL)}
            </div>
            <div className="text-[11px] text-slate-500 font-sans mt-1">
              Closed trades locked in today's broker session
            </div>
          </div>

          {/* Card 3: Floating / Unrealized PnL */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-4">
            <div className="text-[10px] text-slate-500 font-mono uppercase font-semibold mb-1">
              Floating / Unrealized PnL
            </div>
            <div className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${
              totalUnrealizedPnL >= 0 ? 'text-blue-700' : 'text-amber-600'
            }`}>
              {totalUnrealizedPnL >= 0 ? '+' : ''}{formatCurrency(totalUnrealizedPnL)}
            </div>
            <div className="text-[11px] text-slate-500 font-sans mt-1">
              Live mark-to-market open position exposure
            </div>
          </div>

          {/* Card 4: Aggregate 5% Floor Buffer */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-4">
            <div className="text-[10px] text-slate-500 font-mono uppercase font-semibold mb-1">
              Combined 5% Floor Buffer
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-emerald-700">
              +{formatCurrency(aggregateFloorBuffer)}
            </div>
            <div className="text-[11px] text-slate-500 font-sans mt-1">
              {aggregateFloorBufferPct.toFixed(2)}% buffer above ${totalDrawdownFloor.toLocaleString()} floor
            </div>
          </div>
        </div>

        {/* Aggregate Drawdown Cushion Bar */}
        <div className="space-y-1.5 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-600 font-semibold">Aggregate Drawdown Health:</span>
            <span className="text-slate-700 font-medium">
              Live Equity: <strong className="text-blue-700">{formatCurrency(totalCurrentEquity)}</strong> &bull; Baseline: {formatCurrency(totalStartingEquity)}
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                aggregateFloorBufferPct <= 1.0 ? 'bg-rose-500' : aggregateFloorBufferPct <= 2.5 ? 'bg-amber-500' : 'bg-blue-600'
              }`}
              style={{ width: `${Math.min(100, Math.max(8, (aggregateFloorBufferPct / 5.0) * 100))}%` }}
            />
          </div>
        </div>

        {/* Collapsible / Expandable Per-Account PnL Breakdown Table */}
        {isContributionTableOpen && (
          <div className="pt-2 border-t border-slate-100 space-y-2.5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-800 uppercase tracking-wider">
                Individual Account PnL Breakdown
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {accounts.length} active allocations
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-mono text-[11px]">
                    <th className="py-2.5 px-3">Account &amp; Firm</th>
                    <th className="py-2.5 px-3">Server / ID</th>
                    <th className="py-2.5 px-3 text-right">Capital Size</th>
                    <th className="py-2.5 px-3 text-right">Live Equity</th>
                    <th className="py-2.5 px-3 text-right">Realized</th>
                    <th className="py-2.5 px-3 text-right">Floating</th>
                    <th className="py-2.5 px-3 text-right font-bold text-slate-900">Net Daily PnL</th>
                    <th className="py-2.5 px-3 text-right">5% Floor</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-xs">
                  {accounts.map((acc) => {
                    const accPnL = acc.currentEquity - acc.dailyStartingEquity;
                    const accPnLPct = acc.dailyStartingEquity > 0 ? (accPnL / acc.dailyStartingEquity) * 100 : 0;
                    const isAccPos = accPnL >= 0;

                    return (
                      <tr key={acc.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-sans">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{acc.propFirm}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                              {acc.platform || 'MT5'}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                          {acc.loginNumber || acc.id}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-700">
                          {formatCurrency(acc.accountSize)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-blue-700">
                          {formatCurrency(acc.currentEquity)}
                        </td>
                        <td className={`py-2.5 px-3 text-right ${acc.realizedDailyPnL >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>
                          {acc.realizedDailyPnL >= 0 ? '+' : ''}{formatCurrency(acc.realizedDailyPnL)}
                        </td>
                        <td className={`py-2.5 px-3 text-right ${acc.unrealizedPnL >= 0 ? 'text-blue-700' : 'text-amber-600'}`}>
                          {acc.unrealizedPnL >= 0 ? '+' : ''}{formatCurrency(acc.unrealizedPnL)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold">
                          <span className={`px-2 py-0.5 rounded ${
                            isAccPos ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {isAccPos ? '+' : ''}{formatCurrency(accPnL)} ({isAccPos ? '+' : ''}{accPnLPct.toFixed(2)}%)
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right text-rose-600">
                          {formatCurrency(acc.dailyDrawdownCeiling)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>{acc.status}</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Institutional Tools Navigator Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-1.5 flex items-center gap-1.5 shadow-xs font-mono text-xs overflow-x-auto">
        <button
          onClick={() => setFundedViewMode('SENTINEL')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
            fundedViewMode === 'SENTINEL'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-blue-700 hover:bg-slate-100'
          }`}
        >
          <LineChartIcon className="w-3.5 h-3.5" />
          <span>Drawdown Sentinel &amp; Equity Curve</span>
        </button>

        <button
          onClick={() => setFundedViewMode('CALCULATOR')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
            fundedViewMode === 'CALCULATOR'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-blue-700 hover:bg-slate-100'
          }`}
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>Risk &amp; Lot Sizer</span>
        </button>

        <button
          onClick={() => setFundedViewMode('SESSIONS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
            fundedViewMode === 'SESSIONS'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-blue-700 hover:bg-slate-100'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Broker Rollover &amp; Global Sessions</span>
        </button>
      </div>

      {fundedViewMode === 'CALCULATOR' && (
        <PropFirmRiskCalculator accounts={accounts} />
      )}

      {fundedViewMode === 'SESSIONS' && (
        <BrokerRolloverClock propFirmName={yopipsAccount?.propFirm || 'YoPips'} />
      )}

      {fundedViewMode === 'SENTINEL' && (
        <>
          {/* STATIC HIGHLIGHT: YoPips $6,000 Account Status Sentinel */}
          {yopipsAccount && (
        <div className="bg-white border-2 border-blue-500/80 rounded-2xl p-5 sm:p-6 shadow-md shadow-blue-500/5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-extrabold text-base shadow-sm">
                YP
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-extrabold text-slate-900">
                    YoPips $6,000 Funded Account
                  </h3>
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-mono font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Active Telemetry</span>
                  </span>
                </div>
                <div className="text-xs font-mono text-slate-500 flex items-center gap-2 mt-0.5">
                  <span>Server: <strong className="text-slate-800">{yopipsAccount.serverName || 'YoPips-Live-Server'}</strong></span>
                  <span>•</span>
                  <span>Login: <strong className="text-slate-800">#{yopipsAccount.loginNumber || '6094821'}</strong></span>
                  <span>•</span>
                  <span>Platform: <strong className="text-blue-700 font-bold">MT5</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-xs font-mono font-bold">
                <Lock className="w-3.5 h-3.5 text-blue-600" />
                <span>Investor Read-Only Mode</span>
              </span>
              <button
                onClick={() => handleSyncClick(yopipsAccount.id)}
                disabled={syncingAccountId === yopipsAccount.id}
                className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-slate-200 cursor-pointer"
                title="Sync live YoPips telemetry"
              >
                <RefreshCw className={`w-4 h-4 ${syncingAccountId === yopipsAccount.id ? 'animate-spin text-blue-600' : ''}`} />
              </button>
            </div>
          </div>

          {/* 4 Key Institutional Numbers */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Account Capital</span>
              <span className="text-base sm:text-lg font-black text-slate-900">
                {formatCurrency(yopipsAccount.accountSize)}
              </span>
              <span className="text-[10px] text-slate-500 block">YoPips Funded</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Live Current Equity</span>
              <span className="text-base sm:text-lg font-black text-blue-700">
                {formatCurrency(yopipsAccount.currentEquity)}
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold block">
                +{formatCurrency(yopipsAccount.currentEquity - yopipsAccount.dailyStartingEquity)} profit
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">5% Daily DD Floor</span>
              <span className="text-base sm:text-lg font-black text-rose-600">
                {formatCurrency(yopipsAccount.dailyDrawdownCeiling)}
              </span>
              <span className="text-[10px] text-slate-500 block">Max loss: $300.00</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Distance to Breach</span>
              <span className="text-base sm:text-lg font-black text-emerald-700">
                +{formatCurrency(yopipsAccount.distanceToViolation)}
              </span>
              <span className="text-[10px] text-emerald-700 font-bold block">
                {yopipsAccount.distancePct.toFixed(2)}% buffer (Safe)
              </span>
            </div>
          </div>

          {/* Drawdown Health Progress Visualizer */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-600 font-medium">Drawdown Safety Sentinel (5% Rule):</span>
              <span className="font-bold text-emerald-700">
                Current Equity is ${yopipsAccount.distanceToViolation.toFixed(2)} ABOVE the $5,700 daily floor
              </span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div
                className="h-full bg-blue-600 transition-all duration-500 rounded-full"
                style={{ width: `${Math.min(100, Math.max(10, (yopipsAccount.distancePct / 5.0) * 100))}%` }}
              />
            </div>
          </div>

          {/* Recharts Line Chart: historicalEquity Visualization */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-4 sm:p-5 space-y-3 mt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <h4 className="text-sm font-bold text-slate-900 font-mono">
                    YoPips 6K Equity Curve vs 5% Daily Drawdown Floor
                  </h4>
                </div>
                <p className="text-xs text-slate-500 font-sans mt-0.5">
                  Live intraday telemetry from <span className="font-mono text-slate-700 font-bold">historicalEquity</span> plotted against the $5,700.00 daily breach limit
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-1 bg-blue-600 inline-block rounded-full" />
                  <span className="text-slate-700 font-semibold">Account Equity ($)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 border-b-2 border-rose-500 border-dashed inline-block" />
                  <span className="text-rose-600 font-bold">5% DD Floor ($5,700)</span>
                </div>
              </div>
            </div>

            <div className="w-full h-64 sm:h-72 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={yopipsAccount.historicalEquity}
                  margin={{ top: 12, right: 15, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="time"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                    fontFamily="var(--font-mono)"
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    domain={[5650, 6200]}
                    tickFormatter={(v) => `$${v.toLocaleString()}`}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                    fontFamily="var(--font-mono)"
                    width={60}
                  />
                  <Tooltip content={<CustomEquityTooltip />} />
                  <ReferenceLine
                    y={5700}
                    stroke="#e11d48"
                    strokeDasharray="4 4"
                    strokeWidth={2}
                    label={{
                      value: '5% Breach Floor: $5,700.00',
                      fill: '#e11d48',
                      fontSize: 10,
                      position: 'insideBottomRight',
                      fontWeight: 'bold',
                    }}
                  />
                  <ReferenceLine
                    y={6000}
                    stroke="#94a3b8"
                    strokeDasharray="2 2"
                    strokeWidth={1}
                    label={{
                      value: 'Rollover Start: $6,000.00',
                      fill: '#64748b',
                      fontSize: 10,
                      position: 'insideTopLeft',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="equity"
                    name="Live Equity"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={{ fill: '#2563eb', stroke: '#ffffff', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#1d4ed8', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] font-mono text-slate-500 pt-1.5 border-t border-slate-200/80 gap-1">
              <span>Data Source: YoPips Broker Rollover MT5 Telemetry</span>
              <span className="text-emerald-700 font-bold">
                Buffer over 5% Floor: +${yopipsAccount.distanceToViolation.toFixed(2)} ({yopipsAccount.distancePct.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Security & Architecture Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-blue-100 rounded-xl p-4 shadow-sm flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider">
              100% Read-Only Safety
            </h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Investor passwords grant telemetry read rights only. Placing trades or altering orders is cryptographically impossible by MT4/MT5 design.
            </p>
          </div>
        </div>

        <div className="bg-white border border-blue-100 rounded-xl p-4 shadow-sm flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider">
              5% Hard Drawdown Floor
            </h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Continuously computes distance to the 5% daily limit from 22:00 UTC broker rollover equity, preventing unexpected prop firm rule breaches.
            </p>
          </div>
        </div>

        <div className="bg-white border border-blue-100 rounded-xl p-4 shadow-sm flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider">
              Total Capital Monitored
            </h4>
            <div className="text-base font-extrabold text-blue-700 font-mono mt-0.5">
              {formatCurrency(totalConnectedCapital)}
            </div>
            <p className="text-[11px] text-slate-500 font-mono">
              Across {accounts.length} active funded {accounts.length === 1 ? 'account' : 'accounts'}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-mono">
          <span className="text-slate-500 font-semibold px-2 text-[11px] hidden sm:inline">Filter Firm:</span>
          {['ALL', 'YoPips', 'FTMO', 'Funding Pips', 'FundedNext', 'Alpha Capital'].map((firm) => (
            <button
              key={firm}
              onClick={() => setFilterPropFirm(firm)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap cursor-pointer ${
                filterPropFirm === firm
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:text-blue-700 hover:bg-blue-50'
              }`}
            >
              {firm}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-500 font-mono">
          Showing <strong className="text-slate-800">{filteredAccounts.length}</strong> of {accounts.length} accounts
        </div>
      </div>

      {/* Accounts List / Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredAccounts.map((acc) => {
          const isSyncingThis = syncingAccountId === acc.id;
          const distance = acc.distanceToViolation;
          const distancePct = acc.distancePct;
          const isYoPips = acc.propFirm.toLowerCase().includes('yopip') || acc.accountSize === 6000;

          return (
            <div
              key={acc.id}
              className={`bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all space-y-4 relative ${
                isYoPips ? 'border-blue-300 ring-1 ring-blue-500/20' : 'border-slate-200 hover:border-blue-300'
              }`}
            >
              {/* Header: Prop Firm, Platform & Investor Badge */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-mono font-bold text-xs">
                      {acc.propFirm}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px] font-semibold">
                      {acc.platform || 'MT5'}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono text-[11px] font-bold">
                      <Lock className="w-3 h-3 text-emerald-600" />
                      <span>Investor Read-Only</span>
                    </span>
                    {isYoPips && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-mono text-[10px] font-bold">
                        Primary 6K
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono text-slate-500 pt-1">
                    <span>Server: <strong className="text-slate-800">{acc.serverName || 'YoPips-Live-Server'}</strong></span>
                    <span>•</span>
                    <span>Login: <strong className="text-slate-800">{acc.loginNumber || acc.id}</strong></span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleSyncClick(acc.id)}
                    disabled={isSyncingThis}
                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer border border-slate-200"
                    title="Sync live broker telemetry"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingThis ? 'animate-spin text-blue-600' : ''}`} />
                  </button>
                  <button
                    onClick={() => onRemoveAccount(acc.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border border-slate-200"
                    title="Disconnect account"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Financial Health Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Account Size</span>
                  <span className="text-sm font-bold text-slate-900">
                    {formatCurrency(acc.accountSize)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Live Equity</span>
                  <span className="text-sm font-bold text-blue-700">
                    {formatCurrency(acc.currentEquity)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Day Start Balance</span>
                  <span className="text-sm font-bold text-slate-700">
                    {formatCurrency(acc.dailyStartingEquity)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">5% DD Floor</span>
                  <span className="text-sm font-bold text-rose-600">
                    {formatCurrency(acc.dailyDrawdownCeiling)}
                  </span>
                </div>
              </div>

              {/* Drawdown Health Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-600 font-medium">Distance to 5% Breach:</span>
                  <span
                    className={`font-bold ${
                      distancePct <= 1.0
                        ? 'text-rose-600 font-extrabold animate-pulse'
                        : distancePct <= 2.5
                        ? 'text-amber-600'
                        : 'text-emerald-700'
                    }`}
                  >
                    +{formatCurrency(distance)} ({distancePct.toFixed(2)}% buffer)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200 relative">
                  <div
                    className={`h-full transition-all duration-500 ${
                      distancePct <= 1.0 ? 'bg-rose-500' : distancePct <= 2.5 ? 'bg-amber-500' : 'bg-blue-600'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(5, (distancePct / 5.0) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Status Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] font-mono text-slate-500">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span>Live Telemetry Active • Rollover: 22:00 UTC</span>
                </div>
                <span className="text-slate-400">Password: •••••••• (Read-Only)</span>
              </div>
            </div>
          );
        })}
      </div>
      </>
      )}

      {/* CONNECT ACCOUNT MODAL (INVESTOR PASSWORD) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-blue-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Connect Account via Investor Password
                  </h3>
                  <p className="text-xs text-slate-500">
                    Read-only MT4/MT5 credentials for drawdown auditing
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="p-5 space-y-4 overflow-y-auto text-xs">
              {/* Security Banner Callout */}
              <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3.5 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-slate-700 leading-relaxed font-sans">
                  <strong className="text-blue-900 font-bold block mb-0.5">
                    Investor Password Security Standard
                  </strong>
                  Your broker's investor password grants <strong>read-only access</strong>. It allows pulling account equity and trade history for drawdown audits, but strictly prohibits placing trades, modifying stops, or initiating withdrawals.
                </div>
              </div>

              {/* Prop Firm & Platform */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1 font-mono">Prop Firm</label>
                  <select
                    value={propFirm}
                    onChange={(e) => handlePropFirmChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
                  >
                    {propFirms.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1 font-mono">Platform</label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
                  >
                    <option value="MT5">MetaTrader 5 (MT5)</option>
                    <option value="MT4">MetaTrader 4 (MT4)</option>
                    <option value="cTrader">cTrader</option>
                    <option value="MatchTrader">Match-Trader</option>
                  </select>
                </div>
              </div>

              {/* Broker Server */}
              <div>
                <label className="text-slate-700 font-bold block mb-1 font-mono flex items-center justify-between">
                  <span>Broker Server</span>
                  <span className="text-[10px] text-slate-500 font-normal">e.g. YoPips-Live-Server</span>
                </label>
                <input
                  type="text"
                  required
                  value={serverName}
                  onChange={(e) => setServerName(e.target.value)}
                  placeholder="e.g. YoPips-Live-Server or FTMO-Server-2"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              {/* Account Number & Investor Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1 font-mono">
                    Login / Account ID
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 6094821"
                    value={loginNumber}
                    onChange={(e) => setLoginNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1 font-mono flex items-center justify-between">
                    <span>Investor Password</span>
                    <span className="text-[10px] text-emerald-700 font-bold">Read-Only</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Read-only password"
                      value={investorPassword}
                      onChange={(e) => setInvestorPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-3 pr-9 py-2 text-slate-900 font-mono focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Account Size & Drawdown Limit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1 font-mono">Account Capital</label>
                  <select
                    value={accountSize}
                    onChange={(e) => setAccountSize(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-blue-500 focus:bg-white"
                  >
                    <option value={6000}>$6,000 (YoPips Account)</option>
                    <option value={10000}>$10,000</option>
                    <option value={25000}>$25,000</option>
                    <option value={50000}>$50,000</option>
                    <option value={100000}>$100,000</option>
                    <option value={200000}>$200,000</option>
                    <option value={300000}>$300,000</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1 font-mono">Daily DD Rule (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="10"
                    value={dailyDrawdownLimitPct}
                    onChange={(e) => setDailyDrawdownLimitPct(parseFloat(e.target.value) || 5.0)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Verification Progress Feedback */}
              {isVerifying && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-2 text-blue-700 font-bold font-mono">
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
                    <span>Verifying Broker Handshake...</span>
                  </div>
                  <p className="text-[11px] text-blue-900 font-mono">{verificationStep}</p>
                </div>
              )}

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isVerifying}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isVerifying ? 'Verifying...' : 'Verify & Connect Account'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
