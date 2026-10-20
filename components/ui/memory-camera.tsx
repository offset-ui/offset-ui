"use client";

/**
 * MemoryCamera — a retro camera that "prints" a stamp-cutout memory on every tap of the shutter.
 * Tap: shutter presses in, camera recoils, viewfinder flashes, the next image slides out from behind
 * the camera's bottom edge and settles into a slightly rotated, overlapping scrapbook row.
 * After the last image the shutter is disabled; an optional replay button resets the collection.
 *
 * Artwork (camera layers + sample images) lives in /public/memory-camera and is configurable via `assetPath`.
 * Dependencies: motion/react, next/font/google (Inter), clsx + tailwind-merge (via @/lib/utils).
 */

import { useEffect, useImperativeHandle, useMemo, useRef, useState, type CSSProperties, type Ref } from "react";
import { Inter } from "next/font/google";
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion, useSpring, type MotionStyle } from "motion/react";
import { cn } from "@/lib/utils";

/** One memory. Plain strings are shorthand for `{ src }`. */
export type MemoryCameraImage = {
  src: string;
  /** Accessible description of the photo (default "Memory n"). */
  alt?: string;
  /** Small caption on the stamp (default "#n"). */
  label?: string;
};

/** Imperative controls, available through `ref`. */
export type MemoryCameraHandle = {
  /** Same as pressing the shutter. */
  capture: () => void;
  /** Same as pressing Replay. */
  reset: () => void;
};

/** Screen-reader and button copy. */
export type MemoryCameraText = {
  shutter: string;
  shutterDone: string;
  replay: string;
};

export type MemoryCameraColors = {
  /** Paper the stamps are printed on. */
  paper: string;
  /** "#n" label on each stamp. */
  label: string;
  /** Counter text under the camera. */
  counter: string;
  /** Viewfinder flash. */
  flash: string;
};

export type MemoryCameraSizes = {
  /** 1 = the 735px-wide Figma frame. */
  scale: number;
  /** Width of one stamp in design px (Figma: 275). */
  stampWidth: number;
  /** Height of one stamp in design px (Figma: 295). */
  stampHeight: number;
  /** Distance between stamp centres in the row (design px); below the stamp width they overlap. */
  stampPitch: number;
};

export type MemoryCameraSpring = {
  /** Stamp sliding out of the camera. */
  print: { stiffness: number; damping: number; mass: number };
  /** Stamp drifting + rotating into its scrapbook spot. */
  settle: { stiffness: number; damping: number; mass: number };
  /** Shutter button and camera recoil. */
  press: { stiffness: number; damping: number; mass: number };
};

export type MemoryCameraTiming = {
  /** Seconds the viewfinder flash lasts. */
  flash: number;
  /** Seconds between the tap and the stamp starting to print. */
  printDelay: number;
  /** Seconds before the stamp starts drifting sideways / rotating after it leaves the slot. */
  settleDelay: number;
};

export type MemoryCameraTilt = {
  /** Max tilt in degrees toward the cursor; 0 turns the effect off. */
  max: number;
  /** CSS perspective distance in design px; smaller = stronger 3D. */
  perspective: number;
  stiffness: number;
  damping: number;
};

export type MemoryCameraTypography = {
  fontSize: number;
  fontWeight: number;
  fontFamily?: string;
};

export type MemoryCameraProps = {
  /** Up to five images (extras are ignored); URLs or `{ src, alt, label }`. Pre-shaped stamps can pass `stampMask={false}`. */
  images: (string | MemoryCameraImage)[];
  /** Controlled number of printed memories. Omit to let the camera manage it. */
  collected?: number;
  /** Starting number of printed memories when uncontrolled. */
  defaultCollected?: number;
  /** Disable the shutter without changing its look. */
  disabled?: boolean;
  /** Shown in the viewfinder once every memory is collected (default: the last memory). Until then the
   *  viewfinder previews the next image to be printed. */
  viewfinder?: string;
  /** Cut the stamp perforation into each image. Turn off for images that already have it baked in. */
  stampMask?: boolean;
  /** Camera tilts toward the cursor (3D parallax tilt). Stamps and the page are unaffected. */
  tilt?: Partial<MemoryCameraTilt> | false;
  /** Strength of the noise grain on the camera body and paper slot: 0 hides it, 1 is the Figma look. */
  textureOpacity?: number;
  /** Shrink the whole layout to fit the available width instead of overflowing. */
  fit?: boolean;
  /** Show the replay button once every memory is collected. */
  replay?: boolean;
  /** Show the counter text under the camera. */
  showCounter?: boolean;
  /** Show the small caption on each stamp. */
  showLabels?: boolean;
  /** Button and screen-reader copy. */
  text?: Partial<MemoryCameraText>;
  /** Folder (public URL) containing the camera artwork. */
  assetPath?: string;
  /** Counter text; defaults to "3/5 memories collected". */
  counterLabel?: (collected: number, total: number) => string;
  /** Called when a memory prints; in controlled mode, raise `collected` here. */
  onCapture?: (index: number, image: MemoryCameraImage) => void;
  onComplete?: () => void;
  onReset?: () => void;
  colors?: Partial<MemoryCameraColors>;
  sizes?: Partial<MemoryCameraSizes>;
  spring?: { [K in keyof MemoryCameraSpring]?: Partial<MemoryCameraSpring[K]> };
  timing?: Partial<MemoryCameraTiming>;
  typography?: Partial<MemoryCameraTypography>;
  /** Stamp tilt in degrees per slot. */
  rotations?: number[];
  /** Vertical nudge in design px per slot, for a looser scrapbook feel. */
  yOffsets?: number[];
  ref?: Ref<MemoryCameraHandle>;
  className?: string;
};

const MAX_IMAGES = 5;

const COLORS: MemoryCameraColors = { paper: "#ffffff", label: "#737373", counter: "#737373", flash: "#ffffff" };
const SIZES: MemoryCameraSizes = { scale: 0.7, stampWidth: 275, stampHeight: 295, stampPitch: 380 };
const SPRING: MemoryCameraSpring = {
  print: { stiffness: 120, damping: 20, mass: 1 },
  settle: { stiffness: 90, damping: 14, mass: 1 },
  press: { stiffness: 500, damping: 24, mass: 0.7 },
};
const TIMING: MemoryCameraTiming = { flash: 0.4, printDelay: 0.3, settleDelay: 0.25 };
const TILT: MemoryCameraTilt = { max: 2, perspective: 500, stiffness: 100, damping: 50 };
const ROTATIONS = [-8, 5, -3, 7, -5];
const Y_OFFSETS = [0, 18, -6, 22, 4];
const TEXT: MemoryCameraText = { shutter: "Take a photo", shutterDone: "All memories collected", replay: "Replay" };

const inter = Inter({ subsets: ["latin"] });
const TYPOGRAPHY: MemoryCameraTypography = { fontSize: 12, fontWeight: 400, fontFamily: inter.style.fontFamily };

// Figma frame geometry (design px): 735 x 623.03 camera frame.
const FRAME_W = 735;
const FRAME_H = 623.027;
const SLIDE_END = 579; // bottom of the paper-slot lip; stamps are only visible below it.
const SHUTTER = { x: 308, y: 490, w: 119, h: 54 };
const VIEWFINDER = { x: 235.33, y: 164, w: 263, h: 255.578 };
const STAMP_IMG = { x: 6, y: 8, w: 263, h: 255.578 };
const SCRAPBOOK_TOP = 640;

const SHUTTER_HOLE = `path(evenodd, "M0 0H${FRAME_W}V${FRAME_H}H0Z M${SHUTTER.x} ${SHUTTER.y}H${SHUTTER.x + SHUTTER.w}V${SHUTTER.y + SHUTTER.h}H${SHUTTER.x}Z")`;
const SHUTTER_ONLY = `inset(${SHUTTER.y}px ${FRAME_W - SHUTTER.x - SHUTTER.w}px ${FRAME_H - SHUTTER.y - SHUTTER.h}px ${SHUTTER.x}px)`;

const circle = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;

/** Stamp cut-out: the image rectangle with semicircular perforations around its edge (Figma "Subtract"). */
const STAMP_MASK = (() => {
  const { w, h } = STAMP_IMG;
  const r = 5.5;
  const across = Array.from({ length: 11 }, (_, k) => 17.5 + k * 23.5);
  const down = Array.from({ length: 10 }, (_, k) => 20 + k * 23.3);
  const holes = [
    ...across.flatMap((x) => [circle(x, 0, r), circle(x, h, r)]),
    ...down.flatMap((y) => [circle(0, y, r), circle(w, y, r)]),
  ].join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><path fill-rule="evenodd" d="M0 0H${w}V${h}H0Z${holes}"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
})();

const STAMP_MASK_STYLE: CSSProperties = { WebkitMaskImage: STAMP_MASK, maskImage: STAMP_MASK, maskSize: "100% 100%" };

const noClickThrough = "pointer-events-none absolute max-w-none select-none";

function Layer({ src, style, className, ref }: { src: string; style?: CSSProperties; className?: string; ref?: Ref<HTMLImageElement> }) {
  // eslint-disable-next-line @next/next/no-img-element -- decorative, fixed-size artwork
  return <img ref={ref} src={src} alt="" draggable={false} className={cn(noClickThrough, className)} style={style} />;
}

type Slot = { x: number; y: number; rotate: number };

function slotFor(
  index: number,
  total: number,
  centreX: number,
  sizes: MemoryCameraSizes,
  rotations: number[],
  yOffsets: number[],
): Slot {
  const centre = centreX - (sizes.stampPitch * (total - 1)) / 2 + sizes.stampPitch * index;
  return {
    x: centre - sizes.stampWidth / 2,
    y: SCRAPBOOK_TOP + (yOffsets[index % yOffsets.length] ?? 0),
    rotate: rotations[index % rotations.length] ?? 0,
  };
}

type StampProps = {
  centreX: number;
  image: MemoryCameraImage;
  /** Caption under the photo; null hides it. */
  label: string | null;
  index: number;
  slot: Slot;
  colors: MemoryCameraColors;
  sizes: MemoryCameraSizes;
  spring: MemoryCameraSpring;
  timing: MemoryCameraTiming;
  typography: MemoryCameraTypography;
  stampMask: boolean;
  reduce: boolean;
};

function Stamp({ centreX, image, label, index, slot, colors, sizes, spring, timing, typography, stampMask, reduce }: StampProps) {
  const instant = { duration: 0 };
  const hiddenY = SLIDE_END - sizes.stampHeight - 8;
  const slideX = centreX - sizes.stampWidth / 2;
  return (
    <motion.div
      className="pointer-events-auto absolute left-0 top-0"
      style={{
        width: sizes.stampWidth,
        height: sizes.stampHeight,
        background: colors.paper,
        zIndex: index + 1,
        transformOrigin: "50% 50%",
        filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.12))",
      }}
      initial={{ x: slideX, y: hiddenY, rotate: 0, opacity: 1 }}
      animate={{ x: slot.x, y: slot.y, rotate: slot.rotate }}
      whileHover={reduce ? undefined : { scale: 1.05, y: slot.y - 10, zIndex: 20 }}
      exit={{ opacity: 0, scale: 0.92, transition: reduce ? instant : { duration: 0.25 } }}
      transition={
        reduce
          ? instant
          : {
              y: { type: "spring", ...spring.print },
              x: { type: "spring", ...spring.settle, delay: timing.settleDelay },
              rotate: { type: "spring", ...spring.settle, delay: timing.settleDelay },
              scale: { type: "spring", stiffness: 300, damping: 22 },
            }
      }
    >
      <div
        className="absolute"
        style={{
          left: STAMP_IMG.x,
          top: STAMP_IMG.y,
          width: STAMP_IMG.w,
          height: STAMP_IMG.h,
          ...(stampMask ? STAMP_MASK_STYLE : {}),
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- user-supplied memory */}
        <img src={image.src} alt={image.alt ?? `Memory ${index + 1}`} draggable={false} className="size-full object-cover" />
      </div>
      {label !== null && (
        <span
          aria-hidden
          className="absolute -translate-y-1/2 whitespace-nowrap"
          style={{
            left: 255,
            top: 281.5,
            color: colors.label,
            fontSize: typography.fontSize,
            fontWeight: typography.fontWeight,
            fontFamily: typography.fontFamily,
            lineHeight: "normal",
          }}
        >
          {label}
        </span>
      )}
    </motion.div>
  );
}

export function MemoryCamera({
  images,
  viewfinder,
  collected,
  defaultCollected = 0,
  disabled = false,
  stampMask = true,
  textureOpacity = 0.3,
  tilt,
  fit = true,
  replay = true,
  showCounter = true,
  showLabels = true,
  text,
  assetPath = "/memory-camera",
  counterLabel = (n, total) => `${n}/${total} memories collected`,
  onCapture,
  onComplete,
  onReset,
  colors,
  sizes,
  spring,
  timing,
  typography,
  rotations = ROTATIONS,
  yOffsets = Y_OFFSETS,
  ref,
  className,
}: MemoryCameraProps) {
  const reduce = useReducedMotion() ?? false;
  const memories = useMemo(
    () => images.slice(0, MAX_IMAGES).map((image) => (typeof image === "string" ? { src: image } : image)),
    [images],
  );
  const total = memories.length;
  const [innerCount, setInnerCount] = useState(defaultCollected);
  const count = Math.min(collected ?? innerCount, total);
  /** True between the flash peak and the stamp printing, so the viewfinder is already on the next image. */
  const [flashed, setFlashed] = useState(false);
  const busy = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const peakTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const root = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState(Infinity);
  const camera = useRef<HTMLDivElement>(null);
  const shutter = useRef<HTMLImageElement>(null);
  const flash = useRef<HTMLDivElement>(null);
  const tl = { ...TILT, ...(tilt === false ? { max: 0 } : tilt) };
  const copy = { ...TEXT, ...text };
  const aimX = useMotionValue(0);
  const aimY = useMotionValue(0);
  const rotateX = useSpring(aimX, { stiffness: tl.stiffness, damping: tl.damping });
  const rotateY = useSpring(aimY, { stiffness: tl.stiffness, damping: tl.damping });

  const c = { ...COLORS, ...colors };
  const s = { ...SIZES, ...sizes };
  const ty = { ...TYPOGRAPHY, ...typography };
  const tm = { ...TIMING, ...timing };
  const sp: MemoryCameraSpring = {
    print: { ...SPRING.print, ...spring?.print },
    settle: { ...SPRING.settle, ...spring?.settle },
    press: { ...SPRING.press, ...spring?.press },
  };
  const done = total > 0 && count >= total;
  const previewCount = count + (flashed ? 1 : 0);
  const lastSrc = memories[total - 1]?.src ?? `${assetPath}/viewfinder.png`;
  const viewfinderSrc = previewCount >= total ? (viewfinder ?? lastSrc) : (memories[previewCount]?.src ?? lastSrc);
  const flashMask = stampMask ? STAMP_MASK : `url(${viewfinderSrc})`;
  const width = Math.max(FRAME_W, s.stampWidth + s.stampPitch * (total - 1) + 80);
  const height = SCRAPBOOK_TOP + 40 + s.stampHeight;
  const cameraLeft = (width - FRAME_W) / 2;
  const slotLeft = 172.3 + cameraLeft;
  // Every tilted piece pivots around the camera centre so the lip and shutter stay glued to the body.
  const tiltStyle = (left: number, top: number): MotionStyle => ({
    rotateX,
    rotateY,
    transformPerspective: tl.perspective,
    transformOrigin: `${cameraLeft + FRAME_W / 2 - left}px ${FRAME_H / 2 - top}px`,
  });
  const scale = fit ? Math.min(s.scale, available / width) : s.scale;

  useEffect(
    () => () => {
      clearTimeout(timer.current);
      clearTimeout(peakTimer.current);
    },
    [],
  );

  // Decode every memory up front so the viewfinder swap never waits on the network.
  useEffect(() => {
    memories.forEach(({ src }) => {
      new Image().src = src;
    });
  }, [memories]);

  // Tilt the camera toward the pointer, wherever it is on the page.
  useEffect(() => {
    if (reduce || tl.max === 0) {
      aimX.set(0);
      aimY.set(0);
      return;
    }
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch" || !camera.current) return;
      const box = camera.current.getBoundingClientRect();
      const dx = (e.clientX - (box.left + box.width / 2)) / (window.innerWidth / 2);
      const dy = (e.clientY - (box.top + box.height / 2)) / (window.innerHeight / 2);
      aimY.set(Math.max(-1, Math.min(1, dx)) * tl.max);
      aimX.set(-Math.max(-1, Math.min(1, dy)) * tl.max);
    };
    const onLeave = () => {
      aimX.set(0);
      aimY.set(0);
    };
    window.addEventListener("pointermove", onMove);
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [reduce, tl.max, aimX, aimY]);

  useEffect(() => {
    const el = root.current;
    if (!el || !fit) return;
    const observer = new ResizeObserver(([entry]) => setAvailable(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, [fit]);

  function capture() {
    if (busy.current || disabled || count >= total) return;
    busy.current = true;
    if (!reduce) {
      const press = { type: "spring", ...sp.press } as const;
      animate(shutter.current!, { scale: 0.92, y: 2 }, press).then(() => animate(shutter.current!, { scale: 1, y: 0 }, press));
      animate(camera.current!, { scale: [1, 0.988, 1], y: [0, 4, 0] }, { duration: 0.45, ease: "easeOut" });
      animate(flash.current!, { opacity: [0, 0.95, 0] }, { duration: tm.flash, times: [0, 0.18, 1], ease: "easeOut" });
    }
    peakTimer.current = setTimeout(() => setFlashed(true), reduce ? 0 : tm.flash * 0.18 * 1000);
    timer.current = setTimeout(
      () => {
        const next = count + 1;
        if (collected === undefined) setInnerCount(next);
        setFlashed(false);
        busy.current = false;
        onCapture?.(next - 1, memories[next - 1]);
        if (next === total) onComplete?.();
      },
      reduce ? 0 : tm.printDelay * 1000,
    );
  }

  function reset() {
    clearTimeout(timer.current);
    clearTimeout(peakTimer.current);
    busy.current = false;
    setInnerCount(0);
    setFlashed(false);
    onReset?.();
  }

  useImperativeHandle(ref, () => ({ capture, reset }));

  return (
    <div ref={root} className={cn("flex w-full flex-col items-center gap-3", className)}>
      <div style={{ width: width * scale, height: height * scale }}>
        <div
          className="relative origin-top-left"
          style={{ width, height, transform: `scale(${scale})` }}
        >
          <div ref={camera} className="absolute top-0" style={{ left: cameraLeft, width: FRAME_W, height: FRAME_H }}>
            <motion.div className="absolute inset-0" style={tiltStyle(cameraLeft, 0)}>
              <Layer src={`${assetPath}/housing.svg`} className="left-0 top-0" />
              {textureOpacity < 1 && (
                <Layer src={`${assetPath}/housing-clean.svg`} className="left-0 top-0" style={{ opacity: 1 - textureOpacity }} />
              )}
              <div
                aria-hidden
                className="pointer-events-none absolute"
                style={{
                  left: VIEWFINDER.x,
                  top: VIEWFINDER.y,
                  width: VIEWFINDER.w,
                  height: VIEWFINDER.h,
                  ...(stampMask ? STAMP_MASK_STYLE : {}),
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- user-supplied memory */}
                <img
                  src={viewfinderSrc}
                  alt=""
                  draggable={false}
                  className="absolute inset-0 size-full max-w-none select-none object-cover"
                />
              </div>
              <div
                ref={flash}
                aria-hidden
                className="pointer-events-none absolute opacity-0"
                style={{
                  left: VIEWFINDER.x,
                  top: VIEWFINDER.y,
                  width: VIEWFINDER.w,
                  height: VIEWFINDER.h,
                  background: c.flash,
                  WebkitMaskImage: flashMask,
                  maskImage: flashMask,
                  maskSize: "100% 100%",
                }}
              />
              <Layer src={`${assetPath}/rails.svg`} className="left-0 top-0" style={{ clipPath: SHUTTER_HOLE }} />
              <Layer
                src={`${assetPath}/rails.svg`}
                className="left-0 top-0"
                style={{
                  clipPath: SHUTTER_ONLY,
                  transformOrigin: `${SHUTTER.x + SHUTTER.w / 2}px ${SHUTTER.y + SHUTTER.h / 2}px`,
                }}
                ref={shutter}
              />
              <Layer
                src={`${assetPath}/texture-1.svg`}
                style={{ left: 162.35, top: 70.4, width: 410.897, height: 494.101, opacity: textureOpacity }}
              />
              <Layer
                src={`${assetPath}/texture-2.svg`}
                style={{ left: 162.46, top: 70.4, width: 410.65, height: 494.26, opacity: textureOpacity }}
              />
            </motion.div>
          </div>

          <div
            className="pointer-events-none absolute left-0 top-0"
            style={{ width, height, clipPath: `inset(${SLIDE_END}px -400px -400px -400px)` }}
          >
            <AnimatePresence>
              {memories.slice(0, count).map((image, i) => (
                <Stamp
                  key={`${image.src}-${i}`}
                  image={image}
                  label={showLabels ? (image.label ?? `#${i + 1}`) : null}
                  index={i}
                  centreX={width / 2}
                  slot={slotFor(i, total, width / 2, s, rotations, yOffsets)}
                  colors={c}
                  sizes={s}
                  spring={sp}
                  timing={tm}
                  typography={ty}
                  stampMask={stampMask}
                  reduce={reduce}
                />
              ))}
            </AnimatePresence>
          </div>

          <motion.div className="pointer-events-none absolute z-20" style={{ left: slotLeft, top: 538.3, ...tiltStyle(slotLeft, 538.3) }}>
            <Layer src={`${assetPath}/paper-slot.svg`} className="left-0 top-0" />
            {textureOpacity < 1 && (
              <Layer src={`${assetPath}/paper-slot-clean.svg`} className="left-0 top-0" style={{ opacity: 1 - textureOpacity }} />
            )}
          </motion.div>

          <motion.button
            type="button"
            onClick={capture}
            disabled={done || disabled}
            aria-label={done ? copy.shutterDone : copy.shutter}
            className="absolute z-30 cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#008cff] focus-visible:ring-offset-2 disabled:cursor-not-allowed"
            style={{
              left: SHUTTER.x + cameraLeft,
              top: SHUTTER.y,
              width: SHUTTER.w,
              height: SHUTTER.h,
              ...tiltStyle(SHUTTER.x + cameraLeft, SHUTTER.y),
            }}
          />
        </div>
      </div>

      <div className="flex items-center gap-3" style={{ fontFamily: ty.fontFamily, fontSize: ty.fontSize, fontWeight: ty.fontWeight }}>
        <p aria-live="polite" className={cn(!showCounter && "sr-only")} style={{ color: c.counter }}>
          {counterLabel(count, total)}
        </p>
        {replay && done && (
          <button
            type="button"
            onClick={reset}
            className="cursor-pointer rounded-full px-3 py-1 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#008cff] hover:bg-black/5"
            style={{ color: c.counter }}
          >
            {copy.replay}
          </button>
        )}
      </div>
    </div>
  );
}
