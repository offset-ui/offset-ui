"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from "motion/react";
import { cn } from "@/lib/utils";

export type ProximitySection = { id: string; label: string };

export type ProximityScrollIndicatorColors = {
  surface: string;
  progress: string;
};

export type ProximityScrollIndicatorProps = {
  sections?: ProximitySection[];
  colors?: Partial<ProximityScrollIndicatorColors>;
  position?: "top" | "bottom";
  className?: string;
};

const COLORS: ProximityScrollIndicatorColors = { surface: "#fafafa", progress: "#0047f9" };

const CARD = 44;
const RADIUS = 30;
const STROKE = 2;
const RING_INSET = 14;
const STACK_GAP = 12;
const PADDING = 16;
const ROW_PADDING = 2.5;
const ITEM_GAP = 12;
const LINE = { length: 12, lengthActive: 18, thickness: 1.5, thicknessActive: 2.5 };
const CLOSE_DELAY = 180;
const PROXIMITY_RADIUS = 40;
const MAX_SCALE = 1.08;
const MIN_PROGRESS = 0.035;
const INACTIVE_OPACITY = 0.4;
const PANEL_SPRING = { type: "spring", stiffness: 380, damping: 30, mass: 0.7 } as const;
const ROW_SPRING = { stiffness: 420, damping: 32, mass: 0.6 } as const;
const INSTANT_SPRING = { stiffness: 1000, damping: 100 };
const SQUIRCLE = { cornerShape: "squircle" } as CSSProperties;

const DEFAULT_SECTIONS: ProximitySection[] = [
  { id: "innovative-design-trends", label: "Innovative Design Trends" },
  { id: "sustainable-materials", label: "Sustainable Materials" },
  { id: "user-centric-interface", label: "User-Centric Interface" },
  { id: "accessibility-in-modern-design", label: "Accessibility in Modern Design" },
  { id: "the-future-of-prototyping", label: "The Future of  Prototyping" },
];

function readable(bg: string) {
  const m = /^#([0-9a-f]{6})$/i.exec(bg.trim());
  if (!m) return "#121212";
  const n = parseInt(m[1], 16);
  return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255 > 0.6 ? "#121212" : "#fafafa";
}

function ProgressRing({ progressColor, trackColor, reduce }: { progressColor: string; trackColor: string; reduce: boolean | null }) {
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, reduce ? INSTANT_SPRING : { stiffness: 90, damping: 20, restDelta: 0.001 });
  const svgRef = useRef<SVGSVGElement>(null);
  const r = CARD / 2 - RING_INSET;
  const circumference = 2 * Math.PI * r;
  const dashoffset = useTransform(progress, (v) => circumference * (1 - (MIN_PROGRESS + v * (1 - MIN_PROGRESS))));

  useEffect(
    () =>
      progress.on("change", (v) => {
        svgRef.current?.setAttribute("aria-valuenow", String(Math.round(v * 100)));
      }),
    [progress],
  );

  return (
    <svg
      ref={svgRef}
      width={CARD}
      height={CARD}
      viewBox={`0 0 ${CARD} ${CARD}`}
      className="block shrink-0"
      role="progressbar"
      aria-label="Scroll progress"
      aria-valuenow={Math.round(progress.get() * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <circle cx={CARD / 2} cy={CARD / 2} r={r} fill="none" strokeWidth={STROKE} style={{ stroke: trackColor }} />
      <motion.circle
        cx={CARD / 2}
        cy={CARD / 2}
        r={r}
        fill="none"
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeDasharray={circumference}
        style={{ stroke: progressColor, strokeDashoffset: dashoffset, transformOrigin: "50% 50%", rotate: -90 }}
      />
    </svg>
  );
}

type HeadingRowProps = {
  section: ProximitySection;
  isActive: boolean;
  isCurrentSection: boolean;
  pointerY: MotionValue<number>;
  reduce: boolean | null;
  ink: string;
  accent: string;
  index: number;
  measureTick: number;
  onActivate: () => void;
  onMeasure: (index: number, centerY: number | null) => void;
};

function HeadingRow({ section, isActive, isCurrentSection, pointerY, reduce, ink, accent, index, measureTick, onActivate, onMeasure }: HeadingRowProps) {
  const rowRef = useRef<HTMLLIElement>(null);
  const centerRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    const measure = () => {
      const r = rowRef.current?.getBoundingClientRect();
      const center = r ? r.top + r.height / 2 : null;
      centerRef.current = center;
      onMeasure(index, center);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [index, onMeasure, measureTick]);

  const rawScale = useTransform(pointerY, (y) => {
    const center = centerRef.current;
    if (center === null || !Number.isFinite(y)) return 1;
    const t = Math.max(0, 1 - Math.abs(y - center) / PROXIMITY_RADIUS);
    return 1 + (MAX_SCALE - 1) * t * t;
  });
  const scale = useSpring(rawScale, reduce ? INSTANT_SPRING : ROW_SPRING);
  const micro = { duration: reduce ? 0 : 0.2, ease: "easeOut" } as const;
  const dim = isActive ? 1 : INACTIVE_OPACITY;

  return (
    <li ref={rowRef} className="w-full list-none" style={{ paddingBlock: ROW_PADDING }}>
      <motion.button
        type="button"
        onClick={onActivate}
        whileTap={reduce ? undefined : { scale: 0.97 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="flex w-full cursor-pointer items-center rounded-md text-left outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--psi-progress)]"
        style={{ gap: ITEM_GAP }}
        aria-current={isCurrentSection ? "true" : undefined}
      >
        <motion.span
          aria-hidden
          className="block shrink-0 rounded-full"
          animate={{
            width: isActive ? LINE.lengthActive : LINE.length,
            height: isActive ? LINE.thicknessActive : LINE.thickness,
            backgroundColor: isActive ? accent : ink,
            opacity: dim,
          }}
          transition={micro}
        />
        <motion.span
          animate={{ color: ink, opacity: dim }}
          transition={micro}
          style={{ scale, fontSize: 10, fontWeight: 500, transformOrigin: "left center" }}
          className="whitespace-nowrap"
        >
          {section.label}
        </motion.span>
      </motion.button>
    </li>
  );
}

export function ProximityScrollIndicator({ sections = DEFAULT_SECTIONS, colors, position = "top", className }: ProximityScrollIndicatorProps) {
  const reduce = useReducedMotion();
  const { surface, progress } = { ...COLORS, ...colors };
  const ink = readable(surface);
  const top = position === "top";

  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [measureTick, setMeasureTick] = useState(0);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pointerY = useMotionValue(Number.POSITIVE_INFINITY);
  const centersRef = useRef<(number | null)[]>([]);
  const handleMeasure = useCallback((index: number, centerY: number | null) => {
    centersRef.current[index] = centerY;
  }, []);

  useMotionValueEvent(pointerY, "change", (y) => {
    if (!Number.isFinite(y)) return setHovered(null);
    let best = -1;
    let bestDist = Infinity;
    centersRef.current.forEach((cy, i) => {
      if (cy === null) return;
      const dist = Math.abs(y - cy);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    setHovered(best >= 0 ? sections[best].id : null);
  });

  const openNow = useCallback(() => {
    clearTimeout(closeTimer.current);
    setOpen(true);
  }, []);
  const closeSoon = useCallback(() => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      setOpen(false);
      pointerY.set(Number.POSITIVE_INFINITY);
    }, CLOSE_DELAY);
  }, [pointerY]);

  useEffect(() => {
    const els = sections.map((sec) => document.getElementById(sec.id)).filter((el): el is HTMLElement => !!el);
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.find((e) => e.isIntersecting);
        if (hit) setCurrent(hit.target.id);
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [sections]);

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  const card: CSSProperties = {
    "--psi-progress": progress,
    borderRadius: RADIUS,
    background: surface,
    ...SQUIRCLE,
  } as CSSProperties;
  const shift = top ? -6 : 6;

  return (
    <div
      onMouseEnter={openNow}
      onMouseLeave={closeSoon}
      onFocus={openNow}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) closeSoon();
      }}
      className={cn("fixed left-1/2 z-50 flex -translate-x-1/2 items-start", top ? "top-6 flex-col" : "bottom-6 flex-col-reverse", className)}
      style={{ gap: STACK_GAP, width: CARD }}
    >
      <div style={{ ...card, width: CARD, height: CARD, flexShrink: 0 }}>
        <ProgressRing progressColor={progress} trackColor={`color-mix(in srgb, ${ink} 10%, ${surface})`} reduce={reduce} />
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={reduce ? false : { opacity: 0, scale: 0.92, y: shift }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: shift * 0.67 }}
            transition={reduce ? { duration: 0.1 } : PANEL_SPRING}
            onAnimationComplete={() => setMeasureTick((t) => t + 1)}
            style={{ ...card, padding: PADDING, transformOrigin: top ? "top center" : "bottom center" }}
          >
            <ul
              role="navigation"
              aria-label="Section navigation"
              className="flex min-w-max flex-col items-start"
              onPointerMove={(e) => pointerY.set(e.clientY)}
              onPointerLeave={() => pointerY.set(Number.POSITIVE_INFINITY)}
            >
              {sections.map((sec, i) => (
                <HeadingRow
                  key={sec.id}
                  section={sec}
                  isActive={(hovered ?? current) === sec.id}
                  isCurrentSection={current === sec.id}
                  pointerY={pointerY}
                  reduce={reduce}
                  ink={ink}
                  accent={progress}
                  index={i}
                  measureTick={measureTick}
                  onActivate={() => document.getElementById(sec.id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" })}
                  onMeasure={handleMeasure}
                />
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
