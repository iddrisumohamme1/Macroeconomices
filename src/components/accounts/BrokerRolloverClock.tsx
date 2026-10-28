import React, { useState, useEffect } from 'react';
import { Clock, Globe, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';

interface BrokerRolloverClockProps {
  rolloverHourUTC?: number; // default 22 (22:00 UTC)
  propFirmName?: string;
}

export const BrokerRolloverClock: React.FC<BrokerRolloverClockProps> = ({
  rolloverHourUTC = 22,
  propFirmName = 'YoPips',
}) => {
  const [timeUntilRollover, setTimeUntilRollover] = useState<string>('00h 00m 00s');
  const [currentUTCTime, setCurrentUTCTime] = useState<string>('');
  const [isSpreadDangerZone, setIsSpreadDangerZone] = useState<boolean>(false);

  useEffect(() => {
    const updateTimes = () => {
      const now = new Date();
      const nowUTC = new Date(now.toISOString());
      
      const currentH = nowUTC.getUTCHours();
      const currentM = nowUTC.getUTCMinutes();
      const currentS = nowUTC.getUTCSeconds();

      setCurrentUTCTime(
        `${String(currentH).padStart(2, '0')}:${String(currentM).padStart(2, '0')}:${String(currentS).padStart(2, '0')} UTC`
      );

      // Check if within 15 minutes before or after 22:00 UTC (spread widening danger zone)
      if (
        (currentH === 21 && currentM >= 45) ||
        (currentH === 22 && currentM <= 15)
      ) {
        setIsSpreadDangerZone(true);
      } else {
        setIsSpreadDangerZone(false);
      }

      // Calculate time until next 22:00 UTC
      const nextRollover = new Date(nowUTC);
      nextRollover.setUTCHours(rolloverHourUTC, 0, 0, 0);
      if (nextRollover.getTime() <= nowUTC.getTime()) {
        nextRollover.setUTCDate(nextRollover.getUTCDate() + 1);
      }

      const diffMs = nextRollover.getTime() - nowUTC.getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);

      setTimeUntilRollover(
        `${String(diffHrs).padStart(2, '0')}h ${String(diffMins).padStart(2, '0')}m ${String(diffSecs).padStart(2, '0')}s`
      );
    };

    updateTimes();
    const interval = setInterval(updateTimes, 1000);
    return () => clearInterval(interval);
  }, [rolloverHourUTC]);

  // Major FX Sessions status (UTC hours)
  const now = new Date();
  const utcHour = now.getUTCHours();

  const sessions = [
    {
      name: 'London',
      range: '08:00 - 16:30 UTC',
      isActive: utcHour >= 8 && utcHour < 17,
      isCore: true,
      city: 'Europe',
    },
    {
      name: 'New York',
      range: '13:00 - 21:00 UTC',
      isActive: utcHour >= 13 && utcHour < 21,
      isCore: true,
      city: 'Americas',
    },
    {
      name: 'Tokyo',
      range: '00:00 - 09:00 UTC',
      isActive: utcHour >= 0 && utcHour < 9,
      isCore: false,
      city: 'Asia',
    },
    {
      name: 'Sydney',
      range: '22:00 - 07:00 UTC',
      isActive: utcHour >= 22 || utcHour < 7,
      isCore: false,
      city: 'Pacific',
    },
  ];

  const isLondonNYOverlap = utcHour >= 13 && utcHour < 17;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 font-mono">
                {propFirmName} Rollover &amp; Global Session Clock
              </h3>
              {isLondonNYOverlap && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold flex items-center gap-1">
                  <Zap className="w-3 h-3 text-emerald-600" />
                  <span>London / NY Overlap</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Tracks broker rollover reset and high-liquidity institutional trading windows
            </p>
          </div>
        </div>

        <div className="text-left sm:text-right font-mono">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Current Broker UTC</span>
          <span className="text-sm font-extrabold text-slate-900">{currentUTCTime || '22:00:00 UTC'}</span>
        </div>
      </div>

      {/* Rollover Alert Banner */}
      <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        isSpreadDangerZone
          ? 'bg-rose-50 border-rose-200 text-rose-800'
          : 'bg-blue-50/70 border-blue-200 text-slate-800'
      }`}>
        <div className="flex items-center gap-2.5">
          {isSpreadDangerZone ? (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          ) : (
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
          )}
          <div>
            <div className="text-xs font-bold font-mono">
              {isSpreadDangerZone
                ? '⚠️ Rollover Spread Expansion Zone (21:45 - 22:15 UTC)'
                : `${propFirmName} Daily Drawdown Reset at 22:00 UTC`}
            </div>
            <div className="text-[11px] text-slate-600 font-sans mt-0.5">
              {isSpreadDangerZone
                ? 'Liquidity gap window: Spreads widen across broker servers. Avoid tight stops.'
                : 'Daily baseline equity and 5% loss limit reset automatically at broker midnight.'}
            </div>
          </div>
        </div>

        <div className="shrink-0 font-mono text-left sm:text-right bg-white/80 px-3 py-1.5 rounded-lg border border-slate-200">
          <span className="text-[10px] text-slate-500 uppercase block">Next Daily Reset In:</span>
          <span className="text-sm font-black text-blue-700">{timeUntilRollover}</span>
        </div>
      </div>

      {/* Global Trading Sessions Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
        {sessions.map((sess) => (
          <div
            key={sess.name}
            className={`p-3 rounded-xl border transition-all ${
              sess.isActive
                ? 'bg-blue-50/60 border-blue-300 ring-1 ring-blue-500/10'
                : 'bg-slate-50 border-slate-200/80 opacity-75'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-slate-900">{sess.name}</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  sess.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                }`}
              />
            </div>
            <div className="text-[10px] text-slate-500">{sess.range}</div>
            <div className="text-[10px] font-sans font-semibold mt-1 text-slate-600">
              {sess.isActive ? '🟢 Active Session' : '⚪ Closed / Off-hours'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
