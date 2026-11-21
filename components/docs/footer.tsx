import { SITE, SOCIAL_LINKS } from "@/lib/site";
import { cn } from "@/lib/utils";
import { SmartLink } from "./smart-link";

const LINKS: [string, string][] = [
    ["Components", "/components"],
    ["Request", SITE.requestComponent],
    ["FAQ", "/faq"],
    ["About", "/about"],
    ["Contact", "/contact"],
    ["Terms", "/terms"],
    ["Privacy", "/privacy"],
    ["GitHub", SITE.github],
    ...SOCIAL_LINKS,
];

const LINK = "rounded-sm text-[#111]/50 outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-foreground/40";

export function Footer({ className }: { className?: string }) {
  return (
    <footer className={cn("border-t border-black/[.08] bg-white px-4 py-8 text-sm md:px-6", className)}>
      <div className="mx-auto flex max-w-7xl flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <p className="text-[#111]/50">
          © {new Date().getFullYear()} {SITE.name} · MIT licensed
        </p>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {LINKS.map(([name, href]) => (
              <li key={name}>
                <SmartLink href={href} className={LINK}>{name}</SmartLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
