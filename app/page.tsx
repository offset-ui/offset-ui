import type { CSSProperties } from "react";
import Link from "next/link";
import { Button } from "@/components/docs/button";
import { Crowd } from "@/components/docs/crowd";
import { Footer } from "@/components/docs/footer";
import { SquircleLayer } from "@/components/docs/squircle-layer";
import { NewBadge } from "@/components/docs/new-badge";
import { Topbar } from "@/components/docs/topbar";
import { COMPONENTS } from "@/lib/registry";
import { componentPath, previewPath } from "@/lib/routes";
import { SITE } from "@/lib/site";

const FOCUS = "focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Topbar contained />

      <section className="flex min-h-[calc(100svh-var(--topbar-h))] flex-col border-b border-black/[.08] text-center hero-clip">
        <div className="flex flex-1 items-center justify-center px-4 py-8 [@media(min-height:800px)]:py-16">
          <div className="mx-auto flex max-w-[486px] flex-col items-center gap-6 motion-safe:animate-[rise_.7s_ease-out_both]">
            <h1 className="font-display text-[40px] font-normal leading-[1.086] tracking-(--display-tracking) text-foreground sm:text-5xl md:text-[56px]">
              <span className="block whitespace-nowrap">Make Interfaces people</span>
              <span className="block whitespace-nowrap">
                {"want to  "}
                <em className="shine-text font-[790] italic tracking-(--display-tracking-italic)">touch twice</em>
              </span>
            </h1>
            <p className="text-base leading-[normal] text-muted">
              Original components crafted by a <span className="text-brand">designer</span>, each with the prompt and the code to rebuild it in your AI agent of choice.{" "}
              <span className="text-foreground underline decoration-from-font [text-underline-position:from-font]">MIT licensed.</span> Free to use for personal and commercial use.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 p-1">
              <Button href="/components">Browse components</Button>
              <Button href={SITE.github} variant="outline">
                Star on GitHub
                <span aria-hidden>↗</span>
              </Button>
            </div>
          </div>
        </div>
        {/* Desktop only: the crowd sits a little lower, so its feet run past the bottom of the hero (see .crowd-drop). */}
        <Crowd className="crowd-drop h-36 sm:h-44" />
      </section>

      <main className="mx-auto w-full max-w-[1335px] flex-1 px-4 py-16 md:px-6">
        <section aria-labelledby="all" className="flex flex-col gap-6">
          <div className="flex items-baseline justify-between">
            <h2 id="all" className="text-lg font-medium leading-7 tracking-[-0.025em]">
              All Components
            </h2>
            <span className="text-sm text-muted">{COMPONENTS.length}</span>
          </div>

          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {COMPONENTS.map((c, i) => (
              <li key={c.slug} className="card-in" style={{ "--i": i } as CSSProperties}>
                <Link href={componentPath(c.slug)} className={`group smooth block rounded-(--radius-card) border border-hairline bg-card p-[3px] transition-colors hover:border-foreground/20 [--sq-border:color-mix(in_srgb,var(--foreground)_5%,transparent)] hover:[--sq-border:color-mix(in_srgb,var(--foreground)_20%,transparent)] ${FOCUS}`}>
                  <SquircleLayer radius="--radius-card" fill="var(--card)" border="var(--sq-border)" />
                  <div aria-hidden className="relative h-44 overflow-hidden rounded-[20px] bg-[#f7f7f6]">
                    <iframe src={previewPath(c.slug)} scrolling="no" title="" tabIndex={-1} loading="lazy" className="pointer-events-none absolute left-0 top-0 h-[200%] w-[200%] origin-top-left scale-50 border-0" />
                  </div>
                  <div className="px-3 pb-2 pt-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium leading-5">{c.name}</h3>
                      {c.isNew && <NewBadge />}
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted">{c.description}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <Footer />
    </div>
  );
}
