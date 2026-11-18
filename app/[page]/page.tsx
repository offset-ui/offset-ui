import type { Metadata } from "next";
import { Footer } from "@/components/docs/footer";
import { SmartLink } from "@/components/docs/smart-link";
import { Topbar } from "@/components/docs/topbar";
import { PAGES } from "@/lib/pages";
import { SITE } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(PAGES).map((page) => ({ page }));
}

export async function generateMetadata({ params }: PageProps<"/[page]">): Promise<Metadata> {
  const info = PAGES[(await params).page];
  return { title: `${info.title} · ${SITE.name}`, description: info.description };
}

export default async function InfoPage({ params }: PageProps<"/[page]">) {
  const { page } = await params;
  const info = PAGES[page];

  return (
    <div className="flex min-h-screen flex-col">
      <Topbar />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
        <h1 className="text-4xl font-semibold tracking-tight">{info.title}</h1>
        <p className="mt-3 text-stone-600">{info.description}</p>
        {info.updated && <p className="mt-1 text-sm text-stone-500">Last updated {info.updated}</p>}
        <div className="mt-10 space-y-10">
          {info.sections.map((section, i) => (
            <section key={section.heading ?? i} className="space-y-3 leading-relaxed text-stone-700">
              {section.heading && <h2 className="text-lg font-semibold text-foreground">{section.heading}</h2>}
              {section.text?.map((text) => <p key={text}>{text}</p>)}
              {section.code && <code className="block overflow-x-auto rounded-lg bg-black/[.05] px-4 py-3 font-mono text-sm text-foreground">{section.code}</code>}
              {section.list && (
                <ul className="list-disc space-y-1.5 pl-5">
                  {section.list.map((item) => <li key={item}>{item}</li>)}
                </ul>
              )}
              {section.links && (
                <ul className="space-y-1.5">
                  {section.links.map(([name, href]) => (
                    <li key={name}>
                      <SmartLink href={href} className="rounded-sm font-medium text-foreground underline underline-offset-4 focus-ring hover:text-stone-600">
                        {name} ↗
                      </SmartLink>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
