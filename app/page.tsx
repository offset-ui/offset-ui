import Image from "next/image";
import Link from "next/link";
import { Checklist } from "@/components/ui/checklist";
import { SITE } from "@/lib/site";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-6 py-5 md:px-10">
        <Image src="/brand/logo-complete-light.svg" alt={SITE.name} width={118} height={26} priority />
        <a
          href={SITE.github}
          target="_blank"
          rel="noreferrer"
          className="rounded-full px-3 py-1.5 text-sm text-stone-600 outline-none transition-colors hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-stone-400"
        >
          GitHub
        </a>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-14 px-6 py-10 md:flex-row md:gap-20 md:px-10">
        <div className="flex max-w-xl flex-col items-center gap-6 text-center md:items-start md:text-left">
          <h1 className="text-balance text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">{SITE.tagline}</h1>
          <p className="text-balance text-lg leading-relaxed text-stone-600">{SITE.description}</p>

          <Link
            href="/components"
            className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background outline-none transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Browse components
          </Link>

          <a
            href={SITE.github}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-stone-500 outline-none transition-colors hover:text-foreground focus-visible:underline"
          >
            ★ Star us on GitHub. Every star helps us ship the next component sooner.
          </a>
        </div>

        <div className="flex w-full max-w-sm items-center justify-center rounded-3xl bg-black/[.03] p-10">
          <Checklist className="w-[240px]" />
        </div>
      </main>
    </div>
  );
}
