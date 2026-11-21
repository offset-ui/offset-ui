import Image from "next/image";
import Link from "next/link";
import { formatCount } from "@/lib/format";
import { getStarCount } from "@/lib/github";
import { NAV } from "@/lib/registry";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";
import { Search } from "./search";
import { SquircleLayer } from "./squircle-layer";

const { handle, url } = SITE.creator;

export async function Topbar({ contained = false }: { contained?: boolean }) {
  const stars = await getStarCount();
  return (
    <header className={cn("sticky top-0 z-30 bg-background/85 backdrop-blur", !contained && "border-b border-hairline")}>
      <div className={cn("relative grid h-(--topbar-h) grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 md:px-6", contained && "mx-auto max-w-[1335px]")}>
        <div className="flex items-center gap-6">
          <Link href="/" aria-label={SITE.name} className={cn("rounded-md", "focus-ring")}>
            <Image src="/brand/logo-complete-light.svg" alt="" width={89} height={23} priority />
          </Link>
          <p className="hidden text-sm text-muted lg:block">
            Created by{" "}
            {url ? (
              <a href={url} target="_blank" rel="noreferrer" className={cn("rounded-sm font-medium text-foreground hover:underline", "focus-ring")}>
                @{handle}
              </a>
            ) : (
              <span className="font-medium text-foreground">@{handle}</span>
            )}
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
          <div className="smooth hidden items-center gap-2 rounded-(--radius-control) bg-brand/5 px-3 py-1.5 lg:flex">
            <SquircleLayer radius="--radius-control" fill="color-mix(in srgb, var(--brand) 5%, transparent)" />
            {/* Figma: "Offset" Regular, a slightly wider space, and a 88px-wide text box (2px of trailing room). */}
            <span className="block h-5 whitespace-nowrap font-display text-sm leading-5 tracking-[-0.07em] text-foreground" style={{ wordSpacing: "0.09em", paddingRight: 2 }}>
              <span className="font-normal">Offset</span> <span className="font-futura font-bold italic">MOTION</span>
            </span>
            <span className="smooth rounded-(--radius-badge) bg-brand/8 px-1.5 py-0.5 text-[10px] font-medium leading-[15px] text-brand/75">
              <SquircleLayer radius="--radius-badge" fill="color-mix(in srgb, var(--brand) 8%, transparent)" />
              Coming Soon
            </span>
          </div>
        </div>
        {/* Home only: the stroke runs between the logo and the right-hand buttons, not edge to edge of the 1335px bar. */}
        {contained && <span aria-hidden className="topbar-rule" />}
      </div>
    </header>
  );
}
