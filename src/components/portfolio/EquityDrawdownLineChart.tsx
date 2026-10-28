import React, { useState } from 'react';
import { FundingAccount } from '../../types';
import { LineChart as ChartIcon, ShieldAlert, CheckCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/quantCalculations';

interface EquityDrawdownLineChartProps {
  account: FundingAccount;
}

export const EquityDrawdownLineChart: React.FC<EquityDrawdownLineChartProps> = ({ account }) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const dataPoints = account.historicalEquity;
  if (!dataPoints || dataPoints.length === 0) return null;

  const allValues = [
    ...dataPoints.map((d) => d.equity),
    ...dataPoints.map((d) => d.drawdownCeiling),
    account.dailyStartingEquity,
  ];
  const minVal = Math.min(...allValues) * 0.995;
  const maxVal = Math.max(...allValues) * 1.005;
  const range = maxVal - minVal || 1;

  const width = 800;
  const height = 260;
  const paddingX = 50;
  const paddingY = 30;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const getX = (index: number) => paddingX + (index / (dataPoints.length - 1)) * chartWidth;
  const getY = (val: number) => paddingY + chartHeight - ((val - minVal) / range) * chartHeight;

  const equityPoints = dataPoints.map((d, i) => `${getX(i)},${getY(d.equity)}`).join(' ');
  const ceilingY = getY(account.dailyDrawdownCeiling);
  const startingY = getY(account.dailyStartingEquity);

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <ChartIcon className="w-4 h-4 text-emerald-400" />
            Equity Curve vs. Red 5% Daily Drawdown Threshold Marker
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Active Account: <span className="font-mono text-emerald-400 font-semibold">{account.id}</span> ({account.propFirm}) · Hard 5% daily loss boundary locked at broker rollover.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-emerald-400 inline-block" />
            <span className="text-slate-300">Live Equity</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-slate-500 border-b border-dashed inline-block" />
            <span className="text-slate-400">Rollover Base</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-rose-500 inline-block" />
            <span className="text-rose-400 font-semibold">5% DD Ceiling</span>
          </div>
        </div>
      </div>

      {/* Real-time stats chip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 text-xs font-mono">
        <div>
          <span className="text-[10px] text-slate-500 block">Rollover Starting Equity</span>
          <span className="font-semibold text-slate-200 tabular-nums">
            {formatCurrency(account.dailyStartingEquity)}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 block">5% Hard Ceiling ($)</span>
          <span className="font-semibold text-rose-400 tabular-nums">
            {formatCurrency(account.dailyDrawdownCeiling)}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 block">Max 24h Loss Budget</span>
          <span className="font-semibold text-amber-400 tabular-nums">
            -{formatCurrency(account.maxLossAllowed)}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 block">Distance to Violation</span>
          <span
            className={`font-bold tabular-nums flex items-center gap-1 ${
              account.distanceToViolation <= 0
                ? 'text-rose-500'
                : account.distancePct < 2.0
                ? 'text-amber-400'
                : 'text-emerald-400'
            }`}
          >
            {account.distanceToViolation <= 0 ? (
              <ShieldAlert className="w-3 h-3 text-rose-500" />
            ) : (
              <CheckCircle className="w-3 h-3 text-emerald-400" />
            )}
            +{formatCurrency(account.distanceToViolation)} ({account.distancePct.toFixed(2)}%)
          </span>
        </div>
      </div>

      {/* SVG Chart Container */}
      <div className="relative w-full aspect-[16/6] min-h-[220px] max-h-[320px] overflow-hidden bg-slate-950/40 rounded-lg border border-slate-800/60 p-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          {/* Subtle Grid Lines */}
          <line
            x1={paddingX}
            y1={startingY}
            x2={width - paddingX}
            y2={startingY}
            stroke="#475569"
            strokeDasharray="4 4"
            strokeWidth="1.2"
          />
          <text
            x={width - paddingX - 8}
            y={startingY - 6}
            textAnchor="end"
            fill="#94a3b8"
            fontSize="10"
            fontFamily="monospace"
          >
            Base: {formatCurrency(account.dailyStartingEquity)}
          </text>

          {/* Hard 5% Red Drawdown Threshold Line */}
          <line
            x1={paddingX}
            y1={ceilingY}
            x2={width - paddingX}
            y2={ceilingY}
            stroke="#ef4444"
            strokeWidth="2"
          />
          <text
            x={width - paddingX - 8}
            y={ceilingY - 6}
            textAnchor="end"
            fill="#f87171"
            fontSize="10"
            fontWeight="bold"
            fontFamily="monospace"
          >
            5% Hard Limit: {formatCurrency(account.dailyDrawdownCeiling)}
          </text>

          {/* Shaded Red Violation Danger Zone (below the ceiling) */}
          <rect
            x={paddingX}
            y={ceilingY}
            width={chartWidth}
            height={Math.max(0, height - paddingY - ceilingY)}
            fill="rgba(239, 68, 68, 0.08)"
          />

          {/* Safe Buffer Area (between ceiling and equity) */}
          <polygon
            points={`${paddingX},${ceilingY} ${equityPoints} ${getX(dataPoints.length - 1)},${ceilingY}`}
            fill="rgba(16, 185, 129, 0.08)"
          />

          {/* Live Equity Polyline */}
          <polyline
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            points={equityPoints}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive Data Point Dots */}
          {dataPoints.map((pt, i) => {
            const cx = getX(i);
            const cy = getY(pt.equity);
            const isHovered = hoverIndex === i;

            return (
              <g key={pt.time} onMouseEnter={() => setHoverIndex(i)} onMouseLeave={() => setHoverIndex(null)}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 6 : 4}
                  fill="#10b981"
                  stroke="#090d16"
                  strokeWidth="2"
                  className="cursor-pointer transition-all"
                />
                <text
                  x={cx}
                  y={height - 8}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {pt.time}
                </text>
              </g>
            );
          })}
        </svg>

        {hoverIndex !== null && (
          <div
            className="absolute bg-slate-900 border border-slate-700 px-3 py-1.5 rounded shadow-lg text-xs font-mono pointer-events-none z-20"
            style={{
              left: `${(hoverIndex / (dataPoints.length - 1)) * 80 + 10}%`,
              top: '20px',
            }}
          >
            <div className="text-[10px] text-slate-400">Rollover Time: {dataPoints[hoverIndex].time} UTC</div>
            <div className="text-emerald-400 font-bold">
              Equity: {formatCurrency(dataPoints[hoverIndex].equity)}
            </div>
            <div className="text-slate-300 text-[11px]">
              Safety Margin: +{formatCurrency(dataPoints[hoverIndex].equity - account.dailyDrawdownCeiling)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
