"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";

export type DynamicMetricsColors = {
  surface: string;
  text: string;
  bar: string;
};

export type MetricsFrame = {
  label: string;
  sales: number;
  units: number;
  salesChange: number;
  unitsChange: number;
  points: number[];
  labels: string[];
};

export type DynamicMetricsChartProps = {
  title?: string;
  frames?: MetricsFrame[];
  timeframe?: string;
  colors?: Partial<DynamicMetricsColors>;
  formatSales?: (value: number) => string;
  formatUnits?: (value: number) => string;
  onTimeframeChange?: (label: string) => void;
  onRefresh?: () => void;
};

const COLORS: DynamicMetricsColors = { surface: "#ffffff", text: "#121212", bar: "#d2ebff" };

const MIX = (pct: number) => `color-mix(in srgb, var(--dmc-text) ${pct}%, var(--dmc-surface))`;
const SQUIRCLE = { cornerShape: "squircle" } as CSSProperties;
const PILL_SPRING = { type: "spring", stiffness: 800, damping: 56, mass: 0.8 } as const;
const TIP_SPRING = { type: "spring", stiffness: 500, damping: 36 } as const;
const PLOT_HEIGHT = 126;
const DURATION = 0.5;
const FOCUS = "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--dmc-muted)]";

const demo = (label: string, sales: number, units: number, unitsChange: number, shape: number[], labels: string[]): MetricsFrame => {
  const sum = shape.reduce((a, b) => a + b, 0);
  return { label, sales, units, salesChange: 21.4, unitsChange, points: shape.map((v) => +((v / sum) * sales).toFixed(2)), labels };
};

const DEMO_FRAMES: MetricsFrame[] = [
  demo("Today", 261.42, 10, -2.16, [54, 90, 26, 120, 93, 54, 102, 26, 59, 83], ["00:00", "06:00", "12:00", "18:00", "24:00"]),
  demo("7D", 458.02, 28, -0.11, [54, 90, 26, 126, 78, 59, 83], ["02 Oct", "03 Oct", "04 Oct", "05 Oct", "06 Oct", "07 Oct", "08 Oct"]),
  demo(
    "30D",
    1102.1,
    52,
    3.69,
    [100, 43, 86, 19, 14, 69, 97, 28, 34, 81, 30, 10, 14, 108, 19, 16, 85, 19, 74, 21, 89, 19, 83, 21, 81],
    ["02 Oct", "06 Oct", "10 Oct", "14 Oct", "18 Oct", "22 Oct", "26 Oct", "30 Oct"],
  ),
];

function allocate(weights: number[], total: number) {
  const sum = weights.reduce((a, b) => a + b, 0) || 1;
  const raw = weights.map((w) => (w / sum) * total);
  const result = raw.map(Math.floor);
  let left = total - result.reduce((a, b) => a + b, 0);
  const byFraction = raw.map((r, i) => [i, r - Math.floor(r)] as const).sort((a, b) => b[1] - a[1]);
  for (let k = 0; left > 0 && k < byFraction.length; k++, left--) result[byFraction[k][0]]++;
  return result;
}

function ChangeBadge({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span
      className="inline-flex items-center gap-0.5 rounded-xl px-1.5 py-1 text-[10px] font-medium"
      style={{ backgroundColor: up ? "#e0ffe2" : "#ffe0e0", color: up ? "#276c07" : "#6c0707", ...SQUIRCLE }}
    >
      <svg aria-hidden width="12" height="10" viewBox="0 0 12 10" fill="none" className="shrink-0">
        <path d={up ? "M6 2L2 8H10L6 2Z" : "M6 8L2 2H10L6 8Z"} fill="currentColor" />
      </svg>
      {`${up ? "+" : "−"}${Math.abs(value)}%`}
    </span>
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

function RollingNumber({ value, format, reduce }: { value: number; format: (value: number) => string; reduce: boolean | null }) {
  const motionValue = useMotionValue(value);
  const text = useTransform(motionValue, format);
  useEffect(() => {
    if (reduce) {
      motionValue.set(value);
      return;
    }
    const controls = animate(motionValue, value, { duration: DURATION, ease: "easeOut" });
    return () => controls.stop();
  }, [value, reduce, motionValue]);
  return <motion.span>{text}</motion.span>;
}

function Metric({ label, value, change, empty }: { label: string; value: ReactNode; change: number; empty: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-base [color:var(--dmc-muted)]">{label}</p>
      <div className="flex items-center gap-2.5">
        <p className="whitespace-nowrap text-2xl font-medium tabular-nums" style={{ color: empty ? "var(--dmc-muted)" : "var(--dmc-text)" }}>
          {empty ? "—" : value}
        </p>
        {!empty && <ChangeBadge value={change} />}
      </div>
    </div>
  );
}

export function DynamicMetricsChart({
  title = "Overview",
  frames = DEMO_FRAMES,
  timeframe,
  colors,
  formatSales = (v) => `$${v.toFixed(2)}`,
  formatUnits = (v) => Math.round(v).toString(),
  onTimeframeChange,
  onRefresh,
}: DynamicMetricsChartProps) {
  const { surface, text, bar } = { ...COLORS, ...colors };
  const reduce = useReducedMotion();
  const [inner, setInner] = useState(frames[0].label);
  const active = timeframe ?? inner;
  const frame = frames.find((f) => f.label === active) ?? frames[0];

  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [pill, setPill] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const measure = useCallback(() => {
    const el = btnRefs.current[frame.label];
    if (el) setPill({ x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight });
  }, [frame.label]);
  useLayoutEffect(measure, [measure, frames]);
  useEffect(() => {
    document.fonts?.ready.then(measure);
  }, [measure]);

  const { bars, max } = useMemo(() => {
    const units = allocate(frame.points, Math.max(0, Math.round(frame.units)));
    const data = frame.points.map((sales, i) => ({ sales, units: sales > 0 ? Math.max(1, units[i]) : 0 }));
    return { bars: data, max: Math.max(...data.map((b) => b.sales), Number.EPSILON) };
  }, [frame]);

  const empty = bars.length === 0;
  const [hovered, setHovered] = useState<number | null>(null);
  const hoveredBar = hovered !== null ? bars[hovered] : undefined;
  const unitWord = (n: number) => (n === 1 ? "Unit" : "Units");
  const tip = hoveredBar && {
    left: `${((hovered! + 0.5) / bars.length) * 100}%`,
    bottom: (hoveredBar.sales / max) * PLOT_HEIGHT + 13,
    label: `${formatSales(hoveredBar.sales).replace(/\.\d+/, "")} / ${formatUnits(hoveredBar.units)} ${unitWord(hoveredBar.units)}`,
  };

  function select(label: string) {
    setHovered(null);
    setInner(label);
    onTimeframeChange?.(label);
  }

  const vars = {
    "--dmc-surface": surface,
    "--dmc-text": text,
    "--dmc-bar": bar,
    "--dmc-border": MIX(8),
    "--dmc-muted": MIX(60),
    "--dmc-pill": MIX(5),
    "--dmc-grid": MIX(8),
    "--dmc-empty": MIX(2),
    "--dmc-refresh-bg": `color-mix(in srgb, ${bar} 50%, ${surface})`,
  } as CSSProperties;

  return (
    <div
      className="flex w-[525px] max-w-full flex-col gap-7 rounded-[48px] border border-solid p-5 leading-normal [background:var(--dmc-surface)] [border-color:var(--dmc-border)]"
      style={{ ...vars, ...SQUIRCLE }}
    >
      <div className="flex w-full items-center justify-between">
        <h2 className="text-xl font-medium [color:var(--dmc-text)]">{title}</h2>
        <div role="group" aria-label="Select time range" className="relative flex gap-2.5">
          {pill && (
            <motion.div
              aria-hidden
              initial={false}
              animate={{ x: pill.x, y: pill.y, width: pill.w, height: pill.h }}
              transition={reduce ? { duration: 0 } : PILL_SPRING}
              className="absolute left-0 top-0 rounded-[20px] [background:var(--dmc-pill)]"
              style={SQUIRCLE}
            />
          )}
          {frames.map((f) => (
            <button
              key={f.label}
              ref={(el) => {
                btnRefs.current[f.label] = el;
              }}
              type="button"
              aria-pressed={f.label === frame.label}
              onClick={() => select(f.label)}
              className={`relative flex items-center justify-center rounded-[20px] px-2 py-1.5 text-base font-medium transition-colors duration-200 ${FOCUS} ${f.label === frame.label ? "[color:var(--dmc-text)]" : "[color:var(--dmc-muted)]"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex w-full items-center gap-6">
        <Metric label="Sales" value={<RollingNumber value={frame.sales} format={formatSales} reduce={reduce} />} change={frame.salesChange} empty={empty} />
        <div className="h-12 w-px shrink-0 [background:var(--dmc-grid)]" />
        <Metric label="Units" value={<RollingNumber value={frame.units} format={formatUnits} reduce={reduce} />} change={frame.unitsChange} empty={empty} />
      </div>

      <div className="flex w-full flex-col gap-2.5 pt-6">
        {empty ? (
          <div
            role="status"
            className="flex w-full flex-col items-center justify-center gap-4 overflow-hidden rounded-lg px-4 text-center [background:var(--dmc-empty)]"
            style={{ minHeight: PLOT_HEIGHT, ...SQUIRCLE }}
          >
            <p className="max-w-[370px] text-base leading-normal [color:var(--dmc-muted)]">Not enough parameters or metrics at this moment.</p>
            <button
              type="button"
              onClick={onRefresh}
              className={`inline-flex items-center gap-2 rounded-[14px] p-2 text-xs font-medium transition-opacity hover:opacity-80 [background:var(--dmc-refresh-bg)] [color:var(--dmc-text)] ${FOCUS}`}
              style={SQUIRCLE}
            >
              <RefreshIcon />
              Refresh
            </button>
          </div>
        ) : (
          <div
            role="group"
            aria-label={`${frame.label}: sales ${formatSales(frame.sales)}, ${formatUnits(frame.units)} units`}
            className="relative w-full"
            style={{ height: PLOT_HEIGHT }}
            onMouseLeave={() => setHovered(null)}
          >
            <div key={frame.label} className="flex h-full w-full items-end">
              {bars.map((b, i) => (
                <div
                  key={i}
                  role="img"
                  aria-label={`${formatSales(b.sales)}, ${formatUnits(b.units)} ${unitWord(b.units)}`}
                  tabIndex={0}
                  onMouseEnter={() => setHovered(i)}
                  onFocus={() => setHovered(i)}
                  onBlur={() => setHovered(null)}
                  className={`flex flex-1 items-end justify-center rounded-md ${FOCUS}`}
                >
                  <motion.div
                    aria-hidden
                    initial={reduce ? false : { height: 0 }}
                    animate={{ height: (b.sales / max) * PLOT_HEIGHT, opacity: hovered !== null && hovered !== i ? 0.25 : 1 }}
                    transition={{ height: { duration: DURATION, ease: "easeOut", delay: reduce ? 0 : Math.min(i * 0.015, 0.3) }, opacity: { duration: reduce ? 0 : 0.2 } }}
                    className="rounded-sm [background:var(--dmc-bar)]"
                    style={{ width: "35%", maxWidth: 18, ...SQUIRCLE }}
                  />
                </div>
              ))}
            </div>

            <AnimatePresence>
              {tip && (
                <motion.div
                  key="tooltip"
                  aria-hidden
                  initial={{ opacity: 0, left: tip.left, bottom: tip.bottom }}
                  animate={{ opacity: 1, left: tip.left, bottom: tip.bottom }}
                  exit={{ opacity: 0 }}
                  transition={reduce ? { duration: 0 } : { left: TIP_SPRING, bottom: TIP_SPRING, opacity: { duration: 0.15 } }}
                  className="pointer-events-none absolute z-10 -translate-x-1/2 whitespace-nowrap rounded-[14px] px-2 py-1.5 text-center text-[10px] font-medium [background:var(--dmc-text)] [color:var(--dmc-surface)]"
                  style={SQUIRCLE}
                >
                  {tip.label}
                  <span
                    className="absolute left-1/2 top-full -translate-x-1/2"
                    style={{ width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: "9px solid var(--dmc-text)" }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <div className="flex w-full items-center border-t border-solid [border-color:var(--dmc-grid)]">
          {frame.labels.map((label, i) => (
            <div key={i} className="flex min-w-px flex-1 flex-col items-center gap-2">
              <div className="h-[25px] w-px [background:var(--dmc-grid)]" />
              <p className="text-center text-xs [color:var(--dmc-muted)]">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
