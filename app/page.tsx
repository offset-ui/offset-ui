import type { CSSProperties } from "react";
import Link from "next/link";
import { Crowd } from "@/components/docs/crowd";
import { Footer } from "@/components/docs/footer";
import { Topbar } from "@/components/docs/topbar";
import { formatCount } from "@/lib/format";
import { getStarCount } from "@/lib/github";
import { COMPONENTS } from "@/lib/registry";
import { SITE } from "@/lib/site";

const PLACEHOLDER_COUNT = 16;
const PLACEHOLDERS = Array.from({ length: PLACEHOLDER_COUNT }, (_, i) => i);
const PAGE_BACKGROUND = { "--background": "#f6f7f9" } as CSSProperties;
const FOCUS = "outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background";
const BUTTON = `inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-full px-5 text-sm font-medium transition-colors ${FOCUS}`;
const CARD = "group block rounded-[22px] bg-black/[.04] p-1.5 ring-1 ring-black/[.04] transition-colors";

function Card({ index, children }: { index: number; children: React.ReactNode }) {
  return (
    <li className="card-in" style={{ "--i": index } as CSSProperties}>
      {children}
    </li>
  );
}

function CardText({ name, description, badge, variants }: { name: string; description: string; badge?: string; variants: string }) {
  return (
    <div className="space-y-1 px-3 pb-3 pt-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="truncate font-medium">{name}</h3>
          {badge && <span className="rounded-full bg-[#F494BA]/25 px-2 py-0.5 text-[10px] font-medium text-pink-800">{badge}</span>}
        </div>
        <span className="shrink-0 font-mono text-xs text-stone-500">{variants}</span>
      </div>
      <p className="line-clamp-2 text-sm leading-relaxed text-stone-500">{description}</p>
    </div>
  );
}

export default async function Home() {
  const stars = await getStarCount();
  return (
    <div style={PAGE_BACKGROUND} className="flex min-h-screen flex-col bg-background">
      <Topbar stars={stars} contained />

      <section className="bg-white pt-14 text-center md:pt-20">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 motion-safe:animate-[rise_.7s_ease-out_both]">
          <h1 className="text-balance text-4xl font-semibold leading-[1.08] tracking-[-0.03em] sm:text-5xl">
            Make interfaces people want to{" "}
            <span className="bg-[linear-gradient(transparent_62%,#F494BA_62%,#F494BA_92%,transparent_92%)] px-1">touch twice.</span>
          </h1>
          <p className="max-w-2xl text-balance text-base leading-relaxed text-stone-600 md:text-lg">
            Original components crafted by a designer, each with the prompt and the code to rebuild it in your AI agent of choice. MIT licensed. Free to use for personal and commercial use.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/components" className={`${BUTTON} bg-foreground text-background hover:bg-foreground/85`}>
              Browse components
              <span aria-hidden>→</span>
            </Link>
            <a href={SITE.github} target="_blank" rel="noreferrer" className={`${BUTTON} bg-black/[.06] text-stone-800 hover:bg-black/10`}>
              <span aria-hidden className="text-amber-500">
                ★
              </span>
              Star on GitHub
              {stars ? <span className="rounded-full bg-black/[.06] px-2 py-0.5 text-xs tabular-nums text-stone-600">{formatCount(stars)}</span> : null}
            </a>
          </div>
        </div>
        <Crowd className="mt-12 h-36 sm:h-44 md:aspect-[1440/290] md:h-auto" />
      </section>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16 pt-14 md:px-6">
        <section aria-labelledby="all">
          <div className="mb-5 flex items-baseline justify-between">
            <h2 id="all" className="text-2xl font-semibold tracking-tight">
              All components
            </h2>
            <span className="font-mono text-sm text-stone-500">{COMPONENTS.length} components</span>
          </div>

          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {COMPONENTS.map((c, i) => (
              <Card key={c.slug} index={i}>
                <Link href={`/components/${c.slug}`} className={`${CARD} hover:bg-black/[.07] ${FOCUS}`}>
                  <div aria-hidden className="relative h-44 overflow-hidden rounded-2xl bg-white">
                    <iframe src={`/preview/${c.slug}`} scrolling="no" title="" tabIndex={-1} loading="lazy" className="pointer-events-none absolute left-0 top-0 h-[200%] w-[200%] origin-top-left scale-50 border-0" />
                  </div>
                  <CardText name={c.name} description={c.description} badge={c.isNew ? "New" : undefined} variants="1 variant" />
                </Link>
              </Card>
            ))}

            {PLACEHOLDERS.map((i) => (
              <Card key={`placeholder-${i}`} index={COMPONENTS.length + i}>
                <div aria-hidden className={CARD}>
                  <div className="flex h-44 flex-col items-center justify-center gap-2 rounded-2xl bg-white">
                    <span className="h-3 w-28 rounded-full bg-black/[.06]" />
                    <span className="h-3 w-16 rounded-full bg-black/[.04]" />
                  </div>
                  <CardText name="Coming soon" description="A new component is on the way." badge="Soon" variants="—" />
                </div>
              </Card>
            ))}
          </ul>
        </section>
      </main>

      <Footer />
    </div>
  );
}
