"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_GROUPS } from "@/lib/registry";
import { componentPath } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { NewBadge } from "./new-badge";

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="border-b border-black/[.08] md:sticky md:top-(--topbar-h) md:h-[calc(100vh-var(--topbar-h))] md:w-64 md:shrink-0 md:overflow-y-auto md:border-b-0 md:border-r">
      <nav aria-label="Components" className="flex gap-4 overflow-x-auto p-3 md:flex-col md:gap-6 md:overflow-x-visible md:p-5">
        {NAV_GROUPS.map(([category, items]) => (
          <div key={category} className="flex shrink-0 items-center gap-1 md:block md:space-y-1">
            <p className="hidden px-3 pb-1 text-xs text-stone-400 md:block">{category}</p>
            {items.map((c) => {
              const active = pathname === componentPath(c.slug);
              return (
                <Link
                  key={c.slug}
                  href={componentPath(c.slug)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center justify-between gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm focus-ring transition-colors",
                    active ? "bg-black/[.06] font-medium" : "text-stone-600 hover:bg-black/[.04]",
                  )}
                >
                  {c.name}
                  {c.isNew && <NewBadge />}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
