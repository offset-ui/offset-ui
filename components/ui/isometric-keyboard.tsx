"use client";

import { useEffect, useRef, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export type IsometricKeyboardColors = {
  surface: string;
  accent: string;
};

export type IsometricKeyboardProps = {
  theme?: "light" | "dark";
  colors?: Partial<IsometricKeyboardColors>;
  keyboard?: boolean;
  onKeyActivate?: (label: string | null) => void;
  className?: string;
};

const LIGHT: IsometricKeyboardColors = { surface: "#ffffff", accent: "#2563eb" };
const DARK: IsometricKeyboardColors = { surface: "#0b0c0d", accent: "#ffffff" };

const UNIT = 11;
const GAP = 1.8;
const CAP = 6.5;
const REST = 4;
const CASE_HEIGHT = 7;
const RADIUS = 2.4;
const ELEVATION = 0.5;
const ZOOM = 1.75;
const WAVE = 3.4 * UNIT;
const TOP = REST + CAP;
const STIFFNESS = 420;
const DAMPING = 32;
const VIEW_W = 400;
const VIEW_H = 320;
const CASE_STROKE = "color-mix(in srgb, var(--ikb-ink) 32%, var(--ikb-surface))";
const KEY_STROKE = "color-mix(in srgb, var(--ikb-ink) 22%, var(--ikb-surface))";
const KEY_STYLE = { fill: "var(--ikb-surface)", stroke: KEY_STROKE };
const LINE = { strokeWidth: 1, vectorEffect: "non-scaling-stroke", strokeLinejoin: "round" } as const;

const ROWS: [number, number, string][] = [
  [0, 0, "esc _1 f1 f2 f3 f4 _0.5 f5 f6 f7 f8 _0.5 f9 f10 f11 f12"],
  [1.4, 0, "` 1 2 3 4 5 6 7 8 9 0 - = bksp:2"],
  [2.4, 0, "tab:1.5 q w e r t y u i o p [ ] \\:1.5"],
  [3.4, 0, "caps:1.75 a s d f g h j k l ; ' enter:2.25"],
  [4.4, 0, "shift:2.25 z x c v b n m , . / shift:2.75"],
  [5.4, 0, "ctrl:1.25 win:1.25 alt:1.25 space:6.25 alt:1.25 fn:1.25 menu:1.25 ctrl:1.25"],
  [0, 15.5, "prtsc scrlk pause"],
  [1.4, 15.5, "ins home pgup"],
  [2.4, 15.5, "del end pgdn"],
  [4.4, 16.5, "up"],
  [5.4, 15.5, "left down right"],
];

const CODE_LABELS: Record<string, string> = {
  Backquote: "`", Minus: "-", Equal: "=", Backspace: "bksp", BracketLeft: "[", BracketRight: "]", Backslash: "\\",
  CapsLock: "caps", Semicolon: ";", Quote: "'", Comma: ",", Period: ".", Slash: "/", ContextMenu: "menu",
  PrintScreen: "prtsc", ScrollLock: "scrlk", Insert: "ins", PageUp: "pgup", PageDown: "pgdn", Delete: "del",
  Escape: "esc", ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
  Control: "ctrl", Meta: "win",
};

type Point = [number, number];
type Key = { label: string; ring: Point[]; x: number; y: number; rest: number };

const COS = Math.cos((25 * Math.PI) / 180);
const SIN = Math.sin((25 * Math.PI) / 180);
const DEPTH = Math.sqrt(1 - ELEVATION * ELEVATION);
const flat = (x: number, y: number, z: number): Point => [ZOOM * (x * COS - y * SIN), ZOOM * ((x * SIN + y * COS) * ELEVATION - z * DEPTH)];

function roundedRect(u0: number, v0: number, u1: number, v1: number, r: number): Point[] {
  const out: Point[] = [];
  const corners = [[u1 - r, v1 - r, 0], [u0 + r, v1 - r, 90], [u0 + r, v0 + r, 180], [u1 - r, v0 + r, 270]];
  for (const [cu, cv, start] of corners) {
    for (let k = 0; k <= 3; k++) {
      const a = ((start + 30 * k) * Math.PI) / 180;
      out.push([cu + r * Math.cos(a), cv + r * Math.sin(a)]);
    }
  }
  return out;
}

function hull(input: Point[]): Point[] {
  const pts = [...input].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: Point, a: Point, b: Point) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const chain = (list: Point[]) => {
    const out: Point[] = [];
    for (const p of list) {
      while (out.length > 1 && cross(out[out.length - 2], out[out.length - 1], p) <= 0) out.pop();
      out.push(p);
    }
    return out.slice(0, -1);
  };
  return chain(pts).concat(chain(pts.reverse()));
}

const path = (pts: Point[]) => "M" + pts.map((p) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join("L") + "Z";

function readable(bg: string) {
  const m = /^#([0-9a-f]{6})$/i.exec(bg.trim());
  if (!m) return "#000000";
  const n = parseInt(m[1], 16);
  return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255 > 0.6 ? "#000000" : "#ffffff";
}

const KEYS: Key[] = [];
let boardW = 0;
let boardH = 0;
for (const [row, start, spec] of ROWS) {
  let x = start;
  for (const token of spec.split(" ")) {
    if (token[0] === "_") {
      x += Number(token.slice(1));
      continue;
    }
    const [label, width = "1"] = token.split(":");
    const w = Number(width);
    const ring = roundedRect(x * UNIT + GAP / 2, row * UNIT + GAP / 2, (x + w) * UNIT - GAP / 2, (row + 1) * UNIT - GAP / 2, RADIUS);
    KEYS.push({ label, ring, x: (x + w / 2) * UNIT, y: (row + 0.5) * UNIT, rest: label === "space" ? 1.1 : 0 });
    x += w;
    boardW = Math.max(boardW, x);
    boardH = Math.max(boardH, row + 1);
  }
}
KEYS.sort((a, b) => a.x + a.y - (b.x + b.y));

const BY_LABEL = new Map<string, number[]>();
KEYS.forEach((k, i) => BY_LABEL.set(k.label, [...(BY_LABEL.get(k.label) ?? []), i]));
BY_LABEL.forEach((list) => list.sort((a, b) => KEYS[a].x - KEYS[b].x));

const MARGIN = UNIT / 2;
const [BX0, BY0, BX1, BY1] = [-MARGIN, -MARGIN, boardW * UNIT + MARGIN, boardH * UNIT + MARGIN];
const EXTENT = [[BX0, BY0, -CASE_HEIGHT], [BX1, BY1, -CASE_HEIGHT], [BX1, BY0, 0], [BX0, BY1, 0], [BX0, BY0, TOP], [BX1, BY1, TOP]].map((p) => flat(p[0], p[1], p[2]));
const OFFSET_X = VIEW_W / 2 - (Math.min(...EXTENT.map((p) => p[0])) + Math.max(...EXTENT.map((p) => p[0]))) / 2;
const OFFSET_Y = VIEW_H / 2 - (Math.min(...EXTENT.map((p) => p[1])) + Math.max(...EXTENT.map((p) => p[1]))) / 2;

const project = (x: number, y: number, z: number): Point => {
  const [px, py] = flat(x, y, z);
  return [px + OFFSET_X, py + OFFSET_Y];
};
const lift = (ring: Point[], z: number) => ring.map((q) => project(q[0], q[1], z));

const SLAB = roundedRect(BX0, BY0, BX1, BY1, RADIUS * 2.5);
const CASE_SIDE = path(hull(lift(SLAB, 0).concat(lift(SLAB, -CASE_HEIGHT))));
const CASE_TOP = path(lift(SLAB, 0));

function keyIndex(code: string) {
  const sided = /^(Shift|Control|Alt|Meta)(Left|Right)$/.exec(code);
  const label = sided ? (CODE_LABELS[sided[1]] ?? sided[1].toLowerCase()) : (CODE_LABELS[code] ?? code.replace(/^(Key|Digit)/, "").toLowerCase());
  const matches = BY_LABEL.get(label);
  return matches ? matches[Math.min(sided?.[2] === "Right" ? 1 : 0, matches.length - 1)] : -1;
}

export function IsometricKeyboard({ theme, colors, keyboard = true, onKeyActivate, className }: IsometricKeyboardProps) {
  const reduce = useReducedMotion();
  const sideRefs = useRef<(SVGPathElement | null)[]>([]);
  const topRefs = useRef<(SVGPathElement | null)[]>([]);
  const retargetRef = useRef<(over: Point | null) => void>(() => {});
  const onActivateRef = useRef(onKeyActivate);

  useEffect(() => {
    onActivateRef.current = onKeyActivate;
  }, [onKeyActivate]);

  useEffect(() => {
    const state = KEYS.map((k) => ({ x: k.rest, v: 0, t: k.rest, drawn: -1, opacity: -1 }));
    const held = new Set<number>();
    let over: Point | null = null;
    let nearest = -1;
    let raf = 0;
    let last = 0;

    const draw = (i: number) => {
      const g = state[i];
      const side = sideRefs.current[i];
      const top = topRefs.current[i];
      if (!side || !top) return;
      const d = Math.max(0, g.x);
      if (Math.abs(d - g.drawn) > 0.01) {
        g.drawn = d;
        const upper = lift(KEYS[i].ring, TOP - d);
        side.setAttribute("d", path(hull(upper.concat(lift(KEYS[i].ring, REST - d)))));
        top.setAttribute("d", path(upper));
      }
      const opacity = d > REST * 0.3 ? Math.min(0.22, 0.06 + (d / REST) * 0.18) : 0;
      if (opacity === g.opacity) return;
      g.opacity = opacity;
      const on = opacity > 0;
      side.style.stroke = on ? "var(--ikb-accent)" : KEY_STROKE;
      top.style.stroke = on ? "var(--ikb-accent)" : KEY_STROKE;
      top.style.fill = on ? "var(--ikb-accent)" : "var(--ikb-surface)";
      top.style.fillOpacity = on ? String(opacity) : "1";
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
      last = now;
      let moving = false;
      state.forEach((g, i) => {
        if (reduce) {
          g.x = g.t;
          g.v = 0;
        } else if (Math.abs(g.x - g.t) > 0.004 || Math.abs(g.v) > 0.04) {
          const steps = Math.max(1, Math.ceil(dt * 240));
          const h = dt / steps;
          for (let j = 0; j < steps; j++) {
            g.v += (-STIFFNESS * (g.x - g.t) - DAMPING * g.v) * h;
            g.x += g.v * h;
          }
          moving = true;
        } else {
          g.x = g.t;
          g.v = 0;
        }
        draw(i);
      });
      raf = moving ? requestAnimationFrame(frame) : 0;
      if (!moving) last = 0;
    };

    const retarget = () => {
      let best = -1;
      let bestDist = Infinity;
      KEYS.forEach((k, i) => {
        const dist = over ? Math.hypot(k.x - over[0], k.y - over[1]) : Infinity;
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
        const u = dist / WAVE;
        const base = over ? (u < 1 ? REST * (1 - u) * (1 - u) : 0) : k.rest;
        state[i].t = held.has(i) ? Math.max(base, REST) : base;
      });
      if (best !== nearest) {
        nearest = best;
        onActivateRef.current?.(best >= 0 ? KEYS[best].label : null);
      }
      if (!raf) {
        last = 0;
        raf = requestAnimationFrame(frame);
      }
    };

    retargetRef.current = (point) => {
      over = point;
      retarget();
    };

    const onKey = (down: boolean) => (e: KeyboardEvent) => {
      if (!down && e.code.startsWith("Meta")) held.clear();
      const i = keyIndex(e.code);
      if (i < 0) return;
      if (down) {
        held.add(i);
        if (!e.repeat) onActivateRef.current?.(KEYS[i].label);
      } else held.delete(i);
      retarget();
    };
    const release = () => {
      held.clear();
      retarget();
    };
    const keydown = onKey(true);
    const keyup = onKey(false);

    if (keyboard) {
      window.addEventListener("keydown", keydown);
      window.addEventListener("keyup", keyup);
      window.addEventListener("blur", release);
    }
    KEYS.forEach((_, i) => draw(i));

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
      window.removeEventListener("blur", release);
    };
  }, [keyboard, reduce]);

  const aim = (e: ReactPointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const X = (((e.clientX - r.left) / r.width) * VIEW_W - OFFSET_X) / ZOOM;
    const Y = ((((e.clientY - r.top) / r.height) * VIEW_H - OFFSET_Y) / ZOOM + TOP * DEPTH) / ELEVATION;
    retargetRef.current([X * COS + Y * SIN, -X * SIN + Y * COS]);
  };

  const auto = theme === undefined && colors === undefined;
  const palette = { ...(theme === "dark" ? DARK : LIGHT), ...colors };
  const vars = { "--ikb-surface": palette.surface, "--ikb-accent": palette.accent, "--ikb-ink": readable(palette.surface) } as CSSProperties;

  return (
    <div
      className={cn(
        "relative w-full select-none",
        auto &&
          "[--ikb-surface:#ffffff] [--ikb-accent:#2563eb] [--ikb-ink:#000000] dark:[--ikb-surface:#0b0c0d] dark:[--ikb-accent:#ffffff] dark:[--ikb-ink:#ffffff]",
        className,
      )}
      style={auto ? undefined : vars}
    >
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="block h-auto w-full touch-pan-y"
        role="img"
        aria-label="Interactive isometric keyboard"
        onPointerMove={aim}
        onPointerDown={aim}
        onPointerLeave={() => retargetRef.current(null)}
      >
        <path d={CASE_SIDE} style={{ fill: "var(--ikb-surface)", stroke: CASE_STROKE }} {...LINE} />
        <path d={CASE_TOP} style={{ fill: "var(--ikb-surface)", stroke: CASE_STROKE }} {...LINE} />
        {KEYS.map((_, i) => (
          <g key={i}>
            <path ref={(el) => void (sideRefs.current[i] = el)} style={{ ...KEY_STYLE, transition: "stroke 150ms ease" }} {...LINE} />
            <path ref={(el) => void (topRefs.current[i] = el)} style={{ ...KEY_STYLE, transition: "stroke 150ms, fill 150ms, fill-opacity 150ms" }} {...LINE} />
          </g>
        ))}
      </svg>
    </div>
  );
}
