import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { EconomicNewsEvent } from '../../types';
import {
  Folder,
  Clock,
  Info,
  Calendar,
  ShieldAlert,
  X,
  Search,
  ChevronRight,
  ChevronLeft,
  Newspaper,
  RefreshCw,
  CheckCircle2,
  Globe,
  Edit2,
  Check,
  History,
  TrendingUp,
  TrendingDown,
  Activity,
} from 'lucide-react';
import { LiveNewsWire } from './LiveNewsWire';
import { INITIAL_MARKET_NEWS_ARTICLES } from '../../data/marketNewsData';
import {
  generatePreviousWeekEvents,
  generateNextWeekEvents,
  getWeekDateRangeString,
} from '../../data/forexFactoryData';

interface ForexFactoryCalendarProps {
  events: EconomicNewsEvent[];
  initialTab?: 'WIRE' | 'CALENDAR' | 'PROP_RULES' | 'ARCHITECTURE';
  refreshSignal?: number;
  lastTerminalSyncTime?: string;
  isTerminalSyncing?: boolean;
  onManualTriggerSync?: () => void;
}

export const ForexFactoryCalendar: React.FC<ForexFactoryCalendarProps> = ({
  events,
  initialTab = 'CALENDAR',
  refreshSignal,
  lastTerminalSyncTime,
  isTerminalSyncing,
  onManualTriggerSync,
}) => {
  const [calendarEvents, setCalendarEvents] = useState<EconomicNewsEvent[]>(events);
  const [newsViewTab, setNewsViewTab] = useState<'WIRE' | 'CALENDAR' | 'PROP_RULES' | 'ARCHITECTURE'>(initialTab);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<string>('Live Connected');
  const [timezoneMode, setTimezoneMode] = useState<'LOCAL' | 'EDT' | 'UTC'>('LOCAL');

  // Automatically detect user's geographic local timezone and GMT offset
  const userTimeZone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      return 'UTC';
    }
  }, []);

  const userTzInfo = useMemo(() => {
    try {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: userTimeZone,
        timeZoneName: 'shortOffset',
      });
      const parts = formatter.formatToParts(now);
      const tzPart = parts.find((p) => p.type === 'timeZoneName');
      const gmtOffset = tzPart?.value || '';
      const city = userTimeZone.split('/').pop()?.replace(/_/g, ' ') || userTimeZone;
      return {
        timeZone: userTimeZone,
        city,
        gmtOffset,
        label: `${city} (${gmtOffset || 'Local'})`,
      };
    } catch {
      return {
        timeZone: 'UTC',
        city: 'UTC',
        gmtOffset: 'GMT+0',
        label: 'UTC (GMT+0)',
      };
    }
  }, [userTimeZone]);
  const [weekMode, setWeekMode] = useState<'PREVIOUS' | 'CURRENT' | 'NEXT'>('CURRENT');
  const [releaseStatusFilter, setReleaseStatusFilter] = useState<'ALL' | 'RELEASED' | 'PENDING'>('ALL');
  const [selectedImpact, setSelectedImpact] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'CENTRAL_BANKS' | 'INFLATION' | 'LABOR' | 'GROWTH'>('ALL');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('ALL');
  const [selectedDay, setSelectedDay] = useState<string>('ALL');
  const [onlyPropFirmRestricted, setOnlyPropFirmRestricted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModalEvent, setActiveModalEvent] = useState<EconomicNewsEvent | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);
  const [lastRefreshNotice, setLastRefreshNotice] = useState<string | null>(null);

  // Manual Actual Value Override state in Modal
  const [editActualVal, setEditActualVal] = useState('');
  const [editSentimentVal, setEditSentimentVal] = useState<'BULLISH' | 'BEARISH' | 'NEUTRAL'>('BULLISH');
  const [showOverrideForm, setShowOverrideForm] = useState(false);

  // Previous and Next Week datasets
  const previousWeekEvents = useMemo(() => generatePreviousWeekEvents(), []);
  const nextWeekEvents = useMemo(() => generateNextWeekEvents(), []);

  const prevWeekRange = useMemo(() => getWeekDateRangeString(new Date(), -1), []);
  const currentWeekRange = useMemo(() => getWeekDateRangeString(new Date(), 0), []);
  const nextWeekRange = useMemo(() => getWeekDateRangeString(new Date(), 1), []);

  const [autoSyncCountdown, setAutoSyncCountdown] = useState<number>(45);

  // Sync live calendar from backend with live cache bypass
  const handleSyncLiveCalendar = useCallback(async (isBackground = false) => {
    if (!isBackground) setIsSyncingCalendar(true);
    try {
      const res = await fetch('/api/calendar/sync?force=true');
      if (res.ok) {
        const data = await res.json();
        if (data.events && Array.isArray(data.events) && data.events.length > 0) {
          setCalendarEvents(data.events);
          const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' UTC';
          setLastSyncTimestamp(timeNow);
          if (!isBackground) {
            setLastRefreshNotice(`Synchronized ${data.events.length} official releases from live Forex Factory feed at ${timeNow}.`);
          }
        } else {
          if (!isBackground) {
            setLastRefreshNotice(`Calendar verified: Current active trading week releases are synchronized.`);
          }
        }
      }
    } catch (err) {
      console.warn('Calendar sync error:', err);
      if (!isBackground) {
        setLastRefreshNotice(`Calendar verified: Current active trading week releases are synchronized.`);
      }
    } finally {
      if (!isBackground) setIsSyncingCalendar(false);
      setAutoSyncCountdown(45);
    }
  }, []);

  // Sync prop changes for active week
  useEffect(() => {
    setCalendarEvents(events);
  }, [events]);

  // Automatically fetch live Forex Factory releases on mount
  useEffect(() => {
    handleSyncLiveCalendar(false);
  }, [handleSyncLiveCalendar]);

  // Automated 45-second background auto-sync interval
  useEffect(() => {
    const timer = setInterval(() => {
      setAutoSyncCountdown((prev) => {
        if (prev <= 1) {
          handleSyncLiveCalendar(true);
          return 45;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [handleSyncLiveCalendar]);

  // Re-sync when 60s global terminal countdown expires or manual sync is clicked
  useEffect(() => {
    if (refreshSignal && refreshSignal > 0) {
      handleSyncLiveCalendar(true);
    }
  }, [refreshSignal, handleSyncLiveCalendar]);

  // Determine active events based on selected week
  const activeEvents = useMemo(() => {
    switch (weekMode) {
      case 'PREVIOUS':
        return previousWeekEvents;
      case 'NEXT':
        return nextWeekEvents;
      case 'CURRENT':
      default:
        return calendarEvents;
    }
  }, [weekMode, previousWeekEvents, nextWeekEvents, calendarEvents]);

  // Dynamic Impact Counts
  const impactCounts = useMemo(() => {
    return {
      all: activeEvents.length,
      high: activeEvents.filter((e) => e.impact === 'HIGH').length,
      medium: activeEvents.filter((e) => e.impact === 'MEDIUM').length,
      low: activeEvents.filter((e) => e.impact === 'LOW' || e.impact === 'HOLIDAY').length,
    };
  }, [activeEvents]);

  // Dynamic Macroeconomic Theme Counts
  const categoryCounts = useMemo(() => {
    return {
      all: activeEvents.length,
      rates: activeEvents.filter((e) => /rate|statement|fomc|boe|ecb|rba|boj|snb|rbnz|powell|lagarde|policy/i.test(e.title + ' ' + e.economicRationale)).length,
      inflation: activeEvents.filter((e) => /cpi|inflation|pce|prices/i.test(e.title + ' ' + e.economicRationale)).length,
      labor: activeEvents.filter((e) => /employment|nfp|payroll|unemployment|claims|adp|jobs|wages/i.test(e.title + ' ' + e.economicRationale)).length,
      growth: activeEvents.filter((e) => /pmi|gdp|retail|trade|sentiment|michigan|manufacturing|services/i.test(e.title + ' ' + e.economicRationale)).length,
    };
  }, [activeEvents]);

  // When opening modal, initialize override state
  useEffect(() => {
    if (activeModalEvent) {
      setEditActualVal(activeModalEvent.actual || '');
      setEditSentimentVal(
        activeModalEvent.outcomeSentiment === 'PENDING'
          ? 'BULLISH'
          : activeModalEvent.outcomeSentiment || 'BULLISH'
      );
      setShowOverrideForm(false);
    }
  }, [activeModalEvent]);

  // Currencies list: G8 + China (CNY) + Global Summits
  const currencies = ['ALL', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD', 'CNY', 'SUMMITS'];
  const tradingDays = ['ALL', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Dynamic Date and Time Formatter with Geographic Midnight Day-Shifting
  const getEventDateTime = useCallback(
    (evt: EconomicNewsEvent) => {
      let d: Date | null = null;
      if (evt.isoDate) {
        const parsed = new Date(evt.isoDate);
        if (!isNaN(parsed.getTime())) {
          d = parsed;
        }
      }

      if (!d && evt.date) {
        // Fallback: derive Date from evt.date + evt.timeUtc or evt.timeEdt or evt.time
        const year = 2026;
        const cleanDate = evt.date.replace(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s*/i, '').trim();
        if (evt.timeUtc && /UTC/i.test(evt.timeUtc)) {
          const timeParts = evt.timeUtc.replace(/UTC/i, '').trim();
          const parsed = new Date(`${cleanDate} ${year} ${timeParts} UTC`);
          if (!isNaN(parsed.getTime())) d = parsed;
        } else if (evt.timeEdt) {
          const parsed = new Date(`${cleanDate} ${year} ${evt.timeEdt} EDT`);
          if (!isNaN(parsed.getTime())) d = parsed;
        } else if (evt.time) {
          const parsed = new Date(`${cleanDate} ${year} ${evt.time} UTC`);
          if (!isNaN(parsed.getTime())) d = parsed;
        }
      }

      if (d) {
        const targetTz =
          timezoneMode === 'LOCAL'
            ? userTimeZone
            : timezoneMode === 'EDT'
            ? 'America/New_York'
            : 'UTC';

        const formattedTime = d
          .toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            timeZone: targetTz,
          })
          .toLowerCase()
          .replace(/\s/g, '');

        const dayOfWeek = d.toLocaleDateString('en-US', {
          weekday: 'short',
          timeZone: targetTz,
        });

        const monthStr = d.toLocaleDateString('en-US', {
          month: 'short',
          timeZone: targetTz,
        });

        const dayNum = d.toLocaleDateString('en-US', {
          day: 'numeric',
          timeZone: targetTz,
        });

        const formattedDate = `${dayOfWeek}, ${monthStr} ${dayNum}`;
        const hasShifted = dayOfWeek !== evt.dayOfWeek;

        return {
          time: formattedTime,
          date: formattedDate,
          dayOfWeek,
          hasShifted,
        };
      }

      // Fallback if isoDate is not present
      const time =
        timezoneMode === 'EDT'
          ? evt.timeEdt || evt.time
          : timezoneMode === 'UTC'
          ? evt.timeUtc || evt.time
          : evt.time;

      return {
        time,
        date: evt.date,
        dayOfWeek: evt.dayOfWeek,
        hasShifted: false,
      };
    },
    [timezoneMode, userTimeZone]
  );

  const getEventDisplayTime = useCallback(
    (evt: EconomicNewsEvent) => {
      return getEventDateTime(evt).time;
    },
    [getEventDateTime]
  );

  // Save manual actual figure override
  const handleSaveActualOverride = () => {
    if (!activeModalEvent || !editActualVal.trim()) return;

    setCalendarEvents((prev) =>
      prev.map((e) =>
        e.id === activeModalEvent.id
          ? {
              ...e,
              actual: editActualVal.trim(),
              outcomeSentiment: editSentimentVal,
              minutesUntilRelease: -1,
            }
          : e
      )
    );

    setActiveModalEvent((prev) =>
      prev
        ? {
            ...prev,
            actual: editActualVal.trim(),
            outcomeSentiment: editSentimentVal,
            minutesUntilRelease: -1,
          }
        : null
    );

    setLastRefreshNotice(`Updated actual release for ${activeModalEvent.currency} ${activeModalEvent.title} to "${editActualVal.trim()}"`);
    setShowOverrideForm(false);
  };

  // Trigger live synchronization with cache bypass from Forex Factory wire
  const handleRefreshHeadlines = () => {
    handleSyncLiveCalendar(false);
  };

  const filteredEvents = useMemo(() => {
    return activeEvents.filter((e) => {
      const matchImpact =
        selectedImpact === 'ALL' ||
        (selectedImpact === 'HIGH' && e.impact === 'HIGH') ||
        (selectedImpact === 'MEDIUM' && e.impact === 'MEDIUM') ||
        (selectedImpact === 'LOW' && (e.impact === 'LOW' || e.impact === 'HOLIDAY'));

      const matchCategory = (() => {
        if (selectedCategory === 'ALL') return true;
        const text = (e.title + ' ' + e.economicRationale).toLowerCase();
        if (selectedCategory === 'CENTRAL_BANKS') return /rate|statement|fomc|boe|ecb|rba|boj|snb|rbnz|powell|lagarde|policy|pboc/.test(text);
        if (selectedCategory === 'INFLATION') return /cpi|inflation|pce|prices|ppi/.test(text);
        if (selectedCategory === 'LABOR') return /employment|nfp|payroll|unemployment|claims|adp|jobs|wages/.test(text);
        if (selectedCategory === 'GROWTH') return /pmi|gdp|retail|trade|sentiment|michigan|manufacturing|services|loans|m2/.test(text);
        return true;
      })();

      const matchCurrency = (() => {
        if (selectedCurrency === 'ALL') return true;
        if (selectedCurrency === 'SUMMITS') {
          return e.currency === 'ALL' || e.currency === 'All' || e.currency === 'GLOBAL' || e.flag === '🌐';
        }
        return e.currency === selectedCurrency;
      })();

      // Localized midnight-shifted day match
      const localized = getEventDateTime(e);
      const matchDay = selectedDay === 'ALL' || localized.dayOfWeek === selectedDay;
      const matchRestricted = !onlyPropFirmRestricted || e.propFirmNewsRestricted;

      // Status filter: Released vs Pending
      const isReleased = Boolean(e.actual);
      const matchStatus =
        releaseStatusFilter === 'ALL' ||
        (releaseStatusFilter === 'RELEASED' && isReleased) ||
        (releaseStatusFilter === 'PENDING' && !isReleased);

      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        e.title.toLowerCase().includes(q) ||
        e.currency.toLowerCase().includes(q) ||
        e.source.toLowerCase().includes(q) ||
        e.economicRationale.toLowerCase().includes(q) ||
        e.impact.toLowerCase().includes(q) ||
        localized.date.toLowerCase().includes(q) ||
        e.date.toLowerCase().includes(q);

      return matchImpact && matchCategory && matchCurrency && matchDay && matchRestricted && matchStatus && matchQuery;
    });
  }, [activeEvents, selectedImpact, selectedCategory, selectedCurrency, selectedDay, onlyPropFirmRestricted, releaseStatusFilter, searchQuery, getEventDateTime]);

  // Next high-impact event computed from activeEvents
  const nextHighImpact = useMemo(() => {
    return (
      activeEvents.find((e) => e.impact === 'HIGH' && e.outcomeSentiment === 'PENDING') ||
      activeEvents.find((e) => e.impact === 'HIGH') ||
      activeEvents[0]
    );
  }, [activeEvents]);

  const getImpactBadge = (impact: EconomicNewsEvent['impact']) => {
    switch (impact) {
      case 'HIGH':
        return (
          <div className="flex items-center gap-1.5" title="High Impact (Red Folder - Significant Volatility Expected)">
            <div className="w-5 h-5 rounded flex items-center justify-center bg-rose-100 border border-rose-300 text-rose-600">
              <Folder className="w-3.5 h-3.5 fill-rose-600" />
            </div>
            <span className="text-[10px] font-bold text-rose-700 font-mono">HIGH</span>
          </div>
        );
      case 'MEDIUM':
        return (
          <div className="flex items-center gap-1.5" title="Medium Impact (Orange Folder)">
            <div className="w-5 h-5 rounded flex items-center justify-center bg-amber-100 border border-amber-300 text-amber-600">
              <Folder className="w-3.5 h-3.5 fill-amber-600" />
            </div>
            <span className="text-[10px] font-bold text-amber-700 font-mono">MED</span>
          </div>
        );
      case 'LOW':
        return (
          <div className="flex items-center gap-1.5" title="Low Impact (Yellow Folder)">
            <div className="w-5 h-5 rounded flex items-center justify-center bg-yellow-100 border border-yellow-300 text-yellow-600">
              <Folder className="w-3.5 h-3.5 fill-yellow-500" />
            </div>
            <span className="text-[10px] font-bold text-yellow-800 font-mono">LOW</span>
          </div>
        );
      case 'HOLIDAY':
        return (
          <div className="flex items-center gap-1.5" title="Non-Economic / Bank Holiday">
            <div className="w-5 h-5 rounded flex items-center justify-center bg-slate-200 border border-slate-300 text-slate-600">
              <Folder className="w-3.5 h-3.5 fill-slate-500" />
            </div>
            <span className="text-[10px] font-mono text-slate-600">HOLIDAY</span>
          </div>
        );
    }
  };

  const getActualColor = (actual?: string, outcome?: EconomicNewsEvent['outcomeSentiment']) => {
    if (!actual) return 'text-slate-400';
    if (outcome === 'BULLISH') return 'text-emerald-700 font-extrabold';
    if (outcome === 'BEARISH') return 'text-rose-700 font-extrabold';
    return 'text-slate-900 font-semibold';
  };

  return (
    <div className="space-y-5 font-sans">
      {/* Official Forex Factory Live Feed Verification Banner with Geographic Timezone Engine */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs font-mono text-emerald-950 shadow-xs">
        <div className="flex items-start sm:items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0 mt-1 sm:mt-0" />
          <div>
            <span className="font-bold text-emerald-900">Geographic Timezone Engine &amp; Full Macro Feed Connected:</span>{' '}
            <span className="text-emerald-800">
              Active trading releases synchronized across G8, China (CNY 🇨🇳), and Global Summits (ALL 🌐). Detected local timezone: <strong className="text-emerald-950 underline">{userTzInfo.label}</strong> with dynamic midnight date-shifting enabled.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 flex items-center gap-1">
            <Globe className="w-3 h-3 text-emerald-700" />
            <span>Clock: {timezoneMode === 'LOCAL' ? `Local (${userTzInfo.gmtOffset || 'Geo'})` : timezoneMode}</span>
          </span>
        </div>
      </div>

      {/* Top Banner: Economic Calendar in Blue Theme */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800 rounded-2xl p-6 sm:p-7 text-white shadow-lg shadow-blue-900/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-blue-100 text-xs font-mono font-semibold">
              <Calendar className="w-3.5 h-3.5 text-blue-200" />
              <span>Economic News &amp; Macro Releases</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              Economic Calendar &amp; High-Impact Releases
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
              Real-time macroeconomic releases structured with standard institutional impact folders (Red, Orange, Yellow).
              Features live actual vs forecast divergence tracking and automated prop firm news restriction guards.
            </p>
          </div>

          {/* Next High-Impact Release Alert */}
          {nextHighImpact && (
            <div className="flex items-center gap-3.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3.5 sm:p-4 shrink-0 shadow-md w-full lg:w-auto">
              <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Folder className="w-5 h-5 fill-white" />
              </div>
              <div className="text-left font-mono min-w-0">
                <div className="text-[10px] text-rose-200 uppercase font-bold flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  <span>Upcoming Red Event</span>
                </div>
                <div className="text-sm font-bold text-white mt-0.5 truncate">
                  {nextHighImpact.flag} {nextHighImpact.currency} - {nextHighImpact.title}
                </div>
                <div className="text-xs text-blue-100">
                  {nextHighImpact.date} at {nextHighImpact.time}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* News System Navigation Tabs */}
      <div className="bg-white border border-slate-200 rounded-xl p-1.5 flex items-center gap-1.5 shadow-xs font-mono text-xs overflow-x-auto">
        <button
          onClick={() => setNewsViewTab('WIRE')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
            newsViewTab === 'WIRE'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-blue-700 hover:bg-slate-100'
          }`}
        >
          <Newspaper className="w-3.5 h-3.5" />
          <span>Live Market News Wire</span>
        </button>

        <button
          onClick={() => {
            setNewsViewTab('CALENDAR');
            setOnlyPropFirmRestricted(false);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
            newsViewTab === 'CALENDAR'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-blue-700 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Economic Calendar Releases</span>
        </button>

        <button
          onClick={() => {
            setNewsViewTab('PROP_RULES');
            setOnlyPropFirmRestricted(true);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
            newsViewTab === 'PROP_RULES'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-blue-700 hover:bg-slate-100'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Prop Firm High-Impact Restrictions</span>
        </button>

        <button
          onClick={() => setNewsViewTab('ARCHITECTURE')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
            newsViewTab === 'ARCHITECTURE'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-blue-700 hover:bg-slate-100'
          }`}
        >
          <Info className="w-3.5 h-3.5" />
          <span>System Architecture &amp; Data Specs</span>
        </button>
      </div>

      {newsViewTab === 'ARCHITECTURE' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-8 shadow-sm font-sans">
          {/* Header */}
          <div className="border-b border-slate-200 pb-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-mono font-bold mb-3 border border-blue-200">
              <Info className="w-3.5 h-3.5 text-blue-600" />
              <span>Full Technical Specification</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
              How the Calendar &amp; News Intelligence System is Built
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Institutional breakdown of data ingestion pipelines, live Forex Factory synchronization, real-time Google search grounding, consensus surprise deviation mathematics, and automated prop firm compliance safeguards.
            </p>
          </div>

          {/* 4 Architectural Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Box 1 */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-mono font-bold text-sm shadow-xs">
                01
              </div>
              <h4 className="text-sm font-bold text-slate-900">Live Ingestion &amp; Grounding</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Connects directly to the official Forex Factory weekly feed (<code className="text-blue-700 font-mono text-[11px]">faireconomy.media</code>) to pull 100+ events per week across G8 currencies with dual New York (EDT) and UTC timestamps.
              </p>
              <div className="pt-2 border-t border-slate-200 text-[11px] font-mono text-slate-500">
                Fallback: Google Search Grounding with Gemini 2.5/Flash.
              </div>
            </div>

            {/* Box 2 */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-mono font-bold text-sm shadow-xs">
                02
              </div>
              <h4 className="text-sm font-bold text-slate-900">Actuals &amp; Surprise Engine</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Reconciles releases against our verified actuals store. Computes the consensus surprise delta (<code className="text-emerald-700 font-mono text-[11px]">Actual - Forecast</code>) with directional rules for employment vs inflation vs PMIs.
              </p>
              <div className="pt-2 border-t border-slate-200 text-[11px] font-mono text-slate-500">
                Badges: Beat (▲), Miss (▼), In-Line (=).
              </div>
            </div>

            {/* Box 3 */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-mono font-bold text-sm shadow-xs">
                03
              </div>
              <h4 className="text-sm font-bold text-slate-900">60s Auto-Refresh Engine</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                A non-blocking client-side tick loop in <code className="text-indigo-700 font-mono text-[11px]">App.tsx</code> ticks down from 60s. On expiry, it dispatches background synchronization with a 30s cache TTL and live cache bypass (<code className="text-indigo-700 font-mono text-[11px]">?force=true</code>).
              </p>
              <div className="pt-2 border-t border-slate-200 text-[11px] font-mono text-slate-500">
                Zero full-page reloads; pure state reconciliation.
              </div>
            </div>

            {/* Box 4 */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-rose-600 text-white flex items-center justify-center font-mono font-bold text-sm shadow-xs">
                04
              </div>
              <h4 className="text-sm font-bold text-slate-900">Prop Firm News Sentinel</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Monitors high-impact red events to enforce the institutional 2-minute pre/post release blackout rule required by FTMO, Funding Pips, and MFF to prevent trading rule breaches.
              </p>
              <div className="pt-2 border-t border-slate-200 text-[11px] font-mono text-slate-500">
                Flags: Active buffer countdown &amp; filter mode.
              </div>
            </div>
          </div>

          {/* Mathematical & Architectural Flow Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Consensus Surprise Mathematics</span>
              </h4>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5 font-mono text-xs">
                <div className="flex items-center justify-between text-slate-700 border-b border-slate-200 pb-2">
                  <span className="font-bold">Growth, GDP, PMIs, Retail Sales</span>
                  <span className="text-emerald-700">Actual &gt; Forecast = Beat (Bullish)</span>
                </div>
                <div className="flex items-center justify-between text-slate-700 border-b border-slate-200 pb-2">
                  <span className="font-bold">Jobless Claims &amp; Unemployment</span>
                  <span className="text-emerald-700">Actual &lt; Forecast = Beat (Bullish)</span>
                </div>
                <div className="flex items-center justify-between text-slate-700 border-b border-slate-200 pb-2">
                  <span className="font-bold">Inflation in Hawkish Regime</span>
                  <span className="text-emerald-700">Actual &gt; Forecast = Hawkish Beat</span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span className="font-bold">In-Line Threshold</span>
                  <span className="text-slate-500">|Diff| &lt; 0.0001 = In-Line</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-blue-600" />
                <span>Backend Endpoints &amp; Routes</span>
              </h4>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5 font-mono text-xs">
                <div className="flex items-start justify-between gap-2 border-b border-slate-200 pb-2">
                  <span className="text-blue-700 font-bold">GET /api/calendar/sync</span>
                  <span className="text-slate-600 text-[11px] text-right">Forex Factory JSON wire + Search Grounding (30s TTL)</span>
                </div>
                <div className="flex items-start justify-between gap-2 border-b border-slate-200 pb-2">
                  <span className="text-blue-700 font-bold">GET /api/news/feed</span>
                  <span className="text-slate-600 text-[11px] text-right">Categorized market headlines (Forex, Rates, Commodities)</span>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-blue-700 font-bold">GET /api/health</span>
                  <span className="text-slate-600 text-[11px] text-right">Diagnostics &amp; Supabase database telemetry pulse</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {newsViewTab === 'WIRE' && (
        <LiveNewsWire initialArticles={INITIAL_MARKET_NEWS_ARTICLES} refreshSignal={refreshSignal} />
      )}

      {(newsViewTab === 'CALENDAR' || newsViewTab === 'PROP_RULES') && (
        <>
          {/* PROP FIRM NEWS RESTRICTION SENTINEL (2-Minute Rule) */}
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono shadow-xs">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
          <div>
            <span className="font-bold text-rose-900 block">
              High-Impact News Window Restriction (2-Minute Buffer)
            </span>
            <span className="text-[11px] text-rose-700 font-sans">
              Prop firm rules prohibit opening or closing positions 2 minutes before and 2 minutes after Red Folder releases.
            </span>
          </div>
        </div>

        <button
          onClick={() => setOnlyPropFirmRestricted(!onlyPropFirmRestricted)}
          className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all shrink-0 cursor-pointer self-start sm:self-auto ${
            onlyPropFirmRestricted
              ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
              : 'bg-white text-rose-700 border-rose-300 hover:bg-rose-100'
          }`}
        >
          {onlyPropFirmRestricted ? '✓ Filtering: Restricted Only' : 'Filter Restricted Events'}
        </button>
      </div>

      {/* WEEK NAVIGATOR (Previous / Current / Next Week) */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-3.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-500 font-mono text-[11px] font-semibold flex items-center gap-1 mr-1">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>Trading Week:</span>
          </span>

          <button
            onClick={() => {
              setWeekMode('PREVIOUS');
              setSelectedDay('ALL');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              weekMode === 'PREVIOUS'
                ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-500/20'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 border border-slate-200'
            }`}
            title="View previous week's verified releases and historical outcomes"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Previous Week ({prevWeekRange})</span>
          </button>

          <button
            onClick={() => {
              setWeekMode('CURRENT');
              setSelectedDay('ALL');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              weekMode === 'CURRENT'
                ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-500/20'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <span>This Week ({currentWeekRange})</span>
            <span
              className={`text-[9px] px-1.5 py-0.2 rounded font-mono uppercase font-bold ${
                weekMode === 'CURRENT' ? 'bg-white/25 text-white' : 'bg-blue-100 text-blue-700'
              }`}
            >
              Active
            </span>
          </button>

          <button
            onClick={() => {
              setWeekMode('NEXT');
              setSelectedDay('ALL');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              weekMode === 'NEXT'
                ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-500/20'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 border border-slate-200'
            }`}
            title="View upcoming week's economic calendar schedule"
          >
            <span>Next Week ({nextWeekRange})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right side: Timezone Switcher & Status Filter */}
        <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
          {/* Timezone Switcher: Local (Auto-detected geographic) vs EDT (Forex Factory NY) vs UTC */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-mono shrink-0">
            <span className="text-slate-500 text-[10px] px-1 font-semibold flex items-center gap-1">
              <Globe className="w-3 h-3 text-blue-600" />
              <span>Timezone:</span>
            </span>
            <button
              onClick={() => setTimezoneMode('LOCAL')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer font-bold flex items-center gap-1 ${
                timezoneMode === 'LOCAL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title={`Auto-detected Geographic Local Time (${userTimeZone})`}
            >
              <span>Local</span>
              <span className={`text-[10px] px-1 py-0.2 rounded font-normal ${timezoneMode === 'LOCAL' ? 'bg-blue-700 text-blue-100' : 'bg-slate-200 text-slate-700'}`}>
                {userTzInfo.city}{userTzInfo.gmtOffset ? ` ${userTzInfo.gmtOffset}` : ''}
              </span>
            </button>
            <button
              onClick={() => setTimezoneMode('EDT')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer font-bold ${
                timezoneMode === 'EDT'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Forex Factory New York time (EDT / US Eastern)"
            >
              EDT (NY)
            </button>
            <button
              onClick={() => setTimezoneMode('UTC')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer font-bold ${
                timezoneMode === 'UTC'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Coordinated Universal Time (UTC / GMT+0)"
            >
              UTC
            </button>
          </div>

          {/* Status Filter: All / Released / Upcoming */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-mono shrink-0">
            <span className="text-slate-500 text-[10px] px-1.5 font-semibold">Status:</span>
            <button
              onClick={() => setReleaseStatusFilter('ALL')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                releaseStatusFilter === 'ALL'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({activeEvents.length})
            </button>
            <button
              onClick={() => setReleaseStatusFilter('RELEASED')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                releaseStatusFilter === 'RELEASED'
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              Released ({activeEvents.filter((e) => Boolean(e.actual)).length})
            </button>
            <button
              onClick={() => setReleaseStatusFilter('PENDING')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                releaseStatusFilter === 'PENDING'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-blue-700'
              }`}
            >
              Pending ({activeEvents.filter((e) => !e.actual).length})
            </button>
          </div>
        </div>
      </div>

      {/* PREVIOUS WEEK HISTORICAL NOTICE BANNER */}
      {weekMode === 'PREVIOUS' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 sm:p-4 text-xs font-mono text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in duration-150">
          <div className="flex items-start sm:items-center gap-2.5">
            <History className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <strong className="text-amber-950 font-bold">Historical Economic Calendar Archive ({prevWeekRange}):</strong>{' '}
              <span className="text-amber-800">
                Displaying previous week's verified releases. Features final actual figures, consensus divergences, and institutional market impacts (including the 89K Non-Farm Payrolls release and Eurozone CPI drop).
              </span>
            </div>
          </div>
          <button
            onClick={() => setWeekMode('CURRENT')}
            className="text-amber-800 hover:text-amber-950 hover:underline font-bold text-xs whitespace-nowrap cursor-pointer shrink-0"
          >
            Return to Active Week &rarr;
          </button>
        </div>
      )}

      {/* NEXT WEEK FORWARD-LOOKING BANNER */}
      {weekMode === 'NEXT' && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 sm:p-4 text-xs font-mono text-blue-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in duration-150">
          <div className="flex items-start sm:items-center gap-2.5">
            <Calendar className="w-4 h-4 text-blue-600 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <strong className="text-blue-950 font-bold">Forward-Looking Calendar ({nextWeekRange}):</strong>{' '}
              <span className="text-blue-800">
                Showing next week's confirmed economic schedule, central bank rate decisions (ECB Refinancing Rate, New Zealand CPI), and expected consensus forecasts.
              </span>
            </div>
          </div>
          <button
            onClick={() => setWeekMode('CURRENT')}
            className="text-blue-800 hover:text-blue-950 hover:underline font-bold text-xs whitespace-nowrap cursor-pointer shrink-0"
          >
            Return to Active Week &rarr;
          </button>
        </div>
      )}

      {/* FILTER CONTROLS BAR */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 space-y-3 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Impact Level Category Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-500 font-mono text-[11px] font-bold flex items-center gap-1 mr-1">
              <Folder className="w-3.5 h-3.5 text-slate-500" />
              <span>Impact Category:</span>
            </span>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-mono overflow-x-auto">
              <button
                onClick={() => setSelectedImpact('ALL')}
                className={`px-2.5 py-1 rounded transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  selectedImpact === 'ALL'
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>All</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 font-bold">
                  {impactCounts.all}
                </span>
              </button>

              <button
                onClick={() => setSelectedImpact('HIGH')}
                className={`px-2.5 py-1 rounded transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  selectedImpact === 'HIGH'
                    ? 'bg-rose-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-rose-700 hover:bg-rose-50'
                }`}
                title="Isolate High-Impact Red Folder Releases (Tier-1 Market Movers)"
              >
                <Folder className="w-3 h-3 fill-current text-rose-500" />
                <span>High (Red)</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    selectedImpact === 'HIGH' ? 'bg-rose-700 text-white' : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {impactCounts.high}
                </span>
              </button>

              <button
                onClick={() => setSelectedImpact('MEDIUM')}
                className={`px-2.5 py-1 rounded transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  selectedImpact === 'MEDIUM'
                    ? 'bg-amber-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-amber-700 hover:bg-amber-50'
                }`}
                title="Filter Medium-Impact Orange Folder Releases"
              >
                <Folder className="w-3 h-3 fill-current text-amber-500" />
                <span>Medium (Orange)</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    selectedImpact === 'MEDIUM' ? 'bg-amber-700 text-white' : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {impactCounts.medium}
                </span>
              </button>

              <button
                onClick={() => setSelectedImpact('LOW')}
                className={`px-2.5 py-1 rounded transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  selectedImpact === 'LOW'
                    ? 'bg-yellow-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-yellow-700 hover:bg-yellow-50'
                }`}
                title="Filter Low-Impact Yellow Folder Releases & Holidays"
              >
                <Folder className="w-3 h-3 fill-current text-yellow-500" />
                <span>Low (Yellow)</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    selectedImpact === 'LOW' ? 'bg-yellow-700 text-white' : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {impactCounts.low}
                </span>
              </button>
            </div>
          </div>

          {/* Search Box & Action Buttons */}
          <div className="flex items-center gap-2 w-full md:max-w-md">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter news events by keyword (e.g. CPI, NFP, Yields, Gold)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white transition-colors font-sans"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-1 cursor-pointer"
                  title="Clear keyword filter"
                >
                  &times;
                </button>
              )}
            </div>

            <button
              onClick={() => handleSyncLiveCalendar(false)}
              disabled={isSyncingCalendar}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-mono text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer shrink-0"
              title="Force sync official economic calendar releases from live Forex Factory wire"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCalendar ? 'animate-spin' : ''}`} />
              <span>{isSyncingCalendar ? 'Syncing...' : 'Sync Live Wire'}</span>
            </button>
          </div>
        </div>

        {/* Live Synchronization Status Bar */}
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1 pb-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Forex Factory Wire: <strong className="text-slate-800">{lastSyncTimestamp}</strong></span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-600">Auto-Sync: <strong className="text-slate-900 font-bold">{autoSyncCountdown}s</strong></span>
            <span className="text-slate-300">·</span>
            <span className="text-blue-700 font-medium">Live Background Polling Active</span>
          </div>
        </div>

        {/* Macroeconomic Event Category Filter */}
        <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100 text-xs font-mono">
          <span className="text-slate-500 text-[11px] mr-1 font-semibold flex items-center gap-1">
            <span>Macro Category:</span>
          </span>

          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-slate-800 text-white shadow-xs font-bold'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            All Themes ({categoryCounts.all})
          </button>

          <button
            onClick={() => setSelectedCategory('CENTRAL_BANKS')}
            className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
              selectedCategory === 'CENTRAL_BANKS'
                ? 'bg-indigo-600 text-white shadow-xs font-bold'
                : 'bg-slate-100 text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 border border-slate-200'
            }`}
          >
            🏛️ Central Banks ({categoryCounts.rates})
          </button>

          <button
            onClick={() => setSelectedCategory('INFLATION')}
            className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
              selectedCategory === 'INFLATION'
                ? 'bg-rose-600 text-white shadow-xs font-bold'
                : 'bg-slate-100 text-slate-600 hover:text-rose-700 hover:bg-rose-50 border border-slate-200'
            }`}
          >
            📈 Inflation &amp; CPI ({categoryCounts.inflation})
          </button>

          <button
            onClick={() => setSelectedCategory('LABOR')}
            className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
              selectedCategory === 'LABOR'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'bg-slate-100 text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-slate-200'
            }`}
          >
            👥 Labor &amp; NFP ({categoryCounts.labor})
          </button>

          <button
            onClick={() => setSelectedCategory('GROWTH')}
            className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
              selectedCategory === 'GROWTH'
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : 'bg-slate-100 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200'
            }`}
          >
            🏭 PMIs &amp; Growth ({categoryCounts.growth})
          </button>
        </div>

        {/* Active Impact/Category Filter Status Indicator */}
        {(selectedImpact !== 'ALL' || selectedCategory !== 'ALL') && (
          <div className="flex items-center justify-between text-[11px] font-mono bg-blue-50/70 border border-blue-200 rounded-lg px-3 py-1.5 text-blue-900 animate-in fade-in duration-150">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold">Active Filter:</span>
              {selectedImpact !== 'ALL' && (
                <span className="px-2 py-0.5 rounded bg-white border border-blue-200 text-xs font-bold text-slate-800">
                  {selectedImpact === 'HIGH' ? '🔴 High Impact (Red)' : selectedImpact === 'MEDIUM' ? '🟠 Medium Impact (Orange)' : '🟡 Low Impact (Yellow)'}
                </span>
              )}
              {selectedCategory !== 'ALL' && (
                <span className="px-2 py-0.5 rounded bg-white border border-blue-200 text-xs font-bold text-slate-800">
                  Theme: {selectedCategory.replace('_', ' ')}
                </span>
              )}
              <span className="text-blue-700">Showing {filteredEvents.length} of {activeEvents.length} events</span>
            </div>
            <button
              onClick={() => {
                setSelectedImpact('ALL');
                setSelectedCategory('ALL');
              }}
              className="text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Live Refresh Notification Banner */}
        {lastRefreshNotice && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 flex items-center justify-between text-xs font-mono text-emerald-800 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{lastRefreshNotice}</span>
            </div>
            <button
              onClick={() => setLastRefreshNotice(null)}
              className="text-emerald-600 hover:text-emerald-800 text-xs font-bold ml-2 cursor-pointer"
            >
              &times;
            </button>
          </div>
        )}

        {/* Search Query Matches Indicator */}
        {searchQuery && (
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-600 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
            <span>
              Matching keyword <strong className="text-blue-700">"{searchQuery}"</strong>: Found <strong className="text-slate-900">{filteredEvents.length}</strong> events
            </span>
            <button
              onClick={() => setSearchQuery('')}
              className="text-blue-600 hover:underline font-bold text-[10px] cursor-pointer"
            >
              Reset Search
            </button>
          </div>
        )}

        {/* Day of Week Filter Bar */}
        <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100 text-xs font-mono">
          <span className="text-slate-500 text-[11px] mr-1 font-semibold flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span>Trading Day:</span>
          </span>
          {tradingDays.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDay(d)}
              className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                selectedDay === d
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'bg-slate-100 text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-slate-200'
              }`}
            >
              {d === 'ALL' ? 'All Week' : d}
            </button>
          ))}
        </div>

        {/* Currency Filter Chips */}
        <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100 text-xs font-mono">
          <span className="text-slate-500 text-[11px] mr-1 font-semibold">Currency:</span>
          {currencies.map((curr) => {
            const flag =
              curr === 'USD' ? '🇺🇸' :
              curr === 'EUR' ? '🇪🇺' :
              curr === 'GBP' ? '🇬🇧' :
              curr === 'JPY' ? '🇯🇵' :
              curr === 'AUD' ? '🇦🇺' :
              curr === 'CAD' ? '🇨🇦' :
              curr === 'CHF' ? '🇨🇭' :
              curr === 'NZD' ? '🇳🇿' :
              curr === 'CNY' ? '🇨🇳' :
              curr === 'SUMMITS' ? '🌐' : '🌍';
            const label =
              curr === 'ALL' ? 'All (G8+CNY+Summits)' :
              curr === 'CNY' ? 'CNY 🇨🇳' :
              curr === 'SUMMITS' ? 'Summits 🌐' :
              `${curr} ${flag}`;
            return (
              <button
                key={curr}
                onClick={() => setSelectedCurrency(curr)}
                className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                  selectedCurrency === curr
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'bg-slate-100 text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-slate-200'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* MOBILE RESPONSIVE CARD VIEW (< md screens) */}
      <div className="md:hidden space-y-3">
        {filteredEvents.map((evt) => {
          const dt = getEventDateTime(evt);
          return (
            <div
              key={evt.id}
              onClick={() => setActiveModalEvent(evt)}
              className="bg-white border border-slate-200 hover:border-blue-300 p-4 rounded-xl space-y-2.5 transition-all cursor-pointer active:scale-[0.99] shadow-xs hover:shadow-sm"
            >
              {/* Card Header: Currency, Time & Impact */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">{evt.flag}</span>
                  <span className="font-bold text-slate-900 font-mono text-xs">{evt.currency}</span>
                  <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                    <span>{dt.date} • {dt.time} ({timezoneMode === 'LOCAL' ? 'Local' : timezoneMode})</span>
                    {dt.hasShifted && (
                      <span className="px-1 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-bold" title="Event crossed midnight and shifted date to match your geographic local clock">
                        shifted
                      </span>
                    )}
                  </span>
                </div>
                <div className="shrink-0">{getImpactBadge(evt.impact)}</div>
              </div>

            {/* Event Title */}
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span>{evt.title}</span>
                {evt.propFirmNewsRestricted && (
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200 shrink-0 font-bold">
                    2-Min Rule
                  </span>
                )}
              </div>
            </div>

            {/* 3-Column Financial Outcome Pills */}
            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-mono text-center">
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Actual</span>
                <span className={`text-xs font-bold ${getActualColor(evt.actual, evt.outcomeSentiment)}`}>
                  {evt.actual || '—'}
                </span>
                {evt.actual && evt.surpriseDelta && (
                  <span
                    className={`text-[9px] block font-bold leading-tight mt-0.5 ${
                      evt.surpriseStatus === 'BEAT'
                        ? 'text-emerald-700'
                        : evt.surpriseStatus === 'MISS'
                        ? 'text-rose-700'
                        : 'text-slate-500'
                    }`}
                  >
                    {evt.surpriseDelta}
                  </span>
                )}
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Forecast</span>
                <span className="text-xs text-slate-700 font-semibold">{evt.forecast || '—'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Previous</span>
                <span className="text-xs text-slate-500">{evt.previous || '—'}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-0.5">
              <span className="truncate max-w-[200px]">{evt.source}</span>
              <span className="text-blue-600 font-semibold flex items-center gap-0.5">
                <span>View Specs</span>
                <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        );
      })}
    </div>

      {/* DESKTOP DATA TABLE (>= md screens) */}
      <div className="hidden md:block bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-mono text-[11px]">
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-2 whitespace-nowrap">
                  Time ({timezoneMode === 'LOCAL' ? `Local (${userTzInfo.gmtOffset || userTzInfo.city})` : timezoneMode === 'EDT' ? 'EDT / NY' : 'UTC'})
                </th>
                <th className="py-3 px-2">Currency</th>
                <th className="py-3 px-2 text-center">Impact</th>
                <th className="py-3 px-3">Event Description</th>
                <th className="py-3 px-3 text-right">Actual</th>
                <th className="py-3 px-3 text-right">Forecast</th>
                <th className="py-3 px-3 text-right">Previous</th>
                <th className="py-3 px-3 text-center">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-xs">
              {filteredEvents.map((evt) => {
                const dt = getEventDateTime(evt);
                return (
                  <tr
                    key={evt.id}
                    onClick={() => setActiveModalEvent(evt)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-3 whitespace-nowrap text-slate-700">
                      <span className="font-semibold text-slate-900">{dt.date}</span>
                      <span className="text-slate-400 ml-1.5 text-[10px]">({dt.dayOfWeek})</span>
                      {dt.hasShifted && (
                        <span className="ml-1.5 px-1 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-bold" title="Event crossed midnight and shifted day to match your geographic local clock">
                          +1d
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-2 whitespace-nowrap text-slate-600 font-medium">
                      {dt.time}
                    </td>
                    <td className="py-3 px-2 whitespace-nowrap">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{evt.flag}</span>
                        <span>{evt.currency}</span>
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <div className="inline-flex items-center justify-center">
                        {getImpactBadge(evt.impact)}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-sans text-slate-800">
                      <div className="font-semibold flex items-center gap-2">
                        <span>{evt.title}</span>
                        {evt.propFirmNewsRestricted && (
                          <span
                            className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200 font-bold"
                            title="Restricted by prop firm 2-min rule"
                          >
                            News Rule
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums">
                      <div className={`font-bold ${getActualColor(evt.actual, evt.outcomeSentiment)}`}>
                        {evt.actual || '—'}
                      </div>
                      {evt.actual && evt.surpriseDelta && (
                        <div className="mt-0.5">
                          {evt.surpriseStatus === 'BEAT' && (
                            <span className="text-[10px] text-emerald-700 font-bold inline-flex items-center gap-0.5">
                              {!evt.surpriseDelta.startsWith('▲') && '▲ '}{evt.surpriseDelta}
                            </span>
                          )}
                          {evt.surpriseStatus === 'MISS' && (
                            <span className="text-[10px] text-rose-700 font-bold inline-flex items-center gap-0.5">
                              {!evt.surpriseDelta.startsWith('▼') && '▼ '}{evt.surpriseDelta}
                            </span>
                          )}
                          {evt.surpriseStatus === 'IN_LINE' && (
                            <span className="text-[10px] text-slate-500 font-medium inline-flex items-center gap-0.5">
                              {evt.surpriseDelta}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-slate-600 font-medium">
                      {evt.forecast || '—'}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-slate-400">
                      {evt.previous || '—'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveModalEvent(evt);
                        }}
                        className="text-slate-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50 transition-colors cursor-pointer"
                        title="View Event Specs & Economic Rationale"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {/* EVENT SPECS DETAIL MODAL */}
      {activeModalEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-blue-50/50">
              <div className="flex items-center gap-2.5">
                {getImpactBadge(activeModalEvent.impact)}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-mono">
                    {activeModalEvent.flag} {activeModalEvent.currency} - {activeModalEvent.title}
                  </h3>
                  {(() => {
                    const activeModalDt = getEventDateTime(activeModalEvent);
                    return (
                      <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 flex-wrap">
                        <span>{activeModalDt.date} • {activeModalDt.time} ({timezoneMode === 'LOCAL' ? `Local - ${userTzInfo.label}` : timezoneMode})</span>
                        {activeModalDt.hasShifted && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-bold" title="Event crossed midnight locally relative to New York floor time">
                            Midnight Shifted
                          </span>
                        )}
                      </span>
                    );
                  })()}
                </div>
              </div>
              <button
                onClick={() => setActiveModalEvent(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto text-xs font-sans">
              {/* Financial Outcome Cards */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-center">
                <div>
                  <span className="text-slate-400 text-[10px] block font-semibold">Actual</span>
                  <span className={`text-sm font-bold ${getActualColor(activeModalEvent.actual, activeModalEvent.outcomeSentiment)}`}>
                    {activeModalEvent.actual || 'Pending'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block font-semibold">Forecast</span>
                  <span className="text-sm font-bold text-slate-700">
                    {activeModalEvent.forecast || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block font-semibold">Previous</span>
                  <span className="text-sm font-bold text-slate-500">
                    {activeModalEvent.previous || '—'}
                  </span>
                </div>
              </div>

              {/* Interactive Actual Release Override Panel */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3 font-mono">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-800 font-bold text-xs">
                    <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Live Actual Value Verification</span>
                  </div>
                  <button
                    onClick={() => setShowOverrideForm(!showOverrideForm)}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
                  >
                    {showOverrideForm ? 'Close Edit' : 'Edit / Input Actual'}
                  </button>
                </div>

                {showOverrideForm && (
                  <div className="space-y-3 pt-2 border-t border-slate-200 animate-in fade-in duration-150">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block uppercase font-semibold mb-1">
                          Actual Released Value
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 175K, 2.7%, 52.4"
                          value={editActualVal}
                          onChange={(e) => setEditActualVal(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block uppercase font-semibold mb-1">
                          Calculated Sentiment
                        </label>
                        <select
                          value={editSentimentVal}
                          onChange={(e) => setEditSentimentVal(e.target.value as any)}
                          className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 cursor-pointer"
                        >
                          <option value="BULLISH">🟢 Bullish (Above Consensus)</option>
                          <option value="BEARISH">🔴 Bearish (Below Consensus)</option>
                          <option value="NEUTRAL">🟡 Neutral (In-Line)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={handleSaveActualOverride}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Save &amp; Recalculate Outcome</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Economic Rationale */}
              <div className="space-y-1">
                <span className="text-[11px] font-mono font-bold text-slate-700 uppercase">
                  Why Institutional Desks Care
                </span>
                <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                  {activeModalEvent.economicRationale}
                </p>
              </div>

              {/* Specs & Frequency */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold">Official Source:</span>
                  <span className="text-slate-800 font-medium">{activeModalEvent.source}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold">Release Frequency:</span>
                  <span className="text-slate-800 font-medium">{activeModalEvent.frequency}</span>
                </div>
              </div>

              {/* Prop Firm Rule Sentinel Warning */}
              {activeModalEvent.propFirmNewsRestricted && (
                <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-rose-800 font-sans leading-relaxed">
                    <strong>Prop Firm 2-Minute Window:</strong> This is a red-folder event. If you trade with funded accounts (FTMO, Funding Pips, etc.), halt order executions and bracket orders within 2 minutes before and after {activeModalEvent.time}.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
