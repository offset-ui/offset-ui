"use client";

/**
 * ImposterCaptcha — a "whack the imposter" verification game on a 3x3 keyboard.
 * Imposters pop up from behind random keys; catch `target` of them before the countdown ends.
 * Miss: the imposter retreats, an error and a Retry button slide in. Win: the keys collapse into the centre,
 * the caught imposter springs out, and the pill widens into "Verified".
 *
 * Artwork lives in /public/imposter-captcha and is configurable via `assetPath`.
 * Dependencies: motion/react, next/font/google (Inter), clsx + tailwind-merge (via @/lib/utils).
 */

import {
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type Ref,
} from "react";
import { Inter } from "next/font/google";
import { AnimatePresence, animate, motion, useReducedMotion, type Transition } from "motion/react";
import { cn } from "@/lib/utils";

export type ImposterCaptchaColors = {
  surface: string;
  text: string;
  pill: string;
  pillText: string;
  keyLabel: string;
  /** Imposter's skin tone (fingers). */
  skin: string;
  errorSurface: string;
  errorBorder: string;
};

export type ImposterCaptchaSpring = { stiffness: number; damping: number; mass: number };

export type ImposterCaptchaSprings = {
  /** Imposter popping up (key lifts). */
  pop: ImposterCaptchaSpring;
  /** Imposter ducking (key drops). */
  duck: ImposterCaptchaSpring;
  /** Caught character scaling up. */
  reveal: ImposterCaptchaSpring;
  /** Error message, Retry button and the pill. */
  ui: ImposterCaptchaSpring;
};

export type ImposterCaptchaTiming = {
  /** Seconds between each key starting to collapse (Figma brief: ~0.03-0.04). */
  collapseStagger: number;
  /** Seconds one key takes to collapse. */
  collapseDuration: number;
  /** Seconds after the winning click before the first key collapses. */
  collapseDelay: number;
  /** Seconds after the winning click before the character appears. */
  revealDelay: number;
};

export type ImposterCaptchaText = {
  title: string;
  subtitle: string;
  failedTitle: string;
  failedSubtitle: (missed: number) => string;
  error: (missed: number) => string;
  /** Fixed text after the animated number, e.g. "/5 Imposters". */
  counterSuffix: (target: number) => string;
  retry: string;
  verified: string;
  restart: string;
  /** Appended to the label of the key an imposter is hiding behind (screen readers). */
  imposterHint: string;
};

/** Font sizes in design px (before `scale`); raise them when you shrink the card so the copy stays readable. */
export type ImposterCaptchaTypography = {
  title: number;
  subtitle: number;
  timer: number;
  error: number;
};

export type ImposterCaptchaHandle = {
  /** Start a fresh round. */
  restart: () => void;
};

export type ImposterCaptchaProps = {
  /** Imposters to catch. */
  target?: number;
  /** Countdown in seconds. Pass 0 for an untimed round (no timer, no failure). */
  duration?: number;
  /** Milliseconds an imposter stays up before ducking; a [min, max] range makes some linger and some duck right away. */
  popHold?: number | [number, number];
  /** Milliseconds between an imposter ducking and the next one popping. */
  popGap?: number;
  /** Milliseconds before the first imposter appears. */
  startDelay?: number;
  /** Milliseconds between catching an imposter and the next one popping. */
  hitDelay?: number;
  /** Corner radius of the card in design px. */
  radius?: number;
  /** Nine key labels in reading order (text or any node). */
  keys?: ReactNode[];
  /** Folder (public URL) containing the artwork. */
  assetPath?: string;
  /** Shrink to fit the available width instead of overflowing. */
  fit?: boolean;
  /** Overall size multiplier; 1 = the 582px Figma card. */
  scale?: number;
  colors?: Partial<ImposterCaptchaColors>;
  spring?: { [K in keyof ImposterCaptchaSprings]?: Partial<ImposterCaptchaSpring> };
  timing?: Partial<ImposterCaptchaTiming>;
  text?: Partial<ImposterCaptchaText>;
  fontFamily?: string;
  typography?: Partial<ImposterCaptchaTypography>;
  onCaught?: (caught: number) => void;
  onSuccess?: () => void;
  onFail?: (missed: number) => void;
  onRetry?: () => void;
  ref?: Ref<ImposterCaptchaHandle>;
  className?: string;
};

const COLORS: ImposterCaptchaColors = {
  // Deeper than the Figma red (#e63f32) so white text reaches WCAG AA (4.5:1), also over the translucent error box.
  surface: "#cf3125",
  text: "#ffffff",
  pill: "#ffffff",
  pillText: "#000000",
  keyLabel: "rgba(0,0,0,0.46)",
  skin: "#f5bc91",
  errorSurface: "rgba(255,255,255,0.08)",
  errorBorder: "rgba(255,255,255,0.2)",
};

const SPRINGS: ImposterCaptchaSprings = {
  pop: { stiffness: 380, damping: 26, mass: 0.8 },
  duck: { stiffness: 700, damping: 34, mass: 0.7 },
  reveal: { stiffness: 260, damping: 20, mass: 0.9 },
  ui: { stiffness: 260, damping: 26, mass: 0.9 },
};

const TIMING: ImposterCaptchaTiming = { collapseStagger: 0.035, collapseDuration: 0.28, collapseDelay: 0.08, revealDelay: 0.42 };

const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
const word = (n: number) => WORDS[n] ?? String(n);
const plural = (n: number) => `${word(n)} imposter${n === 1 ? "" : "s"}`;
const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const TEXT = {
  failedTitle: "Challenge failed",
  failedSubtitle: (missed: number) => `You missed ${plural(missed)}. Try again to verify.`,
  error: (missed: number) => `${capital(plural(missed))} ${missed === 1 ? "was" : "were"} left behind.`,
  counterSuffix: (target: number) => `/${target} Imposters`,
  retry: "Retry",
  verified: "Verified",
  restart: "Restart",
  imposterHint: "imposter here",
};

const TYPOGRAPHY: ImposterCaptchaTypography = { title: 22, subtitle: 14, timer: 16, error: 14 };

const inter = Inter({ subsets: ["latin"] });

// Figma geometry (design px).
const CARD_W = 582;
const CARD_H = 750;
const CARD_H_FAILED = 781;
const KEY_W = 126.564;
const KEY_H = 132;
const KEYCAP_H = 82.79;
const LIFT = 49;
const COL_PITCH = 191.718;
const ROW_PITCH = 144;
const GRID_Y = 151;
const GRID_Y_FAILED = 130;
const PILL_W = 165.903;
const PILL_FULL_W = 510;
const SLOT_Y = 64; // the Retry button and the pill share this slot inside the 127px controls block.
const KEYS = 9;
// Figma alternates two keycap drawings (slightly different slant) across the grid.
const KEYCAPS = ["keycap-a", "keycap-b", "keycap-b", "keycap-a", "keycap-a", "keycap-b", "keycap-a", "keycap-b", "keycap-b"];

const squircle = { cornerShape: "squircle" } as CSSProperties;
const PILL_SHADOW = "0px 2px 3px rgba(0,0,0,0.07), 0px 6px 7px rgba(0,0,0,0.1)";
const NO_SHADOW = "0px 0px 0px rgba(0,0,0,0), 0px 0px 0px rgba(0,0,0,0)";

type Phase = "playing" | "failed" | "verified";

const asSpring = (s: ImposterCaptchaSpring): Transition => ({ type: "spring", ...s });

function Art({ src, w, h, x, y, className, style }: { src: string; w: number; h: number; x?: number; y?: number; className?: string; style?: CSSProperties }) {
  return <img src={src} alt="" width={w} height={h} draggable={false} className={cn("pointer-events-none max-w-none select-none", x !== undefined && "absolute", className)} style={{ left: x, top: y, width: w, height: h, ...style }} />;
}

const FINGERS = [
  { x: 8.58, y: 66.41, w: 6.1, h: 10.749, iw: 5.57, ih: 10.477 },
  { x: 16.45, y: 65.58, w: 6.199, h: 12.683, iw: 5.57, ih: 12.414 },
  { x: 23.91, y: 68.48, w: 6.034, h: 9.469, iw: 5.57, ih: 9.196 },
  { x: 1.54, y: 68.07, w: 5.911, h: 7.058, iw: 5.57, ih: 6.781 },
];

/** The imposter peeking from behind a key: body, fingers gripping the key and the face. */
function Imposter({ assetPath, skin }: { assetPath: string; skin: string }) {
  return (
    <div aria-hidden className="pointer-events-none absolute overflow-hidden" style={{ left: 6.66, top: 53.1, width: 113.228, height: 78.901 }}>
      <Art src={`${assetPath}/imposter-body.svg`} w={113.228} h={74.29} x={0} y={0} />
      {FINGERS.map((f) => (
        <div key={f.x} className="absolute flex items-center justify-center" style={{ left: f.x, top: f.y, width: f.w, height: f.h }}>
          <div style={{ width: f.iw, height: f.ih, background: skin, borderRadius: 4.97, transform: "rotate(2.94deg)" }} />
        </div>
      ))}
      <div className="absolute overflow-hidden" style={{ left: 24.59, top: 0.51, width: 81.975, height: 73.778 }}>
        <Art src={`${assetPath}/imposter-face.svg`} w={81.974} h={89.778} x={0} y={0} />
      </div>
    </div>
  );
}

const STARS = [
  { src: "star-1.svg", x: 46, y: 58, w: 22.825, h: 21.708 },
  { src: "star-2.svg", x: 139, y: 27, w: 30.434, h: 28.944 },
  { src: "star-3.svg", x: 248, y: 61, w: 20.923, h: 19.899 },
];
const FRAGMENTS = [
  { x: 83, y: 95, w: 9 },
  { x: 236, y: 115, w: 11 },
  { x: 115, y: 73, w: 6 },
];

/** The caught imposter with its orbiting stars and glitch fragments. */
function CaughtCharacter({ assetPath, spring, delay, reduce }: { assetPath: string; spring: ImposterCaptchaSpring; delay: number; reduce: boolean }) {
  const pop = (extra: number): Transition => (reduce ? { duration: 0 } : { ...asSpring({ stiffness: 380, damping: 20, mass: 0.7 }), delay: delay + extra });
  return (
    <motion.div
      className="absolute"
      style={{ left: 131, top: 225, width: 320, height: 320 }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0, transition: { duration: reduce ? 0 : 0.2 } }}
      transition={reduce ? { duration: 0 } : { ...asSpring(spring), delay, opacity: { duration: 0.12, delay } }}
    >
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reduce ? 0 : 0.3, delay: delay + 0.1 }}>
        <Art src={`${assetPath}/orbit.png`} w={227} h={47} x={45} y={57} />
      </motion.div>
      <Art src={`${assetPath}/caught.svg`} w={184.44} h={202.001} x={68} y={103} />
      {STARS.map((s, i) => (
        <motion.div key={s.src} className="absolute" style={{ left: s.x, top: s.y, width: s.w, height: s.h }} initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} transition={pop(0.12 + i * 0.07)}>
          <Art src={`${assetPath}/${s.src}`} w={s.w} h={s.h} />
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
          transition={{ duration: reduce ? 0 : 0.25, delay: delay + 0.25 + i * 0.05 }}
        />
      ))}
    </motion.div>
  );
}

type KeyProps = {
  index: number;
  label: ReactNode;
  assetPath: string;
  colors: ImposterCaptchaColors;
  springs: ImposterCaptchaSprings;
  raised: boolean;
  hint: string;
  carriesImposter: boolean;
  phase: Phase;
  collapseDelay: number;
  collapseDuration: number;
  reduce: boolean;
  onPress: (index: number, el: HTMLElement) => void;
};

function Key({ index, label, assetPath, colors, springs, raised, hint, carriesImposter, phase, collapseDelay, collapseDuration, reduce, onPress }: KeyProps) {
  const col = index % 3;
  const row = Math.floor(index / 3);
  const collapsed = phase === "verified";
  const spring = raised ? asSpring(springs.pop) : asSpring(springs.duck);
  const keycap = KEYCAPS[index];
  return (
    <motion.div
      className="absolute"
      style={{ left: col * COL_PITCH, top: row * ROW_PITCH, width: KEY_W, height: KEY_H, pointerEvents: collapsed ? "none" : undefined }}
      initial={false}
      animate={collapsed ? { x: -(col - 1) * COL_PITCH, y: -(row - 1) * ROW_PITCH, scale: 0.15, opacity: 0 } : { x: 0, y: 0, scale: 1, opacity: 1 }}
      transition={
        reduce
          ? { duration: 0 }
          : collapsed
            ? { duration: collapseDuration, delay: collapseDelay, ease: [0.55, 0, 0.9, 0.45] }
            : { type: "spring", stiffness: 260, damping: 24 }
      }
    >
      {carriesImposter && <Imposter assetPath={assetPath} skin={colors.skin} />}
      <motion.button
        type="button"
        aria-label={`${typeof label === "string" ? `Key ${label}` : `Key ${index + 1}`}${raised ? `, ${hint}` : ""}`}
        className="absolute cursor-pointer rounded-[13px] outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
        style={{ left: 0, top: 49, width: KEY_W, height: KEYCAP_H, transformOrigin: "50% 100%", ...squircle }}
        initial={false}
        animate={{ y: raised ? -LIFT : 0 }}
        transition={reduce ? { duration: 0 } : spring}
        onPointerDown={(e) => onPress(index, e.currentTarget)}
        onClick={(e) => {
          if (e.detail === 0) onPress(index, e.currentTarget);
        }}
      >
        <Art src={`${assetPath}/${keycap}.svg`} w={146.564} h={102.791} x={-9} y={-1} />
        <span
          className="absolute flex items-center justify-center text-center font-bold"
          style={{ left: 52, top: 26, width: 21, height: 16, fontSize: 21, color: colors.keyLabel, lineHeight: "normal" }}
        >
          {label}
        </span>
      </motion.button>
    </motion.div>
  );
}

export function ImposterCaptcha({
  target = 5,
  duration = 10,
  popHold = [420, 1000],
  popGap = 280,
  startDelay = 600,
  hitDelay = 300,
  radius = 32,
  keys,
  assetPath = "/imposter-captcha",
  fit = true,
  scale: scaleProp = 1,
  colors,
  spring,
  timing,
  text,
  fontFamily,
  typography,
  onCaught,
  onSuccess,
  onFail,
  onRetry,
  ref,
  className,
}: ImposterCaptchaProps) {
  const reduce = useReducedMotion() ?? false;
  const timed = duration > 0;
  const [holdMin, holdMax] = Array.isArray(popHold) ? popHold : [popHold, popHold];
  const c = { ...COLORS, ...colors };
  const sp: ImposterCaptchaSprings = {
    pop: { ...SPRINGS.pop, ...spring?.pop },
    duck: { ...SPRINGS.duck, ...spring?.duck },
    reveal: { ...SPRINGS.reveal, ...spring?.reveal },
    ui: { ...SPRINGS.ui, ...spring?.ui },
  };
  const tm = { ...TIMING, ...timing };
  const ty = { ...TYPOGRAPHY, ...typography };
  const copy: ImposterCaptchaText = {
    title: `Whack ${target} Imposters`,
    subtitle: `${capital(word(target))} people are hiding below. Catch them before the time runs out.`,
    ...TEXT,
    ...text,
  };
  const labels = useMemo(
    () => keys ?? [<Art key="v" src={`${assetPath}/key-chevron.svg`} w={24.0003} h={20.2351} className="-mt-[1.5px]" />, "E", "R", "I", "F", "Y", "Y", "O", "U"],
    [keys, assetPath],
  );

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
  const callbacks = useRef({ onFail });
  useEffect(() => {
    callbacks.current = { onFail };
  });

  // The game loop: pops imposters at random keys and runs the countdown.
  useEffect(() => {
    if (phase !== "playing") return;
    const startedAt = performance.now();
    let hold: ReturnType<typeof setTimeout>;
    let rest: ReturnType<typeof setTimeout>;
    const pop = () => {
      const pool = Array.from({ length: KEYS }, (_, k) => k).filter((k) => k !== lastPop.current);
      const next = pool[Math.floor(Math.random() * pool.length)];
      lastPop.current = next;
      setStage(next);
      setActive(next);
      hold = setTimeout(() => {
        setActive(null);
        rest = setTimeout(pop, popGap);
      }, holdMin + Math.random() * (holdMax - holdMin));
    };
    rest = setTimeout(pop, startDelay);
    const tick = timed && setInterval(() => {
      const left = duration - (performance.now() - startedAt) / 1000;
      setRemaining(Math.max(0, Math.ceil(left)));
      if (left <= 0) {
        setActive(null);
        setPhase("failed");
        callbacks.current.onFail?.(target - caughtRef.current);
      }
    }, 100);
    resume.current = () => {
      clearTimeout(hold);
      clearTimeout(rest);
      rest = setTimeout(pop, hitDelay);
    };
    return () => {
      if (tick) clearInterval(tick);
      clearTimeout(hold);
      clearTimeout(rest);
      resume.current = null;
    };
  }, [phase, round, timed, duration, holdMin, holdMax, popGap, startDelay, hitDelay, target]);

  useEffect(() => {
    const el = root.current;
    if (!el || !fit) return;
    const observer = new ResizeObserver(([entry]) => setAvailable(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, [fit]);

  function press(index: number, el: HTMLElement) {
    if (phase !== "playing") return;
    if (!reduce) animate(el, { scaleY: [1, 0.86, 1], scaleX: [1, 1.03, 1] }, { duration: 0.26, ease: "easeOut" });
    if (index !== active) return;
    const next = caughtRef.current + 1;
    caughtRef.current = next;
    setCaught(next);
    setActive(null);
    onCaught?.(next);
    if (next >= target) {
      setHitIndex(index);
      setPhase("verified");
      onSuccess?.();
    } else {
      resume.current?.();
    }
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

  function retry() {
    restart();
    onRetry?.();
  }

  useImperativeHandle(ref, () => ({ restart }));

  // Collapse order: the winning key first, then outwards.
  const order = useMemo(() => {
    const dist = (k: number) => Math.hypot((k % 3) - (hitIndex % 3), Math.floor(k / 3) - Math.floor(hitIndex / 3));
    const ranked = Array.from({ length: KEYS }, (_, k) => k).sort((a, b) => dist(a) - dist(b));
    const rankOf: number[] = [];
    ranked.forEach((k, rank) => {
      rankOf[k] = rank;
    });
    return rankOf;
  }, [hitIndex]);

  const verified = phase === "verified";
  const failed = phase === "failed";
  const missed = target - caught;
  const scale = fit ? Math.min(scaleProp, available / CARD_W) : scaleProp;
  const ui = reduce ? { duration: 0 } : asSpring(sp.ui);
  const mmss = `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`;

  return (
    <div ref={root} className={cn("flex w-full justify-center", className)} style={{ fontFamily: fontFamily ?? inter.style.fontFamily }}>
      <div style={{ zoom: scale }}>
        <motion.div
          role="group"
          aria-label={copy.title}
          className="relative overflow-hidden"
          style={{ width: CARD_W, background: c.surface, color: c.text, borderRadius: radius, ...squircle }}
          initial={false}
          animate={{ height: failed ? CARD_H_FAILED : CARD_H }}
          transition={ui}
        >
          {/* Challenge copy */}
          <div className="absolute" style={{ left: 24, top: 24, width: 534 }}>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={failed ? "failed" : "default"}
                className="p-3"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: reduce ? 0 : 0.25 }}
              >
                <h2 style={{ fontSize: ty.title, fontWeight: 600, lineHeight: 1.1 }}>{failed ? copy.failedTitle : copy.title}</h2>
                <p className="mt-2" style={{ fontSize: ty.subtitle, lineHeight: 1.45, width: 405 }}>
                  {failed ? copy.failedSubtitle(missed) : copy.subtitle}
                </p>
              </motion.div>
            </AnimatePresence>
            {/* 40px hit area around the 24px icon, centred on the title line. */}
            <button
              type="button"
              aria-label={copy.restart}
              onClick={restart}
              className="absolute flex cursor-pointer items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white"
              style={{ left: 490, top: 12 + (ty.title * 1.1 - 40) / 2, width: 40, height: 40 }}
            >
              <Art src={`${assetPath}/restart-white.svg`} w={24} h={24} />
            </button>
          </div>

          {/* Keyboard game grid */}
          <motion.div
            className="absolute"
            style={{ left: 36, width: PILL_FULL_W, height: 3 * KEY_H + 2 * 12 }}
            initial={false}
            animate={{ top: (failed ? GRID_Y_FAILED : GRID_Y) + 24 }}
            transition={ui}
          >
            {labels.slice(0, KEYS).map((label, i) => (
              <Key
                key={i}
                index={i}
                label={label}
                assetPath={assetPath}
                colors={c}
                springs={sp}
                raised={active === i}
                hint={copy.imposterHint}
                carriesImposter={stage === i}
                phase={phase}
                collapseDelay={tm.collapseDelay + order[i] * tm.collapseStagger}
                collapseDuration={tm.collapseDuration}
                reduce={reduce}
                onPress={press}
              />
            ))}
          </motion.div>

          <AnimatePresence>
            {verified && <CaughtCharacter key="caught" assetPath={assetPath} spring={sp.reveal} delay={reduce ? 0 : tm.revealDelay} reduce={reduce} />}
          </AnimatePresence>

          {/* Game controls */}
          <div className="absolute" style={{ left: 24, bottom: 24, width: 534, height: 127 }}>
            <AnimatePresence>
              {failed && (
                <motion.div
                  key="error"
                  role="alert"
                  className="absolute flex items-center border border-solid"
                  style={{ left: 12, top: 12, width: PILL_FULL_W, height: 40, gap: 10, padding: "10px 12px", background: c.errorSurface, borderColor: c.errorBorder, borderRadius: 13.16, ...squircle }}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12, transition: { duration: reduce ? 0 : 0.2, delay: reduce ? 0 : 0.06 } }}
                  transition={reduce ? { duration: 0 } : { ...asSpring(sp.ui), delay: 0.12 }}
                >
                  <Art src={`${assetPath}/alert.svg`} w={18} h={18} />
                  <p style={{ fontSize: ty.error, fontWeight: 500, lineHeight: Math.min(1.4, 20 / ty.error) }}>{copy.error(missed)}</p>
                </motion.div>
              )}
              {failed && (
                <motion.button
                  key="retry"
                  type="button"
                  onClick={retry}
                  className="absolute flex cursor-pointer items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                  style={{ left: 12, top: SLOT_Y, width: PILL_FULL_W, height: 51, gap: 3.29, padding: "16.452px 19.742px 16.452px 13.161px", background: c.pill, color: c.pillText, borderRadius: 13.161, boxShadow: PILL_SHADOW, fontSize: 19.742, fontWeight: 500, ...squircle }}
                  initial={{ opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20, transition: { duration: reduce ? 0 : 0.18 } }}
                  transition={reduce ? { duration: 0 } : { ...asSpring(sp.ui), delay: 0.28 }}
                >
                  {copy.retry}
                  <Art src={`${assetPath}/restart-black.svg`} w={24} h={24} />
                </motion.button>
              )}
            </AnimatePresence>

            {/* Time remaining + counter pill; the pill widens into "Verified". */}
            <motion.div
              className="absolute flex items-center"
              style={{ left: 12, top: SLOT_Y, height: 51, gap: 10 }}
              initial={false}
              animate={{ opacity: phase === "playing" && timed ? 1 : 0 }}
              transition={{ duration: reduce ? 0 : 0.2 }}
            >
              <span className="relative" style={{ width: 14, height: 16 }}>
                <Art src={`${assetPath}/stopwatch.svg`} w={15.8} h={17.8} x={-0.9} y={-0.9} />
              </span>
              <span role="timer" aria-label={`${remaining} seconds left`} style={{ fontSize: ty.timer, fontWeight: 500, lineHeight: 1.5 }}>
                {mmss}
              </span>
            </motion.div>
            <motion.div
              className="absolute flex items-center justify-center overflow-hidden"
              style={{ right: 12, top: SLOT_Y, height: 51, background: c.pill, color: c.pillText, borderRadius: 13.161, fontSize: 19.742, fontWeight: 500, ...squircle }}
              initial={false}
              animate={{ width: verified ? PILL_FULL_W : PILL_W, opacity: failed ? 0 : 1, boxShadow: verified ? PILL_SHADOW : NO_SHADOW }}
              transition={reduce ? { duration: 0 } : { ...asSpring(sp.ui), delay: verified ? 0.25 : 0, opacity: { duration: 0.2 } }}
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
                    transition={reduce ? { duration: 0 } : { ...asSpring({ stiffness: 400, damping: 20, mass: 0.7 }), delay: 0.5 }}
                  >
                    {copy.verified}
                    <Art src={`${assetPath}/verified.svg`} w={24} h={24} />
                  </motion.span>
                ) : (
                  <motion.span
                    key="count"
                    className="flex whitespace-nowrap"
                    exit={{ opacity: 0, transition: { duration: reduce ? 0 : 0.15 } }}
                  >
                    <span aria-hidden className="relative inline-flex overflow-hidden">
                      <AnimatePresence mode="popLayout" initial={false}>
                        <motion.span
                          key={caught}
                          initial={{ y: "100%", opacity: 0 }}
                          animate={{ y: "0%", opacity: 1 }}
                          exit={{ y: "-100%", opacity: 0 }}
                          transition={reduce ? { duration: 0 } : { ...asSpring({ stiffness: 420, damping: 30, mass: 0.7 }) }}
                        >
                          {caught}
                        </motion.span>
                      </AnimatePresence>
                    </span>
                    <span aria-hidden>{copy.counterSuffix(target)}</span>
                    <span role="status" className="sr-only">
                      {caught}
                      {copy.counterSuffix(target)}
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
