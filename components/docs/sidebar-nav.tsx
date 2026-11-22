"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavGroup } from "@/lib/registry";
import { componentPath, componentsPath } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { MotionPill } from "./motion-pill";
import { NewBadge } from "./new-badge";

const START_LINKS = [
  ["Home", "/", "/icons/home.svg"],
  ["All Components", componentsPath, "/icons/grid-plus.svg"],
] as const;

const ROW = "flex items-center gap-2 rounded-lg px-3 py-2 text-sm focus-ring transition-colors hover:bg-foreground/[.04]";
const LABEL = "eyebrow px-3 pb-1 text-foreground/40";

export function SidebarNav({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname();
  const activeCategory = groups.find(([, items]) => items.some((c) => componentPath(c.slug) === pathname))?.[0];
  return (
    <>
      <nav aria-label="Components" className="flex flex-col gap-8 px-5 py-8 md:py-14">
        <div className="space-y-1">
          <p className={LABEL}>Getting started</p>
          {START_LINKS.map(([name, href, icon]) => (
            <Link key={name} href={href} aria-current={pathname === href ? "page" : undefined} className={cn(ROW, pathname === href ? "font-medium text-foreground" : "text-muted")}>
              <span className="flex size-4 items-center justify-center">
                <Image aria-hidden src={icon} alt="" width={13} height={13} />
              </span>
              {name}
            </Link>
          ))}
        </div>
        <div className="space-y-1">
          <p className={LABEL}>Components</p>
          {groups.map(([category, items]) => (
            <details key={category} open={category === activeCategory} className="group/category">
              <summary className={cn(ROW, "cursor-pointer list-none text-muted [&::-webkit-details-marker]:hidden")}>
                <Image aria-hidden src="/icons/chevron-right.svg" alt="" width={16} height={16} className="transition-transform group-open/category:rotate-90" />
                {category}
              </summary>
              <ul className="my-1 ml-5 space-y-0.5 border-l border-foreground/[.08]">
                {items.map((c) => {
                  const active = pathname === componentPath(c.slug);
                  return (
                    <li key={c.slug}>
                      <Link
                        href={componentPath(c.slug)}
                        aria-current={active ? "page" : undefined}
                        className={cn(ROW, "justify-between whitespace-nowrap pl-[15px]", active ? "font-medium text-foreground" : "text-muted")}
                      >
                        {c.name}
                        {c.isNew && <NewBadge />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </details>
          ))}
        </div>
      </nav>
      <MotionPill className="mx-5 mb-6 mt-auto w-fit" />
    </>
  );
}
