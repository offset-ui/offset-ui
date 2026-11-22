"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type TocItem = { id: string; label: string; hint: string; files?: { id: string; name: string }[] };

export function OnThisPage({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState(items[0].id);

  useEffect(() => {
    const view = new IntersectionObserver((entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)), { rootMargin: "-20% 0px -70% 0px" });
    items.forEach(({ id }) => view.observe(document.getElementById(id)!));
    return () => view.disconnect();
  }, [items]);

  return (
    <aside className="hidden w-64 shrink-0 border-l border-foreground/[.08] xl:block">
      <nav aria-label="On this page" className="sticky top-(--topbar-h) max-h-[calc(100svh-var(--topbar-h)-var(--footer-h))] space-y-3 overflow-y-auto px-5 py-14">
        <p className="eyebrow px-3 text-foreground/40">On this page</p>
        <ul className="ml-3 border-l border-foreground/[.08]">
          {items.map(({ id, label, hint, files }) => (
            <li key={id} className="relative">
              {active === id && <span aria-hidden className="absolute -left-px top-1 bottom-1 w-0.5 rounded-full bg-foreground" />}
              <a href={`#${id}`} aria-current={active === id ? "location" : undefined} className="block rounded-sm py-1.5 pl-3 focus-ring">
                <span className={cn("block text-sm", active === id ? "text-foreground" : "text-muted")}>{label}</span>
                <span className="block text-xs text-foreground/40">{hint}</span>
              </a>
              {files?.map((file) => (
                <a key={file.id} href={`#${file.id}`} className="block break-all rounded-sm py-1 pl-8 font-mono text-xs text-foreground/40 transition-colors hover:text-foreground focus-ring">
                  {file.name}
                </a>
              ))}
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
