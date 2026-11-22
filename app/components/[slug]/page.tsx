import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { BackLink } from "@/components/docs/back-link";
import { CodeBlock } from "@/components/docs/code-block";
import { OnThisPage, type TocItem } from "@/components/docs/on-this-page";
import { CopyForAi, PostOnX, ShareLink } from "@/components/docs/page-actions";
import { PreviewFrame } from "@/components/docs/preview-frame";
import { COMPONENTS, componentParams, requireComponent } from "@/lib/registry";
import { componentPath, componentsPath } from "@/lib/routes";
import { describeSetup } from "@/lib/setup";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

export const dynamicParams = false;
export const generateStaticParams = componentParams;

export async function generateMetadata({ params }: PageProps<"/components/[slug]">): Promise<Metadata> {
  const entry = requireComponent((await params).slug);
  const title = `${entry.name} · ${SITE.name}`;
  return { title, description: entry.description, openGraph: { title, description: entry.description, url: componentPath(entry.slug) } };
}

const SECTION = "scroll-mt-20 space-y-4";
const INLINE_CODE = "font-mono text-[0.92em] text-foreground";

function Step({ n, id, title, children }: { n: number; id?: string; title: string; children: React.ReactNode }) {
  return (
    <li id={id} className="flex scroll-mt-20 gap-4">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-black/[.06] text-xs font-medium">{n}</span>
      <div className="min-w-0 flex-1 space-y-3">
        <h3 className="text-sm font-medium">{title}</h3>
        {children}
      </div>
    </li>
  );
}

export default async function ComponentPage({ params }: PageProps<"/components/[slug]">) {
  const entry = requireComponent((await params).slug);
  const { requirements, source, utils, assets, notes } = describeSetup(entry);

  const index = COMPONENTS.findIndex((c) => c.slug === entry.slug);
  const neighbours = [
    { c: COMPONENTS[index - 1], label: "Previous" },
    { c: COMPONENTS[index + 1], label: "Next" },
  ];
  const toc: TocItem[] = [
    { id: "overview", label: "Overview", hint: "What it does & how to use it" },
    { id: "preview", label: "Preview", hint: "Live component demo" },
    { id: "install", label: "Installation", hint: "Install steps & source code", files: [{ id: "install-utils", name: "lib/utils.ts" }, { id: "install-component", name: entry.file }] },
    { id: "usage", label: "Usage", hint: "Add it to a page" },
  ];

  return (
    <div className="flex min-w-0 flex-1">
      <article className="min-w-0 flex-1 space-y-12 px-4 py-10 md:px-10 md:pb-14 md:pt-8">
        <header id="overview" className="scroll-mt-20 space-y-4">
          <BackLink href={componentsPath}>Back to All Components</BackLink>
          <p className="eyebrow text-muted">{entry.category}</p>
          <div className="space-y-1">
            <h1 className="page-title">{entry.name}</h1>
            <p className="max-w-2xl text-base leading-[26px] text-muted">{entry.description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <CopyForAi slug={entry.slug} />
            <ShareLink slug={entry.slug} />
          </div>
        </header>

        <section id="preview" aria-labelledby="preview-title" className={SECTION}>
          <div className="flex items-center justify-between">
            <h2 id="preview-title" className="section-title">
              Preview
            </h2>
            <PostOnX slug={entry.slug} name={entry.name} />
          </div>
          <PreviewFrame slug={entry.slug} title={entry.name}>
            <CodeBlock bare code={source} />
          </PreviewFrame>
        </section>

        <section id="install" aria-labelledby="install-title" className="scroll-mt-20 space-y-6">
          <div className="space-y-1">
            <h2 id="install-title" className="section-title">
              Installation &amp; Setup
            </h2>
            <p className="text-sm leading-[22px] text-muted">
              Requires {requirements}. The components import the helper from <code className={INLINE_CODE}>@/lib/utils</code>; if your project has no <code className={INLINE_CODE}>@</code> path alias, change that import to a relative path.
            </p>
          </div>
          <ol className="space-y-8">
            <Step n={1} title="Install the dependencies">
              <CodeBlock code={SITE.install} title="terminal" lang="bash" />
            </Step>
            <Step n={2} id="install-utils" title="Add the cn helper">
              <CodeBlock code={utils} title="lib/utils.ts" />
            </Step>
            <Step n={3} id="install-component" title="Copy the component">
              <div className="space-y-3 text-sm text-stone-600">
                <p>
                  Open the Code tab above, copy <code className={INLINE_CODE}>{entry.file}</code> into your project.
                </p>
                {assets && (
                  <p>
                    Also copy the folder <code className={INLINE_CODE}>{assets}</code> into your project. It holds the artwork the component loads.
                  </p>
                )}
                {notes.map((note) => (
                  <p key={note}>{note}</p>
                ))}
              </div>
            </Step>
          </ol>
        </section>

        <section id="usage" aria-labelledby="usage-title" className={SECTION}>
          <h2 id="usage-title" className="section-title">
            Usage
          </h2>
          <CodeBlock code={entry.usage} title="app/page.tsx" />
        </section>

        <nav aria-label="More components" className="grid grid-cols-2 gap-3 border-t border-foreground/[.08] pt-8">
          {neighbours.map(({ c, label }, i) =>
            c ? (
              <Link key={label} href={componentPath(c.slug)} className={cn("flex flex-col gap-0.5 rounded-xl p-4 text-sm focus-ring transition-colors hover:bg-foreground/[.03]", i && "items-end text-right")}>
                <span className={cn("flex items-center gap-2.5 text-xs text-foreground/40", i && "flex-row-reverse")}>
                  <Image aria-hidden src="/icons/arrow-left.svg" alt="" width={12} height={12} className={cn("opacity-60", i && "rotate-180")} />
                  {label}
                </span>
                {c.name}
              </Link>
            ) : (
              <span key={label} />
            ),
          )}
        </nav>
      </article>
      <OnThisPage items={toc} />
    </div>
  );
}
