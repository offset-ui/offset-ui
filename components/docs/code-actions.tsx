"use client";

import { useFlash } from "./use-flash";

const button =
  "rounded-md px-2.5 py-1 text-xs font-medium text-stone-600 focus-ring transition-colors hover:bg-black/5";

export function CopyButton() {
  const [copied, flash] = useFlash(1600);

  function copy(e: React.MouseEvent<HTMLButtonElement>) {
    const text = e.currentTarget.closest("[data-code]")?.querySelector("pre")?.textContent ?? "";
    navigator.clipboard.writeText(text).then(flash, () => window.prompt("Copy this code", text));
  }

  return (
    <button type="button" onClick={copy} className={button}>
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function CollapseToggle() {
  return (
    <button
      type="button"
      onClick={(e) => {
        const block = e.currentTarget.closest<HTMLElement>("[data-code]");
        if (block) block.dataset.expanded = block.dataset.expanded === "true" ? "false" : "true";
      }}
      className="w-full border-t border-black/[.08] bg-stone-50 py-2.5 text-xs font-medium text-stone-500 focus-ring transition-colors hover:bg-black/[.04] hover:text-stone-800 focus-visible:ring-inset"
    >
      <span className="group-data-[expanded=true]/code:hidden">Show full code</span>
      <span className="hidden group-data-[expanded=true]/code:inline">Collapse</span>
    </button>
  );
}
