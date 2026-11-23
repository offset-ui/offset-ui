// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Offset UI. Keep this notice with any copy of this file.
"use client";

import { useEffect, useRef, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import type Matter from "matter-js";
import { cn } from "@/lib/utils";

export type HangingProfile = { name: string; role: string; image?: string; tag?: string; href?: string };

export type HangingProfileColors = { surface: string; rope: string };

type HangingProfileCardsProps = {
  cards?: HangingProfile[];
  colors?: Partial<HangingProfileColors>;
  swing?: number;
  className?: string;
  ariaLabel?: string;
};

type Point = { x: number; y: number };
type Verlet = Matter.Body & { positionPrev: Point };

const DEFAULT_CARDS: HangingProfile[] = [
  { name: "Maya Bennett", role: "Creative Director", tag: "People · Studio" },
  { name: "Leo Carter", role: "Motion Designer", tag: "People · Studio" },
  { name: "Noah Williams", role: "Product Designer", tag: "People · Studio" },
  { name: "Amina Yusuf", role: "Brand Designer", tag: "People · Studio" },
];
const DEFAULT_COLORS: HangingProfileColors = { surface: "#f4f4f3", rope: "#8d8d8d" };
const PORTRAITS = [
  { bg: "#e9c4ea", skin: "#e6a07e", hair: "#a23fd0", shirt: "#8f3fc2" },
  { bg: "#d8d2ea", skin: "#eea585", hair: "#2a211f", shirt: "#7d746d" },
  { bg: "#efc36b", skin: "#8a5538", hair: "#2a1d17", shirt: "#4f7694" },
  { bg: "#d8d0ec", skin: "#f0a98a", hair: "#241c1b", shirt: "#c98d8a" },
  { bg: "#bfe0cf", skin: "#d99877", hair: "#6b4a2f", shirt: "#3f6f5f" },
  { bg: "#f4cbb8", skin: "#c88460", hair: "#1f1a18", shirt: "#b25a4a" },
];

const MAX_CARDS = 6;
const CARD = { width: 210, height: 270 };
const PORTRAIT_HEIGHT = 130;
const SLOT = 250;
const KNOTS_PER_SLOT = 6;
const EDGE_KNOTS = 3;
const PAD = 40;
const SPACING = SLOT / KNOTS_PER_SLOT;
const ROPE_Y = 36;
const SAG = 24;
const HEIGHT = 470;
const PIN_DEPTH = 8;
const STRINGS = [80, 48, 28, 62, 38, 70];
const TILTS = [-4, 1.5, -1.5, 2.5, -2.5, 3];

const STEP = 1000 / 60;
const MAX_CATCH_UP = 50;
const WARM_UP_STEPS = 240;
const CALM_FRAMES = 20;
const REST_EPSILON = 0.02;
const DRAG_THRESHOLD = 5;
const GRAVITY = 3;
const SOLVER_ITERATIONS = 40;
const ROPE_PRETENSION = [0.9848, 0.9829, 0.9791, 0.9745, 0.9698, 0.9651];
const MAX_KNOT_STEP = 4;
const ROPE_MASS = 3;
const ROPE_AIR = 0.12;
const ROPE_DAMPING = 0.4;
const CARD_MASS = 1;
const STRING_STIFFNESS = 0.85;
const STRING_DAMPING = 0.15;
const DRAG_DAMPING = 0.12;
const REDUCED_MOTION_AIR = 0.2;
const CARD_CATEGORY = 2;
const WALL_CATEGORY = 4;

const clamp = (value: number, low = 0, high = 1) => Math.min(high, Math.max(low, value));
const cardAir = (swing: number) => 0.07 - 0.06 * clamp(swing);
const dragStiffness = (swing: number) => 0.05 - 0.02 * clamp(swing);

const geometry = (count: number) => {
  const intervals = count * KNOTS_PER_SLOT + 2 * EDGE_KNOTS;
  return { intervals, width: 2 * PAD + intervals * SPACING };
};
const ropeY = (knot: number, intervals: number) => ROPE_Y + SAG * 4 * (knot / intervals) * (1 - knot / intervals);

const restPose = (index: number, count: number) => {
  const { intervals } = geometry(count);
  const knot = EDGE_KNOTS + index * KNOTS_PER_SLOT + KNOTS_PER_SLOT / 2;
  const string = STRINGS[index % STRINGS.length];
  const angle = (TILTS[index % TILTS.length] * Math.PI) / 180;
  const arm = CARD.height / 2 - PIN_DEPTH;
  const pin = { x: -arm * Math.tan(angle), y: -arm };
  const anchor = { x: PAD + knot * SPACING, y: ropeY(knot, intervals) };
  const hang = { x: anchor.x, y: anchor.y + string };
  const [cos, sin] = [Math.cos(angle), Math.sin(angle)];
  const center = { x: hang.x - (pin.x * cos - pin.y * sin), y: hang.y - (pin.x * sin + pin.y * cos) };
  return { knot, string, angle, pin, anchor, hang, center };
};

const cardTransform = (center: Point, angle: number) => `translate3d(${center.x - CARD.width / 2}px, ${center.y - CARD.height / 2}px, 0) rotate(${angle}rad)`;

const ropePath = (points: Point[]) =>
  points.reduce((path, p1, i) => {
    if (i === points.length - 1) return path;
    const [p0, p2, p3] = [points[i - 1] ?? p1, points[i + 1], points[i + 2] ?? points[i + 1]];
    return `${path} C${p1.x + (p2.x - p0.x) / 6} ${p1.y + (p2.y - p0.y) / 6} ${p2.x - (p3.x - p1.x) / 6} ${p2.y - (p3.y - p1.y) / 6} ${p2.x} ${p2.y}`;
  }, `M${points[0].x} ${points[0].y}`);

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
    const knot = Bodies.circle(PAD + j * SPACING, ropeY(j, intervals), 3, { isStatic: j === 0 || j === intervals, frictionAir: ROPE_AIR, collisionFilter: { mask: 0 } });
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
      chamfer: { radius: 18 },
      frictionAir: air,
      friction: 0.05,
      restitution: 0.1,
      collisionFilter: { category: CARD_CATEGORY, mask: CARD_CATEGORY | WALL_CATEGORY },
    });
    Body.setMass(body, CARD_MASS);
    const string = Constraint.create({ bodyA: knots[pose.knot], bodyB: body, pointB: Vector.rotate(pose.pin, pose.angle), length: pose.string, stiffness: STRING_STIFFNESS, damping: STRING_DAMPING });
    return { body, string, pin: pose.pin, knot: knots[pose.knot] };
  });

  const wall = (x: number, y: number, w: number, h: number) => Bodies.rectangle(x, y, w, h, { isStatic: true, collisionFilter: { category: WALL_CATEGORY } });
  Composite.add(engine.world, [
    ...knots,
    ...links,
    ...cards.flatMap((card) => [card.body, card.string]),
    wall(-60, HEIGHT / 2, 120, HEIGHT * 3),
    wall(width + 60, HEIGHT / 2, 120, HEIGHT * 3),
    wall(width / 2, HEIGHT + 60, width * 3, 120),
  ]);

  const moving = [...knots.filter((knot) => !knot.isStatic), ...cards.map((card) => card.body)];
  const drags = new Map<number, { anchor: Matter.Body; pull: Matter.Constraint; card: number }>();
  let lastFrame: number[] = [];

  const loose = knots.filter((knot) => !knot.isStatic) as Verlet[];
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
    grab(index: number, point: Point, pointerId: number) {
      if ([...drags.values()].some((drag) => drag.card === index)) return;
      const anchor = Bodies.circle(point.x, point.y, 1, { isStatic: true, collisionFilter: { mask: 0 } });
      const pull = Constraint.create({ bodyA: anchor, bodyB: cards[index].body, pointB: Vector.sub(point, cards[index].body.position), length: 0, stiffness: dragStiffness(swing), damping: DRAG_DAMPING });
      Composite.add(engine.world, [anchor, pull]);
      drags.set(pointerId, { anchor, pull, card: index });
    },
    move(pointerId: number, point: Point) {
      const drag = drags.get(pointerId);
      if (drag) Body.setPosition(drag.anchor, point);
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

function Portrait({ index }: { index: number }) {
  const { bg, skin, hair, shirt } = PORTRAITS[index % PORTRAITS.length];
  return (
    <svg aria-hidden viewBox="0 0 100 80" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 size-full">
      <rect width="100" height="80" fill={bg} />
      <ellipse cx="50" cy="86" rx="38" ry="26" fill={shirt} />
      <rect x="44" y="52" width="12" height="14" rx="5" fill={skin} />
      <ellipse cx="50" cy="38" rx="17" ry="20" fill={skin} />
      <path d="M32 36c0-16 10-22 20-22 9 0 16 6 16 18-5-6-12-9-19-9-7 0-13 4-17 13z" fill={hair} />
    </svg>
  );
}

export function HangingProfileCards({ cards = DEFAULT_CARDS, colors = {}, swing = 0.5, className, ariaLabel = "Hanging profile cards" }: HangingProfileCardsProps) {
  const profiles = cards.slice(0, MAX_CARDS);
  const count = profiles.length;
  const { width, intervals } = geometry(count);
  const { surface, rope } = { ...DEFAULT_COLORS, ...colors };

  const root = useRef<HTMLElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const ropeEl = useRef<SVGPathElement>(null);
  const cardEls = useRef<(HTMLDivElement | null)[]>([]);
  const lineEls = useRef<(SVGLineElement | null)[]>([]);
  const dotEls = useRef<(SVGCircleElement | null)[]>([]);
  const hookEls = useRef<(SVGGElement | null)[]>([]);
  const world = useRef<ReturnType<typeof buildWorld> | null>(null);
  const wake = useRef(() => {});
  const dragStart = useRef<Point>({ x: 0, y: 0 });
  const dragged = useRef(false);

  useEffect(() => {
    const host = root.current!;
    const view = scene.current!;
    const fit = () => {
      const scale = Math.min(1, host.clientWidth / width);
      view.style.scale = String(scale);
      host.style.height = `${HEIGHT * scale}px`;
    };
    const observer = new ResizeObserver(fit);
    observer.observe(host);
    return () => observer.disconnect();
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

      const draw = () => {
        ropeEl.current?.setAttribute("d", ropePath(sim.knots.map((knot) => knot.position)));
        sim.cards.forEach(({ body, knot }, i) => {
          const pin = sim.pin(i);
          cardEls.current[i]!.style.transform = cardTransform(body.position, body.angle);
          lineEls.current[i]!.setAttribute("x1", String(knot.position.x));
          lineEls.current[i]!.setAttribute("y1", String(knot.position.y));
          lineEls.current[i]!.setAttribute("x2", String(pin.x));
          lineEls.current[i]!.setAttribute("y2", String(pin.y));
          dotEls.current[i]!.setAttribute("cx", String(knot.position.x));
          dotEls.current[i]!.setAttribute("cy", String(knot.position.y));
          hookEls.current[i]!.setAttribute("transform", `translate(${pin.x} ${pin.y}) rotate(${(body.angle * 180) / Math.PI})`);
        });
      };

      const frame = (now: number) => {
        accumulated = Math.min(accumulated + now - last, MAX_CATCH_UP);
        last = now;
        for (; accumulated >= STEP; accumulated -= STEP) sim.step();
        draw();
        calm = sim.busy() ? 0 : calm + 1;
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
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStart.current = { x: e.clientX, y: e.clientY };
    dragged.current = false;
    world.current.grab(index, toScene(e), e.pointerId);
    wake.current();
  };
  const move = (e: ReactPointerEvent) => {
    world.current?.move(e.pointerId, toScene(e));
    if (Math.hypot(e.clientX - dragStart.current.x, e.clientY - dragStart.current.y) > DRAG_THRESHOLD) dragged.current = true;
  };
  const release = (e: ReactPointerEvent) => {
    world.current?.release(e.pointerId);
    wake.current();
  };

  return (
    <section
      ref={root}
      aria-label={ariaLabel}
      className={cn("relative w-full touch-pan-y select-none", className)}
      style={{ height: HEIGHT, "--surface": surface, "--ink": readableOn(surface), "--rope": rope } as CSSProperties}
    >
      <div ref={scene} className="absolute left-1/2 top-0 origin-top" style={{ width, height: HEIGHT, translate: "-50% 0" }}>
        {profiles.map((profile, i) => {
          const pose = restPose(i, count);
          const Footer = profile.href ? "a" : "div";
          return (
            <div
              key={i}
              ref={(el) => {
                cardEls.current[i] = el;
              }}
              role="group"
              aria-label={`${profile.name}, ${profile.role}`}
              onPointerDown={(e) => grab(e, i)}
              onPointerMove={move}
              onPointerUp={release}
              onPointerCancel={release}
              onLostPointerCapture={release}
              onClickCapture={(e) => dragged.current && (e.preventDefault(), e.stopPropagation())}
              className="absolute left-0 top-0 flex cursor-grab touch-none flex-col rounded-[20px] border border-black/5 bg-(--surface) p-3.5 text-(--ink) transition-colors hover:border-black/15 active:cursor-grabbing"
              style={{ width: CARD.width, height: CARD.height, transform: cardTransform(pose.center, pose.angle) }}
            >
              <div className="flex justify-between font-mono text-[9px] uppercase tracking-[0.08em] opacity-60">
                <span>{profile.tag}</span>
                <span>#{String(i + 1).padStart(2, "0")}</span>
              </div>
              <div className="relative mt-2 shrink-0 overflow-hidden rounded-[14px]" style={{ height: PORTRAIT_HEIGHT }}>
                <Portrait index={i} />
                {profile.image && <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${profile.image})` }} />}
              </div>
              <p className="mt-3 truncate text-xl font-medium leading-6 tracking-[-0.03em]">{profile.name}</p>
              <p className="truncate text-[13px] opacity-60">{profile.role}</p>
              <Footer href={profile.href} className="mt-auto flex items-center justify-between border-t border-current/10 pt-2.5">
                <span className="font-mono text-[9px] uppercase tracking-[0.08em] opacity-60">View profile</span>
                <span className="flex size-6 items-center justify-center rounded-full bg-(--ink) text-(--surface)">
                  <svg aria-hidden width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 8 8 2M3.5 2H8v4.5" />
                  </svg>
                </span>
              </Footer>
            </div>
          );
        })}
        <svg aria-hidden viewBox={`0 0 ${width} ${HEIGHT}`} className="pointer-events-none absolute inset-0 size-full overflow-visible fill-none stroke-(--rope)">
          <path
            ref={ropeEl}
            strokeWidth="1.5"
            d={ropePath(Array.from({ length: intervals + 1 }, (_, j) => ({ x: PAD + j * SPACING, y: ropeY(j, intervals) })))}
          />
          {profiles.map((_, i) => {
            const { anchor, hang, angle } = restPose(i, count);
            return (
              <g key={i}>
                <line
                  ref={(el) => {
                    lineEls.current[i] = el;
                  }}
                  x1={anchor.x}
                  y1={anchor.y}
                  x2={hang.x}
                  y2={hang.y}
                  strokeWidth="1.25"
                />
                <circle
                  ref={(el) => {
                    dotEls.current[i] = el;
                  }}
                  cx={anchor.x}
                  cy={anchor.y}
                  r="2.5"
                  className="fill-(--rope) stroke-none"
                />
                <g
                  ref={(el) => {
                    hookEls.current[i] = el;
                  }}
                  transform={`translate(${hang.x} ${hang.y}) rotate(${(angle * 180) / Math.PI})`}
                >
                  <rect x="-6" y="-1" width="12" height="11" rx="3.5" className="fill-(--rope) stroke-none" />
                  <circle cy="-4" r="3" strokeWidth="1.5" />
                </g>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}
