"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";
import { getSvgPath } from "figma-squircle";
import { readNum } from "@/lib/css";

type Props = {
  radius?: string;
  fill?: string;
  border?: string;
};

type Shape = { w: number; h: number; bw: number; outer: string; inner: string };

export function SquircleLayer({ radius = "--radius-control", fill = "none", border }: Props) {
  const marker = useRef<HTMLSpanElement>(null);
  const lastKey = useRef("");
  const [shape, setShape] = useState<Shape | null>(null);
  const maskId = `sq${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  useLayoutEffect(() => {
    const parent = marker.current?.parentElement;
    if (!parent) return;

    if (getComputedStyle(parent).position === "static") parent.style.position = "relative";

    const compute = () => {
      const cs = getComputedStyle(parent);
      const w = parent.offsetWidth;
      const h = parent.offsetHeight;
      if (!w || !h) return;

      const r = readNum(cs, radius);
      const cornerSmoothing = readNum(cs, "--corner-smoothing", 1);
      const bw = parseFloat(cs.borderTopWidth) || 0;

      parent.dataset.squircle = "layer";
      const key = `${w}/${h}/${r}/${bw}`;
      if (key === lastKey.current) return;
      lastKey.current = key;

      const path = (width: number, height: number, cornerRadius: number) => getSvgPath({ width, height, cornerRadius, cornerSmoothing, preserveSmoothing: true });

      setShape({ w, h, bw, outer: path(w, h, r), inner: bw > 0 ? path(w - 2 * bw, h - 2 * bw, Math.max(r - bw, 0)) : "" });
    };

    const observer = new ResizeObserver(compute);
    observer.observe(parent);

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
