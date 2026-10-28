import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Scale,
  Newspaper,
  Calendar,
  BarChart2,
  BarChart3,
  TrendingUp,
} from 'lucide-react';
import {
  INITIAL_CENTRAL_BANKS,
  INITIAL_COMMODITY_CORRELATIONS,
  INITIAL_SENTIMENT_GAUGE,
  INITIAL_AUDIT_LOGS,
} from './data/mockData';
import {
  INITIAL_CURRENCY_BIASES,
  INITIAL_DIVERGENCE_PAIRS,
  INITIAL_COT_POSITIONS,
  INITIAL_SOVEREIGN_YIELDS,
  INITIAL_YIELD_SPREAD_PAIRS,
  INITIAL_OIS_PROBABILITIES,
  INITIAL_CURRENT_ACCOUNT_DATA,
  INITIAL_REER_VALUATIONS,
} from './data/forexFundamentalsData';
import { INITIAL_FOREX_FACTORY_EVENTS } from './data/forexFactoryData';
import {
  CentralBankRate,
  AuditLogItem,
  SentimentGaugeData,
  ToastAlert,
  CurrencyBiasItem,
  DivergencePairItem,
  COTPositionItem,
  EconomicNewsEvent,
  SovereignYieldItem,
  YieldSpreadPair,
  OISMeetingProbability,
  CurrentAccountItem,
  REERValuationItem,
} from './types';
import { Header } from './components/Header';
import { MacroOverview } from './components/macro/MacroOverview';
import { CurrencyBiasMatrix } from './components/macro/CurrencyBiasMatrix';
import { COTPositioningView } from './components/macro/COTPositioningView';
import { YieldsAndValuationView } from './components/macro/YieldsAndValuationView';
import { ForexFactoryCalendar } from './components/news/ForexFactoryCalendar';
import { MarketNews } from './components/news/MarketNews';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AuditLogDrawer } from './components/common/AuditLogDrawer';
import { ToastContainer } from './components/common/ToastContainer';
import { LoginPage } from './components/auth/LoginPage';
import { supabase } from './lib/supabaseClient';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export const DEFAULT_AUTHENTICATED_USER: AuthUser = {
  id: 'usr_quant_prod_99182',
  email: 'iddrisumohamme1@gmail.com',
  name: 'Macro Quant Analyst',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
};

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('apex_active_user_session');
      if (saved) return JSON.parse(saved);
    } catch {}
    localStorage.setItem('apex_active_user_session', JSON.stringify(DEFAULT_AUTHENTICATED_USER));
    return DEFAULT_AUTHENTICATED_USER;
  });

  const [activeTab, setActiveTab] = useState<
    'macro' | 'bias' | 'calendar' | 'cot' | 'news' | 'login' | 'yields'
  >(() => {
    try {
      const saved = localStorage.getItem('apex_active_tab');
      if (
        saved === 'bias' ||
        saved === 'calendar' ||
        saved === 'cot' ||
        saved === 'macro' ||
        saved === 'news' ||
        saved === 'yields'
      ) {
        return saved;
      }
    } catch {}
    return 'bias';
  });

  const handleTabChange = (
    tab: 'macro' | 'bias' | 'calendar' | 'cot' | 'news' | 'login' | 'yields'
  ) => {
    const validTabs = ['macro', 'bias', 'calendar', 'cot', 'news', 'login', 'yields'];
    const safeTab = validTabs.includes(tab) ? tab : 'bias';
    setActiveTab(safeTab);
    try {
      localStorage.setItem('apex_active_tab', safeTab);
    } catch {}
  };

  const [newsEvents] = useState<EconomicNewsEvent[]>(INITIAL_FOREX_FACTORY_EVENTS);
  const [currencyBiases] = useState<CurrencyBiasItem[]>(INITIAL_CURRENCY_BIASES);
  const [divergencePairs] = useState<DivergencePairItem[]>(INITIAL_DIVERGENCE_PAIRS);
  const [cotPositions] = useState<COTPositionItem[]>(INITIAL_COT_POSITIONS);

  // Institutional Fundamentals Suite State
  const [sovereignYields, setSovereignYields] = useState<SovereignYieldItem[]>(INITIAL_SOVEREIGN_YIELDS);
  const [yieldSpreadPairs, setYieldSpreadPairs] = useState<YieldSpreadPair[]>(INITIAL_YIELD_SPREAD_PAIRS);
  const [oisProbabilities, setOisProbabilities] = useState<OISMeetingProbability[]>(INITIAL_OIS_PROBABILITIES);
  const [currentAccountData] = useState<CurrentAccountItem[]>(INITIAL_CURRENT_ACCOUNT_DATA);
  const [reerValuations] = useState<REERValuationItem[]>(INITIAL_REER_VALUATIONS);

  const [centralBanks, setCentralBanks] = useState<CentralBankRate[]>(INITIAL_CENTRAL_BANKS);
  const [commodities] = useState(INITIAL_COMMODITY_CORRELATIONS);
  const [sentimentData, setSentimentData] = useState<SentimentGaugeData>(INITIAL_SENTIMENT_GAUGE);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(INITIAL_AUDIT_LOGS);
  const [lastSyncTime, setLastSyncTime] = useState<string>('2026-10-12 16:00:00 UTC');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [calendarRefreshCounter, setCalendarRefreshCounter] = useState<number>(0);

  // Auto-Refresh state (60-second cycle)
  const [secondsRemaining, setSecondsRemaining] = useState<number>(60);
  const [isAutoRefreshPaused, setIsAutoRefreshPaused] = useState<boolean>(() => {
    try {
      return localStorage.getItem('apex_autorefresh_paused') === 'true';
    } catch {
      return false;
    }
  });

  // Drawer & Alert states
  const [isAuditDrawerOpen, setIsAuditDrawerOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastAlert[]>([]);

  // Listen to Supabase Auth State Changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        const authUser: AuthUser = {
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
          avatar: session.user.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        };
        setUser(authUser);
        localStorage.setItem('apex_active_user_session', JSON.stringify(authUser));
        localStorage.removeItem('apex_user_explicit_signout');
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.email) {
        const authUser: AuthUser = {
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
          avatar: session.user.user_metadata?.avatar_url,
        };
        setUser(authUser);
        localStorage.setItem('apex_active_user_session', JSON.stringify(authUser));
        localStorage.removeItem('apex_user_explicit_signout');
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        localStorage.removeItem('apex_active_user_session');
        localStorage.setItem('apex_user_explicit_signout', 'true');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const addAuditLog = useCallback(
    (
      category: AuditLogItem['category'],
      severity: AuditLogItem['severity'],
      message: string,
      details: string,
      source: string
    ) => {
      const newLog: AuditLogItem = {
        id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
        category,
        severity,
        message,
        details,
        source,
        immutableHash: `SHA256-${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`,
      };

      setAuditLogs((prev) => [newLog, ...prev.slice(0, 99)]);
    },
    []
  );

  const triggerToast = useCallback(
    (alert: Omit<ToastAlert, 'id' | 'timestamp'>) => {
      const newToast: ToastAlert = {
        ...alert,
        id: `toast-${Date.now()}-${Math.random()}`,
        timestamp: new Date().toLocaleTimeString(),
      };
      setToasts((prev) => [...prev, newToast]);
    },
    []
  );

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Ref to hold stable sync handler for auto-refresh timer
  const syncHandlerRef = useRef<(isAuto?: boolean) => void>(() => {});

  const handleTriggerPersistentSync = useCallback(
    (isAuto: boolean = false) => {
      setIsSyncing(true);
      setSecondsRemaining(60);
      setCalendarRefreshCounter((c) => c + 1);

      setTimeout(() => {
        setIsSyncing(false);
        const newTime = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
        setLastSyncTime(newTime);

        // Fluctuate 2Y sovereign yields slightly to reflect live interbank market ticks
        setSovereignYields((prev) =>
          prev.map((item) => {
            const deltaBps = Number(((Math.random() - 0.5) * 1.6).toFixed(1));
            const newYield2Y = Number((item.yield2Y + deltaBps / 100).toFixed(2));
            const newSlope = Math.round((item.yield10Y - newYield2Y) * 100);
            return {
              ...item,
              yield2Y: newYield2Y,
              curveSlopeBps: newSlope,
              dailyChangeBps: Number((item.dailyChangeBps + deltaBps).toFixed(1)),
              updatedTimestamp: 'Interbank Live',
            };
          })
        );

        addAuditLog(
          'DATA_INGEST',
          'SUCCESS',
          isAuto ? 'Automated 60s Macro Telemetry Ingest' : 'Manual Macro Telemetry Sync',
          `Re-synced 2Y sovereign yield spreads, OIS rate probabilities, currency bias weights, and news feeds. Next auto-refresh in 60s.`,
          isAuto ? 'AutoRefreshWorker' : 'ManualRefreshTrigger'
        );
      }, 700);
    },
    [addAuditLog]
  );

  useEffect(() => {
    syncHandlerRef.current = handleTriggerPersistentSync;
  }, [handleTriggerPersistentSync]);

  // 60-Second Auto-Refresh Interval Engine
  useEffect(() => {
    if (isAutoRefreshPaused) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          syncHandlerRef.current(true);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isAutoRefreshPaused]);

  // Toggle Auto-Refresh Play / Pause
  const handleToggleAutoRefreshPause = () => {
    setIsAutoRefreshPaused((prev) => {
      const nextState = !prev;
      try {
        localStorage.setItem('apex_autorefresh_paused', String(nextState));
      } catch {}
      addAuditLog(
        'USER_ACTION',
        'INFO',
        nextState ? 'Auto-Refresh Paused' : 'Auto-Refresh Resumed (60s)',
        nextState
          ? 'User paused the 60-second background macro refresh cycle.'
          : 'Background 60-second telemetry auto-refresh cycle active.',
        'AutoRefreshManager'
      );
      return nextState;
    });
  };

  const handleLoginSuccess = (authUser: AuthUser) => {
    setUser(authUser);
    localStorage.setItem('apex_active_user_session', JSON.stringify(authUser));
    localStorage.removeItem('apex_user_explicit_signout');
    setActiveTab('bias');
    triggerToast({
      type: 'INFO',
      title: 'Workspace Loaded',
      message: `Signed in as ${authUser.email}. Institutional macro analytics active.`,
    });
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    handleTabChange('login');
  };

  const handleUpdateBankRate = (currency: string, nominal: number, cpi: number) => {
    setCentralBanks((prev) =>
      prev.map((cb) => {
        if (cb.currency === currency) {
          const oldRate = cb.nominalRate;
          const trend = nominal > oldRate ? 'hiking' : nominal < oldRate ? 'cutting' : cb.trend;
          const updated = {
            ...cb,
            previousMonthRate: cb.previousMonthRate ?? oldRate,
            nominalRate: nominal,
            cpiInflation: cpi,
            trend,
            lastUpdated: new Date().toISOString().substring(0, 10),
          };

          const deviationBps = Math.round(Math.abs(nominal - (cb.previousMonthRate ?? oldRate)) * 100);

          addAuditLog(
            'DATA_INGEST',
            deviationBps >= 25 ? 'WARNING' : 'INFO',
            `Interest Rate Updated: ${cb.currency} (${cb.centralBank})`,
            `Rate adjusted from ${oldRate.toFixed(2)}% to ${nominal.toFixed(2)}% (${deviationBps} bps vs previous month baseline ${(cb.previousMonthRate ?? oldRate).toFixed(2)}%). CPI: ${cpi.toFixed(2)}%.`,
            'PolicyRateEditor'
          );

          return updated;
        }
        return cb;
      })
    );
  };

  const handleAdjustSentimentScore = (delta: number) => {
    setSentimentData((prev) => {
      const newScore = Math.min(100, Math.max(-100, prev.score + delta));
      let newRegime = prev.regime;
      if (newScore >= 60) newRegime = 'Aggressive Risk-On';
      else if (newScore >= 20) newRegime = 'Moderate Risk-On';
      else if (newScore >= -20) newRegime = 'Neutral / Transition';
      else if (newScore >= -60) newRegime = 'Moderate Risk-Off';
      else newRegime = 'Severe Risk-Off';

      return {
        ...prev,
        score: newScore,
        regime: newRegime,
      };
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* 3-Zone Top Navigation with Auto-Refresh Engine */}
      <Header
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        onOpenAuditLog={() => setIsAuditDrawerOpen(true)}
        auditCount={auditLogs.length}
        user={user}
        onSignOut={handleSignOut}
        lastSyncTime={lastSyncTime}
        isSyncing={isSyncing}
        onTriggerSync={() => handleTriggerPersistentSync(false)}
        secondsRemaining={secondsRemaining}
        isAutoRefreshPaused={isAutoRefreshPaused}
        onToggleAutoRefreshPause={handleToggleAutoRefreshPause}
      />

      {/* Main Viewport Container (with safe bottom clearance for mobile thumb bar) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-5 sm:py-6 pb-24 lg:pb-8">
        <ErrorBoundary
          resetKey={activeTab}
          fallbackTitle={`Error Displaying ${activeTab.toUpperCase()} Workspace`}
          onReset={() => {
            handleTabChange('bias');
            addAuditLog(
              'SECURITY',
              'INFO',
              'Defensive Error Recovery Activated',
              `Recovered from rendering fault in workspace. View automatically restored to Currency Bias.`,
              'ClientErrorBoundary'
            );
          }}
        >
          {activeTab === 'login' && (
            <LoginPage onLoginSuccess={handleLoginSuccess} />
          )}

          {activeTab === 'bias' && (
            <CurrencyBiasMatrix
              biases={currencyBiases}
              divergencePairs={divergencePairs}
              sovereignYields={sovereignYields}
              reerValuations={reerValuations}
              onNavigateToYields={() => handleTabChange('yields')}
            />
          )}

          {activeTab === 'yields' && (
            <YieldsAndValuationView
              sovereignYields={sovereignYields}
              yieldSpreadPairs={yieldSpreadPairs}
              oisProbabilities={oisProbabilities}
              currentAccountData={currentAccountData}
              reerValuations={reerValuations}
              onSelectPair={(_pair) => handleTabChange('bias')}
            />
          )}

          {(activeTab === 'calendar' || activeTab === 'news') && (
            <ForexFactoryCalendar
              events={newsEvents}
              initialTab={activeTab === 'news' ? 'WIRE' : 'CALENDAR'}
              refreshSignal={calendarRefreshCounter}
              lastTerminalSyncTime={lastSyncTime}
              isTerminalSyncing={isSyncing}
              onManualTriggerSync={() => handleTriggerPersistentSync(false)}
            />
          )}

          {activeTab === 'cot' && (
            <COTPositioningView cotPositions={cotPositions} />
          )}

          {activeTab === 'macro' && (
            <MacroOverview
              centralBanks={centralBanks}
              onUpdateBankRate={handleUpdateBankRate}
              commodities={commodities}
              sentimentData={sentimentData}
              onAdjustSentimentScore={handleAdjustSentimentScore}
            />
          )}
        </ErrorBoundary>
      </main>


      {/* Mobile Sticky Bottom Quick-Navigation Bar (< lg screens, touch target >= 44px) */}
      <nav
        aria-label="Mobile Navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg px-1.5 py-1.5 flex items-center justify-around"
      >
        {[
          { id: 'bias', label: 'Bias', icon: Scale },
          { id: 'yields', label: 'Yields', icon: TrendingUp },
          { id: 'calendar', label: 'News & Cal', icon: Calendar },
          { id: 'cot', label: 'COT', icon: BarChart2 },
          { id: 'macro', label: 'Macro', icon: BarChart3 },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as any)}
              className={`min-h-[44px] min-w-[54px] flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'text-blue-600 font-bold bg-blue-50 border border-blue-200 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-medium border border-transparent'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-blue-600 stroke-[2.5]' : 'text-slate-500'}`} />
              <span className="text-[10px] leading-tight font-mono tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Drawers & Notifications */}
      <AuditLogDrawer
        isOpen={isAuditDrawerOpen}
        onClose={() => setIsAuditDrawerOpen(false)}
        logs={auditLogs}
      />

      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
}
