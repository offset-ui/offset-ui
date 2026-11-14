import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Footer } from "@/components/docs/footer";
import { StarLink } from "@/components/docs/star-link";
import { Checklist } from "@/components/ui/checklist";
import { GrabToggle } from "@/components/ui/grab-toggle";
import { getStarCount } from "@/lib/github";
import { SITE } from "@/lib/site";

const squircle = { cornerShape: "squircle" } as CSSProperties;
const TRUST = ["Accessible by default", "Respects reduced motion", "Copy, paste, own it"];
const FOCUS = "outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

function Stage({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <div aria-hidden className="absolute inset-0 translate-x-4 translate-y-4 rounded-[40px] bg-[#F494BA]" style={squircle} />
      <div className="relative flex h-full items-center justify-center rounded-[40px] border border-black/5 bg-[#fcfcfb] p-10" style={squircle}>
        {children}
      </div>
    </div>
  );
}

export default async function Home() {
  const stars = await getStarCount();
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-[-120px] size-[420px] -translate-x-1/2 rounded-full bg-[#F494BA]/15 md:top-[-160px] md:size-[760px] md:bg-[#F494BA]/20 blur-3xl" />

      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-10">
        <Link href="/" aria-label={SITE.name} className={`rounded-md ${FOCUS}`}>
          <Image src="/brand/logo-complete-light.svg" alt="" width={118} height={26} priority />
        </Link>
        <nav className="flex items-center gap-2 text-sm text-stone-700">
          <Link href="/components" className={`rounded-full px-4 py-1.5 transition-colors hover:bg-black/5 ${FOCUS}`}>
            Components
          </Link>
          <StarLink stars={stars} className="rounded-full border border-black/10 px-4 py-1.5 transition-colors hover:bg-black/5" />
        </nav>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-6 pb-20 pt-14 text-center md:pt-24">
        <div className="flex flex-col items-center gap-8 motion-safe:animate-[rise_.7s_ease-out_both]">
          <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/60 px-3.5 py-1.5 text-xs font-medium text-stone-600">
            <span aria-hidden className="size-1.5 rounded-full bg-[#F494BA]" />
            Open source · MIT
          </span>

          <h1 className="max-w-4xl text-balance text-5xl font-semibold leading-[1.02] tracking-[-0.035em] md:text-7xl lg:text-8xl">
            Make interfaces people want to{" "}
            <span className="bg-[linear-gradient(transparent_62%,#F494BA_62%,#F494BA_92%,transparent_92%)] px-1">touch twice.</span>
          </h1>

          <p className="max-w-2xl text-balance text-lg leading-relaxed text-stone-600 md:text-xl">
            Original components crafted by a designer, each with the prompt and the code to rebuild it in your AI agent of choice. MIT licensed. Free to use for personal and commercial use.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/components"
              className={`whitespace-nowrap rounded-full bg-foreground px-7 py-3.5 text-sm font-medium text-background shadow-[0_10px_24px_-10px_rgba(28,25,23,.6)] transition-transform hover:-translate-y-0.5 ${FOCUS}`}
            >
              Browse components
            </Link>
            <a
              href={SITE.github}
              target="_blank"
              rel="noreferrer"
              className={`whitespace-nowrap rounded-full border border-black/10 bg-white/60 px-7 py-3.5 text-sm font-medium text-stone-800 transition-colors hover:bg-white ${FOCUS}`}
            >
              ★ Star on GitHub
            </a>
          </div>

          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-stone-600">
            {TRUST.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span aria-hidden className="size-1.5 rounded-full bg-[#F494BA]" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-20 grid w-full max-w-3xl gap-10 motion-safe:animate-[rise_.7s_.12s_ease-out_both] sm:grid-cols-[1.15fr_1fr] sm:gap-12">
          <Stage>
            <Checklist />
          </Stage>
          <Stage className="min-h-56">
            <GrabToggle size="large" />
          </Stage>
        </div>
      </main>

      <Footer />
    </div>
  );
}
