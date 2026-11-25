// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Offset UI. Keep this notice with any copy of this file.
"use client";

import { useEffect, useId, useRef, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import type Matter from "matter-js";
import { cn } from "@/lib/utils";

export type HangingProfile = { name: string; role: string; image?: string; href?: string };

export type HangingProfileColors = { surface: string; rope: string };

type HangingProfileCardsProps = {
  cards?: HangingProfile[];
  colors?: Partial<HangingProfileColors>;
  swing?: number;
  tilt?: number;
  className?: string;
  ariaLabel?: string;
};

type Point = { x: number; y: number };
type Look = Record<(typeof LOOK_KEYS)[number], number>;
type Verlet = Matter.Body & { positionPrev: Point };

const DEFAULT_CARDS: HangingProfile[] = [
  { name: "Maya Bennett", role: "Creative Director" },
  { name: "Leo Carter", role: "Motion Designer" },
  { name: "Noah Williams", role: "Product Designer" },
  { name: "Amina Yusuf", role: "Brand Designer" },
];
const DEFAULT_COLORS: HangingProfileColors = { surface: "#ffffff", rope: "#ffffff" };
const PORTRAITS = [
  { bg: "#e9c4ea", skin: "#e6a07e", hair: "#a23fd0", shirt: "#8f3fc2" },
  { bg: "#d8d2ea", skin: "#eea585", hair: "#2a211f", shirt: "#7d746d" },
  { bg: "#efc36b", skin: "#8a5538", hair: "#2a1d17", shirt: "#4f7694" },
  { bg: "#d8d0ec", skin: "#f0a98a", hair: "#241c1b", shirt: "#c98d8a" },
  { bg: "#bfe0cf", skin: "#d99877", hair: "#6b4a2f", shirt: "#3f6f5f" },
  { bg: "#f4cbb8", skin: "#c88460", hair: "#1f1a18", shirt: "#b25a4a" },
];
const FABRIC_SHADES = ["#030304", "#15151a", "#27272e", "#15151a", "#030304"];
const CHROME_SHADES = ["#454b5e", "#f6f8fc", "#a9b0c2", "#e6e9f1", "#7b8397", "#454b5e"];
const TUBE = [[1, "#363c4f"], [0.72, "#8b93a7"], [0.48, "#d3d8e4"], [0.2, "#ffffff"]] as const;
const HOOK_PATH = "M0 15V0A9 9 0 0 1 18 0V7M-10 15H10";
const RING_PATH = "M-14 3V11A14 10 0 0 0 14 11V3";
const EYE_PATH = "M-3.4 24a3.4 5 0 1 0 6.8 0a3.4 5 0 1 0 -6.8 0";
const CLASP_BODY = "M-7 40A7 7 0 0 1 7 40V61A7 7 0 0 1 -7 61ZM-2.6 41.5A2.6 2.6 0 0 1 2.6 41.5V59.5A2.6 2.6 0 0 1 -2.6 59.5Z";
const ACTION = "flex h-6 items-center justify-center rounded-md p-1.5 text-[10px] outline-offset-2 focus-visible:outline-2";

const MAX_CARDS = 6;
const CARD = { width: 210, height: 262 };
const PORTRAIT_HEIGHT = 146;
const PORTRAIT_TOP = 5;
const SLOT = 290;
const KNOTS_PER_SLOT = 6;
const EDGE_KNOTS = 2;
const BLEED = 12;
const SPACING = SLOT / KNOTS_PER_SLOT;
const EDGE = EDGE_KNOTS * SPACING - BLEED;
const ROPE_Y = 36;
const SAG = 26;
const HEIGHT = 529;
const STRAP_LENGTH = 90;
const STRAP_WIDTH = 33;
const STRAP_INSET = -4;
const STRAP_EDGE = 0.8;
const STRAP_GATHER = 26;
const GATHER_FROM = 0.85;
const STRAP_SAMPLES = 14;
const STRAP_BOW = 4;
const STRAP_TIP = 0;
const ARC_STEPS = 6;
const HOOK_DROP = 15;
const LOOK_KEYS = ["tx", "ty", "glow"] as const;
const REST_LOOK: Look = { tx: 0, ty: 0, glow: 0 };
const LOOK_TAU = 90;
const LOOK_EPSILON = 0.002;
const MAX_TILT = 14;
const PERSPECTIVE = 900;
const SWAY_FORCE = 0.00002;
const SWAY_CAP = 30;
const SHEEN = "conic-gradient(from 200deg at calc(50% + var(--tx) * 40%) calc(50% + var(--ty) * 40%), #ffc8e6, #fff0b8, #bdf3ff, #dccfff, #ffc8e6)";
const TAIL_LENGTH = 3000;
const TAIL_RISE = 0.4;
const RING_RISE = 46;
const HOLE_TOP = 14;
const HOLE_HEIGHT = 7;
const HOLE_STYLE = { background: "rgba(14, 18, 48, 0.72)", boxShadow: "inset 0 2px 3px rgba(0, 0, 0, 0.6), 0 1px 0 rgba(255, 255, 255, 0.8)" };
const TILTS = [4.83, 1.5, -2.19, -0.09, 3, -3.2];

const STEP = 1000 / 60;
const MAX_CATCH_UP = 50;
const WARM_UP_STEPS = 240;
const CALM_FRAMES = 20;
const REST_EPSILON = 0.02;
const DRAG_THRESHOLD = 5;
const GRAVITY = 3;
const SOLVER_ITERATIONS = 40;
const ROPE_PRETENSION = [0.9849, 0.9849, 0.9815, 0.9774, 0.9729, 0.9685];
const MAX_KNOT_STEP = 4;
const ROPE_MASS = 3;
const ROPE_AIR = 0.12;
const ROPE_DAMPING = 0.4;
const CARD_MASS = 1;
const STRING_STIFFNESS = 0.85;
const STRING_DAMPING = 0.15;
const DRAG_DAMPING = 0.12;
const MAX_PULL = 150;
const REDUCED_MOTION_AIR = 0.2;
const CARD_CATEGORY = 2;
const WALL_CATEGORY = 4;

const clamp = (value: number, low = 0, high = 1) => Math.min(high, Math.max(low, value));
const cardAir = (swing: number) => 0.07 - 0.06 * clamp(swing);
const dragStiffness = (swing: number) => 0.05 - 0.02 * clamp(swing);

const geometry = (count: number) => {
  const intervals = count * KNOTS_PER_SLOT + 2 * EDGE_KNOTS;
  return { intervals, width: count * SLOT + 2 * EDGE };
};
const knotX = (knot: number) => knot * SPACING - BLEED;
const ropeY = (knot: number, intervals: number) => ROPE_Y + SAG * 4 * (knot / intervals) * (1 - knot / intervals);

const restPose = (index: number, count: number) => {
  const { intervals } = geometry(count);
  const knot = EDGE_KNOTS + index * KNOTS_PER_SLOT + KNOTS_PER_SLOT / 2;
  const angle = (TILTS[index % TILTS.length] * Math.PI) / 180;
  const arm = CARD.height / 2 + RING_RISE;
  const pin = { x: -arm * Math.tan(angle), y: -arm };
  const anchor = { x: knotX(knot), y: ropeY(knot, intervals) };
  const hang = { x: anchor.x, y: anchor.y + STRAP_LENGTH };
  const [cos, sin] = [Math.cos(angle), Math.sin(angle)];
  const center = { x: hang.x - (pin.x * cos - pin.y * sin), y: hang.y - (pin.x * sin + pin.y * cos) };
  return { knot, angle, pin, anchor, hang, center };
};

const cardTransform = (center: Point, angle: number) =>
  `translate3d(${center.x - CARD.width / 2}px, ${center.y - CARD.height / 2}px, 0) rotate(${angle}rad) perspective(${PERSPECTIVE}px) rotateX(calc(var(--ty) * var(--tilt) * -${MAX_TILT}deg)) rotateY(calc(var(--tx) * var(--tilt) * ${MAX_TILT}deg))`;

const ropePath = (points: Point[]) =>
  points.reduce((path, p1, i) => {
    if (i === points.length - 1) return path;
    const [p0, p2, p3] = [points[i - 1] ?? p1, points[i + 1], points[i + 2] ?? points[i + 1]];
    return `${path} C${p1.x + (p2.x - p0.x) / 6} ${p1.y + (p2.y - p0.y) / 6} ${p2.x - (p3.x - p1.x) / 6} ${p2.y - (p3.y - p1.y) / 6} ${p2.x} ${p2.y}`;
  }, `M${points[0].x} ${points[0].y}`);

const ropeTails = (intervals: number) => {
  const end = (edge: number, next: number) => {
    const [a, b] = [{ x: knotX(edge), y: ropeY(edge, intervals) }, { x: knotX(next), y: ropeY(next, intervals) }];
    const length = Math.hypot(a.x - b.x, a.y - b.y);
    return `M${a.x + ((a.x - b.x) / length) * TAIL_LENGTH} ${a.y + ((a.y - b.y) / length) * TAIL_LENGTH * TAIL_RISE} L${a.x} ${a.y}`;
  };
  return `${end(0, 1)} ${end(intervals, intervals - 1)}`;
};

const strapShape = (pin: Point, angle: number) => {
  const from = { x: 0, y: HOOK_DROP };
  const up = { x: Math.sin(angle), y: -Math.cos(angle) };
  const end = { x: pin.x + up.x * STRAP_INSET, y: pin.y + up.y * STRAP_INSET };
  const reach = Math.hypot(end.x - from.x, end.y - from.y) * 0.35;
  const [c1, c2] = [{ x: from.x, y: from.y + reach }, { x: end.x + up.x * reach, y: end.y + up.y * reach }];
  const spine = Array.from({ length: STRAP_SAMPLES + 1 }, (_, k) => {
    const [t, u] = [k / STRAP_SAMPLES, 1 - k / STRAP_SAMPLES];
    const at = (p: number, q: number, r: number, v: number) => u ** 3 * p + 3 * u * u * t * q + 3 * u * t * t * r + t ** 3 * v;
    const slope = (p: number, q: number, r: number, v: number) => 3 * u * u * (q - p) + 6 * u * t * (r - q) + 3 * t * t * (v - r);
    const length = Math.hypot(slope(from.x, c1.x, c2.x, end.x), slope(from.y, c1.y, c2.y, end.y));
    const along = { x: slope(from.y, c1.y, c2.y, end.y) / length, y: -slope(from.x, c1.x, c2.x, end.x) / length };
    const half = (STRAP_WIDTH - (STRAP_WIDTH - STRAP_GATHER) * clamp((t - GATHER_FROM) / (1 - GATHER_FROM))) / 2;
    return { x: at(from.x, c1.x, c2.x, end.x) + STRAP_BOW * Math.sin(Math.PI * t) ** 2, y: at(from.y, c1.y, c2.y, end.y), along, half };
  });
  const side = ({ x, y, along, half }: (typeof spine)[number], sign: number) => ({ x: x + along.x * sign * half, y: y + along.y * sign * half });
  const tip = Array.from({ length: ARC_STEPS + 1 }, (_, j) => {
    const theta = (Math.PI * j) / ARC_STEPS;
    const { x, y, along, half } = spine[STRAP_SAMPLES];
    const [across, drop] = [Math.cos(theta) * half, Math.sin(theta) * STRAP_TIP];
    return { x: x + along.x * across - along.y * drop, y: y + along.y * across + along.x * drop };
  });
  return [...spine.map((p) => side(p, 1)), ...tip, ...[...spine].reverse().map((p) => side(p, -1))].map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
};

const readableOn = (color: string) => {
  const hex = /^#([\da-f]{3}|[\da-f]{6})$/i.exec(color.trim())?.[1];
  if (!hex) return "#1d1d1d";
  const full = hex.length === 3 ? [...hex].map((c) => c + c).join("") : hex;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? "#1d1d1d" : "#fafafa";
};

function buildWorld(matter: typeof Matter, count: number, swing: number, calmer: boolean) {
  const { Engine, Bodies, Body, Composite, Constraint, Vector } = matter;
  const { intervals, width } = geometry(count);
  const air = calmer ? REDUCED_MOTION_AIR : cardAir(swing);
  const engine = Engine.create({ gravity: { y: GRAVITY }, constraintIterations: SOLVER_ITERATIONS, positionIterations: SOLVER_ITERATIONS, velocityIterations: 8 });

  const knots = Array.from({ length: intervals + 1 }, (_, j) => {
    const knot = Bodies.circle(knotX(j), ropeY(j, intervals), 3, { isStatic: j === 0 || j === intervals, frictionAir: ROPE_AIR, collisionFilter: { mask: 0 } });
    Body.setMass(knot, ROPE_MASS);
    Body.setInertia(knot, Infinity);
    return knot;
  });
  const links = knots.slice(1).map((knot, j) => {
    const length = Vector.magnitude(Vector.sub(knot.position, knots[j].position)) * ROPE_PRETENSION[count - 1];
    return Constraint.create({ bodyA: knots[j], bodyB: knot, stiffness: 1, damping: ROPE_DAMPING, length });
  });

  const cards = Array.from({ length: count }, (_, i) => {
    const pose = restPose(i, count);
    const body = Bodies.rectangle(pose.center.x, pose.center.y, CARD.width, CARD.height, {
      angle: pose.angle,
      chamfer: { radius: 20 },
      frictionAir: air,
      friction: 0.05,
      restitution: 0.1,
      collisionFilter: { category: CARD_CATEGORY, mask: CARD_CATEGORY | WALL_CATEGORY },
    });
    Body.setMass(body, CARD_MASS);
    const strap = Constraint.create({ bodyA: knots[pose.knot], bodyB: body, pointB: Vector.rotate(pose.pin, pose.angle), length: STRAP_LENGTH, stiffness: STRING_STIFFNESS, damping: STRING_DAMPING });
    return { body, strap, pin: pose.pin, knot: knots[pose.knot] };
  });

  const wall = (x: number, y: number, w: number, h: number) => Bodies.rectangle(x, y, w, h, { isStatic: true, collisionFilter: { category: WALL_CATEGORY } });
  Composite.add(engine.world, [
    ...knots,
    ...links,
    ...cards.flatMap((card) => [card.body, card.strap]),
    wall(-60, HEIGHT / 2, 120, HEIGHT * 3),
    wall(width + 60, HEIGHT / 2, 120, HEIGHT * 3),
    wall(width / 2, HEIGHT + 60, width * 3, 120),
  ]);

  const moving = [...knots.filter((knot) => !knot.isStatic), ...cards.map((card) => card.body)];
  const loose = knots.filter((knot) => !knot.isStatic) as Verlet[];
  const drags = new Map<number, { anchor: Matter.Body; pull: Matter.Constraint; card: number; origin: Point }>();
  let lastFrame: number[] = [];

  const step = () => {
    Engine.update(engine, STEP);
    loose.forEach((knot) => {
      const velocity = Vector.sub(knot.position, knot.positionPrev);
      const speed = Vector.magnitude(velocity);
      if (speed > MAX_KNOT_STEP) Vector.add(knot.positionPrev, Vector.mult(velocity, MAX_KNOT_STEP / speed), knot.position);
    });
  };
  for (let i = 0; i < WARM_UP_STEPS; i++) step();

  return {
    width,
    knots,
    cards,
    step,
    calmer,
    sway(index: number, point: Point, push: number) {
      Body.applyForce(cards[index].body, point, { x: clamp(push, -SWAY_CAP, SWAY_CAP) * SWAY_FORCE, y: 0 });
    },
    grab(index: number, point: Point, pointerId: number) {
      if ([...drags.values()].some((drag) => drag.card === index)) return;
      const anchor = Bodies.circle(point.x, point.y, 1, { isStatic: true, collisionFilter: { mask: 0 } });
      const pull = Constraint.create({ bodyA: anchor, bodyB: cards[index].body, pointB: Vector.sub(point, cards[index].body.position), length: 0, stiffness: dragStiffness(swing), damping: DRAG_DAMPING });
      Composite.add(engine.world, [anchor, pull]);
      drags.set(pointerId, { anchor, pull, card: index, origin: point });
    },
    move(pointerId: number, point: Point) {
      const drag = drags.get(pointerId);
      if (!drag) return;
      const offset = Vector.sub(point, drag.origin);
      const distance = Vector.magnitude(offset);
      Body.setPosition(drag.anchor, distance ? Vector.add(drag.origin, Vector.mult(offset, (MAX_PULL * Math.tanh(distance / MAX_PULL)) / distance)) : drag.origin);
    },
    release(pointerId: number) {
      const drag = drags.get(pointerId);
      if (!drag) return;
      Composite.remove(engine.world, [drag.anchor, drag.pull]);
      drags.delete(pointerId);
    },
    busy() {
      const frame = moving.flatMap((body) => [body.position.x, body.position.y, body.angle * 100]);
      const moved = frame.some((value, i) => Math.abs(value - (lastFrame[i] ?? Infinity)) > REST_EPSILON);
      lastFrame = frame;
      return drags.size > 0 || moved;
    },
    pin(index: number) {
      const { body, pin } = cards[index];
      return Vector.add(body.position, Vector.rotate(pin, body.angle));
    },
    dispose() {
      Composite.clear(engine.world, false);
      Engine.clear(engine);
    },
  };
}

function Tube({ d, width }: { d: string; width: number }) {
  return TUBE.map(([scale, color], n) => <path key={n} d={d} fill="none" stroke={color} strokeWidth={width * scale} strokeLinecap="round" strokeLinejoin="round" transform={n === TUBE.length - 1 ? "translate(-0.6 -0.6)" : undefined} />);
}

function Portrait({ index }: { index: number }) {
  const { skin, hair, shirt } = PORTRAITS[index % PORTRAITS.length];
  return (
    <svg aria-hidden viewBox="0 0 100 80" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 size-full">
      <path d="M66 0H100V30C82 28 68 16 66 0Z" fill={shirt} opacity=".9" />
      <circle cx="50" cy="44" r="36" fill="#fff" opacity=".35" />
      <ellipse cx="50" cy="86" rx="38" ry="26" fill={shirt} />
      <rect x="44" y="52" width="12" height="14" rx="5" fill={skin} />
      <ellipse cx="50" cy="38" rx="17" ry="20" fill={skin} />
      <path d="M32 36c0-16 10-22 20-22 9 0 16 6 16 18-5-6-12-9-19-9-7 0-13 4-17 13z" fill={hair} />
    </svg>
  );
}

export function HangingProfileCards({ cards = DEFAULT_CARDS, colors = {}, swing = 0.5, tilt = 0.5, className, ariaLabel = "Hanging profile cards" }: HangingProfileCardsProps) {
  const profiles = cards.slice(0, MAX_CARDS);
  const count = profiles.length;
  const { width, intervals } = geometry(count);
  const { surface, rope } = { ...DEFAULT_COLORS, ...colors };

  const root = useRef<HTMLElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const ropeEl = useRef<SVGPathElement>(null);
  const cardEls = useRef<(HTMLDivElement | null)[]>([]);
  const strapEls = useRef<(SVGPolygonElement | null)[]>([]);
  const hookEls = useRef<(SVGGElement | null)[]>([]);
  const claspEls = useRef<(SVGGElement | null)[]>([]);
  const shade = useId();
  const metal = useId();
  const dome = useId();
  const weave = useId();
  const hole = useId();
  const shadow = useId();
  const world = useRef<ReturnType<typeof buildWorld> | null>(null);
  const wake = useRef(() => {});
  const dragStart = useRef<Point>({ x: 0, y: 0 });
  const dragged = useRef(false);
  const aims = useRef<Look[]>([]);

  useEffect(() => {
    const host = root.current!;
    const view = scene.current!;
    const fit = () => {
      const scale = Math.min(host.clientWidth / width, Math.max(1, innerHeight / HEIGHT));
      view.style.scale = String(scale);
      host.style.height = `${HEIGHT * scale}px`;
    };
    const observer = new ResizeObserver(fit);
    observer.observe(host);
    addEventListener("resize", fit);
    return () => {
      observer.disconnect();
      removeEventListener("resize", fit);
    };
  }, [width]);

  useEffect(() => {
    let alive = true;
    let dispose = () => {};

    import("matter-js").then(({ default: matter }) => {
      if (!alive) return;
      const calmer = matchMedia("(prefers-reduced-motion: reduce)").matches;
      const sim = buildWorld(matter, count, swing, calmer);
      world.current = sim;
      let raf = 0;
      let last = 0;
      let accumulated = 0;
      let calm = 0;
      let visible = true;
      const looks = Array.from({ length: count }, () => ({ ...REST_LOOK }));
      aims.current = looks.map(() => REST_LOOK);

      const draw = (ease = 0) => {
        ropeEl.current?.setAttribute("d", ropePath(sim.knots.map((knot) => knot.position)));
        sim.cards.forEach(({ body, knot }, i) => {
          const card = cardEls.current[i]!;
          card.style.transform = cardTransform(body.position, body.angle);
          LOOK_KEYS.forEach((key) => {
            looks[i][key] += (aims.current[i][key] - looks[i][key]) * ease;
            card.style.setProperty(`--${key}`, String(looks[i][key]));
          });
          const pin = sim.pin(i);
          strapEls.current[i]!.setAttribute("points", strapShape({ x: pin.x - knot.position.x, y: pin.y - knot.position.y }, body.angle));
          hookEls.current[i]!.setAttribute("transform", `translate(${knot.position.x} ${knot.position.y})`);
          claspEls.current[i]!.setAttribute("transform", `translate(${pin.x} ${pin.y}) rotate(${(body.angle * 180) / Math.PI})`);
        });
      };

      const frame = (now: number) => {
        const elapsed = now - last;
        accumulated = Math.min(accumulated + elapsed, MAX_CATCH_UP);
        last = now;
        for (; accumulated >= STEP; accumulated -= STEP) sim.step();
        draw(1 - Math.exp(-elapsed / LOOK_TAU));
        const looking = looks.some((look, i) => LOOK_KEYS.some((key) => Math.abs(aims.current[i][key] - look[key]) > LOOK_EPSILON));
        calm = sim.busy() || looking ? 0 : calm + 1;
        raf = calm > CALM_FRAMES ? 0 : requestAnimationFrame(frame);
      };
      const run = () => {
        cancelAnimationFrame(raf);
        raf = 0;
        if (!visible || document.hidden) return;
        last = performance.now();
        accumulated = 0;
        calm = 0;
        raf = requestAnimationFrame(frame);
      };

      const view = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        run();
      });
      view.observe(root.current!);
      document.addEventListener("visibilitychange", run);
      wake.current = () => !raf && run();
      draw();

      dispose = () => {
        cancelAnimationFrame(raf);
        view.disconnect();
        document.removeEventListener("visibilitychange", run);
        wake.current = () => {};
        world.current = null;
        sim.dispose();
      };
    });

    return () => {
      alive = false;
      dispose();
    };
  }, [count, swing]);

  const toScene = (e: ReactPointerEvent): Point => {
    const rect = scene.current!.getBoundingClientRect();
    const scale = rect.width / width;
    return { x: (e.clientX - rect.left) / scale, y: (e.clientY - rect.top) / scale };
  };
  const grab = (e: ReactPointerEvent<HTMLDivElement>, index: number) => {
    if (!world.current || (e.pointerType === "mouse" && e.button !== 0)) return;
    if (e.isTrusted) e.currentTarget.setPointerCapture(e.pointerId);
    dragStart.current = { x: e.clientX, y: e.clientY };
    dragged.current = false;
    world.current.grab(index, toScene(e), e.pointerId);
    wake.current();
  };
  const move = (e: ReactPointerEvent, index: number) => {
    const sim = world.current;
    if (!sim) return;
    const point = toScene(e);
    sim.move(e.pointerId, point);
    if (!sim.calmer) {
      const { body } = sim.cards[index];
      const [dx, dy, cos, sin] = [point.x - body.position.x, point.y - body.position.y, Math.cos(body.angle), Math.sin(body.angle)];
      aims.current[index] = { tx: clamp((dx * cos + dy * sin) / (CARD.width / 2), -1, 1), ty: clamp((dy * cos - dx * sin) / (CARD.height / 2), -1, 1), glow: 1 };
      if (e.pointerType === "mouse" && !e.buttons) sim.sway(index, point, e.movementX || 0);
      wake.current();
    }
    if (Math.hypot(e.clientX - dragStart.current.x, e.clientY - dragStart.current.y) > DRAG_THRESHOLD) dragged.current = true;
  };
  const rest = (index: number) => {
    aims.current[index] = REST_LOOK;
    wake.current();
  };
  const release = (e: ReactPointerEvent) => {
    world.current?.release(e.pointerId);
    wake.current();
  };

  return (
    <section
      ref={root}
      aria-label={ariaLabel}
      className={cn("relative w-full touch-pan-y select-none overflow-hidden", className)}
      style={{ height: HEIGHT, "--surface": surface, "--ink": readableOn(surface), "--rope": rope, "--tilt": clamp(tilt) } as CSSProperties}
    >
      <div ref={scene} className="absolute left-1/2 top-0 origin-top" style={{ width, height: HEIGHT, translate: "-50% 0" }}>
        {profiles.map((profile, i) => {
          const pose = restPose(i, count);
          const Profile = profile.href ? "a" : "span";
          return (
            <div
              key={i}
              ref={(el) => {
                cardEls.current[i] = el;
              }}
              role="group"
              aria-label={`${profile.name}, ${profile.role}`}
              onPointerDown={(e) => grab(e, i)}
              onPointerMove={(e) => move(e, i)}
              onPointerLeave={() => rest(i)}
              onPointerUp={release}
              onPointerCancel={release}
              onLostPointerCapture={release}
              onClickCapture={(e) => dragged.current && (e.preventDefault(), e.stopPropagation())}
              className="absolute left-0 top-0 flex cursor-grab touch-none flex-col rounded-[20px] border border-black/15 bg-(--surface) p-1 text-(--ink) transition-colors hover:border-black/30 active:cursor-grabbing"
              style={{ width: CARD.width, height: CARD.height, transform: cardTransform(pose.center, pose.angle), "--tx": 0, "--ty": 0, "--glow": 0 } as CSSProperties}
            >
              <div className="relative shrink-0" style={{ height: PORTRAIT_HEIGHT }}>
                <div className="absolute inset-0 overflow-hidden rounded-2xl" style={{ background: PORTRAITS[i % PORTRAITS.length].bg }}>
                  <Portrait index={i} />
                  {profile.image && <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${profile.image})` }} />}
                </div>
                <span className="absolute left-1/2 w-[35px] -translate-x-1/2 rounded-full" style={{ ...HOLE_STYLE, top: HOLE_TOP - PORTRAIT_TOP, height: HOLE_HEIGHT }} />
              </div>
              <div className="flex flex-1 flex-col justify-between px-2 pb-1.5 pt-2.5">
                <div className="flex flex-col gap-1.5">
                  <p className="flex items-center gap-1 text-base tracking-[-0.03em]">
                    <span className="truncate">{profile.name}</span>
                    <svg aria-hidden width="16" height="16" viewBox="0 0 16 16" className="shrink-0 fill-[#008CFF]">
                      <path d="M13.3067 5.68C13.32 5.56667 13.3333 5.44667 13.3333 5.33333C13.3333 3.74667 11.9067 2.47333 10.32 2.69333C9.86 1.87333 8.98 1.33333 8 1.33333C7.02 1.33333 6.14 1.86667 5.68 2.69333C4.09333 2.48 2.66667 3.75333 2.66667 5.33333C2.66667 5.44667 2.67333 5.56667 2.69333 5.68C1.87333 6.14 1.33333 7.02 1.33333 8C1.33333 8.98 1.86667 9.86 2.69333 10.32C2.68 10.4333 2.66667 10.5533 2.66667 10.6667C2.66667 12.2533 4.09333 13.5267 5.68 13.3067C6.14 14.1267 7.02 14.6667 8 14.6667C8.98 14.6667 9.86 14.1333 10.32 13.3067C11.9067 13.52 13.3333 12.2467 13.3333 10.6667C13.3333 10.5533 13.3267 10.4333 13.3067 10.32C14.1267 9.86 14.6667 8.98 14.6667 8C14.6667 7.02 14.1333 6.14 13.3067 5.68ZM7.32667 10.2733L5.52667 8.47333L6.46667 7.53333L7.33333 8.4L9.55333 6.2L10.4933 7.14667L7.32667 10.28V10.2733Z" />
                    </svg>
                  </p>
                  <span className="h-0.5 w-6 rounded-full" style={{ background: PORTRAITS[i % PORTRAITS.length].shirt }} />
                  <p className="flex items-baseline justify-between gap-2 text-[10px]">
                    <span className="truncate opacity-60">{profile.role}</span>
                    <span className="shrink-0 text-[9px] tracking-widest opacity-40">ID #{String(i + 1).padStart(2, "0")}</span>
                  </p>
                </div>
                <div className="flex gap-1">
                  <Profile href={profile.href} className={cn(ACTION, "min-w-0 flex-1 border border-black/5")}>
                    See full Profile
                  </Profile>
                  <button type="button" className={cn(ACTION, "bg-(--ink) text-(--surface)")}>
                    Connect
                  </button>
                </div>
              </div>
              <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit] mix-blend-multiply" style={{ background: SHEEN, opacity: "calc(var(--glow) * 0.5)" }} />
            </div>
          );
        })}
        <svg aria-hidden viewBox={`0 0 ${width} ${HEIGHT}`} className="pointer-events-none absolute inset-0 size-full overflow-visible">
          <defs>
            <linearGradient id={shade} gradientUnits="userSpaceOnUse" x1={-STRAP_WIDTH / 2} x2={STRAP_WIDTH / 2}>
              {FABRIC_SHADES.map((color, k) => (
                <stop key={k} offset={k / (FABRIC_SHADES.length - 1)} stopColor={color} />
              ))}
            </linearGradient>
            <linearGradient id={metal} gradientUnits="userSpaceOnUse" x1="-7" x2="7">
              {CHROME_SHADES.map((color, k) => (
                <stop key={k} offset={k / (CHROME_SHADES.length - 1)} stopColor={color} />
              ))}
            </linearGradient>
            <radialGradient id={dome} cx="0.35" cy="0.3" r="0.8">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="0.5" stopColor="#9ca3b6" />
              <stop offset="1" stopColor="#323848" />
            </radialGradient>
            <pattern id={weave} width="3.4" height="2.4" patternUnits="userSpaceOnUse">
              <path d="M0 2.4L1.7 0.7L3.4 2.4" fill="none" stroke="#fff" strokeOpacity="0.1" strokeWidth="0.7" />
              <path d="M0 1.2L1.7 -0.5L3.4 1.2" fill="none" stroke="#000" strokeOpacity="0.4" strokeWidth="0.7" />
            </pattern>
            <clipPath id={hole}>
              <rect x="-40" y="-60" width="80" height={RING_RISE + HOLE_TOP + HOLE_HEIGHT - 0.5 + 60} />
            </clipPath>
            <filter id={shadow} x="-40%" y="-10%" width="180%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="1.8" floodColor="#000" floodOpacity="0.4" />
            </filter>
            {profiles.map((_, i) => {
              const { anchor, hang, angle } = restPose(i, count);
              return (
                <polygon
                  key={i}
                  id={`${shade}-${i}`}
                  ref={(el) => {
                    strapEls.current[i] = el;
                  }}
                  points={strapShape({ x: hang.x - anchor.x, y: hang.y - anchor.y }, angle)}
                />
              );
            })}
          </defs>
          <path d={ropeTails(intervals)} strokeWidth="2" strokeLinecap="round" className="fill-none stroke-(--rope)" />
          <path
            ref={ropeEl}
            strokeWidth="2"
            strokeLinecap="round"
            className="fill-none stroke-(--rope)"
            d={ropePath(Array.from({ length: intervals + 1 }, (_, j) => ({ x: knotX(j), y: ropeY(j, intervals) })))}
          />
          {profiles.map((_, i) => {
            const { anchor } = restPose(i, count);
            return (
              <g
                key={i}
                ref={(el) => {
                  hookEls.current[i] = el;
                }}
                transform={`translate(${anchor.x} ${anchor.y})`}
                filter={`url(#${shadow})`}
              >
                <use href={`#${shade}-${i}`} fill={`url(#${shade})`} />
                <use href={`#${shade}-${i}`} fill={`url(#${weave})`} stroke="#fff" strokeOpacity="0.1" strokeWidth={STRAP_EDGE} />
                <Tube d={HOOK_PATH} width={4.4} />
              </g>
            );
          })}
          {profiles.map((_, i) => {
            const { hang, angle } = restPose(i, count);
            return (
              <g
                key={i}
                ref={(el) => {
                  claspEls.current[i] = el;
                }}
                transform={`translate(${hang.x} ${hang.y}) rotate(${(angle * 180) / Math.PI})`}
                filter={`url(#${shadow})`}
              >
                <g clipPath={`url(#${hole})`}>
                  <circle cy="-13" r="4.8" fill="#000" opacity="0.45" />
                  <circle cy="-13" r="3.8" fill={`url(#${dome})`} />
                  <Tube d={RING_PATH} width={5} />
                  <Tube d={EYE_PATH} width={3.4} />
                  <rect x="-4.2" y="28.5" width="8.4" height="6" rx="2" fill={`url(#${metal})`} stroke="#363c4f" strokeWidth="0.6" />
                  <path d={CLASP_BODY} fillRule="evenodd" fill={`url(#${metal})`} stroke="#363c4f" strokeWidth="0.8" />
                  <path d="M-5 43V59" stroke="#fff" strokeOpacity="0.75" strokeWidth="1" strokeLinecap="round" />
                  <path d="M4.3 41V60" stroke="#2c3244" strokeOpacity="0.6" strokeWidth="0.8" strokeLinecap="round" />
                  </g>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}
