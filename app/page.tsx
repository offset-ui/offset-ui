import Link from "next/link";
import { Footer } from "@/components/docs/footer";
import { Topbar } from "@/components/docs/topbar";
import { getStarCount } from "@/lib/github";
import { COMPONENTS } from "@/lib/registry";
import { SITE } from "@/lib/site";

const FOCUS = "outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background";
const PILL = `whitespace-nowrap rounded-full text-sm font-medium transition-colors ${FOCUS}`;

export default async function Home() {
  const stars = await getStarCount();
  return (
    <div className="flex min-h-screen flex-col">
      <Topbar stars={stars} contained />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-16">
        <section className="relative overflow-hidden rounded-[28px] border border-black/10 bg-white px-6 py-20 text-center md:py-28">
          <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 size-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#F494BA]/30 blur-3xl" />
          <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-7 motion-safe:animate-[rise_.7s_ease-out_both]">
            <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-stone-50 px-3.5 py-1.5 text-xs font-medium text-foreground/70">
              <span aria-hidden className="size-1.5 rounded-full bg-[#F494BA]" />
              Open source · MIT
            </span>
            <h1 className="text-balance text-5xl font-semibold leading-[1.04] tracking-[-0.035em] md:text-6xl lg:text-7xl">Make interfaces people want to touch twice.</h1>
            <p className="max-w-2xl text-balance text-base leading-relaxed text-foreground/60 md:text-lg">
              Original components crafted by a designer, each with the prompt and the code to rebuild it in your AI agent of choice. MIT licensed. Free to use for personal and commercial use.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href="/components" className={`${PILL} bg-foreground px-6 py-3 text-background hover:bg-foreground/85`}>
                Browse components →
              </Link>
              <a href={SITE.github} target="_blank" rel="noreferrer" className={`${PILL} border border-black/10 bg-white px-6 py-3 hover:bg-stone-50`}>
                ★ Star on GitHub
              </a>
            </div>
          </div>
        </section>

        <section aria-labelledby="all" className="mt-16">
          <div className="mb-6 flex items-baseline justify-between">
            <h2 id="all" className="text-xl font-semibold tracking-tight">
              All components
            </h2>
            <span className="font-mono text-xs text-foreground/50">{COMPONENTS.length} components</span>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {COMPONENTS.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/components/${c.slug}`}
                  className={`group block rounded-[22px] bg-white p-2 ring-1 ring-black/[.07] transition hover:-translate-y-0.5 hover:ring-black/20 ${FOCUS}`}
                >
                  <div aria-hidden className="relative h-60 overflow-hidden rounded-2xl bg-[#fafaf9] ring-1 ring-black/[.05]">
                    <iframe src={`/preview/${c.slug}`} scrolling="no" title="" tabIndex={-1} loading="lazy" className="pointer-events-none absolute left-0 top-0 h-[200%] w-[200%] origin-top-left scale-50 border-0" />
                  </div>
                  <div className="space-y-1 px-3 pb-3 pt-4">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{c.name}</h3>
                      {c.isNew && <span className="rounded-full bg-[#F494BA]/20 px-2 py-0.5 text-[10px] font-medium text-pink-700">New</span>}
                    </div>
                    <p className="line-clamp-2 text-sm leading-relaxed text-foreground/55">{c.description}</p>
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
