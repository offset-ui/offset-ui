"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type Ref } from "react";
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion, useSpring, type MotionStyle } from "motion/react";
import { cn } from "@/lib/utils";

export type MemoryCameraProps = {
  images?: string[];
  scale?: number;
  stampMask?: boolean;
  paper?: string;
  scatter?: "tidy" | "loose";
  tilt?: boolean;
  replay?: boolean;
  counterLabel?: (collected: number, total: number) => string;
  onCapture?: (index: number) => void;
  onComplete?: () => void;
  onReset?: () => void;
};

const ASSETS = "/memory-camera";
const MAX_IMAGES = 5;
const PRINT = { type: "spring", stiffness: 120, damping: 20, mass: 1 } as const;
const SETTLE = { type: "spring", stiffness: 90, damping: 14, mass: 1 } as const;
const PRESS = { type: "spring", stiffness: 500, damping: 24, mass: 0.7 } as const;
const INSTANT = { duration: 0 };
const FLASH = 0.4;
const PRINT_DELAY = 0.3;
const SETTLE_DELAY = 0.25;
const TEXTURE = 0.3;

const SCATTER = {
  tidy: { rotate: [-3, 2, -2, 3, -1], y: [0, 6, -3, 8, 2] },
  loose: { rotate: [-8, 5, -3, 7, -5], y: [0, 18, -6, 22, 4] },
};

const FRAME_W = 735;
const FRAME_H = 623.027;
const SLIDE_END = 579;
const SHUTTER = { x: 308, y: 490, w: 119, h: 54 };
const VIEWFINDER = { x: 235.33, y: 164, w: 263, h: 255.578 };
const STAMP = { w: 275, h: 295, pitch: 380, img: { x: 6, y: 8, w: 263, h: 255.578 } };
const SCRAPBOOK_TOP = 640;

const SHUTTER_HOLE = `path(evenodd, "M0 0H${FRAME_W}V${FRAME_H}H0Z M${SHUTTER.x} ${SHUTTER.y}H${SHUTTER.x + SHUTTER.w}V${SHUTTER.y + SHUTTER.h}H${SHUTTER.x}Z")`;
const SHUTTER_ONLY = `inset(${SHUTTER.y}px ${FRAME_W - SHUTTER.x - SHUTTER.w}px ${FRAME_H - SHUTTER.y - SHUTTER.h}px ${SHUTTER.x}px)`;

const circle = (cx: number, cy: number, r: number) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;

const svgUrl = (svg: string) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

const STAMP_MASK = (() => {
  const { w, h } = STAMP.img;
  const across = Array.from({ length: 11 }, (_, k) => 17.5 + k * 23.5);
  const down = Array.from({ length: 10 }, (_, k) => 20 + k * 23.3);
  const holes = [...across.flatMap((x) => [circle(x, 0, 5.5), circle(x, h, 5.5)]), ...down.flatMap((y) => [circle(0, y, 5.5), circle(w, y, 5.5)])].join("");
  return svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><path fill-rule="evenodd" d="M0 0H${w}V${h}H0Z${holes}"/></svg>`);
})();

const MASK_STYLE: CSSProperties = { WebkitMaskImage: STAMP_MASK, maskImage: STAMP_MASK, maskSize: "100% 100%" };

const flower = (petal: string, bg: string) => {
  const petals = Array.from({ length: 8 }, (_, i) => `<ellipse cy="-46" rx="19" ry="38" fill="${petal}" transform="rotate(${i * 45})"/>`).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 263 256"><rect width="263" height="256" fill="${bg}"/><g transform="translate(131.5 128)">${petals}<circle r="24" fill="#f4b942"/></g></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

const PLACEHOLDERS = [
  flower("#ff8fab", "#fff1f2"),
  flower("#ffd166", "#e0f2fe"),
  flower("#b794f6", "#ecfdf5"),
  flower("#ff7b54", "#fff7ed"),
  flower("#5eb1ff", "#fef3c7"),
];

function Layer({ src, style, className, ref }: { src: string; style?: CSSProperties; className?: string; ref?: Ref<HTMLImageElement> }) {
  return <img ref={ref} src={src} alt="" draggable={false} className={cn("pointer-events-none absolute max-w-none select-none", className)} style={style} />;
}

type StampProps = {
  src: string;
  index: number;
  x: number;
  y: number;
  rotate: number;
  centreX: number;
  paper: string;
  stampMask: boolean;
  reduce: boolean;
};

function Stamp({ src, index, x, y, rotate, centreX, paper, stampMask, reduce }: StampProps) {
  return (
    <motion.div
      className="pointer-events-auto absolute left-0 top-0"
      style={{ width: STAMP.w, height: STAMP.h, background: paper, zIndex: index + 1, filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.12))" }}
      initial={{ x: centreX - STAMP.w / 2, y: SLIDE_END - STAMP.h - 8, rotate: 0, opacity: 1 }}
      animate={{ x, y, rotate }}
      whileHover={reduce ? undefined : { scale: 1.05, y: y - 10, zIndex: 20 }}
      exit={{ opacity: 0, scale: 0.92, transition: reduce ? INSTANT : { duration: 0.25 } }}
      transition={
        reduce
          ? INSTANT
          : {
              y: PRINT,
              x: { ...SETTLE, delay: SETTLE_DELAY },
              rotate: { ...SETTLE, delay: SETTLE_DELAY },
              scale: { type: "spring", stiffness: 300, damping: 22 },
            }
      }
    >
      <div className="absolute" style={{ left: STAMP.img.x, top: STAMP.img.y, width: STAMP.img.w, height: STAMP.img.h, ...(stampMask ? MASK_STYLE : {}) }}>
        <img src={src} alt={`Memory ${index + 1}`} draggable={false} className="size-full object-cover" />
      </div>
      <span aria-hidden className="absolute -translate-y-1/2 whitespace-nowrap text-xs" style={{ left: 255, top: 281.5, color: "#737373", lineHeight: "normal" }}>
        #{index + 1}
      </span>
    </motion.div>
  );
}

export function MemoryCamera({
  images,
  scale: scaleProp = 0.7,
  stampMask = true,
  paper = "#ffffff",
  scatter = "loose",
  tilt = true,
  replay = true,
  counterLabel = (n, total) => `${n}/${total} memories collected`,
  onCapture,
  onComplete,
  onReset,
}: MemoryCameraProps) {
  const reduce = useReducedMotion() ?? false;
  const memories = useMemo(() => (images?.length ? images : PLACEHOLDERS).slice(0, MAX_IMAGES), [images]);
  const total = memories.length;
  const [count, setCount] = useState(0);
  const [flashed, setFlashed] = useState(false);
  const [available, setAvailable] = useState(Infinity);
  const busy = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const peakTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const root = useRef<HTMLDivElement>(null);
  const camera = useRef<HTMLDivElement>(null);
  const shutter = useRef<HTMLImageElement>(null);
  const flash = useRef<HTMLDivElement>(null);
  const aimX = useMotionValue(0);
  const aimY = useMotionValue(0);
  const rotateX = useSpring(aimX, { stiffness: 100, damping: 50 });
  const rotateY = useSpring(aimY, { stiffness: 100, damping: 50 });

  const done = total > 0 && count >= total;
  const previewCount = count + (flashed ? 1 : 0);
  const viewfinderSrc = memories[Math.min(previewCount, total - 1)];
  const flashMask = stampMask ? STAMP_MASK : `url("${viewfinderSrc}")`;
  const width = Math.max(FRAME_W, STAMP.w + STAMP.pitch * (total - 1) + 80);
  const height = SCRAPBOOK_TOP + 40 + STAMP.h;
  const cameraLeft = (width - FRAME_W) / 2;
  const slotLeft = 172.3 + cameraLeft;
  const scale = Math.min(scaleProp, available / width);
  const tiltStyle = (left: number, top: number): MotionStyle => ({
    rotateX,
    rotateY,
    transformPerspective: 500,
    transformOrigin: `${cameraLeft + FRAME_W / 2 - left}px ${FRAME_H / 2 - top}px`,
  });

  useEffect(
    () => () => {
      clearTimeout(timer.current);
      clearTimeout(peakTimer.current);
    },
    [],
  );

  useEffect(() => {
    memories.forEach((src) => {
      new Image().src = src;
    });
  }, [memories]);

  useEffect(() => {
    const rest = () => {
      aimX.set(0);
      aimY.set(0);
    };
    if (reduce || !tilt) return rest();
    const aim = (e: PointerEvent) => {
      if (e.pointerType === "touch" || !camera.current) return;
      const box = camera.current.getBoundingClientRect();
      const dx = (e.clientX - (box.left + box.width / 2)) / (window.innerWidth / 2);
      const dy = (e.clientY - (box.top + box.height / 2)) / (window.innerHeight / 2);
      aimY.set(Math.max(-1, Math.min(1, dx)) * 2);
      aimX.set(-Math.max(-1, Math.min(1, dy)) * 2);
    };
    window.addEventListener("pointermove", aim);
    document.documentElement.addEventListener("pointerleave", rest);
    return () => {
      window.removeEventListener("pointermove", aim);
      document.documentElement.removeEventListener("pointerleave", rest);
    };
  }, [reduce, tilt, aimX, aimY]);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setAvailable(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function capture() {
    if (busy.current || done) return;
    busy.current = true;
    if (!reduce) {
      animate(shutter.current!, { scale: 0.92, y: 2 }, PRESS).then(() => animate(shutter.current!, { scale: 1, y: 0 }, PRESS));
      animate(camera.current!, { scale: [1, 0.988, 1], y: [0, 4, 0] }, { duration: 0.45, ease: "easeOut" });
      animate(flash.current!, { opacity: [0, 0.95, 0] }, { duration: FLASH, times: [0, 0.18, 1], ease: "easeOut" });
    }
    peakTimer.current = setTimeout(() => setFlashed(true), reduce ? 0 : FLASH * 0.18 * 1000);
    timer.current = setTimeout(
      () => {
        const next = count + 1;
        setCount(next);
        setFlashed(false);
        busy.current = false;
        onCapture?.(next - 1);
        if (next === total) onComplete?.();
      },
      reduce ? 0 : PRINT_DELAY * 1000,
    );
  }

  function reset() {
    clearTimeout(timer.current);
    clearTimeout(peakTimer.current);
    busy.current = false;
    setCount(0);
    setFlashed(false);
    onReset?.();
  }

  const { rotate, y } = SCATTER[scatter];

  return (
    <div ref={root} className="flex w-full flex-col items-center gap-3">
      <div style={{ width: width * scale, height: height * scale }}>
        <div className="relative origin-top-left" style={{ width, height, transform: `scale(${scale})` }}>
          <div ref={camera} className="absolute top-0" style={{ left: cameraLeft, width: FRAME_W, height: FRAME_H }}>
            <motion.div className="absolute inset-0" style={tiltStyle(cameraLeft, 0)}>
              <Layer src={`${ASSETS}/housing.svg`} className="left-0 top-0" />
              <div aria-hidden className="pointer-events-none absolute" style={{ left: VIEWFINDER.x, top: VIEWFINDER.y, width: VIEWFINDER.w, height: VIEWFINDER.h, ...(stampMask ? MASK_STYLE : {}) }}>
                <img src={viewfinderSrc} alt="" draggable={false} className="absolute inset-0 size-full max-w-none select-none object-cover" />
              </div>
              <div
                ref={flash}
                aria-hidden
                className="pointer-events-none absolute bg-white opacity-0"
                style={{ left: VIEWFINDER.x, top: VIEWFINDER.y, width: VIEWFINDER.w, height: VIEWFINDER.h, WebkitMaskImage: flashMask, maskImage: flashMask, maskSize: "100% 100%" }}
              />
              <Layer src={`${ASSETS}/rails.svg`} className="left-0 top-0" style={{ clipPath: SHUTTER_HOLE }} />
              <Layer
                src={`${ASSETS}/rails.svg`}
                className="left-0 top-0"
                style={{ clipPath: SHUTTER_ONLY, transformOrigin: `${SHUTTER.x + SHUTTER.w / 2}px ${SHUTTER.y + SHUTTER.h / 2}px` }}
                ref={shutter}
              />
              <Layer src={`${ASSETS}/texture-1.svg`} style={{ left: 162.35, top: 70.4, width: 410.897, height: 494.101, opacity: TEXTURE }} />
              <Layer src={`${ASSETS}/texture-2.svg`} style={{ left: 162.46, top: 70.4, width: 410.65, height: 494.26, opacity: TEXTURE }} />
            </motion.div>
          </div>

          <div className="pointer-events-none absolute left-0 top-0" style={{ width, height, clipPath: `inset(${SLIDE_END}px -400px -400px -400px)` }}>
            <AnimatePresence>
              {memories.slice(0, count).map((src, i) => (
                <Stamp
                  key={`${src}-${i}`}
                  src={src}
                  index={i}
                  x={width / 2 - (STAMP.pitch * (total - 1)) / 2 + STAMP.pitch * i - STAMP.w / 2}
                  y={SCRAPBOOK_TOP + y[i % y.length]}
                  rotate={rotate[i % rotate.length]}
                  centreX={width / 2}
                  paper={paper}
                  stampMask={stampMask}
                  reduce={reduce}
                />
              ))}
            </AnimatePresence>
          </div>

          <motion.div className="pointer-events-none absolute z-20" style={{ left: slotLeft, top: 538.3, ...tiltStyle(slotLeft, 538.3) }}>
            <Layer src={`${ASSETS}/paper-slot.svg`} className="left-0 top-0" />
          </motion.div>

          <motion.button
            type="button"
            onClick={capture}
            disabled={done}
            aria-label={done ? "All memories collected" : "Take a photo"}
            className="absolute z-30 cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#008cff] focus-visible:ring-offset-2 disabled:cursor-not-allowed"
            style={{ left: SHUTTER.x + cameraLeft, top: SHUTTER.y, width: SHUTTER.w, height: SHUTTER.h, ...tiltStyle(SHUTTER.x + cameraLeft, SHUTTER.y) }}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-[#737373]">
        <p aria-live="polite">{counterLabel(count, total)}</p>
        {replay && done && (
          <button type="button" onClick={reset} className="cursor-pointer rounded-full px-3 py-1 outline-none transition-colors hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-[#008cff]">
            Replay
          </button>
        )}
      </div>
    </div>
  );
}
