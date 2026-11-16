import type { CSSProperties } from "react";
import Link from "next/link";
import { Crowd } from "@/components/docs/crowd";
import { Footer } from "@/components/docs/footer";
import { Topbar } from "@/components/docs/topbar";
import { formatCount } from "@/lib/format";
import { getStarCount } from "@/lib/github";
import { COMPONENTS } from "@/lib/registry";
import { SITE } from "@/lib/site";

const FOCUS = "outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background";
const BUTTON = `inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-full px-6 text-sm font-medium transition-colors ${FOCUS}`;

export default async function Home() {
  const stars = await getStarCount();
  return (
    <div className="flex min-h-screen flex-col">
      <Topbar stars={stars} contained />

      <section className="flex min-h-[calc(100svh-3.5rem)] flex-col border-b border-black/[.08] text-center">
        <div className="flex flex-1 items-center justify-center px-4 py-8 [@media(min-height:800px)]:py-16">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-7 motion-safe:animate-[rise_.7s_ease-out_both]">
            <h1 className="text-balance text-4xl font-semibold leading-[1.06] tracking-[-0.035em] sm:text-5xl md:text-[3.5rem]">
              Make interfaces people want to{" "}
              <span className="bg-[linear-gradient(transparent_64%,#F494BA_64%,#F494BA_90%,transparent_90%)] px-1">touch twice.</span>
            </h1>
            <p className="max-w-xl text-balance text-base leading-relaxed text-stone-500 md:text-[17px]">
              Original components crafted by a designer, each with the prompt and the code to rebuild it in your AI agent of choice. MIT licensed. Free to use for personal and commercial use.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href="/components" className={`${BUTTON} bg-foreground text-background hover:bg-foreground/85`}>
                Browse components
              </Link>
              <a href={SITE.github} target="_blank" rel="noreferrer" className={`${BUTTON} border border-black/[.1] text-foreground hover:bg-black/[.03]`}>
                Star on GitHub
                {stars ? <span className="tabular-nums text-stone-400">{formatCount(stars)}</span> : null}
              </a>
            </div>
          </div>
        </div>
        <Crowd className="h-36 sm:h-44 md:aspect-[1440/290] md:h-auto" />
      </section>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-8 pt-16 md:px-6">
        <section aria-labelledby="all">
          <div className="mb-8 flex items-baseline justify-between">
            <h2 id="all" className="text-lg font-medium tracking-tight">
              Components
            </h2>
            <span className="text-sm text-stone-400">{COMPONENTS.length}</span>
          </div>

          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {COMPONENTS.map((c, i) => (
              <li key={c.slug} className="card-in" style={{ "--i": i } as CSSProperties}>
                <Link href={`/components/${c.slug}`} className={`group block rounded-2xl border border-black/[.08] bg-white p-2 transition-colors hover:border-black/20 ${FOCUS}`}>
                  <div aria-hidden className="relative h-44 overflow-hidden rounded-xl bg-[#f7f7f6]">
                    <iframe src={`/preview/${c.slug}`} scrolling="no" title="" tabIndex={-1} loading="lazy" className="pointer-events-none absolute left-0 top-0 h-[200%] w-[200%] origin-top-left scale-50 border-0" />
                  </div>
                  <div className="px-2 pb-2 pt-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium">{c.name}</h3>
                      {c.isNew && <span className="rounded-full bg-[#F494BA]/20 px-1.5 py-0.5 text-[10px] font-medium text-pink-800">New</span>}
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-stone-500">{c.description}</p>
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
