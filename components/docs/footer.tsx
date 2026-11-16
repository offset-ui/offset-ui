import Link from "next/link";
import { SITE } from "@/lib/site";

const { x, instagram, email, portfolio } = SITE.socials;

const LINKS = (
  [
    ["Components", "/components"],
    ["Request", SITE.requestComponent],
    ["FAQ", "/faq"],
    ["About", "/about"],
    ["Contact", "/contact"],
    ["Terms", "/terms"],
    ["Privacy", "/privacy"],
    ["GitHub", SITE.github],
    ["X", x],
    ["Instagram", instagram],
    ["Email", email && `mailto:${email}`],
    ["Portfolio", portfolio],
  ] as [string, string][]
).filter(([, href]) => href);

const LINK = "rounded-sm text-foreground/50 outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-foreground/40";

function FooterLink({ href, children }: { href: string; children: string }) {
  return href.startsWith("/") ? (
    <Link href={href} className={LINK}>
      {children}
    </Link>
  ) : (
    <a href={href} target={href.startsWith("mailto:") ? undefined : "_blank"} rel="noreferrer" className={LINK}>
      {children}
    </a>
  );
}

export function Footer() {
  return (
    <footer className="mt-24 border-t border-black/[.08] px-4 py-8 text-sm md:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <p className="text-foreground/50">
          © {new Date().getFullYear()} {SITE.name} · MIT licensed
        </p>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {LINKS.map(([name, href]) => (
              <li key={name}>
                <FooterLink href={href}>{name}</FooterLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
