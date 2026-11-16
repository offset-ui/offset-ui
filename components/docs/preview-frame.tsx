"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type PreviewFrameProps = {
  slug: string;
  title: string;
  height: number;
  children: ReactNode;
};

const TABS = ["Preview", "Code"] as const;
const BUTTON = "rounded-md px-2.5 py-1 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-stone-400";

export function PreviewFrame({ slug, title, height, children }: PreviewFrameProps) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Preview");
  const [run, setRun] = useState(0);
  const src = `/preview/${slug}`;
  return (
    <div className="overflow-hidden rounded-2xl border border-black/[.08] bg-white">
      <div className="flex items-center justify-between border-b border-black/[.08] px-3 py-2">
        <div role="tablist" aria-label="View" className="flex gap-1 rounded-lg bg-black/[.05] p-0.5">
          {TABS.map((name) => (
            <button
              key={name}
              type="button"
              role="tab"
              aria-selected={tab === name}
              onClick={() => setTab(name)}
              className={cn(BUTTON, "px-3", tab === name ? "bg-white text-foreground shadow-sm" : "text-stone-500 hover:text-foreground")}
            >
              {name}
            </button>
          ))}
        </div>
        <div className={cn("flex items-center gap-1", tab === "Code" && "invisible")}>
          <button type="button" onClick={() => setRun((n) => n + 1)} className={cn(BUTTON, "text-stone-600 hover:bg-black/5")}>
            Replay
          </button>
          <a href={src} target="_blank" rel="noreferrer" className={cn(BUTTON, "text-stone-600 hover:bg-black/5")}>
            Open
          </a>
        </div>
      </div>
      <iframe key={run} src={src} title={`${title} preview`} hidden={tab !== "Preview"} className="block w-full bg-[#fafaf9]" style={{ height }} loading="lazy" />
      <div role="tabpanel" hidden={tab !== "Code"} className="p-2">
        {children}
      </div>
    </div>
  );
}
