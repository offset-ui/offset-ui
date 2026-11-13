"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type Ref } from "react";
import { animate, useReducedMotion, type AnimationPlaybackControls } from "motion/react";
import { cn } from "@/lib/utils";

export type GrabToggleColors = {
  track: string;
  trackOn: string;
  knob: string;
  knobOn: string;
  skin: string;
  sleeve: string;
};

export type GrabToggleProps = {
  size?: "small" | "medium" | "large";
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  colors?: Partial<GrabToggleColors>;
  ariaLabel?: string;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
};

const COLORS: GrabToggleColors = {
  track: "#DEDEDE",
  trackOn: "#D2F8FF",
  knob: "#FFFFFF",
  knobOn: "#0089EB",
  skin: "#FFD28B",
  sleeve: "#0089EB",
};

const SIZES = { small: 44, medium: 46, large: 48 };
const WIDTH = 394;
const HEIGHT = 191;
const KNOB = 157;
const INSET = 17;
const HAND_WIDTH = 334;
const OFF_X = INSET;
const ON_X = WIDTH - INSET - KNOB;
const DURATION = 1.5;
const EASE = [0.5, 0, 0.5, 1] as const;
const K = HAND_WIDTH / 37.2995;
const SIDES = [
  { hidden: WIDTH + 80, thumb: 50, grab: 59, flip: "" },
  { hidden: -HAND_WIDTH - 80, thumb: 138, grab: -236, flip: " scaleX(-1)" },
];
const OUTLINE = { stroke: "#FFFFFF", strokeWidth: 2 };
const SKIN: CSSProperties = { fill: "var(--gt-skin)", ...OUTLINE };

const smooth = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

type ArtProps = { ref: Ref<SVGSVGElement>; width: number; height: number; className: string; style: CSSProperties; children: ReactNode };

function Art({ ref, width, height, className, style, children }: ArtProps) {
  return (
    <svg ref={ref} width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" aria-hidden style={style} className={cn("pointer-events-none absolute left-0 max-w-none", className)}>
      {children}
    </svg>
  );
}

const HAND = (
  <>
    <path
      d="M190.504 115.5H36.0042C36.0042 115.5 26.0041 114.011 26.0041 102.5C26.0041 91.5 36.0042 90 36.0042 90H81.5041C84.4398 90 84.5041 86.5 81.5042 86.5H23.5042C23.5042 86.5 14.0041 85.0019 14.0041 73C14.0041 59.5 23.5042 60 23.5042 60H83.0042C86.5041 59 85.5041 55.5 83.0042 55H12.0042C12.0042 55 1.25639 55.5 1.00417 42.5C0.751957 29.5 12.0042 29.5 12.0042 29.5H86.0042C89.5041 29.5 89.5041 24.5 86.0042 24.5H23.5042C23.5042 24.5 12.8379 23.4919 13.5042 11.5C14.0042 2.5 23.5042 1 23.5042 1H190.504V115.5Z"
      style={SKIN}
    />
    <g transform={`scale(${K})`}>
      <rect x="21.33" y="1.4078" width="0.8774" height="10.4769" fill="#3A3A3A" />
      <rect x="22.2074" y="1.4078" width="0.8775" height="10.4769" fill="#000000" />
      <path d="M23.0849 12.8986H37.2995V0.0559399H23.0849Z" style={{ fill: "color-mix(in srgb, var(--gt-sleeve) 76%, black)" }} />
      <path d="M23.0849 12.5559C23.0849 12.5559 33.6116 12.5559 35.1116 11.5559C36.6116 10.5558 36.6116 0.0558941 36.6116 0.0558941L23.0849 0.0559399Z" style={{ fill: "var(--gt-sleeve)" }} />
    </g>
  </>
);

const THUMB = (
  <path
    d="M32.5741 5H116.574H139.574V69.5H110.574C86.1741 69.5 70.0741 50.1667 65.0741 40.5C54.2408 40.3333 29.7741 39.2 18.5741 36C7.3741 32.8 5.5741 18.3333 6.0741 11.5L32.5741 5Z"
    style={SKIN}
  />
);

export function GrabToggle({ size = "medium", checked, defaultChecked = false, disabled = false, colors, ariaLabel = "Toggle", onCheckedChange, className }: GrabToggleProps) {
  const [inner, setInner] = useState(defaultChecked);
  const value = checked ?? inner;
  const [initial] = useState(value);
  const shown = useRef(value);
  const busy = useRef(false);
  const reduceMotion = useReducedMotion();
  const pill = useRef<HTMLButtonElement>(null);
  const knobRef = useRef<HTMLSpanElement>(null);
  const hands = useRef<(SVGSVGElement | null)[]>([]);
  const thumbs = useRef<(SVGSVGElement | null)[]>([]);
  const { track, trackOn, knob, knobOn, skin, sleeve } = { ...COLORS, ...colors };
  const scale = SIZES[size] / HEIGHT;

  useEffect(() => {
    if (shown.current === value) return;
    shown.current = value;
    busy.current = true;

    const side = SIDES[value ? 0 : 1];
    const hand = hands.current[value ? 0 : 1]!;
    const thumb = thumbs.current[value ? 0 : 1]!;
    const from = value ? OFF_X : ON_X;
    const to = value ? ON_X : OFF_X;
    const grab = from + side.grab;
    const release = to + side.grab;

    const place = (handX: number, knobX: number) => {
      hand.style.transform = `translateX(${handX}px)${side.flip}`;
      thumb.style.transform = `translateX(${handX + side.thumb}px)${side.flip}`;
      knobRef.current!.style.transform = `translateX(${knobX}px)`;
    };

    const colourTiming = reduceMotion ? { duration: 0 } : { duration: 0.25, delay: DURATION / 3, ease: EASE };
    const controls: AnimationPlaybackControls[] = [
      animate(pill.current!, { background: value ? trackOn : track }, colourTiming),
      animate(knobRef.current!, { background: value ? knobOn : knob }, colourTiming),
      animate(0, 1, {
        duration: reduceMotion ? 0 : DURATION,
        ease: "linear",
        onUpdate: (p) => {
          if (p < 0.35) place(lerp(side.hidden, grab, smooth(p / 0.35)), from);
          else if (p < 0.7) {
            const u = smooth((p - 0.35) / 0.35);
            place(lerp(grab, release, u), lerp(from, to, u));
          } else place(lerp(release, side.hidden, smooth((p - 0.7) / 0.3)), to);
        },
      }),
    ];
    Promise.all(controls).finally(() => {
      busy.current = false;
    });
    return () => {
      controls.forEach((c) => c.stop());
      busy.current = false;
    };
  }, [value, reduceMotion, track, trackOn, knob, knobOn]);

  function toggle() {
    if (busy.current || disabled) return;
    if (checked === undefined) setInner(!value);
    onCheckedChange?.(!value);
  }

  return (
    <button
      ref={pill}
      type="button"
      role="switch"
      aria-checked={value}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={toggle}
      style={{ width: WIDTH * scale, height: HEIGHT * scale, background: initial ? trackOn : track, "--gt-skin": skin, "--gt-sleeve": sleeve, "--gt-on": knobOn } as CSSProperties}
      className={cn(
        "relative shrink-0 cursor-pointer overflow-hidden rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--gt-on)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      <div className="absolute left-0 top-0 origin-top-left" style={{ width: WIDTH, height: HEIGHT, transform: `scale(${scale})` }}>
        {SIDES.map((s, i) => (
          <Art key={i} ref={(el) => void (hands.current[i] = el)} width={HAND_WIDTH} height={116.5} className="top-[37px]" style={{ transform: `translateX(${s.hidden}px)${s.flip}` }}>
            {HAND}
          </Art>
        ))}
        <span
          ref={knobRef}
          className="absolute left-0 top-[17px] rounded-full"
          style={{ width: KNOB, height: KNOB, transform: `translateX(${initial ? ON_X : OFF_X}px)`, background: initial ? knobOn : knob }}
        />
        {SIDES.map((s, i) => (
          <Art
            key={i}
            ref={(el) => void (thumbs.current[i] = el)}
            width={145.574}
            height={76.5}
            className="top-[33px] drop-shadow-[0_1px_2.5px_rgba(0,0,0,0.07)]"
            style={{ transform: `translateX(${s.hidden + s.thumb}px)${s.flip}` }}
          >
            {THUMB}
          </Art>
        ))}
      </div>
    </button>
  );
}
