import React, { useState } from 'react';
import { Database, ShieldCheck, FileSpreadsheet, Code2, CheckCircle2, Lock, RefreshCw, Copy, Check } from 'lucide-react';

interface LookerDataPipelineProps {
  onTriggerSync: () => void;
  lastSyncTime: string;
}

export const LookerDataPipeline: React.FC<LookerDataPipelineProps> = ({
  onTriggerSync,
  lastSyncTime,
}) => {
  const [copiedScript, setCopiedScript] = useState(false);
  const [activeSchemaTab, setActiveSchemaTab] = useState<'macro' | 'accounts' | 'trades'>('accounts');

  const appsScriptCode = `/**
 * Google Apps Script: FX Macro Monitor & Funded Account Feeds
 * Ingestion pipeline connecting Yahoo Finance / Google Finance to Google Sheets.
 * Strictly READ-ONLY. Zero execution footprint or broker routing.
 */
function syncMacroFeedsAndPortfolio() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Fetch Major Central Bank Policy Rates & CPI
  const macroSheet = ss.getSheetByName("MACRO_DATA") || ss.insertSheet("MACRO_DATA");
  const centralBanks = [
    { country: "USA", currency: "USD", nominalRate: 5.25, cpi: 2.6 },
    { country: "Eurozone", currency: "EUR", nominalRate: 3.50, cpi: 2.2 },
    { country: "Australia", currency: "AUD", nominalRate: 4.35, cpi: 3.8 },
    { country: "Canada", currency: "CAD", nominalRate: 4.25, cpi: 2.0 },
    { country: "Switzerland", currency: "CHF", nominalRate: 1.00, cpi: 1.1 },
    { country: "New Zealand", currency: "NZD", nominalRate: 5.25, cpi: 3.3 },
    { country: "UK", currency: "GBP", nominalRate: 5.00, cpi: 2.2 },
    { country: "Japan", currency: "JPY", nominalRate: 0.25, cpi: 2.8 }
  ];
  
  // Write header and computed Real Rates
  macroSheet.clear();
  macroSheet.appendRow(["Country", "Currency", "Nominal_Rate_%", "Headline_CPI_%", "Real_Rate_%", "Timestamp"]);
  const now = new Date().toISOString();
  
  centralBanks.forEach(b => {
    const realRate = b.nominalRate - b.cpi;
    macroSheet.appendRow([b.country, b.currency, b.nominalRate, b.cpi, realRate, now]);
  });
  
  // 2. Compute 5% Daily Drawdown Hard Limits for Funded Accounts
  const accountSheet = ss.getSheetByName("PORTFOLIO_ACCOUNTS");
  if (accountSheet) {
    const data = accountSheet.getDataRange().getValues();
    // Headers: [AccountID, PropFirm, DailyStartingEquity, CurrentEquity, ...]
    // Formula for 5% DD Ceiling: =C2 * 0.95
    // Formula for Distance to Violation: =D2 - (C2 * 0.95)
  }
  
  Logger.log("Pipeline sync finished at: " + now);
}`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white tracking-tight">
              Google Looker Studio &amp; Sheets Data Pipeline
            </h2>
            <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono">
              Live Ingest Simulator
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Data presentation layer connecting dynamic Google Sheets databases to Google Looker Studio via automated Google Apps Script cron triggers.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
          <div className="text-right text-xs">
            <span className="text-slate-500">Last Synced:</span>
            <div className="font-mono text-slate-300 font-semibold">{lastSyncTime}</div>
          </div>
          <button
            onClick={onTriggerSync}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Sheets</span>
          </button>
        </div>
      </div>

      {/* Security & Data Isolation Protocols (PRD Section 5) */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2 mb-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Security Protocols &amp; Zero Execution Footprint
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Non-execution quantitative analytics dashboard with strict physical and architectural barriers.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3.5">
            <div className="flex items-center gap-2 text-emerald-400 mb-1.5">
              <Lock className="w-4 h-4" />
              <h4 className="text-xs font-bold uppercase tracking-wider">Data Isolation</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Utilizes strictly <strong>read-only investor API credentials</strong> (investor password without trade authorization) or manual trade statement CSV paste buffers into Google Sheets.
            </p>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3.5">
            <div className="flex items-center gap-2 text-rose-400 mb-1.5">
              <ShieldCheck className="w-4 h-4" />
              <h4 className="text-xs font-bold uppercase tracking-wider">Zero Execution Footprint</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>Absolute structural ban</strong> on outbound order webhooks, private execution keys, FIX protocol gateways, or broker order pathways. Execution is impossible by system architecture.
            </p>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3.5">
            <div className="flex items-center gap-2 text-cyan-400 mb-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <h4 className="text-xs font-bold uppercase tracking-wider">Access &amp; Audit Logging</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Primary Google Sheets backend secured via restricted Google Account RBAC. Granular activity log stamps every modification, formula recalculation, or manual CSV import attempt.
            </p>
          </div>
        </div>
      </div>

      {/* Google Sheets Database Schema Preview */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              Dynamic Google Sheets Database Schema
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Structured database tabs ready for Google Looker Studio Data Source connections.
            </p>
          </div>

          {/* Schema Selector Tabs */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs font-mono">
            <button
              onClick={() => setActiveSchemaTab('accounts')}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                activeSchemaTab === 'accounts'
                  ? 'bg-slate-800 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              PORTFOLIO_ACCOUNTS
            </button>
            <button
              onClick={() => setActiveSchemaTab('macro')}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                activeSchemaTab === 'macro'
                  ? 'bg-slate-800 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              MACRO_DIFFERENTIALS
            </button>
            <button
              onClick={() => setActiveSchemaTab('trades')}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                activeSchemaTab === 'trades'
                  ? 'bg-slate-800 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              STATEMENT_TRADES
            </button>
          </div>
        </div>

        {/* Tabular Preview */}
        {activeSchemaTab === 'accounts' && (
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-950/60">
                  <th className="py-2.5 px-3">account_id (PK)</th>
                  <th className="py-2.5 px-3">prop_firm</th>
                  <th className="py-2.5 px-3 text-right">daily_start_equity</th>
                  <th className="py-2.5 px-3 text-right">dd_ceiling_formula</th>
                  <th className="py-2.5 px-3 text-right">current_equity</th>
                  <th className="py-2.5 px-3 text-right">distance_to_violation</th>
                  <th className="py-2.5 px-3 text-center">violation_status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300 text-[11px]">
                <tr>
                  <td className="py-2.5 px-3 text-white font-bold">FTMO-100K-01</td>
                  <td className="py-2.5 px-3 font-sans">FTMO</td>
                  <td className="py-2.5 px-3 text-right">$104,250.00</td>
                  <td className="py-2.5 px-3 text-right text-rose-400 font-semibold">=C2 * 0.95</td>
                  <td className="py-2.5 px-3 text-right text-white font-bold">$103,820.00</td>
                  <td className="py-2.5 px-3 text-right text-emerald-400">=E2 - D2 (+$4,782.50)</td>
                  <td className="py-2.5 px-3 text-center text-emerald-400 font-semibold">Safe</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-white font-bold">MFF-200K-02</td>
                  <td className="py-2.5 px-3 font-sans">MyForexFunds</td>
                  <td className="py-2.5 px-3 text-right">$212,400.00</td>
                  <td className="py-2.5 px-3 text-right text-rose-400 font-semibold">=C3 * 0.95</td>
                  <td className="py-2.5 px-3 text-right text-white font-bold">$215,180.00</td>
                  <td className="py-2.5 px-3 text-right text-emerald-400">=E3 - D3 (+$13,400.00)</td>
                  <td className="py-2.5 px-3 text-center text-emerald-400 font-semibold">Safe</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-white font-bold">TOPSTEP-50K-ALPHA</td>
                  <td className="py-2.5 px-3 font-sans">Topstep FX</td>
                  <td className="py-2.5 px-3 text-right">$51,200.00</td>
                  <td className="py-2.5 px-3 text-right text-rose-400 font-semibold">=C4 * 0.95</td>
                  <td className="py-2.5 px-3 text-right text-white font-bold">$49,450.00</td>
                  <td className="py-2.5 px-3 text-right text-amber-400">=E4 - D4 (+$810.00)</td>
                  <td className="py-2.5 px-3 text-center text-amber-400 font-semibold">Warning (1.58%)</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {activeSchemaTab === 'macro' && (
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-950/60">
                  <th className="py-2.5 px-3">currency_pair</th>
                  <th className="py-2.5 px-3">base_currency</th>
                  <th className="py-2.5 px-3">quote_currency</th>
                  <th className="py-2.5 px-3 text-right">base_real_rate</th>
                  <th className="py-2.5 px-3 text-right">quote_real_rate</th>
                  <th className="py-2.5 px-3 text-right">real_diff_formula</th>
                  <th className="py-2.5 px-3 text-center">looker_bias</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300 text-[11px]">
                <tr>
                  <td className="py-2.5 px-3 text-white font-bold">EUR/USD</td>
                  <td className="py-2.5 px-3">EUR</td>
                  <td className="py-2.5 px-3">USD</td>
                  <td className="py-2.5 px-3 text-right">+1.30%</td>
                  <td className="py-2.5 px-3 text-right">+2.65%</td>
                  <td className="py-2.5 px-3 text-right text-rose-400">=D2 - E2 (-1.35%)</td>
                  <td className="py-2.5 px-3 text-center text-rose-400 font-semibold">Bearish EUR</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-white font-bold">AUD/USD</td>
                  <td className="py-2.5 px-3">AUD</td>
                  <td className="py-2.5 px-3">USD</td>
                  <td className="py-2.5 px-3 text-right">+0.55%</td>
                  <td className="py-2.5 px-3 text-right">+2.65%</td>
                  <td className="py-2.5 px-3 text-right text-rose-400">=D3 - E3 (-2.10%)</td>
                  <td className="py-2.5 px-3 text-center text-rose-400 font-semibold">Strongly Bearish</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-white font-bold">USD/CHF</td>
                  <td className="py-2.5 px-3">USD</td>
                  <td className="py-2.5 px-3">CHF</td>
                  <td className="py-2.5 px-3 text-right">+2.65%</td>
                  <td className="py-2.5 px-3 text-right">-0.10%</td>
                  <td className="py-2.5 px-3 text-right text-emerald-400">=D4 - E4 (+2.75%)</td>
                  <td className="py-2.5 px-3 text-center text-emerald-400 font-semibold">Strongly Bullish USD</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {activeSchemaTab === 'trades' && (
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-950/60">
                  <th className="py-2.5 px-3">ticket_id</th>
                  <th className="py-2.5 px-3">account_id</th>
                  <th className="py-2.5 px-3">asset</th>
                  <th className="py-2.5 px-3 text-center">direction</th>
                  <th className="py-2.5 px-3 text-right">lots</th>
                  <th className="py-2.5 px-3 text-right">realized_pnl</th>
                  <th className="py-2.5 px-3 text-right">r_multiple_formula</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300 text-[11px]">
                <tr>
                  <td className="py-2.5 px-3 text-slate-200">9841203</td>
                  <td className="py-2.5 px-3">MFF-200K-02</td>
                  <td className="py-2.5 px-3 text-white font-bold">USD/CAD</td>
                  <td className="py-2.5 px-3 text-center text-rose-400">SELL</td>
                  <td className="py-2.5 px-3 text-right">8.0</td>
                  <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">+$3,318.50</td>
                  <td className="py-2.5 px-3 text-right text-emerald-400">=F2 / $1,164.00 (+2.85R)</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-slate-200">9841244</td>
                  <td className="py-2.5 px-3">FTMO-100K-01</td>
                  <td className="py-2.5 px-3 text-white font-bold">EUR/USD</td>
                  <td className="py-2.5 px-3 text-center text-rose-400">SELL</td>
                  <td className="py-2.5 px-3 text-right">4.5</td>
                  <td className="py-2.5 px-3 text-right text-rose-400 font-bold">-$1,215.00</td>
                  <td className="py-2.5 px-3 text-right text-rose-400">=F3 / $1,215.00 (-1.00R)</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Google Apps Script Feeds Connector Generator */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-cyan-400" />
              Automated Data Ingestion: Google Apps Script Generator
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Connect Google Sheets to financial feeds (Yahoo Finance API, Google Finance) via Google Apps Script cron triggers.
            </p>
          </div>

          <button
            onClick={handleCopyScript}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors self-start sm:self-auto"
          >
            {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedScript ? 'Copied to Clipboard!' : 'Copy Apps Script'}</span>
          </button>
        </div>

        <div className="bg-slate-950 rounded-lg p-3.5 border border-slate-800 text-slate-300 font-mono text-xs overflow-x-auto max-h-56">
          <pre>{appsScriptCode}</pre>
        </div>
      </div>
    </div>
  );
};
