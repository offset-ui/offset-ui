"use client";

import { useId, useRef, useState, type CSSProperties, type Ref } from "react";
import { animate, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

const WIDTH = 394;
const HEIGHT = 191;
const CIRCLE = 157;
const INSET = 17;
const HAND_WIDTH = 334;
const CIRCLE_OFF_X = INSET;
const CIRCLE_ON_X = WIDTH - INSET - CIRCLE;
const RIGHT_HIDDEN = WIDTH + 80;
const LEFT_HIDDEN = -HAND_WIDTH - 80;
const RIGHT_THUMB = 50;
const LEFT_THUMB = 138;
const RIGHT_GRAB = 59;
const LEFT_GRAB = -236;
const EASE = [0.5, 0, 0.5, 1] as const;
const SIZES = { small: 44, medium: 46, large: 48 } as const;

const smooth = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

type HandColors = { fill: string; stroke: string; strokeWidth: number; cuff: string; gap: string };
type ThumbColors = { fill: string; stroke: string; strokeWidth: number };

const HAND_DEFAULTS: HandColors = { fill: "#FFD28B", stroke: "#FFFFFF", strokeWidth: 2, cuff: "#0089EB", gap: "#000000" };
const THUMB_DEFAULTS: ThumbColors = { fill: "#FFD28B", stroke: "#FFFFFF", strokeWidth: 2 };

export type HandDraggingToggleProps = {
  size?: keyof typeof SIZES;
  width?: number;
  duration?: number;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  pillOff?: string;
  pillOn?: string;
  circleOff?: string;
  circleOn?: string;
  handColors?: Partial<HandColors>;
  thumbColors?: Partial<ThumbColors>;
  className?: string;
};

type ArtProps = { ref: Ref<SVGSVGElement>; style: CSSProperties; className: string };

function HandArt({ ref, colors, style, className }: ArtProps & { colors: HandColors }) {
  return (
    <svg ref={ref} width={HAND_WIDTH} height={116.5} viewBox="0 0 334 116.5" fill="none" style={style} className={className} aria-hidden>
      <path
        d="M190.504 115.5H36.0042C36.0042 115.5 26.0041 114.011 26.0041 102.5C26.0041 91.5 36.0042 90 36.0042 90H81.5041C84.4398 90 84.5041 86.5 81.5042 86.5H23.5042C23.5042 86.5 14.0041 85.0019 14.0041 73C14.0041 59.5 23.5042 60 23.5042 60H83.0042C86.5041 59 85.5041 55.5 83.0042 55H12.0042C12.0042 55 1.25639 55.5 1.00417 42.5C0.751957 29.5 12.0042 29.5 12.0042 29.5H86.0042C89.5041 29.5 89.5041 24.5 86.0042 24.5H23.5042C23.5042 24.5 12.8379 23.4919 13.5042 11.5C14.0042 2.5 23.5042 1 23.5042 1H190.504V115.5Z"
        fill={colors.fill}
        stroke={colors.stroke}
        strokeWidth={colors.strokeWidth}
      />
      <path d="M206.714 12.6053H191V106.421H206.714V12.6053Z" fill={colors.gap} />
      <path d="M206.714 115.5H334V0.5H206.714V12.6053V106.421V115.5Z" fill={colors.cuff} />
    </svg>
  );
}

function ThumbArt({ ref, colors, style, className }: ArtProps & { colors: ThumbColors }) {
  const filterId = `hdt-shadow-${useId().replace(/:/g, "")}`;
  return (
    <svg ref={ref} width={145.574} height={76.5} viewBox="0 0 145.574 76.5" fill="none" style={style} className={className} aria-hidden>
      <defs>
        <filter id={filterId} x="0" y="0" width="145.574" height="76.5" filterUnits="userSpaceOnUse">
          <feDropShadow dy="1" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.07" />
        </filter>
      </defs>
      <path
        d="M32.5741 5H116.574H139.574V69.5H110.574C86.1741 69.5 70.0741 50.1667 65.0741 40.5C54.2408 40.3333 29.7741 39.2 18.5741 36C7.3741 32.8 5.5741 18.3333 6.0741 11.5L32.5741 5Z"
        fill={colors.fill}
        stroke={colors.stroke}
        strokeWidth={colors.strokeWidth}
        filter={`url(#${filterId})`}
      />
    </svg>
  );
}

export function HandDraggingToggle({
  size = "medium",
  width,
  duration = 1.5,
  defaultChecked = false,
  onCheckedChange,
  disabled = false,
  pillOff = "#DEDEDE",
  pillOn = "#D2F8FF",
  circleOff = "#FFFFFF",
  circleOn = "#0089EB",
  handColors,
  thumbColors,
  className,
}: HandDraggingToggleProps) {
  const [checked, setChecked] = useState(defaultChecked);
  const scale = width ? width / WIDTH : SIZES[size] / HEIGHT;
  const busy = useRef(false);
  const reduceMotion = useReducedMotion();
  const pill = useRef<HTMLButtonElement>(null);
  const circle = useRef<HTMLSpanElement>(null);
  const rightHand = useRef<SVGSVGElement>(null);
  const leftHand = useRef<SVGSVGElement>(null);
  const rightThumb = useRef<SVGSVGElement>(null);
  const leftThumb = useRef<SVGSVGElement>(null);

  async function toggle() {
    if (busy.current || disabled) return;
    busy.current = true;
    const next = !checked;
    setChecked(next);
    onCheckedChange?.(next);

    const hand = next ? rightHand.current! : leftHand.current!;
    const thumb = next ? rightThumb.current! : leftThumb.current!;
    const flip = next ? "" : " scaleX(-1)";
    const thumbOffset = next ? RIGHT_THUMB : LEFT_THUMB;
    const from = next ? CIRCLE_OFF_X : CIRCLE_ON_X;
    const to = next ? CIRCLE_ON_X : CIRCLE_OFF_X;
    const grab = from + (next ? RIGHT_GRAB : LEFT_GRAB);
    const release = to + (next ? RIGHT_GRAB : LEFT_GRAB);
    const hidden = next ? RIGHT_HIDDEN : LEFT_HIDDEN;

    const place = (handX: number, circleX: number) => {
      hand.style.transform = `translateX(${handX}px)${flip}`;
      thumb.style.transform = `translateX(${handX + thumbOffset}px)${flip}`;
      circle.current!.style.transform = `translateX(${circleX}px)`;
    };

    const colourTiming = reduceMotion ? { duration: 0 } : { duration: 0.25, delay: duration / 3, ease: EASE };
    const pillColour = animate(pill.current!, { background: next ? pillOn : pillOff }, colourTiming);
    const circleColour = animate(circle.current!, { background: next ? circleOn : circleOff }, colourTiming);
    const move = animate(0, 1, {
      duration: reduceMotion ? 0 : duration,
      ease: "linear",
      onUpdate: (p) => {
        if (p < 0.35) {
          place(lerp(hidden, grab, smooth(p / 0.35)), from);
        } else if (p < 0.7) {
          const u = smooth((p - 0.35) / 0.35);
          place(lerp(grab, release, u), lerp(from, to, u));
        } else {
          place(lerp(release, hidden, smooth((p - 0.7) / 0.3)), to);
        }
      },
    });
    try {
      await Promise.all([move, pillColour, circleColour]);
    } finally {
      busy.current = false;
    }
  }

  const hand = { ...HAND_DEFAULTS, ...handColors };
  const thumb = { ...THUMB_DEFAULTS, ...thumbColors };
  const art = "pointer-events-none absolute left-0 max-w-none";

  return (
    <button
      ref={pill}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={toggle}
      style={{ width: WIDTH * scale, height: HEIGHT * scale, background: defaultChecked ? pillOn : pillOff }}
      className={cn(
        "relative shrink-0 cursor-pointer overflow-hidden rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#0089EB] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      <div className="absolute left-0 top-0 h-[191px] w-[394px] origin-top-left" style={{ transform: `scale(${scale})` }}>
        <HandArt
          ref={rightHand}
          colors={hand}
          className={`${art} top-[37px]`}
          style={{ transform: `translateX(${RIGHT_HIDDEN}px)` }}
        />
        <HandArt
          ref={leftHand}
          colors={hand}
          className={`${art} top-[37px]`}
          style={{ transform: `translateX(${LEFT_HIDDEN}px) scaleX(-1)` }}
        />
        <span
          ref={circle}
          className="absolute left-0 top-[17px] h-[157px] w-[157px] rounded-full"
          style={{
            transform: `translateX(${defaultChecked ? CIRCLE_ON_X : CIRCLE_OFF_X}px)`,
            background: defaultChecked ? circleOn : circleOff,
          }}
        />
        <ThumbArt
          ref={rightThumb}
          colors={thumb}
          className={`${art} top-[33px]`}
          style={{ transform: `translateX(${RIGHT_HIDDEN + RIGHT_THUMB}px)` }}
        />
        <ThumbArt
          ref={leftThumb}
          colors={thumb}
          className={`${art} top-[33px]`}
          style={{ transform: `translateX(${LEFT_HIDDEN + LEFT_THUMB}px) scaleX(-1)` }}
        />
      </div>
    </button>
  );
}
