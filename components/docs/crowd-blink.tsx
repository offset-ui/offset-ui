"use client";

import { useEffect } from "react";

const BLINK_MS = 140;
const CLOSED = 0.08;

export function CrowdBlink() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const stops = [...document.querySelectorAll<HTMLElement>("[data-peep]")].map((figure) => {
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
    return () => stops.forEach((stop) => stop());
  }, []);

  return null;
}
