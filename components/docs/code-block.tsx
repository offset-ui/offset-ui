"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type CodeBlockProps = {
  code: string;
  /** File name or label shown in the header. */
  title?: string;
  className?: string;
};

/** Code longer than this many lines starts collapsed. */
const COLLAPSE_AFTER = 14;

export function CodeBlock({ code, title, className }: CodeBlockProps) {
  const long = code.split("\n").length > COLLAPSE_AFTER;
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(!long);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className={cn("overflow-hidden rounded-xl border border-black/10 bg-stone-950 text-stone-100", className)}>
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
        <span className="truncate font-mono text-xs text-stone-400">{title}</span>
        <button
          type="button"
          onClick={copy}
          className="rounded-md px-2.5 py-1 text-xs font-medium text-stone-300 outline-none transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/60"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className={cn("overflow-auto p-4 font-mono text-[13px] leading-relaxed", !expanded && "max-h-80")}>
        <code>{code}</code>
      </pre>
      {long && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="w-full border-t border-white/10 py-2.5 text-xs font-medium text-stone-400 outline-none transition-colors hover:bg-white/5 hover:text-stone-200 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/60"
        >
          {expanded ? "Collapse" : "Show full code"}
        </button>
      )}
    </div>
  );
}
