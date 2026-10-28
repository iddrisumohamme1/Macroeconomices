import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  History,
  Menu,
  X,
  BarChart3,
  Scale,
  BarChart2,
  Calendar,
  LogOut,
  RefreshCw,
  UserCheck,
  ChevronRight,
  Newspaper,
  Play,
  Pause,
  Clock,
  TrendingUp,
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'macro' | 'bias' | 'calendar' | 'cot' | 'news' | 'login' | 'yields';
  setActiveTab: (tab: 'macro' | 'bias' | 'calendar' | 'cot' | 'news' | 'login' | 'yields') => void;
  onOpenAuditLog: () => void;
  auditCount: number;
  user?: { id: string; email: string; name: string; avatar?: string } | null;
  onSignOut?: () => void;
  lastSyncTime?: string;
  isSyncing?: boolean;
  onTriggerSync?: () => void;
  secondsRemaining: number;
  isAutoRefreshPaused: boolean;
  onToggleAutoRefreshPause: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenAuditLog,
  auditCount,
  user,
  onSignOut,
  lastSyncTime,
  isSyncing,
  onTriggerSync,
  secondsRemaining,
  isAutoRefreshPaused,
  onToggleAutoRefreshPause,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile drawer on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Prevent background body scroll when drawer is open on mobile
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const navItems = [
    {
      id: 'bias' as const,
      label: 'Currency Bias',
      shortLabel: 'Bias',
      description: 'Strongest vs weakest divergence scanner & bias scoring',
      icon: Scale,
    },
    {
      id: 'yields' as const,
      label: 'Yields & Valuation',
      shortLabel: 'Yields',
      description: '2Y sovereign spreads, OIS rate probabilities, REER & current account',
      icon: TrendingUp,
    },
    {
      id: 'calendar' as const,
      label: 'News & Calendar',
      shortLabel: 'News & Cal',
      description: 'Official Forex Factory releases, live surprise metrics & real-time market wire',
      icon: Calendar,
    },
    {
      id: 'cot' as const,
      label: 'COT Institutional',
      shortLabel: 'COT Flow',
      description: 'CFTC non-commercial hedge fund net positioning & Z-scores',
      icon: BarChart2,
    },
    {
      id: 'macro' as const,
      label: 'Macro Rates',
      shortLabel: 'Macro',
      description: 'Central banks, real yield differentials & sentiment',
      icon: BarChart3,
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-3">
          {/* Left: Brand title wordmark */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <button
              onClick={() => {
                setActiveTab('bias');
                setIsMobileMenuOpen(false);
              }}
              className="text-left group truncate cursor-pointer"
              title="Apex FX Macro Intelligence"
            >
              {/* Mobile Title (< 640px) */}
              <span className="text-sm font-bold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors block sm:hidden leading-tight truncate">
                Apex Macro
              </span>
              {/* Desktop / Tablet Title (>= 640px) */}
              <span className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors hidden sm:block leading-tight truncate">
                Apex FX Macro
              </span>
              <span className="text-[10px] text-blue-600 font-mono font-medium hidden md:block leading-none">
                Institutional Intelligence
              </span>
            </button>
          </div>

          {/* Center: Desktop Navigation Links (>= lg screens) */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 overflow-x-auto no-scrollbar">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-xs'
                      : 'text-slate-600 hover:text-blue-700 hover:bg-slate-50'
                  }`}
                  title={item.description}
                >
                  <item.icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
                  <span className="hidden xl:inline">{item.label}</span>
                  <span className="inline xl:hidden">{item.shortLabel}</span>
                </button>
              );
            })}
          </nav>

          {/* Right: Auto-Refresh Controls, Audit Log, User Profile & Menu Trigger */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Desktop Auto-Refresh Controls (>= lg screens) */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono shadow-2xs">
              <div className="flex items-center gap-1.5" title="Automatic 60-second background telemetry refresh">
                <span
                  className={`relative flex h-2 w-2 shrink-0 ${
                    isAutoRefreshPaused ? '' : 'animate-pulse'
                  }`}
                >
                  <span
                    className={`inline-flex rounded-full h-2 w-2 ${
                      isAutoRefreshPaused ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                  />
                </span>
                <span className="text-slate-500 text-[11px] font-medium hidden xl:inline">Auto-Sync:</span>
                <span
                  className={`tabular-nums font-bold text-[11px] min-w-[24px] ${
                    isAutoRefreshPaused ? 'text-amber-600' : 'text-slate-800'
                  }`}
                >
                  {isAutoRefreshPaused ? 'PAUSED' : `${secondsRemaining}s`}
                </span>
              </div>

              <div className="h-3.5 w-px bg-slate-200 mx-0.5" />

              {/* Play / Pause Toggle Button */}
              <button
                onClick={onToggleAutoRefreshPause}
                title={isAutoRefreshPaused ? 'Resume auto-refresh (60s)' : 'Pause auto-refresh countdown'}
                className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-200/60 rounded transition-colors cursor-pointer"
                aria-label={isAutoRefreshPaused ? 'Resume auto-refresh' : 'Pause auto-refresh'}
              >
                {isAutoRefreshPaused ? (
                  <Play className="w-3.5 h-3.5 text-amber-600 fill-amber-500/20" />
                ) : (
                  <Pause className="w-3.5 h-3.5 text-slate-600" />
                )}
              </button>

              {/* Instant Manual Sync Button */}
              {onTriggerSync && (
                <button
                  onClick={onTriggerSync}
                  disabled={isSyncing}
                  title="Trigger immediate data ingest & reset timer"
                  className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-200/60 rounded transition-colors disabled:opacity-50 cursor-pointer"
                  aria-label="Trigger instant sync"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
                </button>
              )}
            </div>

            {/* Mobile / Tablet Auto-Refresh Controls (< lg screens) */}
            <div className="flex lg:hidden items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono shadow-2xs">
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  isAutoRefreshPaused ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'
                }`}
              />
              <span
                className={`tabular-nums font-bold text-[11px] min-w-[20px] text-center ${
                  isAutoRefreshPaused ? 'text-amber-600 text-[10px]' : 'text-slate-800'
                }`}
              >
                {isAutoRefreshPaused ? '⏸' : `${secondsRemaining}s`}
              </span>
              <button
                onClick={onToggleAutoRefreshPause}
                className="p-1 text-slate-500 hover:text-blue-600 rounded transition-colors cursor-pointer"
                title={isAutoRefreshPaused ? 'Resume auto-refresh' : 'Pause auto-refresh'}
                aria-label={isAutoRefreshPaused ? 'Resume auto-refresh' : 'Pause auto-refresh'}
              >
                {isAutoRefreshPaused ? (
                  <Play className="w-3 h-3 text-amber-600 fill-amber-500/20" />
                ) : (
                  <Pause className="w-3 h-3 text-slate-600" />
                )}
              </button>
              {onTriggerSync && (
                <button
                  onClick={onTriggerSync}
                  disabled={isSyncing}
                  className="p-1 text-slate-500 hover:text-blue-600 rounded transition-colors disabled:opacity-50 cursor-pointer"
                  title="Sync telemetry now"
                  aria-label="Sync telemetry now"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
                </button>
              )}
            </div>


            {/* User Auth Profile Badge or Sign In CTA (Desktop) */}
            {user ? (
              <div className="hidden sm:flex items-center gap-1 sm:gap-1.5 pl-1 sm:pl-1.5 border-l border-slate-200 shrink-0">
                <div
                  className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg py-1 px-2 text-xs"
                  title={`Signed in as ${user.email}`}
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-5 h-5 rounded-full object-cover ring-1 ring-blue-500 shrink-0"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-mono font-bold text-[10px] shrink-0">
                      {user.name ? user.name[0].toUpperCase() : 'U'}
                    </div>
                  )}
                  <span className="hidden xl:inline text-slate-800 font-mono text-[11px] font-semibold truncate max-w-[120px]">
                    {user.name || user.email.split('@')[0]}
                  </span>
                </div>

                {onSignOut && (
                  <button
                    onClick={onSignOut}
                    title="Sign out of current workspace"
                    className="flex items-center justify-center p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => setActiveTab('login')}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer shadow-sm"
              >
                <span>Sign In</span>
              </button>
            )}

            {/* Hamburger Menu Button for Mobile (< lg screens) */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-1.5 sm:p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE SLIDE-OUT RESPONSIVE NAVIGATION DRAWER (< lg screens) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Slide-out Drawer Panel */}
          <div className="fixed top-0 right-0 bottom-0 w-[85%] max-w-[340px] bg-white shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200 border-l border-slate-200 z-50">
            {/* Top Bar with Brand & Close Button */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 leading-tight">Apex FX Macro</h3>
                  <p className="text-[10px] text-blue-600 font-mono">Terminal Menu</p>
                </div>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors"
                aria-label="Close Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-4 space-y-4 flex-1 overflow-y-auto">
              {/* Auto-Refresh Control Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-xs font-bold text-slate-800">Auto-Refresh Engine</span>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                      isAutoRefreshPaused
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {isAutoRefreshPaused ? 'PAUSED' : 'ACTIVE (60s)'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 font-mono">
                  <span>Cycle countdown:</span>
                  <span className="font-bold text-slate-900 tabular-nums">
                    {isAutoRefreshPaused ? 'Paused' : `${secondsRemaining} seconds`}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={onToggleAutoRefreshPause}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                      isAutoRefreshPaused
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {isAutoRefreshPaused ? (
                      <>
                        <Play className="w-3 h-3 fill-white" />
                        <span>Resume</span>
                      </>
                    ) : (
                      <>
                        <Pause className="w-3 h-3 text-slate-700" />
                        <span>Pause</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      if (onTriggerSync) onTriggerSync();
                    }}
                    disabled={isSyncing}
                    className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold bg-blue-600 text-white border border-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>Sync Now</span>
                  </button>
                </div>

                <div className="text-[10px] text-slate-500 font-mono text-center pt-0.5">
                  Last telemetry sync: {lastSyncTime ? lastSyncTime.split(' ')[1] : 'Active'}
                </div>
              </div>

              {/* Navigation Items */}
              <div className="space-y-1">
                <div className="px-1 text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold mb-1.5">
                  Workspaces
                </div>

                {navItems.map((item) => {
                  const isActive = activeTab === item.id;
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-start gap-2.5 p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                        isActive
                          ? 'bg-blue-50 text-blue-900 border border-blue-200 shadow-xs'
                          : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${isActive ? 'text-blue-900' : 'text-slate-800'}`}>
                            {item.label}
                          </span>
                          {isActive && (
                            <span className="text-[9px] font-mono font-bold text-blue-700 bg-blue-100 px-1 py-0.2 rounded border border-blue-300">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 leading-snug line-clamp-1 font-sans mt-0.5">
                          {item.description}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 self-center" />
                    </button>
                  );
                })}
              </div>

              {/* Audit Log Trigger in Drawer */}
              <button
                onClick={() => {
                  onOpenAuditLog();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-600" />
                  <span className="text-xs font-semibold text-slate-800">Calculation Audit Log</span>
                </div>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-mono px-1.5 py-0.5 rounded font-bold">
                  {auditCount} records
                </span>
              </button>
            </div>

            {/* Drawer Footer: User Profile / Auth */}
            <div className="p-4 border-t border-slate-200 bg-slate-50/80">
              {user ? (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-mono font-bold text-xs shrink-0">
                      {user.name ? user.name[0].toUpperCase() : 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{user.email}</p>
                      <p className="text-[10px] text-emerald-600 font-mono flex items-center gap-1">
                        <UserCheck className="w-2.5 h-2.5" />
                        <span>Investor Session</span>
                      </p>
                    </div>
                  </div>

                  {onSignOut && (
                    <button
                      onClick={() => {
                        onSignOut();
                        setIsMobileMenuOpen(false);
                      }}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Sign Out"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => {
                    setActiveTab('login');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors text-center"
                >
                  Sign In to Workspace
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
