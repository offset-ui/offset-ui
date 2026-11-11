"use client";

import { useState } from "react";

type PreviewFrameProps = {
  slug: string;
  title: string;
  height: number;
};

/** Live demo in an iframe, so each component gets its own viewport, fonts and scroll. */
export function PreviewFrame({ slug, title, height }: PreviewFrameProps) {
  const [run, setRun] = useState(0);
  const src = `/preview/${slug}`;
  return (
    <div className="overflow-hidden rounded-2xl border border-black/10">
      <div className="flex items-center justify-between border-b border-black/10 bg-black/[.02] px-4 py-2">
        <span className="text-xs text-stone-500">Live preview</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setRun((n) => n + 1)}
            className="rounded-md px-2.5 py-1 text-xs font-medium text-stone-600 outline-none transition-colors hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-stone-400"
          >
            Replay
          </button>
          <a
            href={src}
            target="_blank"
            rel="noreferrer"
            className="rounded-md px-2.5 py-1 text-xs font-medium text-stone-600 outline-none transition-colors hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-stone-400"
          >
            Open
          </a>
        </div>
      </div>
      <iframe key={run} src={src} title={`${title} preview`} className="block w-full bg-[#fafaf9]" style={{ height }} loading="lazy" />
    </div>
  );
}
