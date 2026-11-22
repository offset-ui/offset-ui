"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { Instrument_Serif } from "next/font/google";
import { cn } from "@/lib/utils";

const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", display: "swap" });

const LETTERS = "Offset";
const WORD = { ems: 2.08, share: 0.6 };
const BAND = { rowsMin: 8, cellsAcross: 170, minPitch: 6, swellWidth: 0.07, swellLift: 0.5, tideSeconds: 5 };
const clamp = (value: number, low = 0, high = 1) => Math.min(high, Math.max(low, value));

const LETTER =
  "inline-block bg-[linear-gradient(to_bottom,color-mix(in_srgb,var(--foreground)_85%,transparent)_0%,transparent_80%)] bg-clip-text text-transparent transition-[translate,opacity] duration-700 ease-out [transition-delay:calc(var(--i)*70ms)] motion-safe:translate-y-[35%] motion-safe:opacity-0 group-data-[in]/wordmark:translate-y-0 group-data-[in]/wordmark:opacity-100";

export function FooterWordmark({ className }: { className?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const band = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = root.current!;
    const canvas = band.current!;
    const ctx = canvas.getContext("2d")!;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pink = getComputedStyle(canvas).getPropertyValue("--brand").trim();
    const pointer = { col: 0, active: false };
    let cols = 0;
    let rows = 0;
    let pitch = 1;
    let noise = new Float32Array(0);
    let swell = new Float32Array(0);
    let raf = 0;
    let start = 0;
    let visible = false;

    const draw = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = pink;
      const progress = reduce ? 1 : clamp((time - start) / 1800);
      const tide = 1 - ((time / 1000 / BAND.tideSeconds) % 1.4);
      for (let row = 0; row < rows; row++) {
        const rowDepth = (row + 0.5) / rows;
        for (let col = 0; col < cols; col++) {
          const depth = clamp(rowDepth + swell[col] * BAND.swellLift);
          const appear = clamp((progress * 1.5 - (1 - rowDepth) - noise[row * cols + col] * 0.2) * 5);
          const glow = reduce ? 0 : 0.25 * Math.exp(-(((rowDepth - tide) / 0.1) ** 2)) + 0.1 * depth * Math.sin(time * 0.002 + noise[row * cols + col] * 40);
          ctx.globalAlpha = clamp((0.9 * depth ** 2.6 + glow) * appear);
          ctx.fillRect(col * pitch, row * pitch, pitch - 1, pitch - 1);
        }
      }
    };

    const tick = (time: number) => {
      const spread = cols * BAND.swellWidth;
      for (let col = 0; col < cols; col++) {
        const target = pointer.active ? Math.exp(-(((col - pointer.col) / spread) ** 2)) : 0;
        swell[col] += (target - swell[col]) * 0.1;
      }
      draw(time);
      raf = requestAnimationFrame(tick);
    };
    const run = () => {
      cancelAnimationFrame(raf);
      if (!reduce && visible && !document.hidden) raf = requestAnimationFrame(tick);
    };

    const layout = () => {
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = Math.round(width * devicePixelRatio);
      canvas.height = Math.round(height * devicePixelRatio);
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      pitch = Math.max(BAND.minPitch, Math.round(width / BAND.cellsAcross));
      cols = Math.ceil(width / pitch);
      rows = Math.max(BAND.rowsMin, Math.floor(height / pitch));
      noise = Float32Array.from({ length: cols * rows }, Math.random);
      swell = new Float32Array(cols);
      draw(performance.now());
    };

    const aim = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.col = ((event.clientX - rect.left) / pitch) | 0;
      pointer.active = true;
    };
    const release = () => {
      pointer.active = false;
    };

    const resize = new ResizeObserver(layout);
    const view = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !start) {
          start = performance.now();
          host.dataset.in = "";
        }
        run();
      },
      { threshold: 0.25 },
    );

    resize.observe(canvas);
    view.observe(host);
    if (!reduce) {
      document.addEventListener("visibilitychange", run);
      host.addEventListener("pointermove", aim);
      host.addEventListener("pointerleave", release);
      host.addEventListener("pointercancel", release);
    }
    return () => {
      cancelAnimationFrame(raf);
      resize.disconnect();
      view.disconnect();
      document.removeEventListener("visibilitychange", run);
      host.removeEventListener("pointermove", aim);
      host.removeEventListener("pointerleave", release);
      host.removeEventListener("pointercancel", release);
    };
  }, []);

  return (
    <div ref={root} aria-hidden className={cn("group/wordmark select-none overflow-hidden touch-pan-y", className)}>
      <div className="mx-auto max-w-[1335px] px-4 md:px-6 [container-type:inline-size]">
        <div
          style={{ fontSize: `calc(100cqw * ${WORD.share} / ${WORD.ems})` }}
          className={cn(serif.className, "relative z-10 -mb-[0.16em] whitespace-nowrap text-center leading-[0.95]")}
        >
          {[...LETTERS].map((letter, index) => (
            <span key={index} style={{ "--i": index } as CSSProperties} className={LETTER}>
              {letter}
            </span>
          ))}
        </div>
      </div>
      <canvas ref={band} className="relative z-20 block h-[clamp(72px,9vw,130px)] w-full" />
    </div>
  );
}
