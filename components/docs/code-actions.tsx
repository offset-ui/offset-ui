"use client";

import Image from "next/image";
import { useFlash } from "./use-flash";

export function CopyButton() {
  const [copied, flash] = useFlash(1600);

  function copy(e: React.MouseEvent<HTMLButtonElement>) {
    const text = e.currentTarget.closest("[data-code]")?.querySelector("pre")?.textContent ?? "";
    navigator.clipboard.writeText(text).then(flash, () => window.prompt("Copy this code", text));
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Copied" : "Copy code"}
      className="sticky top-3.5 mr-3 mt-3.5 flex h-6 min-w-6 shrink-0 items-center justify-center rounded-md text-xs font-medium text-muted focus-ring transition-colors hover:bg-black/5"
    >
      {copied ? <span className="px-1.5">Copied</span> : <Image aria-hidden src="/icons/copy.svg" alt="" width={16} height={16} />}
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
      className="w-full border-t border-hairline py-2.5 text-xs font-medium text-muted focus-ring transition-colors hover:bg-black/[.03] hover:text-foreground focus-visible:ring-inset"
    >
      <span className="group-data-[expanded=true]/code:hidden">Show full code</span>
      <span className="hidden group-data-[expanded=true]/code:inline">Collapse</span>
    </button>
  );
}
