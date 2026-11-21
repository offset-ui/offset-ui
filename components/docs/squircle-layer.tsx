"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";
import { getSvgPath } from "figma-squircle";
import { readNum } from "@/lib/css";

/**
 * Draws Figma's exact "iOS corner smoothing" shape behind its parent element.
 * Ported from the portfolio project's SquircleLayer.
 *
 *   <button className="rounded-(--radius-control) ..."> <SquircleLayer radius="--radius-control" fill="#111" /> ... </button>
 *
 * - The parent keeps its normal classes (rounded, bg, border). They are the fallback until this runs and keep
 *   layout and the focus ring working. Once it runs, the parent's own background and border colour are hidden
 *   (see globals.css) and the smooth shape is drawn instead.
 * - `radius`  name of a CSS custom property holding the radius in px, e.g. "--radius-control" or "--r".
 * - `fill`    background as a CSS colour (may be a var()). Use "none" for no background. With a `border` the fill
 *             must be opaque, because the border is drawn as a shape underneath it.
 * - `border`  border colour as a CSS colour. The border WIDTH is read from the parent's own border classes.
 * - Smoothing comes from --corner-smoothing (1 = Figma 100%, 0.6 = iOS default, 0 = plain round).
 */
type Props = {
  radius?: string;
  fill?: string;
  border?: string;
};

type Shape = { w: number; h: number; bw: number; outer: string; inner: string };

export function SquircleLayer({ radius = "--radius-control", fill = "none", border }: Props) {
  const marker = useRef<HTMLSpanElement>(null);
  const [shape, setShape] = useState<Shape | null>(null);
  const maskId = `sq${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  useLayoutEffect(() => {
    const parent = marker.current?.parentElement;
    if (!parent) return;

    // Absolutely positioned layers need a positioned parent.
    if (getComputedStyle(parent).position === "static") parent.style.position = "relative";

    const compute = () => {
      const cs = getComputedStyle(parent);
      const w = parent.offsetWidth;
      const h = parent.offsetHeight;
      if (!w || !h) return; // hidden or collapsed

      const r = readNum(cs, radius);
      const cornerSmoothing = readNum(cs, "--corner-smoothing", 1);
      const bw = parseFloat(cs.borderTopWidth) || 0;

      const path = (width: number, height: number, cornerRadius: number) => getSvgPath({ width, height, cornerRadius, cornerSmoothing, preserveSmoothing: true });

      parent.dataset.squircle = "layer";
      setShape({ w, h, bw, outer: path(w, h, r), inner: bw > 0 ? path(w - 2 * bw, h - 2 * bw, Math.max(r - bw, 0)) : "" });
    };

    const observer = new ResizeObserver(compute);
    observer.observe(parent);
    compute();

    return () => {
      observer.disconnect();
      delete parent.dataset.squircle;
    };
  }, [radius]);

  const marked = <span ref={marker} hidden />;
  if (!shape) return marked;

  const { w, h, bw, outer, inner } = shape;
  const hasBorder = Boolean(border) && bw > 0;
  const hasFill = fill !== "none";
  const paint = (color: string) => ({ fill: color, transition: "fill 150ms" });

  return (
    <>
      {marked}
      <svg aria-hidden width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", left: -bw, top: -bw, zIndex: -1, pointerEvents: "none", overflow: "visible" }}>
        {hasBorder && !hasFill && (
          // Border only: a ring made by masking the inner shape out of the outer shape.
          <>
            <mask id={maskId}>
              <path d={outer} fill="white" />
              <path d={inner} fill="black" transform={`translate(${bw} ${bw})`} />
            </mask>
            <path d={outer} mask={`url(#${maskId})`} style={paint(border!)} />
          </>
        )}
        {hasBorder && hasFill && (
          <>
            <path d={outer} style={paint(border!)} />
            <path d={inner} transform={`translate(${bw} ${bw})`} style={paint(fill)} />
          </>
        )}
        {!hasBorder && hasFill && <path d={outer} style={paint(fill)} />}
      </svg>
    </>
  );
}
