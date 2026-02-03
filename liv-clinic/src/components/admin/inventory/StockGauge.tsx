'use client';

/**
 * Premium SVG-based gauge & chart components for inventory visualization.
 * "Quiet Luxury" aesthetic — warm neutrals, refined shadows, smooth animations.
 */

// ─── Circular Gauge ─────────────────────────────
interface CircularGaugeProps {
  /** 0-100 percentage */
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  sublabel?: string;
}

const STATUS_COLORS = {
  normal: { stroke: '#34d399', trail: '#ecfdf5' },
  low:    { stroke: '#f59e0b', trail: '#fffbeb' },
  out:    { stroke: '#ef4444', trail: '#fef2f2' },
};

function resolveColor(pct: number) {
  if (pct <= 0) return STATUS_COLORS.out;
  if (pct <= 40) return STATUS_COLORS.low;
  return STATUS_COLORS.normal;
}

export function CircularGauge({
  value,
  size = 72,
  strokeWidth = 6,
  color,
  label,
  sublabel,
}: CircularGaugeProps) {
  const pct = Math.max(0, Math.min(100, value));
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (pct / 100) * circumference;
  const colors = color ? { stroke: color, trail: `${color}15` } : resolveColor(pct);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="transform -rotate-90" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.04))' }}>
        {/* trail */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={colors.trail}
          strokeWidth={strokeWidth}
        />
        {/* value arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={colors.stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {/* centre text overlay */}
      <div
        className="absolute flex flex-col items-center justify-center"
        style={{ width: size, height: size }}
      >
        <span className="text-sm font-bold text-[#6d4e42] leading-none">{Math.round(pct)}%</span>
      </div>
      {label && <span className="text-xs text-[#575756] font-medium leading-tight">{label}</span>}
      {sublabel && <span className="text-[10px] text-[#8a8a8a] leading-tight">{sublabel}</span>}
    </div>
  );
}

// ─── Linear Progress Bar ────────────────────────
interface ProgressBarProps {
  current: number;
  min: number;
  max?: number;
  height?: number;
  showLabel?: boolean;
  animated?: boolean;
}

export function ProgressBar({ current, min, max, height = 6, showLabel = false, animated = true }: ProgressBarProps) {
  const effectiveMax = max ?? Math.max(min * 3, current, 1);
  const pct = Math.min(100, (current / effectiveMax) * 100);

  let barColor = 'bg-emerald-400';
  let bgColor = 'bg-emerald-50';
  if (current <= 0) {
    barColor = 'bg-red-400';
    bgColor = 'bg-red-50';
  } else if (current <= min) {
    barColor = 'bg-amber-400';
    bgColor = 'bg-amber-50';
  }

  return (
    <div className="flex items-center gap-2 w-full">
      <div className={`flex-1 ${bgColor} rounded-full overflow-hidden`} style={{ height }}>
        <div
          className={`h-full ${barColor} rounded-full ${animated ? 'transition-all duration-700 ease-out' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-[#8a8a8a] tabular-nums w-8 text-right flex-shrink-0">
          {current}
        </span>
      )}
    </div>
  );
}

// ─── Donut Chart (SVG) ──────────────────────────
export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  centreLabel?: string;
  centreValue?: string | number;
}

export function DonutChart({
  segments,
  size = 140,
  strokeWidth = 20,
  centreLabel,
  centreValue,
}: DonutChartProps) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) {
    return (
      <div className="flex items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-xs text-[#8a8a8a]">데이터 없음</span>
      </div>
    );
  }
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  let accumulated = 0;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.06))' }}>
        {/* Background circle for subtle depth */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#f0eeec"
          strokeWidth={strokeWidth}
        />
        {segments.map((seg, i) => {
          const pct = seg.value / total;
          const dashLength = pct * circumference;
          const dashOffset = -(accumulated / total) * circumference;
          accumulated += seg.value;
          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeLinecap="butt"
              strokeDasharray={`${dashLength} ${circumference - dashLength}`}
              strokeDashoffset={dashOffset}
              className="transition-all duration-700 ease-out"
            />
          );
        })}
      </svg>
      {/* Centre text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {centreValue !== undefined && (
          <span className="text-2xl font-bold text-[#6d4e42] tracking-tight">{centreValue}</span>
        )}
        {centreLabel && <span className="text-[10px] text-[#a09080] mt-0.5">{centreLabel}</span>}
      </div>
    </div>
  );
}

// ─── Mini Bar (horizontal bar for category distribution) ─
interface MiniBarProps {
  label: string;
  value: number;
  maxValue: number;
  color: string;
}

export function MiniBar({ label, value, maxValue, color }: MiniBarProps) {
  const pct = maxValue > 0 ? (value / maxValue) * 100 : 0;
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-xs text-[#575756] w-20 truncate flex-shrink-0">{label}</span>
      <div className="flex-1 bg-[#f0eeec] rounded-full h-[7px] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-semibold text-[#6d4e42] w-6 text-right flex-shrink-0 tabular-nums">{value}</span>
    </div>
  );
}
