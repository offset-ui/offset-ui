"use client";
/**
 * Dependencies this component expects from the host project:
 * - Tailwind CSS (used for the theming CSS variables and layout utilities)
 * - "motion" (the `motion/react` package) — only for useReducedMotion
 * - cn() from "@/lib/utils" (clsx + tailwind-merge)
 * No Next.js-specific APIs are used, so it drops into any React project.
 *
 * An isometric TKL keyboard drawn as hairline keycaps. Each cap presses down under
 * the pointer (hover, click or tap) on its own spring, so a cluster sinks and the
 * springs' lag drags a wave along the cursor's path. Active caps light up in the
 * accent colour (blue on light, white on dark by default). Everything — palette,
 * sizes, camera tilt, spring feel, wave radius, layout — comes from props.
 */

import { useEffect, useMemo, useRef, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export type IsometricKeyboardColors = {
  surface: string; // cap/case fill (also occludes caps behind)
  case: string; // the base slab stroke
  key: string; // resting keycap stroke
  accent: string; // pressed keycap stroke + fill
};

export type IsometricKeyboardSizes = {
  unit: number; // key pitch in world units
  gap: number; // gap between caps in world units
  capHeight: number; // keycap thickness
  restGap: number; // gap between a resting cap and the deck (how far it can travel)
  caseHeight: number; // base slab thickness
  radius: number; // keycap corner radius
  elevation: number; // camera tilt, 0..1 (lower = more slanted toward the viewer)
  scale: number; // camera zoom
};

export type IsometricKeyboardSpring = { stiffness: number; damping: number; mass: number };

/** A layout row. Tokens: [w, label] is a key w units wide; [g] is a gap of g units. */
export type KeyboardRow = { y: number; x: number; t: ([number, string] | [number])[] };

export type IsometricKeyboardProps = {
  /** Omit to follow the system / `.dark` theme; set to force the palette. */
  theme?: "light" | "dark";
  colors?: Partial<IsometricKeyboardColors>;
  sizes?: Partial<IsometricKeyboardSizes>;
  spring?: Partial<IsometricKeyboardSpring>;
  /** Wave radius in key units: how far the press ripples from the pointer. */
  waveRadius?: number;
  /** Custom layout; defaults to a TKL board. */
  layout?: KeyboardRow[];
  /** Fires with the label of the key nearest the pointer (or null on leave). */
  onKeyActivate?: (label: string | null) => void;
  className?: string;
};

const LIGHT: IsometricKeyboardColors = { surface: "#ffffff", case: "#9aa0a6", key: "#c2c6cc", accent: "#2563eb" };
const DARK: IsometricKeyboardColors = { surface: "#0b0c0d", case: "#50525a", key: "#44464d", accent: "#ffffff" };

const SIZES: IsometricKeyboardSizes = {
  unit: 11, gap: 1.8, capHeight: 6.5, restGap: 4, caseHeight: 7, radius: 2.4, elevation: 0.5, scale: 1.75,
};
const SPRING: IsometricKeyboardSpring = { stiffness: 420, damping: 32, mass: 1 };
const VBW = 400, VBH = 320;

const TKL: KeyboardRow[] = [
  { y: 0.0, x: 0, t: [[1, "esc"], [1], [1, "f1"], [1, "f2"], [1, "f3"], [1, "f4"], [0.5], [1, "f5"], [1, "f6"], [1, "f7"], [1, "f8"], [0.5], [1, "f9"], [1, "f10"], [1, "f11"], [1, "f12"]] },
  { y: 1.4, x: 0, t: [[1, "`"], [1, "1"], [1, "2"], [1, "3"], [1, "4"], [1, "5"], [1, "6"], [1, "7"], [1, "8"], [1, "9"], [1, "0"], [1, "-"], [1, "="], [2, "bksp"]] },
  { y: 2.4, x: 0, t: [[1.5, "tab"], [1, "q"], [1, "w"], [1, "e"], [1, "r"], [1, "t"], [1, "y"], [1, "u"], [1, "i"], [1, "o"], [1, "p"], [1, "["], [1, "]"], [1.5, "\\"]] },
  { y: 3.4, x: 0, t: [[1.75, "caps"], [1, "a"], [1, "s"], [1, "d"], [1, "f"], [1, "g"], [1, "h"], [1, "j"], [1, "k"], [1, "l"], [1, ";"], [1, "'"], [2.25, "enter"]] },
  { y: 4.4, x: 0, t: [[2.25, "shift"], [1, "z"], [1, "x"], [1, "c"], [1, "v"], [1, "b"], [1, "n"], [1, "m"], [1, ","], [1, "."], [1, "/"], [2.75, "shift"]] },
  { y: 5.4, x: 0, t: [[1.25, "ctrl"], [1.25, "win"], [1.25, "alt"], [6.25, "space"], [1.25, "alt"], [1.25, "fn"], [1.25, "menu"], [1.25, "ctrl"]] },
  { y: 0.0, x: 15.5, t: [[1, "prtsc"], [1, "scrlk"], [1, "pause"]] },
  { y: 1.4, x: 15.5, t: [[1, "ins"], [1, "home"], [1, "pgup"]] },
  { y: 2.4, x: 15.5, t: [[1, "del"], [1, "end"], [1, "pgdn"]] },
  { y: 4.4, x: 16.5, t: [[1, "up"]] },
  { y: 5.4, x: 15.5, t: [[1, "left"], [1, "down"], [1, "right"]] },
];

// --- isometric camera (ported from the hairline engine) ---
type Cam = { c: number; s: number; zf: number; k: number; S: number; ox: number; oy: number };
type Pt = [number, number];
function makeCam(azDeg: number, k: number, S: number): Cam {
  const az = (azDeg * Math.PI) / 180;
  return { c: Math.cos(az), s: Math.sin(az), zf: Math.sqrt(1 - k * k), k, S, ox: 0, oy: 0 };
}
const proj = (C: Cam) => (x: number, y: number, z: number): Pt => {
  const X = x * C.c - y * C.s, Y = x * C.s + y * C.c;
  return [C.ox + C.S * X, C.oy + C.S * (Y * C.k - z * C.zf)];
};
const unproj = (C: Cam, sx: number, sy: number, z: number): Pt => {
  const X = (sx - C.ox) / C.S, Y = ((sy - C.oy) / C.S + z * C.zf) / C.k;
  return [X * C.c + Y * C.s, -X * C.s + Y * C.c];
};
function fitCam(C: Cam, pts: [number, number, number][]) {
  C.ox = 0; C.oy = 0;
  const P = proj(C);
  let a = 1e9, b = -1e9, c = 1e9, d = -1e9;
  for (const p of pts) { const q = P(p[0], p[1], p[2]); a = Math.min(a, q[0]); b = Math.max(b, q[0]); c = Math.min(c, q[1]); d = Math.max(d, q[1]); }
  C.ox = VBW / 2 - (a + b) / 2; C.oy = VBH / 2 - (c + d) / 2;
}
function rrect(u0: number, v0: number, u1: number, v1: number, r: number): Pt[] {
  r = Math.max(0, Math.min(r, (u1 - u0) / 2, (v1 - v0) / 2));
  const out: Pt[] = [], n = 3;
  for (const [cu, cv, a0] of [[u1 - r, v1 - r, 0], [u0 + r, v1 - r, 90], [u0 + r, v0 + r, 180], [u1 - r, v0 + r, 270]])
    for (let k = 0; k <= n; k++) { const a = ((a0 + (90 * k) / n) * Math.PI) / 180; out.push([cu + r * Math.cos(a), cv + r * Math.sin(a)]); }
  return out;
}
function hull(input: Pt[]): Pt[] {
  const pts = input.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const x = (o: Pt, a: Pt, b: Pt) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: Pt[] = [], up: Pt[] = [];
  for (const p of pts) { while (lo.length > 1 && x(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (up.length > 1 && x(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  lo.pop(); up.pop();
  return lo.concat(up);
}
const poly = (pts: Pt[]) => "M" + pts.map((p) => p[0].toFixed(2) + " " + p[1].toFixed(2)).join("L") + "Z";

type Key = { label: string; ring: Pt[]; cx: number; cy: number; h0: number };
type KState = { x: number; v: number; t: number; drawn: number; act: number };

export function IsometricKeyboard({
  theme, colors, sizes, spring, waveRadius = 3.4, layout = TKL, onKeyActivate, className,
}: IsometricKeyboardProps) {
  const reduce = useReducedMotion();
  const s = { ...SIZES, ...sizes };
  const sp = { ...SPRING, ...spring };
  const TOP = s.restGap + s.capHeight;
  const R = waveRadius * s.unit;

  const { keys, caseSil, caseTop, C } = useMemo(() => {
    const cam = makeCam(25, s.elevation, s.scale);
    let maxX = 0, maxY = 0;
    const raw: Key[] = [];
    for (const row of layout) {
      let x = row.x;
      for (const tk of row.t) {
        if (tk.length === 1) { x += tk[0]; continue; }
        const [w, label] = tk as [number, string];
        const x0 = x * s.unit + s.gap / 2, x1 = (x + w) * s.unit - s.gap / 2;
        const y0 = row.y * s.unit + s.gap / 2, y1 = (row.y + 1) * s.unit - s.gap / 2;
        raw.push({ label, ring: rrect(x0, y0, x1, y1, s.radius), cx: (x + w / 2) * s.unit, cy: (row.y + 0.5) * s.unit, h0: label === "space" ? 1.1 : 0 });
        x += w; maxX = Math.max(maxX, x); maxY = Math.max(maxY, row.y + 1);
      }
    }
    const M = s.unit * 0.5, bx0 = -M, bx1 = maxX * s.unit + M, by0 = -M, by1 = maxY * s.unit + M;
    fitCam(cam, [[bx0, by0, -s.caseHeight], [bx1, by1, -s.caseHeight], [bx1, by0, 0], [bx0, by1, 0], [bx0, by0, TOP], [bx1, by1, TOP]]);
    const P = proj(cam);
    const slab = rrect(bx0, by0, bx1, by1, s.radius * 2.5);
    const caseSil = poly(hull(slab.map((q) => P(q[0], q[1], 0)).concat(slab.map((q) => P(q[0], q[1], -s.caseHeight)))));
    const caseTop = poly(slab.map((q) => P(q[0], q[1], 0)));
    raw.sort((a, b) => a.cx + a.cy - (b.cx + b.cy)); // back to front
    return { keys: raw, caseSil, caseTop, C: cam };
  }, [layout, s.unit, s.gap, s.caseHeight, s.radius, s.elevation, s.scale, TOP]);

  const svgRef = useRef<SVGSVGElement>(null);
  const silRefs = useRef<(SVGPathElement | null)[]>([]);
  const topRefs = useRef<(SVGPathElement | null)[]>([]);
  const overRef = useRef<Pt | null>(null);
  const retargetRef = useRef<() => void>(() => {});
  // Held in a ref so an inline callback can't re-run the animation effect (which would reset every spring).
  const onActivateRef = useRef(onKeyActivate);
  useEffect(() => { onActivateRef.current = onKeyActivate; }, [onKeyActivate]);

  useEffect(() => {
    const P = proj(C);
    const st: KState[] = keys.map((k) => ({ x: k.h0, v: 0, t: k.h0, drawn: -1, act: -1 }));
    let raf = 0, last = 0, nearest = -2;

    const draw = (i: number) => {
      const k = keys[i], g = st[i], sil = silRefs.current[i], top = topRefs.current[i];
      if (!sil || !top) return;
      const d = Math.max(0, g.x);
      if (Math.abs(d - g.drawn) > 0.01) {
        g.drawn = d;
        const z0 = s.restGap - d, z1 = TOP - d;
        sil.setAttribute("d", poly(hull(k.ring.map((q) => P(q[0], q[1], z1)).concat(k.ring.map((q) => P(q[0], q[1], z0))))));
        top.setAttribute("d", poly(k.ring.map((q) => P(q[0], q[1], z1))));
      }
      const op = d > s.restGap * 0.3 ? Math.min(0.22, 0.06 + (d / s.restGap) * 0.18) : 0;
      if (op !== g.act) {
        g.act = op;
        const on = op > 0;
        sil.style.stroke = on ? "var(--ikb-accent)" : "var(--ikb-key)";
        top.style.stroke = on ? "var(--ikb-accent)" : "var(--ikb-key)";
        top.style.fill = on ? "var(--ikb-accent)" : "var(--ikb-surface)";
        top.style.fillOpacity = on ? String(op) : "1";
      }
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
      last = now;
      let moving = false;
      for (let i = 0; i < keys.length; i++) {
        const g = st[i];
        if (reduce) { g.x = g.t; g.v = 0; }
        else if (Math.abs(g.x - g.t) > 0.004 || Math.abs(g.v) > 0.04) {
          const n = Math.max(1, Math.ceil(dt * 240)), h = dt / n;
          for (let j = 0; j < n; j++) { const a = (-sp.stiffness * (g.x - g.t) - sp.damping * g.v) / sp.mass; g.v += a * h; g.x += g.v * h; }
          moving = true;
        } else { g.x = g.t; g.v = 0; }
        draw(i);
      }
      raf = moving ? requestAnimationFrame(frame) : 0;
      if (!moving) last = 0;
    };
    const wake = () => { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } };

    retargetRef.current = () => {
      const over = overRef.current;
      let best = -1, bd = Infinity;
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        if (!over) { st[i].t = k.h0; continue; }
        const dist = Math.hypot(k.cx - over[0], k.cy - over[1]);
        if (dist < bd) { bd = dist; best = i; }
        const u = dist / R;
        st[i].t = u >= 1 ? 0 : s.restGap * (1 - u) * (1 - u);
      }
      if (best !== nearest) { nearest = best; onActivateRef.current?.(over && best >= 0 ? keys[best].label : null); }
      wake();
    };

    keys.forEach((_, i) => draw(i)); // first paint
    return () => { if (raf) cancelAnimationFrame(raf); };
  }, [keys, C, R, TOP, s.restGap, sp.stiffness, sp.damping, sp.mass, reduce]);

  const toWorld = (e: ReactPointerEvent): Pt | null => {
    const svg = svgRef.current; if (!svg) return null;
    const r = svg.getBoundingClientRect();
    return unproj(C, ((e.clientX - r.left) / r.width) * VBW, ((e.clientY - r.top) / r.height) * VBH, TOP);
  };
  const set = (e: ReactPointerEvent) => { overRef.current = toWorld(e); retargetRef.current(); };

  const autoTheme = theme === undefined && colors === undefined;
  const vars = useMemo(() => {
    const c = { ...(theme === "dark" ? DARK : LIGHT), ...colors };
    return { "--ikb-surface": c.surface, "--ikb-case": c.case, "--ikb-key": c.key, "--ikb-accent": c.accent } as CSSProperties;
  }, [theme, colors]);

  return (
    <div
      className={cn(
        "relative w-full select-none",
        autoTheme &&
          "[--ikb-surface:#ffffff] [--ikb-case:#9aa0a6] [--ikb-key:#c2c6cc] [--ikb-accent:#2563eb] dark:[--ikb-surface:#0b0c0d] dark:[--ikb-case:#50525a] dark:[--ikb-key:#44464d] dark:[--ikb-accent:#ffffff]",
        className,
      )}
      style={autoTheme ? undefined : vars}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VBW} ${VBH}`}
        className="block h-auto w-full touch-pan-y"
        role="img"
        aria-label="Interactive isometric keyboard"
        onPointerMove={set}
        onPointerDown={set}
        onPointerLeave={() => { overRef.current = null; retargetRef.current(); }}
      >
        <path d={caseSil} style={{ fill: "var(--ikb-surface)", stroke: "var(--ikb-case)" }} strokeWidth={1} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        <path d={caseTop} style={{ fill: "var(--ikb-surface)", stroke: "var(--ikb-case)" }} strokeWidth={1} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        {keys.map((k, i) => (
          <g key={i}>
            <path ref={(el) => { silRefs.current[i] = el; }} style={{ fill: "var(--ikb-surface)", stroke: "var(--ikb-key)", transition: "stroke 150ms ease" }} strokeWidth={1} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
            <path ref={(el) => { topRefs.current[i] = el; }} style={{ fill: "var(--ikb-surface)", stroke: "var(--ikb-key)", transition: "stroke 150ms ease, fill 150ms ease, fill-opacity 150ms ease" }} strokeWidth={1} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
          </g>
        ))}
      </svg>
    </div>
  );
}
