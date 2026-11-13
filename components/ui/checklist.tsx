"use client";

import { Fragment, useRef, useState, type CSSProperties } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export type ChecklistItem = { id: string; label: string; disabled?: boolean };

export type ChecklistColors = {
  surface: string;
  accent: string;
};

export type ChecklistProps = {
  items?: ChecklistItem[];
  checked?: string[];
  defaultChecked?: string[];
  colors?: Partial<ChecklistColors>;
  particles?: number;
  ariaLabel?: string;
  onCheckedChange?: (checked: string[]) => void;
};

const ITEMS: ChecklistItem[] = [
  { id: "read", label: "Read 5 pages of a book 📚" },
  { id: "cat", label: "Feed My cat 🐈" },
  { id: "code", label: "VibeCode a component 💻" },
];

const COLORS: ChecklistColors = { surface: "#dbe9ff", accent: "#008cff" };

const ROW_HEIGHT = 36;
const BOX = 20;
const BOX_INSET = 10;
const BOX_RADIUS = 12;
const STRIKE = 1;
const TICK = 0.55;
const DISSOLVE = 1.8;
const PEN_EASE = [0.4, 0, 0.15, 1] as const;
const STRIKE_PATH =
  "M1.00027 12.0636C1.00027 12.0636 49.1642 -2.69595 47.343 1.87995C44.4722 9.09279 29.298 13.7592 29.298 19.2757C29.298 27.3363 93.6857 -4.48424 94.916 5.69859C95.7693 12.7607 85.9038 18.2405 88.7643 21.3971C94.916 28.1857 147 11.2143 147 11.2143";
const STRIKE_W = 148;
const STRIKE_H = 24;
const TICK_PATH = "M5.6 9.9 L9 13 L15.4 6.5";

const squircle = { cornerShape: "squircle" } as CSSProperties;

function readable(bg: string) {
  const m = /^#([0-9a-f]{6})$/i.exec(bg.trim());
  if (!m) return "#ffffff";
  const n = parseInt(m[1], 16);
  return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255 > 0.6 ? "#000000" : "#ffffff";
}

type Particle = { id: string; x: number; y: number; dx: number; dy: number; size: number; delay: number; life: number };

function makeParticles(count: number, burst: number): Particle[] {
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", STRIKE_PATH);
  const total = path.getTotalLength();
  return Array.from({ length: count }, (_, i) => {
    const p = path.getPointAtLength((total * (i + Math.random())) / count);
    return {
      id: `${burst}-${i}`,
      x: (p.x / STRIKE_W) * 100,
      y: (p.y / STRIKE_H) * 100,
      dx: (Math.random() - 0.5) * 30,
      dy: -(8 + Math.random() * 22),
      size: 1.5 + Math.random() * 1.5,
      delay: Math.random() * 0.25,
      life: DISSOLVE * (0.6 + Math.random() * 0.4),
    };
  });
}

type RowProps = {
  item: ChecklistItem;
  checked: boolean;
  accent: string;
  tick: string;
  particleCount: number;
  reduce: boolean;
  onToggle: () => void;
};

function Row({ item, checked, accent, tick, particleCount, reduce, onToggle }: RowProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const burst = useRef(0);

  function handleChange() {
    setParticles(checked && !reduce ? makeParticles(particleCount, ++burst.current) : []);
    onToggle();
  }

  const t = (duration: number, delay = 0) => (reduce ? { duration: 0 } : { duration, delay, ease: PEN_EASE });

  return (
    <label className={cn("group flex w-full cursor-pointer items-center select-none", item.disabled && "cursor-not-allowed opacity-50")} style={{ height: ROW_HEIGHT }}>
      <input type="checkbox" checked={checked} disabled={item.disabled} onChange={handleChange} className="peer sr-only" />
      <span
        aria-hidden
        className="group-active:motion-safe:scale-90 relative flex shrink-0 items-center justify-center transition-transform duration-200 ease-out peer-focus-visible:[&>span:first-child]:ring-2"
        style={{ width: BOX + BOX_INSET * 2, height: ROW_HEIGHT }}
      >
        <motion.span
          className="absolute ring-offset-1 ring-offset-transparent"
          initial={false}
          animate={{ scale: checked && !reduce ? [1, 1.12, 1] : 1 }}
          transition={{ duration: 0.4, delay: checked ? 0.1 : 0, ease: "easeOut" }}
          style={{ width: BOX, height: BOX, borderRadius: BOX_RADIUS, border: `1px solid ${accent}`, ["--tw-ring-color" as string]: accent, ...squircle }}
        >
          <span
            className="absolute inset-0"
            style={{
              background: accent,
              borderRadius: BOX_RADIUS - 1,
              opacity: checked ? 1 : 0,
              transition: reduce ? "none" : `opacity ${checked ? 0.18 : 0.25}s ease-out ${checked ? 0 : TICK * 0.7}s`,
              ...squircle,
            }}
          />
        </motion.span>
        <svg width={BOX} height={BOX} viewBox="0 0 20 20" fill="none" className="absolute" style={{ stroke: tick }}>
          <motion.path
            d={TICK_PATH}
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={false}
            animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
            transition={{ pathLength: t(TICK, checked ? 0.1 : 0), opacity: checked ? { duration: 0 } : { duration: 0, delay: reduce ? 0 : TICK } }}
          />
        </svg>
      </span>

      <span className="relative whitespace-nowrap text-xs font-medium tracking-[-0.1px]" style={{ color: accent, lineHeight: "normal" }}>
        <span style={{ opacity: checked ? 0.8 : 1, transition: reduce ? "none" : `opacity 0.6s ease-out ${checked ? 0.3 : 0}s` }}>{item.label}</span>
        <span aria-hidden className="pointer-events-none absolute -inset-x-[4px] top-1/2 -translate-y-1/2" style={{ height: STRIKE_H }}>
          <svg className="absolute inset-0 size-full overflow-visible" viewBox={`0 0 ${STRIKE_W} ${STRIKE_H}`} preserveAspectRatio="none" fill="none">
            <motion.path
              d={STRIKE_PATH}
              stroke={accent}
              strokeWidth={2}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              initial={false}
              animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
              transition={checked ? t(STRIKE, 0.05) : { duration: 0 }}
            />
          </svg>
          {particles.map((p) => (
            <motion.span
              key={p.id}
              className="absolute rounded-full"
              style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, background: accent }}
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

export function Checklist({ items = ITEMS, checked: controlled, defaultChecked = [], colors, particles = 100, ariaLabel = "Checklist", onCheckedChange }: ChecklistProps) {
  const [inner, setInner] = useState(defaultChecked);
  const reduce = useReducedMotion() ?? false;
  const value = controlled ?? inner;
  const { surface, accent } = { ...COLORS, ...colors };
  const tick = readable(accent);

  function toggle(id: string) {
    const next = value.includes(id) ? value.filter((v) => v !== id) : [...value, id];
    if (controlled === undefined) setInner(next);
    onCheckedChange?.(next);
  }

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="relative inline-flex min-w-[240px] flex-col items-start gap-[5px] rounded-[42px] py-4 pl-6"
      style={{ background: surface, ...squircle }}
    >
      {items.map((item, i) => (
        <Fragment key={item.id}>
          {i > 0 && <div aria-hidden className="h-px w-full shrink-0 opacity-15" style={{ background: accent }} />}
          <Row item={item} checked={value.includes(item.id)} accent={accent} tick={tick} particleCount={particles} reduce={reduce} onToggle={() => toggle(item.id)} />
        </Fragment>
      ))}
      <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[42px] shadow-[inset_0_0_0_1px_#ffffff]" style={squircle} />
    </div>
  );
}
