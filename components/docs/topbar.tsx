import Image from "next/image";
import Link from "next/link";
import { COMPONENTS } from "@/lib/registry";
import { SITE } from "@/lib/site";
import { Search } from "./search";
import { StarLink } from "./star-link";

const ITEMS = COMPONENTS.map(({ slug, name, description, category }) => ({ slug, name, description, category }));
const LINK = "rounded-full px-3.5 py-1.5 text-sm text-stone-700 outline-none transition-colors hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-stone-400";

export function Topbar({ stars, contained = false }: { stars: number | null; contained?: boolean }) {
  return (
    <header className="sticky top-0 z-30 border-b border-black/10 bg-background/85 backdrop-blur">
      <div className={`flex h-14 items-center gap-3 px-4 md:px-6 ${contained ? "mx-auto max-w-6xl" : ""}`}>
        <Link href="/" aria-label={SITE.name} className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-stone-400">
          <Image src="/brand/logo-complete-light.svg" alt="" width={110} height={24} priority />
        </Link>
        <div className="ml-auto flex items-center gap-1 sm:ml-4 sm:flex-1">
          <Search items={ITEMS} />
          <div className="ml-auto flex items-center gap-1">
            <Link href="/components" className={`${LINK} hidden md:block`}>
              Components
            </Link>
            <a href={SITE.requestComponent} target="_blank" rel="noreferrer" className={`${LINK} hidden md:block`}>
              Request
            </a>
            <StarLink stars={stars} className="rounded-full border border-black/10 px-3.5 py-1.5 text-sm text-stone-700 transition-colors hover:bg-black/5" />
          </div>
        </div>
      </div>
    </header>
  );
}
