"use client";
/**
 * Dependencies this component expects from the host project:
 * - Tailwind CSS (styling is utility classes plus inline styles for prop-driven values)
 * - "motion" (the `motion/react` package) for the bar grow-up and rolling-counter animations
 * - cn() from "@/lib/utils" (clsx + tailwind-merge) — swap for your own classname merger if needed
 * No Next.js-specific APIs are used, so this drops into any React project. Typography is inherited
 * from the host page by default; pass `typography.fontFamily` to override it.
 */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
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
  tooltipBg: string;
  tooltipText: string;
  emptyPanel: string;
  refreshBg: string;
  refreshText: string;
};

export type DynamicMetricsSizes = {
  radius: number;
  barRadius: number;
  pillRadius: number;
  badgeRadius: number;
  tooltipRadius: number;
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
  badgeWeight: number;
  tooltipSize: number;
  tooltipWeight: number;
};

export type MetricsFrame = {
  id: string;
  label: string;
  sales: number;
  units: number;
  /** Percent change; its sign drives the up/green or down/red badge. */
  salesChange: number;
  unitsChange: number;
  /**
   * Relative shape of sales over the period. It's resampled to the rendered bar
   * count (one bar per unit, capped at maxBars), so the number of values here is
   * only the silhouette — the actual bar count is driven by `units`.
   */
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
  /** Shown in the chart area when the active frame has no data (units ≤ 0). */
  emptyMessage?: string;
  refreshLabel?: string;
  /** Called when the empty-state Refresh button is pressed. */
  onRefresh?: () => void;
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
  tooltipBg: "#121212",
  tooltipText: "#ffffff",
  emptyPanel: "#fbfdff",
  refreshBg: "#E9F5FF",
  refreshText: "#315b7a",
};

const SIZES: DynamicMetricsSizes = {
  radius: 48,
  barRadius: 2,
  pillRadius: 20,
  badgeRadius: 12,
  tooltipRadius: 14,
  plotHeight: 126,
  maxBars: 25,
};

const TYPO: DynamicMetricsTypography = {
  headingSize: 20,
  headingWeight: 500,
  valueSize: 24,
  valueWeight: 500,
  labelSize: 16,
  axisSize: 12,
  pillSize: 16,
  badgeSize: 10,
  badgeWeight: 500,
  tooltipSize: 10,
  tooltipWeight: 500,
};

/** iOS-style continuous corners; applied only to border-less fills (bars, badges). */
const SQUIRCLE = { cornerShape: "squircle" } as CSSProperties;

/** Quick spring that squeezes the active pill as it slides between options. */
const PILL_SPRING = { type: "spring", stiffness: 800, damping: 56, mass: 0.8 } as const;

/** Softer spring that glides the shared tooltip between bars. */
const TIP_SPRING = { type: "spring", stiffness: 500, damping: 36 } as const;

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

/** Bar width adapts to the rendered bar count so bars fit without overflowing. */
function barWidthFor(count: number, override?: number) {
  if (override !== undefined) return override;
  if (count <= 12) return 18;
  if (count <= 18) return 12;
  return 6;
}

/** Resample a shape (up or down) to exactly `n` points via linear interpolation. */
function resample(values: number[], n: number): number[] {
  if (n <= 0 || values.length === 0) return [];
  if (values.length === n) return values.slice();
  if (n === 1) return [values.reduce((a, b) => a + b, 0) / values.length];
  if (values.length === 1) return Array(n).fill(values[0]);
  return Array.from({ length: n }, (_, i) => {
    const pos = (i * (values.length - 1)) / (n - 1);
    const lo = Math.floor(pos);
    const hi = Math.min(lo + 1, values.length - 1);
    return values[lo] + (values[hi] - values[lo]) * (pos - lo);
  });
}

/** Split an integer `total` across `weights` so the whole-number parts sum exactly to `total`. */
function allocateIntegers(weights: number[], total: number) {
  const sum = weights.reduce((a, b) => a + b, 0) || 1;
  const raw = weights.map((w) => (w / sum) * total);
  const result = raw.map(Math.floor);
  let left = total - result.reduce((a, b) => a + b, 0);
  const byFraction = raw.map((r, i) => [i, r - Math.floor(r)] as const).sort((a, b) => b[1] - a[1]);
  for (let k = 0; left > 0 && k < byFraction.length; k++, left--) result[byFraction[k][0]]++;
  return result;
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

function RefreshIcon() {
  return (
    <svg aria-hidden width="12" height="12" viewBox="0 0 16 16" fill="none" className="shrink-0">
      <path
        d="M2 8C2 6.4087 2.63214 4.88258 3.75736 3.75736C4.88258 2.63214 6.4087 2 8 2C9.67737 2.00631 11.2874 2.66082 12.4933 3.82667L14 5.33333M10.6667 5.33333H14V2M14 8C14 9.5913 13.3679 11.1174 12.2426 12.2426C11.1174 13.3679 9.5913 14 8 14C6.32263 13.9937 4.71265 13.3392 3.50667 12.1733L2 10.6667M2 14V10.6667H5.33333"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChangeBadge({ value, size, weight, radius }: { value: number; size: number; weight: number; radius: number }) {
  const up = value >= 0;
  return (
    <span
      className="inline-flex items-center gap-0.5 px-1.5 py-1"
      style={{
        borderRadius: radius,
        backgroundColor: up ? "var(--dmc-inc-bg)" : "var(--dmc-dec-bg)",
        color: up ? "var(--dmc-inc-text)" : "var(--dmc-dec-text)",
        fontSize: size,
        fontWeight: weight,
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
  empty,
}: {
  label: string;
  value: React.ReactNode;
  change: number;
  typo: DynamicMetricsTypography;
  badgeRadius: number;
  empty?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="[color:var(--dmc-muted)]" style={{ fontSize: typo.labelSize }}>
        {label}
      </p>
      <div className="flex items-center gap-2.5">
        <p
          className="whitespace-nowrap tabular-nums"
          style={{ fontSize: typo.valueSize, fontWeight: typo.valueWeight, color: empty ? "var(--dmc-muted)" : "var(--dmc-text)" }}
        >
          {empty ? "—" : value}
        </p>
        {!empty && <ChangeBadge value={change} size={typo.badgeSize} weight={typo.badgeWeight} radius={badgeRadius} />}
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
  emptyMessage = "Not enough parameters or metrics at this moment.",
  refreshLabel = "Refresh",
  onRefresh,
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

  // Single sliding/squeezing pill: measure the active button and tween a lone indicator to it.
  const groupRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [pill, setPill] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const measurePill = useCallback(() => {
    const el = btnRefs.current[active];
    if (el) setPill({ x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight });
  }, [active]);
  useLayoutEffect(measurePill, [measurePill, t.pillSize, frames]);
  useEffect(() => {
    document.fonts?.ready.then(measurePill);
  }, [measurePill]);

  // One bar per unit, capped at maxBars. The sales shape is resampled to that count,
  // then Sales/Units are split across the bars so everything stays consistent:
  // height tracks each bar's $ amount, amounts sum to Sales, units sum to Units, and a
  // bar with no sales ($0) holds 0 units (zero height) — never money with zero units.
  // Memoised so hovering (which re-renders) doesn't redo the resample/allocation.
  const { barData, maxSales, barWidth } = useMemo(() => {
    const totalUnits = Math.max(0, Math.round(frame.units));
    const barCount = Math.min(totalUnits, s.maxBars);
    const shape = resample(frame.bars, barCount);
    const centShares = allocateIntegers(shape, Math.round(frame.sales * 100));
    const extraUnits = allocateIntegers(shape, totalUnits - barCount); // spread the surplus over 1-per-bar
    const data = shape.map((_, i) => {
      const salesAmount = centShares[i] / 100;
      return { sales: salesAmount, units: salesAmount > 0 ? 1 + extraUnits[i] : 0 };
    });
    return {
      barData: data,
      maxSales: Math.max(...data.map((b) => b.sales), Number.EPSILON),
      barWidth: barWidthFor(barCount, s.barWidth),
    };
  }, [frame, s.maxBars, s.barWidth]);

  const isEmpty = barData.length === 0; // no units/data for this frame → show the empty state

  const [hovered, setHovered] = useState<number | null>(null);
  function selectTimeframe(id: string) {
    setHovered(null); // drop any stale hover when the bars change
    setActive(id);
  }

  const hoveredBar = hovered !== null ? barData[hovered] : undefined;
  const tip = hoveredBar
    ? {
        left: `${((hovered! + 0.5) / barData.length) * 100}%`,
        bottom: (hoveredBar.sales / maxSales) * s.plotHeight + 13,
        text: `${formatSales(hoveredBar.sales).replace(/\.\d+/, "")} / ${formatUnits(hoveredBar.units)}${hoveredBar.units === 1 ? "Unit" : "Units"}`,
      }
    : null;

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
    "--dmc-tip-bg": c.tooltipBg,
    "--dmc-tip-text": c.tooltipText,
    "--dmc-empty-panel": c.emptyPanel,
    "--dmc-refresh-bg": c.refreshBg,
    "--dmc-refresh-text": c.refreshText,
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
        <div ref={groupRef} role="group" aria-label="Select time range" className="relative flex gap-2.5">
          {pill && (
            <motion.div
              aria-hidden
              initial={false}
              animate={{ x: pill.x, y: pill.y, width: pill.w, height: pill.h }}
              transition={reduceMotion ? { duration: 0 } : PILL_SPRING}
              className="absolute left-0 top-0"
              style={{ borderRadius: s.pillRadius, backgroundColor: "var(--dmc-pill-active)", ...SQUIRCLE }}
            />
          )}
          {frames.map((f) => {
            const selected = f.id === active;
            return (
              <button
                key={f.id}
                ref={(el) => {
                  btnRefs.current[f.id] = el;
                }}
                type="button"
                aria-pressed={selected}
                onClick={() => selectTimeframe(f.id)}
                className="relative flex items-center justify-center px-2 py-1.5 outline-none transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--dmc-muted)]"
                style={{
                  borderRadius: s.pillRadius,
                  color: selected ? "var(--dmc-text)" : "var(--dmc-muted)",
                  fontSize: t.pillSize,
                  fontWeight: 500,
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
          empty={isEmpty}
        />
        <div className="h-12 w-px shrink-0 [background:var(--dmc-grid)]" />
        <Metric
          label="Units"
          value={<RollingNumber value={frame.units} format={formatUnits} duration={duration} reduceMotion={reduceMotion} />}
          change={frame.unitsChange}
          typo={t}
          badgeRadius={s.badgeRadius}
          empty={isEmpty}
        />
      </div>

      <div className="flex w-full flex-col gap-2.5 pt-6">
        {isEmpty ? (
          <div
            role="status"
            className="flex w-full flex-col items-center justify-center gap-4 overflow-hidden px-4 text-center [background:var(--dmc-empty-panel)]"
            style={{ minHeight: s.plotHeight, borderRadius: 8, ...SQUIRCLE }}
          >
            <p className="[color:var(--dmc-muted)]" style={{ fontSize: t.labelSize, lineHeight: 1.5, maxWidth: 370 }}>
              {emptyMessage}
            </p>
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center gap-2 px-2 py-2 outline-none transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--dmc-muted)] [background:var(--dmc-refresh-bg)] [color:var(--dmc-refresh-text)]"
              style={{ borderRadius: 14, fontSize: 12, fontWeight: 500, ...SQUIRCLE }}
            >
              <RefreshIcon />
              {refreshLabel}
            </button>
          </div>
        ) : (
          <div
            role="group"
            aria-label={`${frame.label}: sales ${formatSales(frame.sales)}, ${formatUnits(frame.units)} units`}
            className="relative w-full"
            style={{ height: s.plotHeight }}
            onMouseLeave={() => setHovered(null)}
          >
            <motion.div key={active} className="flex h-full w-full items-end">
            {barData.map((bar, i) => {
              const height = (bar.sales / maxSales) * s.plotHeight;
              const faded = hovered !== null && hovered !== i;
              const unitWord = bar.units === 1 ? "Unit" : "Units";
              return (
                <div
                  key={i}
                  role="img"
                  aria-label={`${formatSales(bar.sales)}, ${formatUnits(bar.units)} ${unitWord}`}
                  tabIndex={0}
                  onMouseEnter={() => setHovered(i)}
                  onFocus={() => setHovered(i)}
                  onBlur={() => setHovered(null)}
                  className="flex flex-1 items-end justify-center rounded-md outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--dmc-muted)]"
                >
                  <motion.div
                    aria-hidden
                    initial={reduceMotion ? false : { height: 0 }}
                    animate={{ height, opacity: faded ? 0.25 : 1 }}
                    transition={{
                      height: { duration, ease: "easeOut", delay: reduceMotion ? 0 : Math.min(i * 0.015, 0.3) },
                      opacity: { duration: reduceMotion ? 0 : 0.2 },
                    }}
                    style={{ width: barWidth, borderRadius: s.barRadius, backgroundColor: "var(--dmc-bar)", ...SQUIRCLE }}
                  />
                </div>
              );
            })}
          </motion.div>

          {/* One shared tooltip that slides between bars (no per-bar remount, no width jump). */}
          <AnimatePresence>
            {tip && (
              <motion.div
                key="tooltip"
                aria-hidden
                initial={{ opacity: 0, left: tip.left, bottom: tip.bottom }}
                animate={{ opacity: 1, left: tip.left, bottom: tip.bottom }}
                exit={{ opacity: 0 }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { left: TIP_SPRING, bottom: TIP_SPRING, opacity: { duration: 0.15 } }
                }
                className="pointer-events-none absolute z-10 -translate-x-1/2 whitespace-nowrap px-2 py-1.5 text-center [background:var(--dmc-tip-bg)] [color:var(--dmc-tip-text)]"
                style={{ borderRadius: s.tooltipRadius, fontSize: t.tooltipSize, fontWeight: t.tooltipWeight, ...SQUIRCLE }}
              >
                {tip.text}
                <span
                  className="absolute left-1/2 top-full -translate-x-1/2"
                  style={{ width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: "9px solid var(--dmc-tip-bg)" }}
                />
              </motion.div>
            )}
          </AnimatePresence>
          </div>
        )}

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
