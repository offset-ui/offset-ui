import type { Metadata } from "next";
import Link from "next/link";
import { CodeBlock } from "@/components/docs/code-block";
import { NewBadge } from "@/components/docs/new-badge";
import { Newsletter } from "@/components/docs/newsletter";
import { CopyForAi, ShareLinks } from "@/components/docs/page-actions";
import { PreviewFrame } from "@/components/docs/preview-frame";
import { PropsTable } from "@/components/docs/props-table";
import { getProps } from "@/lib/props";
import { COMPONENTS, componentParams, requireComponent } from "@/lib/registry";
import { componentPath } from "@/lib/routes";
import { describeSetup } from "@/lib/setup";
import { SITE } from "@/lib/site";

export const dynamicParams = false;
export const generateStaticParams = componentParams;

export async function generateMetadata({ params }: PageProps<"/components/[slug]">): Promise<Metadata> {
  const entry = requireComponent((await params).slug);
  const title = `${entry.name} · ${SITE.name}`;
  return { title, description: entry.description, openGraph: { title, description: entry.description, url: componentPath(entry.slug) } };
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-4">
      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-black/[.06] text-xs font-medium">{n}</span>
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
  const { props, groups } = getProps(entry);

  const index = COMPONENTS.findIndex((c) => c.slug === entry.slug);
  const [prev, next] = [COMPONENTS[index - 1], COMPONENTS[index + 1]];
  const code = "rounded bg-black/[.06] px-1.5 py-0.5 font-mono text-xs";

  return (
    <article className="mx-auto max-w-4xl space-y-16 px-5 py-10 md:px-10 md:py-14">
      <header className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wider text-stone-500">{entry.category}</p>
        <h1 className="text-3xl font-semibold tracking-[-0.03em] md:text-4xl">{entry.name}</h1>
        <p className="max-w-2xl text-base leading-relaxed text-stone-500">{entry.description}</p>
        {entry.isNew && <NewBadge className="inline-block px-2.5 text-xs" />}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 pt-2">
          <CopyForAi slug={entry.slug} />
          <ShareLinks slug={entry.slug} name={entry.name} />
        </div>
      </header>

      <section aria-labelledby="preview" className="space-y-4">
        <h2 id="preview" className="text-lg font-medium tracking-tight">
          Preview
        </h2>
        <PreviewFrame slug={entry.slug} title={entry.name} height={entry.previewHeight}>
          <CodeBlock code={source} title={entry.file} />
        </PreviewFrame>
      </section>

      <section aria-labelledby="install" className="space-y-6">
        <div className="space-y-1">
          <h2 id="install" className="text-lg font-medium tracking-tight">
            Installation
          </h2>
          <p className="text-sm text-stone-600">
            Requires {requirements}. The components import the helper from <code className={code}>@/lib/utils</code>; if your project has no{" "}
            <code className={code}>@</code> path alias, change that import to a relative path.
          </p>
        </div>
        <ol className="space-y-8">
          <Step n={1} title="Install the dependencies">
            <CodeBlock code={SITE.install} title="terminal" lang="bash" />
          </Step>
          <Step n={2} title="Add the cn helper">
            <CodeBlock code={utils} title="lib/utils.ts" />
          </Step>
          <Step n={3} title="Copy the component">
            <p className="text-sm text-stone-600">
              Open the Code tab above, copy <code className={code}>{entry.file}</code> into your project.
            </p>
            {assets && (
              <p className="text-sm text-stone-600">
                Also copy the folder <code className={code}>{assets}</code> into your project. It holds the artwork the component loads.
              </p>
            )}
            {notes.map((note) => (
              <p key={note} className="text-sm text-stone-600">
                {note}
              </p>
            ))}
          </Step>
        </ol>
      </section>

      <section aria-labelledby="usage" className="space-y-4">
        <h2 id="usage" className="text-lg font-medium tracking-tight">
          Usage
        </h2>
        <CodeBlock code={entry.usage} title="app/page.tsx" />
      </section>

      {props.length > 0 && (
        <section aria-labelledby="props" className="space-y-4">
          <div className="space-y-1">
            <h2 id="props" className="text-lg font-medium tracking-tight">
              Props
            </h2>
            <p className="text-sm text-stone-600">Every prop is optional unless marked with a red asterisk.</p>
          </div>
          <PropsTable props={props} groups={groups} />
        </section>
      )}

      <nav aria-label="More components" className="grid gap-3 border-t border-black/[.08] pt-8 sm:grid-cols-2">
        {[prev && { c: prev, label: "Previous" }, next && { c: next, label: "Next" }].map((item, i) =>
          item ? (
            <Link
              key={item.c.slug}
              href={componentPath(item.c.slug)}
              className={`rounded-xl border border-black/[.08] p-4 focus-ring transition-colors hover:bg-black/[.03] ${i ? "sm:text-right" : ""}`}
            >
              <span className="block text-xs text-stone-500">{item.label}</span>
              <span className="font-medium">{item.c.name}</span>
            </Link>
          ) : (
            <span key={i} />
          ),
        )}
      </nav>

      <Newsletter />
    </article>
  );
}
