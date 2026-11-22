"use client";

import { useEffect, useRef, useState } from "react";
import { previewPath } from "@/lib/routes";
import { cn } from "@/lib/utils";

const FRAME = "pointer-events-none absolute left-0 top-0 h-[200%] w-[200%] origin-top-left scale-50 border-0 transition-opacity duration-300";
const FILL = 0.78;
const MAX_ZOOM = 3;
const SKIP_FIT_PAGES = 4;
const SCROLL_PAGES = 3;
const SETTLE_MS = 150;
const SETTLE_TRIES = 20;
const STEP_MS = 1100;
const PRESS_DELAY_MS = 450;
const MAX_TARGETS = 8;

type Playable = Window & typeof globalThis;

type Area = { left: number; right: number; top: number; bottom: number };

const union = (areas: Area[]): Area => ({
  left: Math.min(...areas.map((r) => r.left)),
  right: Math.max(...areas.map((r) => r.right)),
  top: Math.min(...areas.map((r) => r.top)),
  bottom: Math.max(...areas.map((r) => r.bottom)),
});

function paintedArea(win: Playable, root: Element): Area | null {
  const rects = [root, ...root.querySelectorAll("*")]
    .filter((el) => {
      const style = win.getComputedStyle(el);
      const visible = style.visibility !== "hidden" && style.opacity !== "0";
      const paints =
        el.matches("img, svg, canvas, video") ||
        style.backgroundImage !== "none" ||
        style.backgroundColor !== "rgba(0, 0, 0, 0)" ||
        parseFloat(style.borderTopWidth) > 0 ||
        [...el.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim());
      return visible && paints;
    })
    .map((el) => el.getBoundingClientRect())
    .filter((r) => r.width && r.height);
  return rects.length ? union(rects) : null;
}

const measure = (win: Playable) => [...(win.document.querySelector("main")?.children ?? [])].map((child) => paintedArea(win, child)).filter((area) => area !== null);

const snapshot = (win: Playable) => JSON.stringify([win.innerWidth, win.innerHeight, ...measure(win).map((area) => Object.values(area).map(Math.round))]);

async function measureSettled(win: Playable) {
  let last = snapshot(win);
  for (let tries = 0; tries < SETTLE_TRIES; tries++) {
    await new Promise((resolve) => win.setTimeout(resolve, SETTLE_MS));
    const next = snapshot(win);
    if (next === last) break;
    last = next;
  }
  return measure(win);
}

function fitToFrame(win: Playable, areas: Area[]) {
  const { documentElement, body } = win.document;
  const main = win.document.querySelector("main");
  if (!main || !areas.length) return;
  let area = union(areas);
  if (area.bottom - area.top > win.innerHeight * SKIP_FIT_PAGES) return;
  const firstOnly = areas.length > 1 && area.bottom - area.top > win.innerHeight * FILL;
  if (firstOnly) area = areas[0];
  const { left, right, top, bottom } = area;
  const zoom = Math.min(MAX_ZOOM, (win.innerWidth * FILL) / (right - left), (win.innerHeight * FILL) / (bottom - top));
  const [x, y] = [(left + right) / 2, (top + bottom) / 2];
  const page = main.getBoundingClientRect();
  const background = win.getComputedStyle(main).backgroundColor;
  for (const el of [documentElement, body]) {
    el.style.background = background;
    el.style.overflow = "hidden";
  }
  if (firstOnly) [...main.children].slice(1).forEach((el) => ((el as HTMLElement).style.visibility = "hidden"));
  main.style.transformOrigin = `${x - page.left}px ${y - page.top}px`;
  main.style.transform = `translate(${win.innerWidth / 2 - x}px, ${win.innerHeight / 2 - y}px) scale(${zoom})`;
}

function playDemo(win: Playable) {
  const doc = win.document;
  const targets = [...doc.querySelectorAll<HTMLElement>("main button:not(:disabled), main [role=switch], main input[type=checkbox]")]
    .filter((el) => el.getClientRects().length && !/copy/i.test(`${el.textContent} ${el.getAttribute("aria-label")}`))
    .slice(0, MAX_TARGETS);
  const timers: number[] = [];
  let turn = 0;

  const send = (el: Element, type: string, x: number, y: number) => el.dispatchEvent(new win.PointerEvent(type, { bubbles: true, clientX: x, clientY: y, pointerType: "mouse", isPrimary: true }));

  const step = () => {
    if (doc.documentElement.scrollHeight > win.innerHeight * SCROLL_PAGES) win.scrollBy({ top: win.innerHeight * 0.6, behavior: "smooth" });
    const button = targets[turn % targets.length];
    const rect = (button ?? doc.querySelector("main > *"))?.getBoundingClientRect();
    if (!rect) return;
    const x = rect.left + rect.width * (button ? 0.5 : 0.15 + 0.7 * ((turn * 0.37) % 1));
    const y = rect.top + rect.height * (button ? 0.5 : 0.3 + 0.4 * ((turn * 0.61) % 1));
    const el = button ?? doc.elementFromPoint(x, y);
    turn++;
    if (!el) return;
    for (const type of ["pointerover", "pointerenter", "pointermove"]) send(el, type, x, y);
    timers.push(
      win.setTimeout(() => {
        if (button) button.click();
        else for (const type of ["pointerdown", "pointerup"]) send(el, type, x, y);
      }, PRESS_DELAY_MS),
    );
  };

  step();
  const loop = win.setInterval(step, STEP_MS);
  return () => {
    win.clearInterval(loop);
    timers.forEach((id) => win.clearTimeout(id));
  };
}

export function LiveThumbnail({ slug, play = false }: { slug: string; play?: boolean }) {
  const [ready, setReady] = useState(false);
  const stop = useRef<() => void>(undefined);
  const started = useRef(false);

  useEffect(() => () => stop.current?.(), []);

  async function settle(frame: HTMLIFrameElement) {
    if (started.current) return;
    started.current = true;
    const win = frame.contentWindow as Playable;
    await win.document.fonts.ready;
    const areas = await measureSettled(win);
    if (!frame.isConnected) return;
    fitToFrame(win, areas);
    if (play) stop.current = playDemo(win);
    setReady(true);
  }

  return (
    <iframe
      ref={(frame) => {
        if (frame?.contentWindow?.location.pathname === previewPath(slug) && frame.contentDocument?.readyState === "complete") settle(frame);
      }}
      src={previewPath(slug)}
      scrolling="no"
      title=""
      tabIndex={-1}
      onLoad={(e) => settle(e.currentTarget)}
      className={cn(FRAME, ready ? "opacity-100" : "opacity-0")}
    />
  );
}
