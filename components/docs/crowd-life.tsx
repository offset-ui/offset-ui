"use client";

import { useEffect, useRef, useState } from "react";

const BLINK_MS = 140;
const CLOSED = 0.08;
const BUBBLE_MS = 3200;
const EDGE = 118;
const TOP_SAFE = 120;

type Bubble = { text: string; x: number; y: number };

export function CrowdLife() {
  const host = useRef<HTMLDivElement>(null);
  const [bubble, setBubble] = useState<Bubble | null>(null);

  useEffect(() => {
    const crowd = host.current!.parentElement!;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canHover = matchMedia("(hover: hover)").matches;

    const stops = reduce
      ? []
      : [...crowd.querySelectorAll<HTMLElement>("[data-peep]")].map((figure) => {
          let timer = 0;
          const wait = () => {
            timer = window.setTimeout(() => {
              figure.style.setProperty("--blink", String(CLOSED));
              timer = window.setTimeout(() => {
                figure.style.setProperty("--blink", "1");
                wait();
              }, BLINK_MS);
            }, 1500 + Math.random() * 6500);
          };
          wait();
          return () => window.clearTimeout(timer);
        });

    let hide = 0;
    let showing = false;
    let hovering = false;
    let last: HTMLElement | null = null;

    const say = (el: HTMLElement) => {
      const figure = el.getBoundingClientRect();
      const area = crowd.getBoundingClientRect();
      window.clearTimeout(hide);
      showing = true;
      setBubble({ text: el.dataset.say!, x: Math.min(Math.max(figure.left - area.left + figure.width / 2, EDGE), area.width - EDGE), y: figure.top - area.top + figure.height * 0.1 });
      hide = window.setTimeout(() => {
        showing = false;
        setBubble(null);
      }, BUBBLE_MS);
    };
    const silence = () => {
      window.clearTimeout(hide);
      showing = false;
      setBubble(null);
    };
    const speaker = (e: Event) => (e.target as Element).closest<HTMLElement>("[data-say]");

    const over = (e: MouseEvent) => {
      const el = speaker(e);
      if (!el) return;
      hovering = true;
      say(el);
    };
    const out = (e: MouseEvent) => {
      const el = speaker(e);
      if (!el || el.contains(e.relatedTarget as Node)) return;
      hovering = false;
      silence();
    };

    let auto = 0;
    const onScreen = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      const headX = r.left + r.width / 2;
      const headY = r.top + r.height * 0.1;
      return headX > 16 && headX < innerWidth - 16 && headY > TOP_SAFE && headY < innerHeight - 16;
    };
    const chatter = () => {
      auto = window.setTimeout(() => {
        if (!document.hidden && !showing && !hovering) {
          const options = [...crowd.querySelectorAll<HTMLElement>("[data-say]")].filter((el) => el !== last && onScreen(el));
          if (options.length) {
            last = options[Math.floor(Math.random() * options.length)];
            say(last);
          }
        }
        chatter();
      }, 1800 + Math.random() * 4200);
    };
    if (!reduce) chatter();

    if (canHover) {
      crowd.addEventListener("mouseover", over);
      crowd.addEventListener("mouseout", out);
    }
    return () => {
      stops.forEach((stop) => stop());
      window.clearTimeout(hide);
      window.clearTimeout(auto);
      crowd.removeEventListener("mouseover", over);
      crowd.removeEventListener("mouseout", out);
    };
  }, []);

  return (
    <div ref={host} className="pointer-events-none absolute inset-0 z-20">
      {bubble && (
        <div className="absolute w-max max-w-[220px] -translate-x-1/2 -translate-y-full pb-2" style={{ left: bubble.x, top: bubble.y }}>
          <div className="relative rounded-2xl border border-black/[.08] bg-white px-3.5 py-2 text-[13px] font-medium leading-snug shadow-[0_10px_28px_-10px_rgba(0,0,0,.2)] motion-safe:animate-[rise_.18s_ease-out_both]">
            {bubble.text}
            <span aria-hidden className="absolute left-1/2 top-full -mt-1 size-2 -translate-x-1/2 rotate-45 border-b border-r border-black/[.08] bg-white" />
          </div>
        </div>
      )}
    </div>
  );
}
