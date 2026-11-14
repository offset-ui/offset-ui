import Link from "next/link";
import { SITE } from "@/lib/site";

const { x, instagram, email, portfolio } = SITE.socials;

const COLUMNS = [
  { title: "Library", links: [["All components", "/components"], ["Request a component", SITE.requestComponent]] },
  { title: "Resources", links: [["Setup guide", "/components"], ["FAQ", "/faq"], ["GitHub", SITE.github]] },
  { title: "Company", links: [["About", "/about"], ["Contact", "/contact"]] },
  { title: "Legal", links: [["Terms", "/terms"], ["Privacy", "/privacy"]] },
];

const SOCIALS = [["X", x], ["Instagram", instagram], ["Email", email && `mailto:${email}`], ["Portfolio", portfolio]].filter(([, href]) => href);

const LINK = "rounded-sm text-stone-600 outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-stone-400";

function FooterLink({ href, children }: { href: string; children: string }) {
  return href.startsWith("/") ? (
    <Link href={href} className={LINK}>{children}</Link>
  ) : (
    <a href={href} target={href.startsWith("mailto:") ? undefined : "_blank"} rel="noreferrer" className={LINK}>{children}</a>
  );
}

export function Footer() {
  return (
    <footer className="relative z-10 mt-16 border-t border-black/10 px-6 py-12 text-sm md:px-10">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div className="space-y-3">
          <p className="font-semibold">{SITE.name}</p>
          <p className="max-w-xs text-pretty text-stone-600">Figma-built React components with motion you&apos;ll remember. Copy the code, keep the feel.</p>
          {SOCIALS.length > 0 && (
            <ul className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
              {SOCIALS.map(([name, href]) => (
                <li key={name}><FooterLink href={href}>{name}</FooterLink></li>
              ))}
            </ul>
          )}
        </div>
        {COLUMNS.map((column) => (
          <nav key={column.title} aria-label={column.title} className="space-y-3">
            <p className="font-medium">{column.title}</p>
            <ul className="space-y-2">
              {column.links.map(([name, href]) => (
                <li key={name}><FooterLink href={href}>{name}</FooterLink></li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="mx-auto mt-12 flex max-w-6xl flex-col justify-between gap-2 text-xs text-stone-500 sm:flex-row">
        <p>
          © {new Date().getFullYear()} {SITE.name} ·{" "}
          <Link href="/about" className="underline-offset-2 hover:text-foreground hover:underline">
            MIT licensed
          </Link>
        </p>
        <p>Open source and built in public.</p>
      </div>
    </footer>
  );
}
