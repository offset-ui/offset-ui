"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { COMPONENTS } from "@/lib/registry";
import { cn } from "@/lib/utils";

const GROUPS = COMPONENTS.reduce<Record<string, typeof COMPONENTS>>((groups, c) => ({ ...groups, [c.category]: [...(groups[c.category] ?? []), c] }), {});

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="border-b border-black/10 md:sticky md:top-14 md:h-[calc(100vh-3.5rem)] md:w-64 md:shrink-0 md:overflow-y-auto md:border-b-0 md:border-r">
      <nav aria-label="Components" className="flex gap-4 overflow-x-auto p-3 md:flex-col md:gap-6 md:overflow-x-visible md:p-5">
        {Object.entries(GROUPS).map(([category, items]) => (
          <div key={category} className="flex shrink-0 items-center gap-1 md:block md:space-y-1">
            <p className="hidden items-center justify-between px-3 pb-1 text-xs font-medium uppercase tracking-wider text-stone-400 md:flex">
              {category}
              <span className="font-mono normal-case tracking-normal">{items.length}</span>
            </p>
            {items.map((c) => {
              const active = pathname === `/components/${c.slug}`;
              return (
                <Link
                  key={c.slug}
                  href={`/components/${c.slug}`}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center justify-between gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-stone-400",
                    active ? "bg-black/[.06] font-medium" : "text-stone-600 hover:bg-black/[.04]",
                  )}
                >
                  {c.name}
                  {c.isNew && <span className="rounded-full bg-[#F494BA]/25 px-2 py-0.5 text-[10px] font-medium text-pink-800">New</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
