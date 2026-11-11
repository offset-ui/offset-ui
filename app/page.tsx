import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { Checklist } from "@/components/ui/checklist";
import { COMPONENTS } from "@/lib/registry";
import { SITE } from "@/lib/site";

const squircle = { cornerShape: "squircle" } as CSSProperties;

const TRUST = ["Accessible by default", "Respects reduced motion", "Copy, paste, own it"];

function Check() {
  return (
    <svg aria-hidden width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
      <circle cx="8" cy="8" r="8" fill="#F494BA" fillOpacity=".35" />
      <path d="M4.6 8.2l2.2 2.2 4.6-4.8" stroke="#1c1917" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      {/* Soft brand glow behind the stage */}
      <div aria-hidden className="pointer-events-none absolute -right-40 top-1/4 size-[560px] rounded-full bg-[#F494BA]/25 blur-3xl" />

      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-10">
        <Link href="/" aria-label={SITE.name} className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-stone-400">
          <Image src="/brand/logo-complete-light.svg" alt="" width={118} height={26} priority />
        </Link>
        <a
          href={SITE.github}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-black/10 px-4 py-1.5 text-sm text-stone-700 outline-none transition-colors hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-stone-400"
        >
          ★ GitHub
        </a>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-16 px-6 pb-14 pt-6 md:flex-row md:gap-14 md:px-10 lg:gap-24">
        <div className="flex max-w-xl flex-col items-center gap-7 text-center motion-safe:animate-[rise_.7s_ease-out_both] md:items-start md:text-left">
          <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/50 px-3.5 py-1.5 text-xs font-medium text-stone-600">
            <span aria-hidden className="size-1.5 rounded-full bg-[#F494BA]" />
            Open source · MIT
          </span>

          <h1 className="text-balance text-5xl font-semibold leading-[1.03] tracking-tight md:text-6xl lg:text-7xl">
            Small interactions,{" "}
            <span className="bg-[linear-gradient(transparent_62%,#F494BA_62%,#F494BA_92%,transparent_92%)] px-1">big memories.</span>
          </h1>

          <p className="text-balance text-lg leading-relaxed text-stone-600 md:text-xl">{SITE.description}</p>

          <div className="flex flex-col items-center gap-4 md:items-start">
            <Link
              href="/components"
              className="whitespace-nowrap rounded-full bg-foreground px-7 py-3.5 text-sm font-medium text-background shadow-[0_10px_24px_-10px_rgba(28,25,23,.6)] outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Browse components
            </Link>
            <a
              href={SITE.github}
              target="_blank"
              rel="noreferrer"
              className="rounded-md text-sm text-stone-600 outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-stone-400"
            >
              ★ Star us on GitHub. Every star helps us ship the next component sooner.
            </a>
          </div>

          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-stone-600 md:justify-start">
            {TRUST.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <Check />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* The logo's idea: a stage with an offset twin behind it */}
        <div className="relative w-full max-w-sm motion-safe:animate-[rise_.7s_.12s_ease-out_both]">
          <div aria-hidden className="absolute inset-0 translate-x-5 translate-y-5 rounded-[44px] bg-[#F494BA]" style={squircle} />
          <div className="relative flex items-center justify-center rounded-[44px] border border-black/5 bg-[#fcfcfb] p-12" style={squircle}>
            <Checklist className="w-[250px]" />
          </div>
        </div>
      </main>

      <footer className="relative z-10 px-6 pb-8 text-center text-xs text-stone-500">
        {COMPONENTS.length} components and counting · MIT licensed
      </footer>
    </div>
  );
}
