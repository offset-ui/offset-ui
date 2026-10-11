"use client";
/**
 * Dependencies this component expects from the host project:
 * - Tailwind CSS (styling is utility classes plus inline styles for prop-driven values)
 * - "motion" (the `motion/react` package) for the bar grow-up and rolling-counter animations
 * - cn() from "@/lib/utils" (clsx + tailwind-merge) — swap for your own classname merger if needed
 * No Next.js-specific APIs are used, so this drops into any React project. Typography is inherited
 * from the host page by default; pass `typography.fontFamily` to override it.
 */

import { useEffect, useState, type CSSProperties } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { cn } from "@/lib/utils";

export type DynamicMetricsColors = {
  surface: string;
  border: string;
  text: string;
  muted: string;
  pillActive: string;
  bar: string;
  grid: string;
  increaseBg: string;
  increaseText: string;
  decreaseBg: string;
  decreaseText: string;
};

export type DynamicMetricsSizes = {
  radius: number;
  barRadius: number;
  pillRadius: number;
  badgeRadius: number;
  plotHeight: number;
  maxBars: number;
  /** Override the data-driven bar width (see barWidthFor) with a fixed pixel value. */
  barWidth?: number;
};

export type DynamicMetricsTypography = {
  fontFamily?: string;
  headingSize: number;
  headingWeight: number;
  valueSize: number;
  valueWeight: number;
  labelSize: number;
  axisSize: number;
  pillSize: number;
  badgeSize: number;
};

export type MetricsFrame = {
  id: string;
  label: string;
  sales: number;
  units: number;
  /** Percent change; its sign drives the up/green or down/red badge. */
  salesChange: number;
  unitsChange: number;
  /** Raw bar values; heights are normalised against the frame's own max. */
  bars: number[];
  /** X-axis labels, rendered independently of bar count. */
  ticks: string[];
};

export type DynamicMetricsChartProps = {
  title?: string;
  frames?: MetricsFrame[];
  timeframe?: string;
  defaultTimeframe?: string;
  onTimeframeChange?: (id: string) => void;
  formatSales?: (value: number) => string;
  formatUnits?: (value: number) => string;
  duration?: number;
  colors?: Partial<DynamicMetricsColors>;
  sizes?: Partial<DynamicMetricsSizes>;
  typography?: Partial<DynamicMetricsTypography>;
  className?: string;
};

const COLORS: DynamicMetricsColors = {
  surface: "#ffffff",
  border: "#ebebeb",
  text: "#121212",
  muted: "#707070",
  pillActive: "#f4f4f4",
  bar: "#d2ebff",
  grid: "#ebebeb",
  increaseBg: "#e0ffe2",
  increaseText: "#276c07",
  decreaseBg: "#ffe0e0",
  decreaseText: "#6c0707",
};

const SIZES: DynamicMetricsSizes = {
  radius: 24,
  barRadius: 4,
  pillRadius: 20,
  badgeRadius: 6,
  plotHeight: 126,
  maxBars: 25,
};

const TYPO: DynamicMetricsTypography = {
  headingSize: 20,
  headingWeight: 500,
  valueSize: 24,
  valueWeight: 500,
  labelSize: 16,
  axisSize: 14,
  pillSize: 16,
  badgeSize: 10,
};

/** iOS-style continuous corners; applied only to border-less fills (bars, badges). */
const SQUIRCLE = { cornerShape: "squircle" } as CSSProperties;

const DEMO_FRAMES: MetricsFrame[] = [
  {
    id: "today",
    label: "Today",
    sales: 261.42,
    units: 10,
    salesChange: 21.4,
    unitsChange: -2.16,
    bars: [54, 90, 26, 120, 93, 54, 102, 26, 59, 83],
    ticks: ["00:00", "06:00", "12:00", "18:00", "24:00"],
  },
  {
    id: "7d",
    label: "7D",
    sales: 458.02,
    units: 28,
    salesChange: 21.4,
    unitsChange: -0.11,
    bars: [54, 90, 26, 126, 78, 59, 83, 26, 68],
    ticks: ["02 Oct", "03 Oct", "04 Oct", "05 Oct", "06 Oct", "07 Oct", "08 Oct"],
  },
  {
    id: "30d",
    label: "30D",
    sales: 1102.1,
    units: 52,
    salesChange: 21.4,
    unitsChange: 3.69,
    bars: [100, 43, 86, 19, 14, 69, 97, 28, 34, 81, 30, 10, 14, 108, 19, 16, 85, 19, 74, 21, 89, 19, 83, 21, 81],
    ticks: ["02 Oct", "06 Oct", "10 Oct", "14 Oct", "18 Oct", "22 Oct", "26 Oct", "30 Oct"],
  },
];

/** Dynamic bar width from total volume: <15 → 18px, 15–30 → 30px, >30 → thin 6px. */
function barWidthFor(units: number, override?: number) {
  if (override !== undefined) return override;
  if (units < 15) return 18;
  if (units <= 30) return 30;
  return 6;
}

/** Hard ceiling on bars: evenly sample down to `max` instead of dropping the tail. */
function capBars(values: number[], max: number) {
  if (values.length <= max) return values;
  const step = (values.length - 1) / (max - 1);
  return Array.from({ length: max }, (_, i) => values[Math.round(i * step)]);
}

function useControllableState<T>(controlled: T | undefined, defaultValue: T, onChange?: (value: T) => void) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const value = controlled !== undefined ? controlled : uncontrolled;
  function setValue(next: T) {
    if (controlled === undefined) setUncontrolled(next);
    onChange?.(next);
  }
  return [value, setValue] as const;
}

function TrendTriangle({ up }: { up: boolean }) {
  return (
    <svg aria-hidden width="12" height="10" viewBox="0 0 12 10" fill="none" className="shrink-0">
      <path d={up ? "M6 2L2 8H10L6 2Z" : "M6 8L2 2H10L6 8Z"} fill="currentColor" />
    </svg>
  );
}

function ChangeBadge({ value, size, radius }: { value: number; size: number; radius: number }) {
  const up = value >= 0;
  return (
    <span
      className="inline-flex items-center gap-0.5 px-1.5 py-1"
      style={{
        borderRadius: radius,
        backgroundColor: up ? "var(--dmc-inc-bg)" : "var(--dmc-dec-bg)",
        color: up ? "var(--dmc-inc-text)" : "var(--dmc-dec-text)",
        fontSize: size,
        ...SQUIRCLE,
      }}
    >
      <TrendTriangle up={up} />
      {`${up ? "+" : "−"}${Math.abs(value)}%`}
    </span>
  );
}

function RollingNumber({
  value,
  format,
  duration,
  reduceMotion,
}: {
  value: number;
  format: (value: number) => string;
  duration: number;
  reduceMotion: boolean | null;
}) {
  const motionValue = useMotionValue(value);
  const text = useTransform(motionValue, format);
  useEffect(() => {
    if (reduceMotion) {
      motionValue.set(value);
      return;
    }
    const controls = animate(motionValue, value, { duration, ease: "easeOut" });
    return () => controls.stop();
  }, [value, duration, reduceMotion, motionValue]);
  return <motion.span>{text}</motion.span>;
}

function Metric({
  label,
  value,
  change,
  typo,
  badgeRadius,
}: {
  label: string;
  value: React.ReactNode;
  change: number;
  typo: DynamicMetricsTypography;
  badgeRadius: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="[color:var(--dmc-muted)]" style={{ fontSize: typo.labelSize }}>
        {label}
      </p>
      <div className="flex items-center gap-2.5">
        <p
          className="whitespace-nowrap tabular-nums [color:var(--dmc-text)]"
          style={{ fontSize: typo.valueSize, fontWeight: typo.valueWeight }}
        >
          {value}
        </p>
        <ChangeBadge value={change} size={typo.badgeSize} radius={badgeRadius} />
      </div>
    </div>
  );
}

export function DynamicMetricsChart({
  title = "Overview",
  frames = DEMO_FRAMES,
  timeframe,
  defaultTimeframe,
  onTimeframeChange,
  formatSales = (v) => `$${v.toFixed(2)}`,
  formatUnits = (v) => Math.round(v).toString(),
  duration = 0.5,
  colors,
  sizes,
  typography,
  className,
}: DynamicMetricsChartProps) {
  const c = { ...COLORS, ...colors };
  const s = { ...SIZES, ...sizes };
  const t = { ...TYPO, ...typography };
  const reduceMotion = useReducedMotion();

  const [active, setActive] = useControllableState(timeframe, defaultTimeframe ?? frames[0].id, onTimeframeChange);
  const frame = frames.find((f) => f.id === active) ?? frames[0];

  const bars = capBars(frame.bars, s.maxBars);
  const max = Math.max(...bars, 1);
  const barWidth = barWidthFor(frame.units, s.barWidth);

  const vars = {
    "--dmc-surface": c.surface,
    "--dmc-border": c.border,
    "--dmc-text": c.text,
    "--dmc-muted": c.muted,
    "--dmc-pill-active": c.pillActive,
    "--dmc-bar": c.bar,
    "--dmc-grid": c.grid,
    "--dmc-inc-bg": c.increaseBg,
    "--dmc-inc-text": c.increaseText,
    "--dmc-dec-bg": c.decreaseBg,
    "--dmc-dec-text": c.decreaseText,
  } as CSSProperties;

  return (
    <div
      className={cn("flex w-[525px] max-w-full flex-col gap-7 border border-solid p-5 [background:var(--dmc-surface)] [border-color:var(--dmc-border)]", className)}
      style={{ ...vars, borderRadius: s.radius, fontFamily: t.fontFamily, lineHeight: "normal", ...SQUIRCLE }}
    >
      <div className="flex w-full items-center justify-between">
        <h2 className="[color:var(--dmc-text)]" style={{ fontSize: t.headingSize, fontWeight: t.headingWeight }}>
          {title}
        </h2>
        <div role="group" aria-label="Select time range" className="flex gap-2.5">
          {frames.map((f) => {
            const selected = f.id === active;
            return (
              <button
                key={f.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setActive(f.id)}
                className="flex items-center justify-center px-2 py-1.5 transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--dmc-muted)]"
                style={{
                  borderRadius: s.pillRadius,
                  backgroundColor: selected ? "var(--dmc-pill-active)" : "transparent",
                  color: selected ? "var(--dmc-text)" : "var(--dmc-muted)",
                  fontSize: t.pillSize,
                  fontWeight: 500,
                  ...SQUIRCLE,
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex w-full items-center gap-6">
        <Metric
          label="Sales"
          value={<RollingNumber value={frame.sales} format={formatSales} duration={duration} reduceMotion={reduceMotion} />}
          change={frame.salesChange}
          typo={t}
          badgeRadius={s.badgeRadius}
        />
        <div className="h-12 w-px shrink-0 [background:var(--dmc-grid)]" />
        <Metric
          label="Units"
          value={<RollingNumber value={frame.units} format={formatUnits} duration={duration} reduceMotion={reduceMotion} />}
          change={frame.unitsChange}
          typo={t}
          badgeRadius={s.badgeRadius}
        />
      </div>

      <div className="flex w-full flex-col gap-2.5 pt-6">
        <div
          role="img"
          aria-label={`${frame.label}: sales ${formatSales(frame.sales)}, ${formatUnits(frame.units)} units`}
          className="w-full"
          style={{ height: s.plotHeight }}
        >
          <motion.div key={active} className="flex h-full w-full items-end">
            {bars.map((value, i) => {
              const height = (value / max) * s.plotHeight;
              return (
                <div key={i} className="flex flex-1 items-end justify-center">
                  <motion.div
                    aria-hidden
                    initial={reduceMotion ? false : { height: 0 }}
                    animate={{ height }}
                    transition={{ duration, ease: "easeOut", delay: reduceMotion ? 0 : Math.min(i * 0.015, 0.3) }}
                    style={{ width: barWidth, borderRadius: s.barRadius, backgroundColor: "var(--dmc-bar)", ...SQUIRCLE }}
                  />
                </div>
              );
            })}
          </motion.div>
        </div>

        <div className="flex w-full items-center border-t border-solid [border-color:var(--dmc-grid)]">
          {frame.ticks.map((tick, i) => (
            <div key={i} className="flex min-w-px flex-1 flex-col items-center gap-2">
              <div className="h-[25px] w-px [background:var(--dmc-grid)]" />
              <p className="text-center [color:var(--dmc-muted)]" style={{ fontSize: t.axisSize }}>
                {tick}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
