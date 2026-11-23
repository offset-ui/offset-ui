import type { Metadata } from "next";
import { BackLink } from "@/components/docs/back-link";
import { Footer } from "@/components/docs/footer";
import { SmartLink } from "@/components/docs/smart-link";
import { Topbar } from "@/components/docs/topbar";
import { PAGES } from "@/lib/pages";
import { SITE } from "@/lib/site";

const INLINE = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/;

function Inline({ text }: { text: string }) {
  return text.split(INLINE).map((part, i) => {
    const bold = /^\*\*(.+)\*\*$/.exec(part);
    if (bold) return <strong key={i} className="font-medium text-foreground">{bold[1]}</strong>;
    const link = /^\[(.+)\]\((.+)\)$/.exec(part);
    if (link) return <SmartLink key={i} href={link[2]} className="rounded-sm font-medium text-foreground underline underline-offset-4 focus-ring hover:text-muted">{link[1]}</SmartLink>;
    return part;
  });
}

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(PAGES).map((page) => ({ page }));
}

export async function generateMetadata({ params }: PageProps<"/[page]">): Promise<Metadata> {
  const info = PAGES[(await params).page];
  return { title: `${info.title} · ${SITE.name}`, description: info.description ?? SITE.description };
}

export default async function InfoPage({ params }: PageProps<"/[page]">) {
  const { page } = await params;
  const info = PAGES[page];

  return (
    <div className="flex min-h-screen flex-col">
      <Topbar bordered />
      <main className="mx-auto w-full max-w-[1335px] flex-1 px-4 py-10 md:px-6 md:py-14">
        <div className="max-w-2xl">
          <BackLink href="/">Back to Home</BackLink>
          <h1 className="page-title mt-6">{info.title}</h1>
          {info.description && <p className="mt-1 text-base leading-[26px] text-muted">{info.description}</p>}
          {info.updated && <p className="mt-1 text-sm text-foreground/40">Last updated {info.updated}</p>}
          <div className="mt-10 space-y-10">
            {info.sections.map((section, i) => (
              <section key={section.heading ?? i} className="space-y-3 text-[15px] leading-6 text-stone-600">
                {section.heading && <h2 className="section-title text-foreground">{section.heading}</h2>}
                {section.text?.map((text) => <p key={text}><Inline text={text} /></p>)}
                {section.code && <code className="block overflow-x-auto rounded-xl bg-card px-4 py-3 font-mono text-[13px] text-foreground">{section.code}</code>}
                {section.list && (
                  <ul className="list-disc space-y-1.5 pl-5">
                    {section.list.map((item) => <li key={item}><Inline text={item} /></li>)}
                  </ul>
                )}
                {section.links && (
                  <ul className="space-y-1.5">
                    {section.links.map(([name, href]) => (
                      <li key={name}>
                        <SmartLink href={href} className="rounded-sm font-medium text-foreground underline underline-offset-4 focus-ring hover:text-muted">
                          {name} ↗
                        </SmartLink>
                      </li>
                    ))}
                  </ul>
                )}
                {section.closing?.map((text) => <p key={text}><Inline text={text} /></p>)}
              </section>
            ))}
          </div>
        </div>
      </main>
      <Footer className="mt-16" />
    </div>
  );
}
