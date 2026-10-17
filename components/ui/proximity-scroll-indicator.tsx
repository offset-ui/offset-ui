"use client";
/**
 * Dependencies this component expects from the host project:
 * - Tailwind CSS (styling is utility classes plus inline styles for prop-driven values)
 * - "motion" (the `motion/react` package) for the scroll-linked progress ring, the
 *   expand/collapse spring and the proximity scale
 * - cn() from "@/lib/utils" (clsx + tailwind-merge)
 * No Next.js-specific APIs are used, so it drops into any React project. Typography is
 * inherited from the host page by default; pass `typography.fontFamily` to override it.
 *
 * Fixed at the top centre of the viewport, as two stacked cards: a small ring card that
 * never changes size or position, and a heading-list card that mounts below it on hover
 * or focus. The ring always tracks page scroll (0 at the top, 1 at the bottom)
 * independently of the open/closed state, so it never resets or replays. The list stays
 * open while the pointer is anywhere inside either card, and closes after a short delay
 * once it fully leaves. While open, headings track the pointer continuously (one shared
 * motion value drives every row's own spring, rather than retriggering an animation per
 * pointer move), so the nearest heading scales up smoothly with no stutter. The heading
 * whose section is currently in view keeps a longer resting indicator line.
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { cn } from "@/lib/utils";

export type ProximitySection = { id: string; label: string };

export type ProximityScrollIndicatorColors = {
  surface: string;
  track: string;
  progress: string;
  text: string;
  line: string;
};

export type ProximityScrollIndicatorSizes = {
  collapsedSize: number; // the ring card's fixed width/height and the ring's SVG viewport
  radius: number; // corner radius, shared by both cards
  strokeWidth: number;
  ringInset: number; // distance from the card edge to the ring
  stackGap: number; // gap between the ring card and the list card
  padding: number; // uniform padding inside the list card
  rowPaddingY: number; // vertical padding inside each row
  itemGap: number; // gap between a row's indicator line and its label
  lineLength: number; // indicator line length, resting
  lineLengthActive: number; // indicator line length, active row
  lineThickness: number; // indicator line thickness ("stroke width"), resting
  lineThicknessActive: number; // indicator line thickness, active row
};

export type ProximityScrollIndicatorSpring = { stiffness: number; damping: number; mass: number };

export type ProximityScrollIndicatorTypography = { fontFamily?: string; fontSize: number; fontWeight: number; letterSpacing: number };

export type ProximityScrollIndicatorProps = {
  sections?: ProximitySection[];
  colors?: Partial<ProximityScrollIndicatorColors>;
  sizes?: Partial<ProximityScrollIndicatorSizes>;
  /** The list card's expand/collapse spring. */
  spring?: Partial<ProximityScrollIndicatorSpring>;
  /** How long the pointer may be fully outside before the list closes, in ms. */
  closeDelay?: number;
  /** How far from a heading (in px) the proximity scale still applies. */
  proximityRadius?: number;
  /** The scale a heading reaches right under the pointer. */
  maxScale?: number;
  /** The stroke never shows less than this fraction (0–1) filled, so it reads as a visible sliver at the very top of the page instead of disappearing. The reported aria-valuenow stays the true scroll percentage. */
  minProgress?: number;
  /** Opacity (0–1) applied to every heading except the active one. */
  inactiveOpacity?: number;
  typography?: Partial<ProximityScrollIndicatorTypography>;
  className?: string;
};

const COLORS: ProximityScrollIndicatorColors = {
  surface: "#fafafa",
  track: "#e6e6e6",
  progress: "#0047f9",
  text: "#121212",
  line: "#121212",
};

const SIZES: ProximityScrollIndicatorSizes = {
  collapsedSize: 44,
  radius: 30,
  strokeWidth: 2,
  ringInset: 14,
  stackGap: 12,
  padding: 16,
  rowPaddingY: 2.5,
  itemGap: 12,
  lineLength: 12,
  lineLengthActive: 18,
  // 1.5/2.5 rather than 1/1.8: `rounded-full` can only round up to half the thickness, so anything
  // thinner than ~1.5px renders as a flat-capped sliver with no visible curve at all.
  lineThickness: 1.5,
  lineThicknessActive: 2.5,
};

// Critically damped (ζ≈0.9–1): reaches its target in one clean motion, no overshoot or settle-jiggle.
const SPRING: ProximityScrollIndicatorSpring = { stiffness: 380, damping: 30, mass: 0.7 };
/** Each row's own spring onto the shared pointer-derived target: quick to respond, settled, no overshoot jiggle. */
const PROXIMITY_SPRING = { stiffness: 420, damping: 32, mass: 0.6 } as const;

const DEFAULT_SECTIONS: ProximitySection[] = [
  { id: "innovative-design-trends", label: "Innovative Design Trends" },
  { id: "sustainable-materials", label: "Sustainable Materials" },
  { id: "user-centric-interface", label: "User-Centric Interface" },
  { id: "accessibility-in-modern-design", label: "Accessibility in Modern Design" },
  { id: "the-future-of-prototyping", label: "The Future of  Prototyping" },
];

/** iOS-style continuous corners, shared by both cards. */
const SQUIRCLE = { cornerShape: "squircle" } as CSSProperties;

function ProgressRing({
  s,
  c,
  reduce,
  minProgress,
}: {
  s: ProximityScrollIndicatorSizes;
  c: ProximityScrollIndicatorColors;
  reduce: boolean | null;
  minProgress: number;
}) {
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, reduce ? { stiffness: 1000, damping: 100 } : { stiffness: 90, damping: 20, restDelta: 0.001 });
  const svgRef = useRef<SVGSVGElement>(null);
  const r = s.collapsedSize / 2 - s.ringInset;
  const circumference = 2 * Math.PI * r;
  // The stroke itself is floored to minProgress so it reads as a visible sliver at the top of the page.
  const dashoffset = useTransform(progress, (v) => circumference * (1 - (minProgress + v * (1 - minProgress))));

  // aria-valuenow belongs on the element carrying role="progressbar" so screen readers pick it up.
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
      width={s.collapsedSize}
      height={s.collapsedSize}
      viewBox={`0 0 ${s.collapsedSize} ${s.collapsedSize}`}
      className="block shrink-0"
      role="progressbar"
      aria-label="Scroll progress"
      aria-valuenow={Math.round(progress.get() * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <circle cx={s.collapsedSize / 2} cy={s.collapsedSize / 2} r={r} fill="none" stroke={c.track} strokeWidth={s.strokeWidth} />
      <motion.circle
        cx={s.collapsedSize / 2}
        cy={s.collapsedSize / 2}
        r={r}
        fill="none"
        stroke={c.progress}
        strokeWidth={s.strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        style={{ strokeDashoffset: dashoffset, transformOrigin: "50% 50%", rotate: -90 }}
      />
    </svg>
  );
}

function HeadingRow({
  section,
  isActive,
  isCurrentSection,
  pointerY,
  proximityRadius,
  maxScale,
  inactiveOpacity,
  reduce,
  s,
  c,
  typo,
  onActivate,
  index,
  onMeasure,
  measureTick,
}: {
  section: ProximitySection;
  /** Blue + long indicator: the hovered row, or the in-view section when nothing is hovered. */
  isActive: boolean;
  /** The section actually in view while scrolling — drives aria-current regardless of hover. */
  isCurrentSection: boolean;
  pointerY: MotionValue<number>;
  proximityRadius: number;
  maxScale: number;
  /** Opacity applied to every row except the active one. */
  inactiveOpacity: number;
  reduce: boolean | null;
  s: ProximityScrollIndicatorSizes;
  c: ProximityScrollIndicatorColors;
  typo: ProximityScrollIndicatorTypography;
  onActivate: () => void;
  index: number;
  onMeasure: (index: number, centerY: number | null) => void;
  /** Bumped once the panel's entrance animation settles, so rows re-measure their post-transform position. */
  measureTick: number;
}) {
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

  // Derived continuously from the one shared pointerY value — no per-move animate() calls to restart or stack up.
  const rawScale = useTransform(pointerY, (y) => {
    const center = centerRef.current;
    if (center === null || !Number.isFinite(y)) return 1;
    const t = Math.max(0, 1 - Math.abs(y - center) / proximityRadius);
    return 1 + (maxScale - 1) * t * t;
  });
  const scale = useSpring(rawScale, reduce ? { stiffness: 1000, damping: 100 } : PROXIMITY_SPRING);

  const microTransition = { duration: reduce ? 0 : 0.2, ease: "easeOut" } as const;

  return (
    <li ref={rowRef} className="w-full list-none" style={{ paddingBlock: s.rowPaddingY }}>
      <motion.button
        type="button"
        onClick={onActivate}
        whileTap={reduce ? undefined : { scale: 0.97 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="flex w-full cursor-pointer items-center rounded-md text-left outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--psi-progress)]"
        style={{ gap: s.itemGap }}
        aria-current={isCurrentSection ? "true" : undefined}
      >
        <motion.span
          aria-hidden
          className="block shrink-0 rounded-full"
          animate={{
            width: isActive ? s.lineLengthActive : s.lineLength,
            height: isActive ? s.lineThicknessActive : s.lineThickness,
            backgroundColor: isActive ? c.progress : c.line,
            opacity: isActive ? 1 : inactiveOpacity,
          }}
          transition={microTransition}
        />
        <motion.span
          animate={{ color: c.text, opacity: isActive ? 1 : inactiveOpacity }}
          transition={microTransition}
          style={{
            scale,
            fontFamily: typo.fontFamily,
            fontSize: typo.fontSize,
            fontWeight: typo.fontWeight,
            letterSpacing: typo.letterSpacing,
            transformOrigin: "left center",
          }}
          className="whitespace-nowrap"
        >
          {section.label}
        </motion.span>
      </motion.button>
    </li>
  );
}

export function ProximityScrollIndicator({
  sections = DEFAULT_SECTIONS,
  colors,
  sizes,
  spring,
  closeDelay = 180,
  proximityRadius = 40,
  maxScale = 1.08,
  minProgress = 0.035,
  inactiveOpacity = 0.40,
  typography,
  className,
}: ProximityScrollIndicatorProps) {
  const reduce = useReducedMotion();
  const c = { ...COLORS, ...colors };
  const s = { ...SIZES, ...sizes };
  const sp = { ...SPRING, ...spring };
  const typo = { fontFamily: undefined, fontSize: 10, fontWeight: 500, letterSpacing: 0, ...typography };

  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // One raw (unsprung) value carrying the pointer's screen Y; each row derives its own smooth scale from it.
  const pointerY = useMotionValue(Number.POSITIVE_INFINITY);
  // Each row reports its own centre here (via onMeasure) so the nearest-row lookup below needs no layout reads.
  const centersRef = useRef<(number | null)[]>([]);
  const handleMeasure = useCallback((index: number, centerY: number | null) => {
    centersRef.current[index] = centerY;
  }, []);
  // Bumped when the panel's entrance spring finishes, so rows re-measure their settled (not mid-transform) position.
  const [measureTick, setMeasureTick] = useState(0);

  // The row nearest the pointer — recomputed from the cached centres, not from a DOM query, so it stays cheap
  // even on fast pointer movement. Only triggers a re-render when the nearest row actually changes.
  useMotionValueEvent(pointerY, "change", (y) => {
    if (!Number.isFinite(y)) {
      setHovered((prev) => (prev === null ? prev : null));
      return;
    }
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
    const id = best >= 0 ? sections[best].id : null;
    setHovered((prev) => (prev === id ? prev : id));
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
    }, closeDelay);
  }, [closeDelay, pointerY]);

  // The currently viewed section, tracked independently of hover/expand state.
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

  function goTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }

  const vars = { "--psi-surface": c.surface, "--psi-progress": c.progress } as CSSProperties;
  const cardStyle: CSSProperties = { ...vars, borderRadius: s.radius, background: "var(--psi-surface)", ...SQUIRCLE };

  return (
    <div
      onMouseEnter={openNow}
      onMouseLeave={closeSoon}
      onFocus={openNow}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) closeSoon();
      }}
      className={cn("fixed top-6 left-1/2 z-50 flex -translate-x-1/2 flex-col items-start", className)}
      // A fixed anchor width (the collapsed card's own size) instead of content-driven sizing: the
      // wider list card then overflows to the right from this same left edge, rather than the whole
      // stack re-centering (and dragging the ring sideways) each time the panel's width changes.
      style={{ gap: s.stackGap, width: s.collapsedSize }}
    >
      <div style={{ ...cardStyle, width: s.collapsedSize, height: s.collapsedSize, flexShrink: 0 }}>
        <ProgressRing s={s} c={c} reduce={reduce} minProgress={minProgress} />
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={reduce ? false : { opacity: 0, scale: 0.92, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: -4 }}
            transition={reduce ? { duration: 0.1 } : { type: "spring", stiffness: sp.stiffness, damping: sp.damping, mass: sp.mass }}
            onAnimationComplete={() => setMeasureTick((t) => t + 1)}
            style={{
              ...cardStyle,
              padding: s.padding,
              transformOrigin: "top center",
            }}
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
                  proximityRadius={proximityRadius}
                  maxScale={maxScale}
                  inactiveOpacity={inactiveOpacity}
                  reduce={reduce}
                  s={s}
                  c={c}
                  typo={typo}
                  onActivate={() => goTo(sec.id)}
                  index={i}
                  onMeasure={handleMeasure}
                  measureTick={measureTick}
                />
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
