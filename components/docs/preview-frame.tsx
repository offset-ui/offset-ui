"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { previewPath } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { Card } from "./card";

type PreviewFrameProps = {
  slug: string;
  title: string;
  children: ReactNode;
};

const TABS = ["Preview", "Code"] as const;
const DESIGN_HEIGHT = 560;
const WINDOW = "h-[420px] w-full md:h-[clamp(400px,calc(100svh-484px),560px)]";

export function PreviewFrame({ slug, title, children }: PreviewFrameProps) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Preview");
  const [run, setRun] = useState(0);
  const [scale, setScale] = useState(1);
  const frame = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const box = frame.current!;
    const observer = new ResizeObserver(() => {
      if (box.clientHeight) setScale(matchMedia("(min-width: 768px)").matches ? Math.min(1, box.clientHeight / DESIGN_HEIGHT) : 1);
    });
    observer.observe(box);
    return () => observer.disconnect();
  }, []);
  const header = (
    <>
      <div role="tablist" aria-label="View" className="flex rounded-full bg-black/5 p-0.5">
        {TABS.map((name) => (
          <button
            key={name}
            type="button"
            role="tab"
            aria-selected={tab === name}
            onClick={() => setTab(name)}
            className={cn("rounded-full px-3 py-1 text-xs focus-ring transition-colors", tab === name ? "bg-white font-medium text-foreground" : "text-foreground/40 hover:text-foreground")}
          >
            {name}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setRun((n) => n + 1)}
        className={cn("smooth flex items-center gap-[5px] rounded-md px-2.5 py-1 text-xs font-medium text-muted focus-ring transition-colors hover:bg-black/5", tab === "Code" && "invisible")}
      >
        <Image aria-hidden src="/icons/reload.svg" alt="" width={14} height={14} />
        Replay
      </button>
    </>
  );
  return (
    <Card header={header} headerClassName="px-1.5">
      <div ref={frame} hidden={tab !== "Preview"} className={cn("relative overflow-hidden", WINDOW)}>
        <iframe
          key={run}
          src={previewPath(slug)}
          title={`${title} preview`}
          loading="lazy"
          className="absolute left-0 top-0 origin-top-left bg-white"
          style={{ width: `${100 / scale}%`, height: `${100 / scale}%`, scale }}
        />
      </div>
      <div role="tabpanel" hidden={tab !== "Code"} className={cn("overflow-auto", WINDOW)}>
        {children}
      </div>
    </Card>
  );
}
