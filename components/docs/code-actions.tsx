"use client";

import { useState } from "react";

const button =
  "rounded-md px-2.5 py-1 text-xs font-medium text-stone-600 outline-none transition-colors hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-stone-400";

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
      className="w-full border-t border-black/[.08] bg-stone-50 py-2.5 text-xs font-medium text-stone-500 outline-none transition-colors hover:bg-black/[.04] hover:text-stone-800 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stone-400"
    >
      <span className="group-data-[expanded=true]/code:hidden">Show full code</span>
      <span className="hidden group-data-[expanded=true]/code:inline">Collapse</span>
    </button>
  );
}
