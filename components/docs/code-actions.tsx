"use client";

import { useState } from "react";

const button =
  "rounded-md px-2.5 py-1 text-xs font-medium text-stone-300 outline-none transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/60";

/** Copies the text of the nearest code block, read from the page so the code is not sent to the browser twice. */
export function CopyButton() {
  const [copied, setCopied] = useState(false);

  async function copy(e: React.MouseEvent<HTMLButtonElement>) {
    const text = e.currentTarget.closest("[data-code]")?.querySelector("pre")?.textContent ?? "";
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button type="button" onClick={copy} className={button}>
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

/** Flips `data-expanded` on the code block; the CSS shows the right label and height. */
export function CollapseToggle() {
  return (
    <button
      type="button"
      onClick={(e) => {
        const block = e.currentTarget.closest<HTMLElement>("[data-code]");
        if (block) block.dataset.expanded = block.dataset.expanded === "true" ? "false" : "true";
      }}
      className="w-full border-t border-white/10 py-2.5 text-xs font-medium text-stone-400 outline-none transition-colors hover:bg-white/5 hover:text-stone-200 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/60"
    >
      <span className="group-data-[expanded=true]/code:hidden">Show full code</span>
      <span className="hidden group-data-[expanded=true]/code:inline">Collapse</span>
    </button>
  );
}
