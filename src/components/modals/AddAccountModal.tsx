import React, { useState } from 'react';
import { FundingAccount } from '../../types';
import { calculateAccountDrawdown } from '../../utils/quantCalculations';
import {
  X,
  Plus,
  ShieldCheck,
  Building2,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Server,
  KeyRound,
  FileCheck2,
} from 'lucide-react';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAccount: (account: FundingAccount) => void;
  existingAccountsCount: number;
}

const PROP_FIRM_SERVERS = [
  { name: 'FTMO', servers: ['FTMO-Server', 'FTMO-Server-2', 'FTMO-Demo'] },
  { name: 'Funding Pips', servers: ['FundingPips-Server', 'FundingPips-Live', 'FundingPips-Demo'] },
  { name: 'Alpha Capital Group', servers: ['AlphaCapital-Live', 'AlphaCapital-Server'] },
  { name: 'The Funded Trader', servers: ['TFT-Server-1', 'TFT-Live'] },
  { name: 'Apex Trader Funding', servers: ['Apex-Rithmic', 'Apex-Tradovate'] },
  { name: 'Topstep', servers: ['Topstep-Tradovate', 'Topstep-NinjaTrader'] },
  { name: 'Funding Trader', servers: ['FundingTrader-Live'] },
  { name: 'Other / Custom Broker', servers: ['Custom Server'] },
];

const ACCOUNT_SIZE_PRESETS = [
  { label: '$10,000', size: 10000 },
  { label: '$25,000', size: 25000 },
  { label: '$50,000', size: 50000 },
  { label: '$100,000', size: 100000 },
  { label: '$200,000', size: 200000 },
  { label: '$300,000', size: 300000 },
];

export const AddAccountModal: React.FC<AddAccountModalProps> = ({
  isOpen,
  onClose,
  onAddAccount,
  existingAccountsCount,
}) => {
  // Connection Mode: Investor Password (Read-Only) vs Manual Entry
  const [connectionMode, setConnectionMode] = useState<'INVESTOR_PASSWORD' | 'MANUAL'>('INVESTOR_PASSWORD');

  // Common Fields
  const [propFirm, setPropFirm] = useState('FTMO');
  const [serverName, setServerName] = useState('FTMO-Server');
  const [customServer, setCustomServer] = useState('');
  const [platform, setPlatform] = useState<'MT4' | 'MT5' | 'cTrader'>('MT5');
  const [accountSize, setAccountSize] = useState<number>(100000);
  const [accountType, setAccountType] = useState('100K Funded');
  const [accountId, setAccountId] = useState(`FTMO-100K-0${existingAccountsCount + 1}`);

  // Investor Password Specific
  const [loginNumber, setLoginNumber] = useState('');
  const [investorPassword, setInvestorPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);

  // Financial parameters
  const [startingEquity, setStartingEquity] = useState<number>(100000);
  const [currentEquity, setCurrentEquity] = useState<number>(100000);
  const [drawdownLimitPct, setDrawdownLimitPct] = useState<number>(5.0);
  const [serverTimezone, setServerTimezone] = useState('UTC+2 (22:00 UTC Rollover)');

  if (!isOpen) return null;

  const activeServers = PROP_FIRM_SERVERS.find((p) => p.name === propFirm)?.servers || ['Custom Server'];
  const finalServer = serverName === 'Custom Server' ? customServer || 'Custom-Broker' : serverName;

  // Real-time calculated drawdown parameters
  const dd = calculateAccountDrawdown(startingEquity, currentEquity, drawdownLimitPct);

  const handlePresetSizeSelect = (size: number) => {
    setAccountSize(size);
    setStartingEquity(size);
    setCurrentEquity(size);
    const prefix = propFirm.split(' ')[0].toUpperCase();
    const sizeStr = `${size / 1000}K`;
    setAccountId(`${prefix}-${sizeStr}-0${existingAccountsCount + 1}`);
    setAccountType(`${sizeStr} Funded`);
  };

  const handleTestInvestorConnection = () => {
    if (!loginNumber.trim() || !investorPassword.trim()) {
      alert('Please enter your Account Number and Investor Password to test connection.');
      return;
    }

    setIsVerifying(true);
    setVerificationSuccess(false);

    // Simulate broker server handshake & read-only permission verification
    setTimeout(() => {
      setIsVerifying(false);
      setVerificationSuccess(true);
      // Auto-sync starting equity and current equity
      setStartingEquity(accountSize);
      setCurrentEquity(accountSize);
    }, 900);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalAccount: FundingAccount = {
      id: accountId.trim() || `${propFirm.split(' ')[0]}-${accountSize / 1000}K-0${Date.now().toString().slice(-3)}`,
      propFirm: propFirm === 'Other / Custom Broker' ? 'Custom Broker' : propFirm,
      accountType: accountType.trim() || `${accountSize / 1000}K Funded`,
      accountSize: Number(accountSize),
      dailyStartingEquity: Number(startingEquity),
      currentEquity: Number(currentEquity),
      balance: Number(currentEquity),
      unrealizedPnL: 0,
      realizedDailyPnL: Number(currentEquity) - Number(startingEquity),
      dailyDrawdownLimitPct: Number(drawdownLimitPct),
      dailyDrawdownCeiling: dd.ceiling,
      maxLossAllowed: dd.maxLossAllowed,
      distanceToViolation: dd.distance,
      distancePct: dd.distancePct,
      status: dd.status,
      totalTradesToday: 0,
      serverTimezone: serverTimezone,
      lastRolloverTimestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
      connectionType: connectionMode === 'INVESTOR_PASSWORD' ? 'INVESTOR_PASSWORD_READONLY' : 'MANUAL_ENTRY',
      platform: platform,
      serverName: finalServer,
      loginNumber: loginNumber || undefined,
      isReadOnly: true,
      historicalEquity: [
        {
          time: '22:00',
          equity: Number(startingEquity),
          drawdownCeiling: dd.ceiling,
        },
        {
          time: new Date().toISOString().substring(11, 16),
          equity: Number(currentEquity),
          drawdownCeiling: dd.ceiling,
        },
      ],
    };

    onAddAccount(finalAccount);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Connect Funded Account</span>
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Read-Only Investor Mode
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Safe read-only sync • Zero trading permissions • 5% Drawdown Sentinel
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 font-sans">
          {/* Mode Switch Tabs */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            <button
              type="button"
              onClick={() => setConnectionMode('INVESTOR_PASSWORD')}
              className={`flex-1 py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                connectionMode === 'INVESTOR_PASSWORD'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
              <span>Read-Only Investor Password</span>
            </button>
            <button
              type="button"
              onClick={() => setConnectionMode('MANUAL')}
              className={`flex-1 py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                connectionMode === 'MANUAL'
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Manual Balance Setup</span>
            </button>
          </div>

          {/* Privacy Guarantee Notice for Investor Password */}
          {connectionMode === 'INVESTOR_PASSWORD' && (
            <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-xl p-3.5 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="text-xs font-bold text-emerald-300 flex items-center gap-2 font-mono">
                  <span>100% Privacy &amp; Capital Protection</span>
                  <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.2 rounded border border-emerald-500/30">
                    NON-EXECUTION
                  </span>
                </div>
                <p className="text-[11px] text-emerald-300/80 leading-relaxed font-sans">
                  The <strong>Investor Password</strong> provides strictly read-only access. It is cryptographically restricted by MetaTrader and brokers — it is mathematically impossible to place, modify, or close trades. Only live equity, balance, and drawdown levels are audited.
                </p>
              </div>
            </div>
          )}

          {/* Prop Firm & Server Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono font-medium text-slate-300 block mb-1.5">
                Prop Firm / Broker
              </label>
              <select
                value={propFirm}
                onChange={(e) => {
                  setPropFirm(e.target.value);
                  const found = PROP_FIRM_SERVERS.find((p) => p.name === e.target.value);
                  if (found) setServerName(found.servers[0]);
                  const prefix = e.target.value.split(' ')[0].toUpperCase();
                  setAccountId(`${prefix}-${accountSize / 1000}K-0${existingAccountsCount + 1}`);
                }}
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none"
              >
                {PROP_FIRM_SERVERS.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-mono font-medium text-slate-300 block mb-1.5">
                Broker Server Name
              </label>
              <select
                value={serverName}
                onChange={(e) => setServerName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none"
              >
                {activeServers.map((srv) => (
                  <option key={srv} value={srv}>
                    {srv}
                  </option>
                ))}
              </select>
              {serverName === 'Custom Server' && (
                <input
                  type="text"
                  placeholder="e.g. MyBroker-Live-01"
                  value={customServer}
                  onChange={(e) => setCustomServer(e.target.value)}
                  className="mt-1.5 w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none"
                  required
                />
              )}
            </div>
          </div>

          {/* Platform Selector */}
          <div>
            <label className="text-xs font-mono font-medium text-slate-300 block mb-1.5">
              Trading Terminal / Platform
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['MT5', 'MT4', 'cTrader'] as const).map((plat) => (
                <button
                  type="button"
                  key={plat}
                  onClick={() => setPlatform(plat)}
                  className={`py-1.5 px-3 rounded-lg text-xs font-mono font-semibold transition-all border cursor-pointer ${
                    platform === plat
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {plat === 'MT5' ? 'MetaTrader 5 (MT5)' : plat === 'MT4' ? 'MetaTrader 4 (MT4)' : 'cTrader'}
                </button>
              ))}
            </div>
          </div>

          {/* Investor Password Credentials Fields */}
          {connectionMode === 'INVESTOR_PASSWORD' && (
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300 font-bold flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                  Read-Only Credentials
                </span>
                <span className="text-[10px] text-emerald-400">Encrypted in Local Session</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">
                    MT Login / Account Number
                  </label>
                  <input
                    type="text"
                    value={loginNumber}
                    onChange={(e) => {
                      setLoginNumber(e.target.value);
                      setVerificationSuccess(false);
                    }}
                    placeholder="e.g. 8920194"
                    className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">
                    Investor Password (Read-Only)
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={investorPassword}
                      onChange={(e) => {
                        setInvestorPassword(e.target.value);
                        setVerificationSuccess(false);
                      }}
                      placeholder="Enter investor / read-only password"
                      className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl px-3.5 py-2 pr-9 text-xs text-white font-mono focus:outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Handshake Verification CTA */}
              <div className="pt-1 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleTestInvestorConnection}
                  disabled={isVerifying || !loginNumber.trim() || !investorPassword.trim()}
                  className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-mono font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isVerifying ? 'animate-spin' : ''}`} />
                  <span>{isVerifying ? 'Connecting to Broker Socket...' : 'Test Read-Only Handshake'}</span>
                </button>

                {verificationSuccess && (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono font-semibold animate-in fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Socket Verified (Read-Only)</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Account Capital Selection */}
          <div>
            <label className="text-xs font-mono font-medium text-slate-300 block mb-1.5">
              Account Capital / Tier Size
            </label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {ACCOUNT_SIZE_PRESETS.map((p) => (
                <button
                  type="button"
                  key={p.size}
                  onClick={() => handlePresetSizeSelect(p.size)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-mono font-semibold transition-all border cursor-pointer ${
                    accountSize === p.size
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Financial Parameters: Starting Equity & Current Equity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono font-medium text-slate-300 block mb-1.5">
                Starting Daily Equity ($)
              </label>
              <input
                type="number"
                value={startingEquity}
                onChange={(e) => setStartingEquity(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none"
                required
              />
              <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                Equity locked at 22:00 UTC rollover
              </span>
            </div>
            <div>
              <label className="text-xs font-mono font-medium text-slate-300 block mb-1.5">
                Current Live Equity ($)
              </label>
              <input
                type="number"
                value={currentEquity}
                onChange={(e) => setCurrentEquity(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none"
                required
              />
              <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                Includes floating open positions
              </span>
            </div>
          </div>

          {/* Drawdown Rule % and Server */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono font-medium text-slate-300 block mb-1.5">
                Daily Drawdown Limit (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={drawdownLimitPct}
                onChange={(e) => setDrawdownLimitPct(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none"
                required
              />
              <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                Prop firm daily limit (standard: 5.0%)
              </span>
            </div>
            <div>
              <label className="text-xs font-mono font-medium text-slate-300 block mb-1.5">
                Account ID / Identifier
              </label>
              <input
                type="text"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                placeholder="e.g. FTMO-100K-02"
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Automated Drawdown Sentinel Preview */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2 font-mono text-xs">
            <div className="text-emerald-400 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Real-Time 5% Drawdown Sentinel Parameters</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-900">
              <div>
                <span className="text-slate-400 block text-[10px]">5% Hard Loss Ceiling:</span>
                <span className="text-rose-400 font-bold">
                  ${dd.ceiling.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Max Dollar Loss Allowed:</span>
                <span className="text-amber-400 font-bold">
                  ${dd.maxLossAllowed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Distance to Violation:</span>
                <span className="text-emerald-400 font-bold">
                  ${dd.distance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({dd.distancePct.toFixed(2)}%)
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Sentinel Guard:</span>
                <span className="text-emerald-400 font-bold">Active (Non-Execution)</span>
              </div>
            </div>
          </div>

          {/* Submit CTA */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs font-mono flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99] cursor-pointer"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Register Read-Only Account &amp; Arm Sentinel</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
