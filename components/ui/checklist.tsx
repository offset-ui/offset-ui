"use client";

/**
 * Checklist — hand-drawn check-off list.
 * Check: box fills, tick draws itself, a wavy pen stroke scribbles across the text.
 * Uncheck: tick retracts, the stroke dissolves into drifting particles.
 * Dependencies: motion/react, clsx + tailwind-merge (via @/lib/utils).
 */

import { Fragment, useRef, useState, type CSSProperties } from "react";
import { Noto_Color_Emoji } from "next/font/google";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export type ChecklistItem = { id: string; label: string; disabled?: boolean };

export type ChecklistColors = {
  surface: string;
  border: string;
  accent: string;
  tick: string;
  divider: string;
  dividerOpacity: number;
};

export type ChecklistSizes = {
  radius: number;
  padding: number;
  paddingLeft: number;
  rowHeight: number;
  gap: number;
  boxSize: number;
  boxRadius: number;
  boxInset: number;
  strokeWidth: number;
  particles: number;
};

export type ChecklistTypography = {
  fontSize: number;
  fontWeight: number;
  letterSpacing: number;
  fontFamily?: string;
};

export type ChecklistTiming = {
  /** Seconds for the pen stroke to cross the text. */
  strike: number;
  /** Seconds for the tick to draw / retract. */
  tick: number;
  /** Seconds the particles take to fade out. */
  dissolve: number;
};

/** Shape of the particles the strike dissolves into when a task is unchecked. */
export type ChecklistDither = {
  /** Max horizontal drift in px (each particle picks a random value within ±half). */
  spread: number;
  /** Min / max upward drift in px. */
  riseMin: number;
  riseMax: number;
  /** Min / max particle diameter in px. */
  sizeMin: number;
  sizeMax: number;
  /** Max random start delay in seconds. */
  stagger: number;
};

export type ChecklistProps = {
  /** Any number of tasks; ids must be unique. */
  items?: ChecklistItem[];
  /** Controlled list of checked ids. */
  checked?: string[];
  defaultChecked?: string[];
  onCheckedChange?: (checked: string[]) => void;
  colors?: Partial<ChecklistColors>;
  sizes?: Partial<ChecklistSizes>;
  typography?: Partial<ChecklistTypography>;
  timing?: Partial<ChecklistTiming>;
  dither?: Partial<ChecklistDither>;
  /** Accessible name of the list. */
  ariaLabel?: string;
  className?: string;
};

const ITEMS: ChecklistItem[] = [
  { id: "read", label: "Read 5 pages of a book 📚" },
  { id: "cat", label: "Feed My cat 🐈" },
  { id: "code", label: "VibeCode a component 💻" },
];

const COLORS: ChecklistColors = {
  surface: "#dbe9ff",
  border: "#ffffff",
  accent: "#008cff",
  tick: "#ffffff",
  divider: "#0066ff",
  dividerOpacity: 0.15,
};

const SIZES: ChecklistSizes = {
  radius: 42,
  padding: 16,
  paddingLeft: 24,
  rowHeight: 36,
  gap: 5,
  boxSize: 20,
  boxRadius: 12,
  boxInset: 10,
  strokeWidth: 2,
  particles: 100,
};

// Segoe UI has no emoji glyphs, so Noto Color Emoji supplies modern, smooth emoji on every platform.
const emoji = Noto_Color_Emoji({ subsets: ["emoji"], weight: "400" });

const TYPOGRAPHY: ChecklistTypography = {
  fontSize: 12,
  fontWeight: 500,
  letterSpacing: -0.1,
  fontFamily: `"Segoe UI", ${emoji.style.fontFamily}, system-ui, sans-serif`,
};
const TIMING: ChecklistTiming = { strike: 1, tick: 0.55, dissolve: 1.8 };
const DITHER: ChecklistDither = { spread: 30, riseMin: 8, riseMax: 30, sizeMin: 1.5, sizeMax: 3, stagger: 0.25 };

const PEN_EASE = [0.4, 0, 0.15, 1] as const;
// Figma "Cancelled" scribble (148 x 24) and the check mark centreline inside the 20px box.
const STRIKE_PATH =
  "M1.00027 12.0636C1.00027 12.0636 49.1642 -2.69595 47.343 1.87995C44.4722 9.09279 29.298 13.7592 29.298 19.2757C29.298 27.3363 93.6857 -4.48424 94.916 5.69859C95.7693 12.7607 85.9038 18.2405 88.7643 21.3971C94.916 28.1857 147 11.2143 147 11.2143";
const STRIKE_W = 148;
const STRIKE_H = 24;
const TICK_PATH = "M5.6 9.9 L9 13 L15.4 6.5";

const squircle = { cornerShape: "squircle" } as CSSProperties;

type Particle = { id: string; x: number; y: number; dx: number; dy: number; size: number; delay: number; life: number };

/** Evenly samples points along the scribble and gives each a random upward drift. */
function makeParticles(count: number, dissolve: number, d: ChecklistDither, burst: number): Particle[] {
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", STRIKE_PATH);
  const total = path.getTotalLength();
  return Array.from({ length: count }, (_, i) => {
    const p = path.getPointAtLength((total * (i + Math.random())) / count);
    return {
      id: `${burst}-${i}`,
      x: (p.x / STRIKE_W) * 100,
      y: (p.y / STRIKE_H) * 100,
      dx: (Math.random() - 0.5) * d.spread,
      dy: -(d.riseMin + Math.random() * (d.riseMax - d.riseMin)),
      size: d.sizeMin + Math.random() * (d.sizeMax - d.sizeMin),
      delay: Math.random() * d.stagger,
      life: dissolve * (0.6 + Math.random() * 0.4),
    };
  });
}

type RowProps = {
  item: ChecklistItem;
  checked: boolean;
  onToggle: () => void;
  colors: ChecklistColors;
  sizes: ChecklistSizes;
  typography: ChecklistTypography;
  timing: ChecklistTiming;
  dither: ChecklistDither;
  reduce: boolean;
};

function Row({ item, checked, onToggle, colors, sizes, typography, timing, dither, reduce }: RowProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const burst = useRef(0);

  function handleChange() {
    if (checked && !reduce) setParticles(makeParticles(sizes.particles, timing.dissolve, dither, ++burst.current));
    else setParticles([]);
    onToggle();
  }

  const t = (duration: number, delay = 0) => (reduce ? { duration: 0 } : { duration, delay, ease: PEN_EASE });

  return (
    <label
      className={cn(
        "group flex w-full cursor-pointer items-center select-none",
        item.disabled && "cursor-not-allowed opacity-50",
      )}
      style={{ height: sizes.rowHeight, fontFamily: typography.fontFamily }}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={item.disabled}
        onChange={handleChange}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className="group-active:motion-safe:scale-90 relative flex shrink-0 items-center justify-center transition-transform duration-200 ease-out peer-focus-visible:[&>span:first-child]:ring-2"
        style={{ width: sizes.boxSize + sizes.boxInset * 2, height: sizes.rowHeight }}
      >
        <motion.span
          className="absolute ring-offset-1 ring-offset-transparent"
          initial={false}
          animate={{ scale: checked && !reduce ? [1, 1.12, 1] : 1 }}
          transition={{ duration: 0.4, delay: checked ? 0.1 : 0, ease: "easeOut" }}
          style={{
            width: sizes.boxSize,
            height: sizes.boxSize,
            borderRadius: sizes.boxRadius,
            border: `1px solid ${colors.accent}`,
            ["--tw-ring-color" as string]: colors.accent,
            ...squircle,
          }}
        >
          <span
            className="absolute inset-0"
            style={{
              background: colors.accent,
              borderRadius: Math.max(sizes.boxRadius - 1, 0),
              opacity: checked ? 1 : 0,
              transition: reduce
                ? "none"
                : `opacity ${checked ? 0.18 : 0.25}s ease-out ${checked ? 0 : timing.tick * 0.7}s`,
              ...squircle,
            }}
          />
        </motion.span>
        <svg
          width={sizes.boxSize}
          height={sizes.boxSize}
          viewBox="0 0 20 20"
          fill="none"
          className="absolute"
          style={{ stroke: colors.tick }}
        >
          <motion.path
            d={TICK_PATH}
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={false}
            animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
            transition={{
              pathLength: t(timing.tick, checked ? 0.1 : 0),
              opacity: checked ? { duration: 0 } : { duration: 0, delay: reduce ? 0 : timing.tick },
            }}
          />
        </svg>
      </span>

      <span
        className="relative whitespace-nowrap"
        style={{
          color: colors.accent,
          fontSize: typography.fontSize,
          fontWeight: typography.fontWeight,
          letterSpacing: typography.letterSpacing,
          lineHeight: "normal",
        }}
      >
        <span
          style={{
            opacity: checked ? 0.8 : 1,
            transition: reduce ? "none" : `opacity 0.6s ease-out ${checked ? 0.3 : 0}s`,
          }}
        >
          {item.label}
        </span>
        <span aria-hidden className="pointer-events-none absolute -inset-x-[4px] top-1/2 -translate-y-1/2" style={{ height: STRIKE_H }}>
          <svg
            className="absolute inset-0 size-full overflow-visible"
            viewBox={`0 0 ${STRIKE_W} ${STRIKE_H}`}
            preserveAspectRatio="none"
            fill="none"
          >
            <motion.path
              d={STRIKE_PATH}
              stroke={colors.accent}
              strokeWidth={sizes.strokeWidth}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              initial={false}
              animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
              transition={checked ? t(timing.strike, 0.05) : { duration: 0 }}
            />
          </svg>
          {particles.map((p) => (
            <motion.span
              key={p.id}
              className="absolute rounded-full"
              style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, background: colors.accent }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{ x: p.dx, y: p.dy, opacity: 0, scale: 0.3 }}
              transition={{
                duration: p.life,
                delay: p.delay,
                ease: [0.25, 0.1, 0.25, 1],
                opacity: { duration: p.life, delay: p.delay, ease: [0.4, 0, 0.8, 1] },
              }}
              onAnimationComplete={() => setParticles((cur) => cur.filter((c) => c.id !== p.id))}
            />
          ))}
        </span>
      </span>
    </label>
  );
}

export function Checklist({
  items = ITEMS,
  checked: controlled,
  defaultChecked = [],
  onCheckedChange,
  colors,
  sizes,
  typography,
  timing,
  dither,
  ariaLabel = "Checklist",
  className,
}: ChecklistProps) {
  const [inner, setInner] = useState(defaultChecked);
  const reduce = useReducedMotion() ?? false;
  const value = controlled ?? inner;
  const c = { ...COLORS, ...colors };
  const s = { ...SIZES, ...sizes };
  const ty = { ...TYPOGRAPHY, ...typography };
  const tm = { ...TIMING, ...timing };
  const dt = { ...DITHER, ...dither };

  function toggle(id: string) {
    const next = value.includes(id) ? value.filter((v) => v !== id) : [...value, id];
    if (controlled === undefined) setInner(next);
    onCheckedChange?.(next);
  }

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn("relative inline-flex flex-col items-start", className)}
      style={{
        background: c.surface,
        borderRadius: s.radius,
        padding: `${s.padding}px 0 ${s.padding}px ${s.paddingLeft}px`,
        gap: s.gap,
        ...squircle,
      }}
    >
      {items.map((item, i) => (
        <Fragment key={item.id}>
          {i > 0 && (
            <div aria-hidden className="h-px w-full shrink-0" style={{ background: c.divider, opacity: c.dividerOpacity }} />
          )}
          <Row
            item={item}
            checked={value.includes(item.id)}
            onToggle={() => toggle(item.id)}
            colors={c}
            sizes={s}
            typography={ty}
            timing={tm}
            dither={dt}
            reduce={reduce}
          />
        </Fragment>
      ))}
      {/* Inside stroke painted last so the dividers are cleanly covered at the card edge. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ borderRadius: s.radius, boxShadow: `inset 0 0 0 1px ${c.border}`, ...squircle }}
      />
    </div>
  );
}
