import React, { useState } from 'react';
import { ARCHITECTURE_COMPARISONS } from '../../data/mockData';
import { Server, Database, ShieldCheck, Zap, Layers, Code, CheckCircle, AlertCircle, Cpu, Network } from 'lucide-react';

interface ArchitectureTradeoffsProps {
  onNavigateToSupabaseDocs?: () => void;
}

export const ArchitectureTradeoffs: React.FC<ArchitectureTradeoffsProps> = ({
  onNavigateToSupabaseDocs,
}) => {
  const [activeCodeTab, setActiveCodeTab] = useState<'spring' | 'supabase'>('spring');
  const [selectedDimension, setSelectedDimension] = useState<number>(0);

  const springBootSampleCode = `// Spring Boot 3.3.x: Read-Only Investor Audit & Drawdown Service
package com.apex.quant.service;

import com.apex.quant.dto.AccountAuditResponse;
import com.apex.quant.model.FundingAccount;
import com.apex.quant.repository.FundingAccountRepository;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class FundedAccountAuditorService {

    private final FundingAccountRepository accountRepo;

    public FundedAccountAuditorService(FundingAccountRepository accountRepo) {
        this.accountRepo = accountRepo;
    }

    /**
     * Strictly READ-ONLY transaction with REPEATABLE_READ isolation
     * Prevents phantom reads during aggregate portfolio calculations.
     */
    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    @Cacheable(value = "accountAudits", key = "#accountId")
    public AccountAuditResponse auditAccountDrawdown(String accountId) {
        FundingAccount acc = accountRepo.findById(accountId)
            .orElseThrow(() -> new AccountNotFoundException(accountId));

        // Hard Equation: 5% Daily Drawdown Ceiling based on Rollover Equity
        BigDecimal ceiling = acc.getDailyStartingEquity()
            .multiply(BigDecimal.valueOf(0.95))
            .setScale(2, RoundingMode.HALF_UP);

        BigDecimal distanceToViolation = acc.getCurrentEquity().subtract(ceiling);
        BigDecimal distancePct = distanceToViolation
            .divide(acc.getDailyStartingEquity(), 4, RoundingMode.HALF_UP)
            .multiply(BigDecimal.valueOf(100));

        boolean isBreached = distanceToViolation.compareTo(BigDecimal.ZERO) <= 0;

        return AccountAuditResponse.builder()
            .accountId(acc.getId())
            .dailyStartingEquity(acc.getDailyStartingEquity())
            .dailyDrawdownCeiling(ceiling)
            .currentEquity(acc.getCurrentEquity())
            .distanceToViolation(distanceToViolation)
            .distancePercentage(distancePct)
            .status(isBreached ? "BREACHED" : distancePct.doubleValue() < 2.0 ? "WARNING" : "SAFE")
            .build();
    }
}`;

  const supabaseSqlSchema = `-- Supabase / PostgreSQL: Multi-Tenant Schema with Strict RLS & Read-Only Roles
-- 1. Create table for funded accounts
CREATE TABLE public.funding_accounts (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    prop_firm TEXT NOT NULL,
    account_size NUMERIC(12, 2) NOT NULL,
    daily_starting_equity NUMERIC(12, 2) NOT NULL,
    current_equity NUMERIC(12, 2) NOT NULL,
    daily_drawdown_limit_pct NUMERIC(4, 3) DEFAULT 0.050,
    -- Generated Column for 5% Daily Drawdown Ceiling
    daily_drawdown_ceiling NUMERIC(12, 2) GENERATED ALWAYS AS (daily_starting_equity * 0.95) STORED,
    -- Generated Column for Distance to Violation
    distance_to_violation NUMERIC(12, 2) GENERATED ALWAYS AS (current_equity - (daily_starting_equity * 0.95)) STORED,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.funding_accounts ENABLE ROW LEVEL SECURITY;

-- 3. Multi-Tenant RLS Policy: Users can only select their own funded accounts
CREATE POLICY "Users can only read own funded accounts"
    ON public.funding_accounts
    FOR SELECT
    USING (auth.uid() = user_id);

-- 4. Architectural Zero-Execution Role: Revoke any write abilities from dashboard role
CREATE ROLE auditor_readonly;
GRANT SELECT ON public.funding_accounts TO auditor_readonly;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.funding_accounts FROM auditor_readonly;

-- 5. Enable Realtime WAL streaming for live equity updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.funding_accounts;`;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white tracking-tight">
              Backend Architecture &amp; Database Trade-Offs
            </h2>
            <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono">
              React + Spring Boot + Supabase
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
            In-depth evaluation of using <strong>Supabase (PostgreSQL)</strong> alongside <strong>Spring Boot</strong> and <strong>React</strong>, analyzing data consistency (ACID guarantees, dual-writes, RLS) versus latency (network hops, pooling, caching).
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-1 rounded">
            PostgreSQL 15+ ACID Compliant
          </span>
          {onNavigateToSupabaseDocs && (
            <button
              onClick={onNavigateToSupabaseDocs}
              className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-colors whitespace-nowrap"
            >
              Supabase Breakdown &amp; Benchmark →
            </button>
          )}
        </div>
      </div>

      {/* System Architecture Topology Visual Map */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2 mb-2">
          <Network className="w-4 h-4 text-cyan-400" />
          Three-Tier System Architecture Topology
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          Clear separation between Client Presentation, Business Domain Logic (Spring Boot), and Persistent Data Engine (Supabase / Google Sheets).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
          {/* Tier 1: React Presentation */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4 relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">
                Tier 1: Presentation
              </span>
              <Layers className="w-4 h-4 text-cyan-400" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">React SPA + Looker Studio</h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Institutional quantitative UI, Looker Studio embedded views, client-side differential rendering, and Supabase Realtime WebSocket listeners.
            </p>
            <div className="text-[11px] font-mono text-slate-500 space-y-1">
              <div>· Latency: &lt;5ms local compute</div>
              <div>· State: TanStack Query / Realtime</div>
            </div>
          </div>

          {/* Tier 2: Spring Boot Backend */}
          <div className="bg-slate-950/80 border border-emerald-500/30 rounded-lg p-4 relative shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">
                Tier 2: Business Logic
              </span>
              <Server className="w-4 h-4 text-emerald-400" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">Spring Boot 3.3 Backend</h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Calculates hard risk rules (5% drawdown, mathematical expectancy), enforces strict read-only RBAC, and protects broker isolation.
            </p>
            <div className="text-[11px] font-mono text-slate-500 space-y-1">
              <div>· Latency: 10-25ms REST / gRPC</div>
              <div>· Isolation: REPEATABLE_READ</div>
            </div>
          </div>

          {/* Tier 3: Supabase Engine */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4 relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider">
                Tier 3: Database &amp; Storage
              </span>
              <Database className="w-4 h-4 text-amber-400" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">Supabase (PostgreSQL 15)</h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Full ACID transaction engine, Row-Level Security (RLS) multi-tenant isolation, Supavisor connection pooling, and WAL replication.
            </p>
            <div className="text-[11px] font-mono text-slate-500 space-y-1">
              <div>· Latency: 15-35ms p95 PostgREST</div>
              <div>· Consistency: Full ACID Postgres</div>
            </div>
          </div>
        </div>
      </div>

      {/* Trade-Offs Deep Dive Matrix: Consistency vs Latency */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2 mb-2">
          <Cpu className="w-4 h-4 text-emerald-400" />
          Technical Trade-Offs Matrix: Consistency vs. Latency
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Detailed evaluation answering whether Supabase is ideal for this quantitative auditor architecture.
        </p>

        {/* Dimension Selection */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-4">
          {ARCHITECTURE_COMPARISONS.map((comp, idx) => (
            <button
              key={comp.dimension}
              onClick={() => setSelectedDimension(idx)}
              className={`p-3 rounded-lg border text-left transition-all ${
                selectedDimension === idx
                  ? 'bg-slate-800 border-emerald-500/50 shadow-sm'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="text-xs font-bold text-slate-200">{comp.dimension}</div>
              <div className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                {comp.verdict}
              </div>
            </button>
          ))}
        </div>

        {/* Selected Dimension Detail Card */}
        {(() => {
          const active = ARCHITECTURE_COMPARISONS[selectedDimension];
          return (
            <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase">
                    Dimension Evaluation
                  </span>
                  <h4 className="text-base font-bold text-white">{active.dimension}</h4>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {active.verdict}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-slate-900/60 p-3 rounded border border-slate-800">
                  <div className="text-xs font-bold text-emerald-400 mb-1 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Supabase + Spring Boot
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {active.springBootSupabase}
                  </p>
                </div>

                <div className="bg-slate-900/60 p-3 rounded border border-slate-800">
                  <div className="text-xs font-bold text-slate-300 mb-1">
                    Traditional Self-Hosted Postgres
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {active.traditionalRelational}
                  </p>
                </div>

                <div className="bg-slate-900/60 p-3 rounded border border-slate-800">
                  <div className="text-xs font-bold text-amber-400 mb-1">
                    Google Sheets + Looker Studio
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {active.googleSheetsLooker}
                  </p>
                </div>
              </div>

              <div className="bg-slate-900/80 p-3 rounded border border-slate-800/80 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300 leading-relaxed">
                  <strong className="text-white">Quantitative Architect's Analysis:</strong>{' '}
                  {active.tradeOffAnalysis}
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Code Blueprints: Spring Boot & Supabase RLS */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <Code className="w-4 h-4 text-emerald-400" />
              Production Implementation Blueprints
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Production-ready Spring Boot 3 Java Service &amp; Supabase PostgreSQL DDL.
            </p>
          </div>

          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs font-mono">
            <button
              onClick={() => setActiveCodeTab('spring')}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                activeCodeTab === 'spring'
                  ? 'bg-slate-800 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Spring Boot Service
            </button>
            <button
              onClick={() => setActiveCodeTab('supabase')}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                activeCodeTab === 'supabase'
                  ? 'bg-slate-800 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Supabase SQL &amp; RLS
            </button>
          </div>
        </div>

        <div className="bg-slate-950 rounded-lg p-4 border border-slate-800 text-slate-300 font-mono text-xs overflow-x-auto max-h-80">
          <pre>{activeCodeTab === 'spring' ? springBootSampleCode : supabaseSqlSchema}</pre>
        </div>
      </div>
    </div>
  );
};
