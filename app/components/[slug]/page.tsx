import { readFileSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CodeBlock } from "@/components/docs/code-block";
import { Newsletter } from "@/components/docs/newsletter";
import { CopyForAi, ShareLinks } from "@/components/docs/page-actions";
import { PreviewFrame } from "@/components/docs/preview-frame";
import { PropsTable } from "@/components/docs/props-table";
import { extractProps } from "@/lib/props";
import { COMPONENTS, getComponent } from "@/lib/registry";
import { SITE } from "@/lib/site";

const read = (file: string) => readFileSync(path.join(/* turbopackIgnore: true */ process.cwd(), file), "utf8");

// Unknown slugs 404 straight away instead of being rendered on demand.
export const dynamicParams = false;

export function generateStaticParams() {
  return COMPONENTS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/components/[slug]">): Promise<Metadata> {
  const entry = getComponent((await params).slug);
  return entry
    ? {
        title: `${entry.name} · ${SITE.name}`,
        description: entry.description,
        openGraph: { title: `${entry.name} · ${SITE.name}`, description: entry.description, url: `/components/${entry.slug}` },
      }
    : {};
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
  const entry = getComponent((await params).slug);
  if (!entry) notFound();

  const source = read(entry.file);
  const utils = read("lib/utils.ts");
  const { props: found, groups: foundGroups } = extractProps(entry.file);
  const docs = entry.propDocs ?? {};
  const withDoc = (row: (typeof found)[number]) => ({ ...row, description: row.description || docs[row.name] || "" });
  const props = found.map(withDoc);
  const groups = foundGroups.map((g) => ({ ...g, rows: g.rows.map(withDoc) }));

  const index = COMPONENTS.findIndex((c) => c.slug === entry.slug);
  const [prev, next] = [COMPONENTS[index - 1], COMPONENTS[index + 1]];
  const code = "rounded bg-black/[.06] px-1.5 py-0.5 font-mono text-xs";

  return (
    <article className="mx-auto max-w-4xl space-y-16 px-5 py-10 md:px-10 md:py-14">
      <header className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wider text-stone-500">{entry.category}</p>
        <h1 className="text-3xl font-semibold tracking-[-0.03em] md:text-4xl">{entry.name}</h1>
        <p className="max-w-2xl text-base leading-relaxed text-stone-500">{entry.description}</p>
        <div className="flex flex-wrap gap-2 pt-1">
          {entry.isNew && <span className="rounded-full bg-[#F494BA]/25 px-2.5 py-0.5 text-xs font-medium text-pink-800">New</span>}
        </div>
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
            Requires React 19 and Tailwind CSS v4. The components import the helper from <code className={code}>@/lib/utils</code>; if your project has no{" "}
            <code className={code}>@</code> path alias, change that import to a relative path.
          </p>
        </div>
        <ol className="space-y-8">
          <Step n={1} title="Install the dependencies">
            <CodeBlock code={SITE.install} title="terminal" />
          </Step>
          <Step n={2} title="Add the cn helper">
            <CodeBlock code={utils} title="lib/utils.ts" />
          </Step>
          <Step n={3} title="Copy the component">
            <p className="text-sm text-stone-600">
              Open the Code tab above, copy <code className={code}>{entry.file}</code> into your project.
            </p>
            {entry.assets && (
              <p className="text-sm text-stone-600">
                Also copy the folder <code className={code}>{entry.assets}</code> into your project. It holds the artwork the component loads.
              </p>
            )}
            {entry.notes?.map((note) => (
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
              href={`/components/${item.c.slug}`}
              className={`rounded-xl border border-black/[.08] p-4 outline-none transition-colors hover:bg-black/[.03] focus-visible:ring-2 focus-visible:ring-stone-400 ${i ? "sm:text-right" : ""}`}
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
