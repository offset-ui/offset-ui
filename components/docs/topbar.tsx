import Image from "next/image";
import Link from "next/link";
import { formatCount } from "@/lib/format";
import { getStarCount } from "@/lib/github";
import { NAV, NAV_GROUPS } from "@/lib/registry";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";
import { MobileDock } from "./mobile-dock";
import { MotionPill } from "./motion-pill";
import { Search } from "./search";
import { SquircleLayer } from "./squircle-layer";

export async function Topbar({ motion = true, bordered = false }: { motion?: boolean; bordered?: boolean }) {
  const stars = await getStarCount();
  return (
    <>
    <header className={cn("sticky top-0 z-30 h-(--topbar-h) bg-background/85 backdrop-blur", bordered && "border-b border-foreground/[.08]")}>
      <div className="relative mx-auto flex h-full max-w-[1335px] items-center justify-between gap-3 px-4 md:grid md:grid-cols-[1fr_auto_1fr] md:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" aria-label={SITE.name} className="flex items-center gap-2 rounded-md focus-ring">
            <Image src="/brand/logo-mark.svg" alt="" width={20} height={20} priority />
            <span aria-hidden className="text-lg font-[450] tracking-[-0.08em]">OffsetUI</span>
          </Link>
          <p className="hidden text-sm text-muted lg:block">
            Created by{" "}
            <a href={SITE.socials.linkedin} target="_blank" rel="noreferrer" className="focus-ring rounded-sm font-medium text-foreground hover:underline">
              {SITE.author}
            </a>
          </p>
        </div>
        <Search items={NAV} />
        <div className="flex items-center justify-end gap-6">
          <a
            href={SITE.github}
            target="_blank"
            rel="noreferrer"
            aria-label={stars ? `GitHub, ${stars} stars` : "GitHub"}
            className={cn("smooth flex items-center gap-2 rounded-(--radius-control) bg-foreground/5 px-3 py-1.5 text-sm text-muted transition-colors hover:bg-foreground/[.08] [--sq-fill:color-mix(in_srgb,var(--foreground)_5%,transparent)] hover:[--sq-fill:color-mix(in_srgb,var(--foreground)_8%,transparent)]", "focus-ring")}
          >
            <SquircleLayer radius="--radius-control" fill="var(--sq-fill)" />
            <Image aria-hidden src="/icons/github.svg" alt="" width={18} height={18} className="shrink-0" />
            <span aria-hidden className="flex h-[15px] w-0.5 shrink-0 items-center justify-center">
              <Image src="/icons/divider.svg" alt="" width={15} height={1} className="max-w-none rotate-90" />
            </span>
            <span className="flex items-center gap-[5px]">
              <span aria-hidden className="relative size-4 shrink-0">
                <Image src="/icons/star.svg" alt="" width={13} height={12} className="absolute inset-[8.39%_10.23%_15.6%_10.23%] block size-auto max-w-none" />
              </span>
              {stars ? <span>{formatCount(stars)}</span> : null}
            </span>
          </a>
          {motion && <MotionPill className="hidden lg:flex" />}
        </div>
      </div>
    </header>
    <MobileDock groups={NAV_GROUPS} />
    </>
  );
}
