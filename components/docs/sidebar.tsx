"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { COMPONENTS } from "@/lib/registry";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="border-b border-black/10 md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0 md:border-b-0 md:border-r">
      <div className="flex h-full flex-col gap-4 p-4 md:p-6">
        <Link href="/" aria-label={SITE.name} className="w-fit rounded-md outline-none focus-visible:ring-2 focus-visible:ring-stone-400">
          <Image src="/brand/logo-complete-light.svg" alt="" width={110} height={24} />
        </Link>

        <nav aria-label="Components" className="-mx-1 flex gap-1 overflow-x-auto md:flex-1 md:flex-col md:overflow-y-auto md:overflow-x-visible">
          <span className="hidden px-3 pb-1 text-xs font-medium uppercase tracking-wider text-stone-400 md:block">Components</span>
          {COMPONENTS.map((c) => {
            const active = pathname === `/components/${c.slug}`;
            return (
              <Link
                key={c.slug}
                href={`/components/${c.slug}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex shrink-0 items-center justify-between gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-stone-400",
                  active ? "bg-black/[.06] font-medium" : "text-stone-600 hover:bg-black/[.04]",
                )}
              >
                {c.name}
                {c.isNew && <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-700">New</span>}
              </Link>
            );
          })}
        </nav>

        <a
          href={SITE.github}
          target="_blank"
          rel="noreferrer"
          className="hidden rounded-xl border border-black/10 p-3 text-xs leading-relaxed text-stone-600 outline-none transition-colors hover:bg-black/[.03] focus-visible:ring-2 focus-visible:ring-stone-400 md:block"
        >
          <span className="font-medium text-foreground">★ Star on GitHub</span>
          <br />
          Every star helps us ship the next component sooner.
        </a>
      </div>
    </aside>
  );
}
