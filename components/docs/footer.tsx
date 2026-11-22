import { SITE, SOCIAL_LINKS } from "@/lib/site";
import { cn } from "@/lib/utils";
import { SmartLink } from "./smart-link";

const PAGE_LINKS: [string, string][] = [["About", "/about"], ["Contact", "/contact"], ["Privacy", "/privacy"], ["Terms", "/terms"]];
const ELSEWHERE_LINKS: [string, string][] = [["GitHub", SITE.github], ...SOCIAL_LINKS];

const LINK = "rounded-sm text-[#111]/50 outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-foreground/40";

export function FooterLinks({ className }: { className?: string }) {
  return (
    <nav aria-label="Footer" className={cn("flex flex-wrap gap-x-6 gap-y-2", className)}>
      {[PAGE_LINKS, ELSEWHERE_LINKS].map((links, group) => (
        <ul key={group} className={cn("flex flex-wrap justify-center gap-x-6 gap-y-2", group === 1 && "lg:border-l lg:border-foreground/25 lg:pl-6")}>
          {links.map(([name, href]) => (
            <li key={name}>
              <SmartLink href={href} className={cn(LINK, href.startsWith("mailto:") && "underline underline-offset-4")}>{name}</SmartLink>
            </li>
          ))}
        </ul>
      ))}
    </nav>
  );
}

export function FooterCredit({ className }: { className?: string }) {
  return (
    <p className={className}>
      © {new Date().getFullYear()} {SITE.name.replace(" ", "")} • Built in public by{" "}
      <SmartLink href={SITE.socials.linkedin} className="rounded-sm text-foreground underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-foreground/40">
        {SITE.author}
      </SmartLink>
    </p>
  );
}

export function Footer({ className }: { className?: string }) {
  return (
    <footer className={cn("border-t border-foreground/[.08]", className)}>
      <div className="mx-auto flex max-w-[1335px] flex-col items-center gap-5 px-4 py-8 text-center text-sm max-md:pb-24 md:min-h-[calc(var(--footer-h)-1px)] md:px-6 lg:flex-row lg:justify-between lg:text-left">
        <FooterCredit className="text-[#111]/50" />
        <FooterLinks className="max-md:flex-col max-md:items-center" />
      </div>
    </footer>
  );
}
