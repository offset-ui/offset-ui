"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, animate, motion, useReducedMotion, type Transition } from "motion/react";
import { cn } from "@/lib/utils";

export type ImposterCaptchaColors = {
  surface: string;
  accent: string;
};

export type ImposterCaptchaText = {
  title: string;
  subtitle: string;
  retry: string;
  verified: string;
};

export type ImposterCaptchaProps = {
  target?: number;
  duration?: number;
  difficulty?: "easy" | "normal" | "hard";
  scale?: number;
  colors?: Partial<ImposterCaptchaColors>;
  text?: Partial<ImposterCaptchaText>;
  assetPath?: string;
  onSuccess?: () => void;
  onFail?: (missed: number) => void;
  onRetry?: () => void;
  className?: string;
};

const COLORS: ImposterCaptchaColors = { surface: "#cf3125", accent: "#ffffff" };

const PACE = {
  easy: { hold: [650, 1300], gap: 400, start: 700, hit: 350 },
  normal: { hold: [420, 1000], gap: 280, start: 600, hit: 300 },
  hard: { hold: [300, 700], gap: 200, start: 500, hit: 220 },
} as const;

const POP = { type: "spring", stiffness: 380, damping: 26, mass: 0.8 } as const;
const DUCK = { type: "spring", stiffness: 700, damping: 34, mass: 0.7 } as const;
const REVEAL = { type: "spring", stiffness: 260, damping: 20, mass: 0.9 } as const;
const UI = { type: "spring", stiffness: 260, damping: 26, mass: 0.9 } as const;
const INSTANT = { duration: 0 };
const COLLAPSE = { stagger: 0.035, duration: 0.28, delay: 0.08, reveal: 0.42 };

const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
const word = (n: number) => WORDS[n] ?? String(n);
const plural = (n: number) => `${word(n)} imposter${n === 1 ? "" : "s"}`;
const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const CARD_W = 582;
const KEY_W = 126.564;
const KEY_H = 132;
const KEYCAP_H = 82.79;
const LIFT = 49;
const COL_PITCH = 191.718;
const ROW_PITCH = 144;
const PILL_W = 165.903;
const FULL_W = 510;
const SLOT_Y = 64;
const KEYS = Array.from({ length: 9 }, (_, i) => i);
const LABELS = [null, "E", "R", "I", "F", "Y", "Y", "O", "U"];
const KEYCAPS = ["a", "b", "b", "a", "a", "b", "a", "b", "b"];

const squircle = { cornerShape: "squircle" } as CSSProperties;
const SHADOW = "0px 2px 3px rgba(0,0,0,0.07), 0px 6px 7px rgba(0,0,0,0.1)";
const NO_SHADOW = "0px 0px 0px rgba(0,0,0,0), 0px 0px 0px rgba(0,0,0,0)";
const RING = "focus-visible:ring-2 focus-visible:ring-(--ring) focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";

type Phase = "playing" | "failed" | "verified";

function readable(bg: string) {
  const m = /^#([0-9a-f]{6})$/i.exec(bg.trim());
  if (!m) return "#000000";
  const n = parseInt(m[1], 16);
  return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255 > 0.6 ? "#000000" : "#ffffff";
}

function useMotionPrefs() {
  const reduce = useReducedMotion() ?? false;
  return { reduce, t: (transition: Transition): Transition => (reduce ? INSTANT : transition) };
}

function Art({ src, w, h, x, y, className, style }: { src: string; w: number; h: number; x?: number; y?: number; className?: string; style?: CSSProperties }) {
  return (
    <img
      src={src}
      alt=""
      width={w}
      height={h}
      draggable={false}
      className={cn("pointer-events-none max-w-none select-none", x !== undefined && "absolute", className)}
      style={{ left: x, top: y, width: w, height: h, ...style }}
    />
  );
}

const FINGERS = [
  { x: 8.58, y: 66.41, w: 6.1, h: 10.749, ih: 10.477 },
  { x: 16.45, y: 65.58, w: 6.199, h: 12.683, ih: 12.414 },
  { x: 23.91, y: 68.48, w: 6.034, h: 9.469, ih: 9.196 },
  { x: 1.54, y: 68.07, w: 5.911, h: 7.058, ih: 6.781 },
];

function Imposter({ assetPath }: { assetPath: string }) {
  return (
    <div aria-hidden className="pointer-events-none absolute overflow-hidden" style={{ left: 6.66, top: 53.1, width: 113.228, height: 78.901 }}>
      <Art src={`${assetPath}/imposter-body.svg`} w={113.228} h={74.29} x={0} y={0} />
      {FINGERS.map((f) => (
        <div key={f.x} className="absolute flex items-center justify-center" style={{ left: f.x, top: f.y, width: f.w, height: f.h }}>
          <div style={{ width: 5.57, height: f.ih, background: "#f5bc91", borderRadius: 4.97, transform: "rotate(2.94deg)" }} />
        </div>
      ))}
      <div className="absolute overflow-hidden" style={{ left: 24.59, top: 0.51, width: 81.975, height: 73.778 }}>
        <Art src={`${assetPath}/imposter-face.svg`} w={81.974} h={89.778} x={0} y={0} />
      </div>
    </div>
  );
}

const STARS = [
  { src: "star-1", x: 46, y: 58, w: 22.825, h: 21.708 },
  { src: "star-2", x: 139, y: 27, w: 30.434, h: 28.944 },
  { src: "star-3", x: 248, y: 61, w: 20.923, h: 19.899 },
];
const FRAGMENTS = [
  { x: 83, y: 95, w: 9 },
  { x: 236, y: 115, w: 11 },
  { x: 115, y: 73, w: 6 },
];

function CaughtCharacter({ assetPath }: { assetPath: string }) {
  const { reduce, t } = useMotionPrefs();
  const delay = reduce ? 0 : COLLAPSE.reveal;
  const pop = (extra: number) => t({ type: "spring", stiffness: 380, damping: 20, mass: 0.7, delay: delay + extra });
  return (
    <motion.div
      className="absolute"
      style={{ left: 131, top: 225, width: 320, height: 320 }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0, transition: t({ duration: 0.2 }) }}
      transition={t({ ...REVEAL, delay, opacity: { duration: 0.12, delay } })}
    >
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={t({ duration: 0.3, delay: delay + 0.1 })}>
        <Art src={`${assetPath}/orbit.png`} w={227} h={47} x={45} y={57} />
      </motion.div>
      <Art src={`${assetPath}/caught.svg`} w={184.44} h={202.001} x={68} y={103} />
      {STARS.map((s, i) => (
        <motion.div
          key={s.src}
          className="absolute"
          style={{ left: s.x, top: s.y, width: s.w, height: s.h }}
          initial={{ scale: 0, rotate: -40 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={pop(0.12 + i * 0.07)}
        >
          <Art src={`${assetPath}/${s.src}.svg`} w={s.w} h={s.h} />
        </motion.div>
      ))}
      {FRAGMENTS.map((f, i) => (
        <motion.span
          key={f.x}
          aria-hidden
          className="absolute bg-white"
          style={{ left: f.x, top: f.y, width: f.w, height: 3, borderRadius: 1 }}
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={t({ duration: 0.25, delay: delay + 0.25 + i * 0.05 })}
        />
      ))}
    </motion.div>
  );
}

type KeyProps = {
  index: number;
  assetPath: string;
  raised: boolean;
  carriesImposter: boolean;
  collapsed: boolean;
  collapseDelay: number;
  onPress: (index: number, el: HTMLElement) => void;
};

function Key({ index, assetPath, raised, carriesImposter, collapsed, collapseDelay, onPress }: KeyProps) {
  const { t } = useMotionPrefs();
  const col = index % 3;
  const row = Math.floor(index / 3);
  const label = LABELS[index];
  return (
    <motion.div
      className="absolute"
      style={{ left: col * COL_PITCH, top: row * ROW_PITCH, width: KEY_W, height: KEY_H, pointerEvents: collapsed ? "none" : undefined }}
      initial={false}
      animate={collapsed ? { x: -(col - 1) * COL_PITCH, y: -(row - 1) * ROW_PITCH, scale: 0.15, opacity: 0 } : { x: 0, y: 0, scale: 1, opacity: 1 }}
      transition={t(collapsed ? { duration: COLLAPSE.duration, delay: collapseDelay, ease: [0.55, 0, 0.9, 0.45] } : { type: "spring", stiffness: 260, damping: 24 })}
    >
      {carriesImposter && <Imposter assetPath={assetPath} />}
      <motion.button
        type="button"
        aria-label={`Key ${label ?? index + 1}${raised ? ", imposter here" : ""}`}
        className={cn("absolute cursor-pointer rounded-[13px] outline-none", RING)}
        style={{ left: 0, top: 49, width: KEY_W, height: KEYCAP_H, transformOrigin: "50% 100%", ...squircle }}
        initial={false}
        animate={{ y: raised ? -LIFT : 0 }}
        transition={t(raised ? POP : DUCK)}
        onPointerDown={(e) => onPress(index, e.currentTarget)}
        onClick={(e) => {
          if (e.detail === 0) onPress(index, e.currentTarget);
        }}
      >
        <Art src={`${assetPath}/keycap-${KEYCAPS[index]}.svg`} w={146.564} h={102.791} x={-9} y={-1} />
        <span className="absolute flex items-center justify-center text-center font-bold" style={{ left: 52, top: 26, width: 21, height: 16, fontSize: 21, color: "rgba(0,0,0,0.46)", lineHeight: "normal" }}>
          {label ?? <Art src={`${assetPath}/key-chevron.svg`} w={24.0003} h={20.2351} className="-mt-[1.5px]" />}
        </span>
      </motion.button>
    </motion.div>
  );
}

export function ImposterCaptcha({
  target = 5,
  duration = 10,
  difficulty = "normal",
  scale = 1,
  colors,
  text,
  assetPath = "/imposter-captcha",
  onSuccess,
  onFail,
  onRetry,
  className,
}: ImposterCaptchaProps) {
  const { reduce, t } = useMotionPrefs();
  const timed = duration > 0;
  const pace = PACE[difficulty];
  const { surface, accent } = { ...COLORS, ...colors };
  const ink = readable(surface);
  const onLight = ink === "#000000";
  const veil = onLight ? "0,0,0" : "255,255,255";
  const accentInk = readable(accent);
  const copy = {
    title: `Whack ${target} Imposters`,
    subtitle: `${capital(word(target))} people are hiding below. Catch them before the time runs out.`,
    retry: "Retry",
    verified: "Verified",
    ...text,
  };

  const [phase, setPhase] = useState<Phase>("playing");
  const [caught, setCaught] = useState(0);
  const [active, setActive] = useState<number | null>(null);
  const [stage, setStage] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(duration);
  const [round, setRound] = useState(0);
  const [hitIndex, setHitIndex] = useState(0);
  const [available, setAvailable] = useState(Infinity);

  const caughtRef = useRef(0);
  const lastPop = useRef(-1);
  const resume = useRef<(() => void) | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const failRef = useRef(onFail);
  useEffect(() => {
    failRef.current = onFail;
  });

  useEffect(() => {
    if (phase !== "playing") return;
    const startedAt = performance.now();
    const [holdMin, holdMax] = pace.hold;
    let hold: ReturnType<typeof setTimeout>;
    let rest: ReturnType<typeof setTimeout>;
    const pop = () => {
      const pool = KEYS.filter((k) => k !== lastPop.current);
      const next = pool[Math.floor(Math.random() * pool.length)];
      lastPop.current = next;
      setStage(next);
      setActive(next);
      hold = setTimeout(() => {
        setActive(null);
        rest = setTimeout(pop, pace.gap);
      }, holdMin + Math.random() * (holdMax - holdMin));
    };
    rest = setTimeout(pop, pace.start);
    const tick =
      timed &&
      setInterval(() => {
        const left = duration - (performance.now() - startedAt) / 1000;
        setRemaining(Math.max(0, Math.ceil(left)));
        if (left <= 0) {
          setActive(null);
          setPhase("failed");
          failRef.current?.(target - caughtRef.current);
        }
      }, 100);
    resume.current = () => {
      clearTimeout(hold);
      clearTimeout(rest);
      rest = setTimeout(pop, pace.hit);
    };
    return () => {
      if (tick) clearInterval(tick);
      clearTimeout(hold);
      clearTimeout(rest);
      resume.current = null;
    };
  }, [phase, round, timed, duration, pace, target]);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setAvailable(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function press(index: number, el: HTMLElement) {
    if (phase !== "playing") return;
    if (!reduce) animate(el, { scaleY: [1, 0.86, 1], scaleX: [1, 1.03, 1] }, { duration: 0.26, ease: "easeOut" });
    if (index !== active) return;
    const next = caughtRef.current + 1;
    caughtRef.current = next;
    setCaught(next);
    setActive(null);
    if (next < target) return resume.current?.();
    setHitIndex(index);
    setPhase("verified");
    onSuccess?.();
  }

  function restart() {
    caughtRef.current = 0;
    lastPop.current = -1;
    setCaught(0);
    setActive(null);
    setStage(null);
    setRemaining(duration);
    setPhase("playing");
    setRound((r) => r + 1);
  }

  const dist = (k: number) => Math.hypot((k % 3) - (hitIndex % 3), Math.floor(k / 3) - Math.floor(hitIndex / 3));
  const order = [...KEYS].sort((a, b) => dist(a) - dist(b));
  const verified = phase === "verified";
  const failed = phase === "failed";
  const missed = target - caught;
  const fit = Math.min(scale, available / CARD_W);
  const ui = t(UI);
  const mmss = `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`;
  const counter = `/${target} Imposters`;

  return (
    <div ref={root} className={cn("flex w-full justify-center", className)}>
      <div style={{ zoom: fit }}>
        <motion.div
          role="group"
          aria-label={copy.title}
          className="relative overflow-hidden"
          style={{ width: CARD_W, background: surface, color: ink, borderRadius: 32, "--ring": ink, ...squircle } as CSSProperties}
          initial={false}
          animate={{ height: failed ? 781 : 750 }}
          transition={ui}
        >
          <div className="absolute" style={{ left: 24, top: 24, width: 534 }}>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={failed ? "failed" : "default"}
                className="p-3"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={t({ duration: 0.25 })}
              >
                <h2 style={{ fontSize: 22, fontWeight: 600, lineHeight: 1.1 }}>{failed ? "Challenge failed" : copy.title}</h2>
                <p className="mt-2" style={{ fontSize: 14, lineHeight: 1.45, width: 405 }}>
                  {failed ? `You missed ${plural(missed)}. Try again to verify.` : copy.subtitle}
                </p>
              </motion.div>
            </AnimatePresence>
            <button
              type="button"
              aria-label="Restart"
              onClick={restart}
              className={cn("absolute flex cursor-pointer items-center justify-center rounded-full outline-none", RING)}
              style={{ left: 490, top: 3.1, width: 40, height: 40 }}
            >
              <Art src={`${assetPath}/restart-${onLight ? "black" : "white"}.svg`} w={24} h={24} />
            </button>
          </div>

          <motion.div
            className="absolute"
            style={{ left: 36, width: FULL_W, height: 3 * KEY_H + 24 }}
            initial={false}
            animate={{ top: (failed ? 130 : 151) + 24 }}
            transition={ui}
          >
            {KEYS.map((i) => (
              <Key
                key={i}
                index={i}
                assetPath={assetPath}
                raised={active === i}
                carriesImposter={stage === i}
                collapsed={verified}
                collapseDelay={COLLAPSE.delay + order.indexOf(i) * COLLAPSE.stagger}
                onPress={press}
              />
            ))}
          </motion.div>

          <AnimatePresence>{verified && <CaughtCharacter key="caught" assetPath={assetPath} />}</AnimatePresence>

          <div className="absolute" style={{ left: 24, bottom: 24, width: 534, height: 127 }}>
            <AnimatePresence>
              {failed && (
                <motion.div
                  key="error"
                  role="alert"
                  className="absolute flex items-center border border-solid"
                  style={{ left: 12, top: 12, width: FULL_W, height: 40, gap: 10, padding: "10px 12px", background: `rgba(${veil},0.08)`, borderColor: `rgba(${veil},0.2)`, borderRadius: 13.16, ...squircle }}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12, transition: t({ duration: 0.2, delay: 0.06 }) }}
                  transition={t({ ...UI, delay: 0.12 })}
                >
                  <Art src={`${assetPath}/alert.svg`} w={18} h={18} style={{ filter: onLight ? "invert(1)" : undefined }} />
                  <p style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.4 }}>
                    {capital(plural(missed))} {missed === 1 ? "was" : "were"} left behind.
                  </p>
                </motion.div>
              )}
              {failed && (
                <motion.button
                  key="retry"
                  type="button"
                  onClick={() => {
                    restart();
                    onRetry?.();
                  }}
                  className={cn("absolute flex cursor-pointer items-center justify-center outline-none", RING)}
                  style={{ left: 12, top: SLOT_Y, width: FULL_W, height: 51, gap: 3.29, padding: "16.452px 19.742px 16.452px 13.161px", background: accent, color: accentInk, borderRadius: 13.161, boxShadow: SHADOW, fontSize: 19.742, fontWeight: 500, ...squircle }}
                  initial={{ opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20, transition: t({ duration: 0.18 }) }}
                  transition={t({ ...UI, delay: 0.28 })}
                >
                  {copy.retry}
                  <Art src={`${assetPath}/restart-${accentInk === "#000000" ? "black" : "white"}.svg`} w={24} h={24} />
                </motion.button>
              )}
            </AnimatePresence>

            <motion.div
              className="absolute flex items-center"
              style={{ left: 12, top: SLOT_Y, height: 51, gap: 10 }}
              initial={false}
              animate={{ opacity: phase === "playing" && timed ? 1 : 0 }}
              transition={t({ duration: 0.2 })}
            >
              <span className="relative" style={{ width: 14, height: 16, filter: onLight ? "invert(1)" : undefined }}>
                <Art src={`${assetPath}/stopwatch.svg`} w={15.8} h={17.8} x={-0.9} y={-0.9} />
              </span>
              <span role="timer" aria-label={`${remaining} seconds left`} style={{ fontSize: 16, fontWeight: 500, lineHeight: 1.5 }}>
                {mmss}
              </span>
            </motion.div>

            <motion.div
              className="absolute flex items-center justify-center overflow-hidden"
              style={{ right: 12, top: SLOT_Y, height: 51, background: accent, color: accentInk, borderRadius: 13.161, fontSize: 19.742, fontWeight: 500, ...squircle }}
              initial={false}
              animate={{ width: verified ? FULL_W : PILL_W, opacity: failed ? 0 : 1, boxShadow: verified ? SHADOW : NO_SHADOW }}
              transition={t({ ...UI, delay: verified ? 0.25 : 0, opacity: { duration: 0.2 } })}
            >
              <AnimatePresence mode="popLayout" initial={false}>
                {verified ? (
                  <motion.span
                    key="verified"
                    role="status"
                    className="flex items-center whitespace-nowrap"
                    style={{ gap: 3.29 }}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={t({ type: "spring", stiffness: 400, damping: 20, mass: 0.7, delay: 0.5 })}
                  >
                    {copy.verified}
                    <Art src={`${assetPath}/verified.svg`} w={24} h={24} />
                  </motion.span>
                ) : (
                  <motion.span key="count" className="flex whitespace-nowrap" exit={{ opacity: 0, transition: t({ duration: 0.15 }) }}>
                    <span aria-hidden className="relative inline-flex overflow-hidden">
                      <AnimatePresence mode="popLayout" initial={false}>
                        <motion.span
                          key={caught}
                          initial={{ y: "100%", opacity: 0 }}
                          animate={{ y: "0%", opacity: 1 }}
                          exit={{ y: "-100%", opacity: 0 }}
                          transition={t({ type: "spring", stiffness: 420, damping: 30, mass: 0.7 })}
                        >
                          {caught}
                        </motion.span>
                      </AnimatePresence>
                    </span>
                    <span aria-hidden>{counter}</span>
                    <span role="status" className="sr-only">
                      {caught}
                      {counter}
                    </span>
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
