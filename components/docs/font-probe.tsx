"use client";

import { useEffect } from "react";

/** Marks <html data-sf> when SF Compact is installed, so the headline switches to Figma's exact -9% tracking. */
export function FontProbe() {
  useEffect(() => {
    document.fonts
      .load('56px "SF Compact Brand"')
      .then((faces) => {
        if (faces.length) document.documentElement.dataset.sf = "";
      })
      .catch(() => {});
  }, []);
  return null;
}
