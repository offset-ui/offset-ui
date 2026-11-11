import { readFileSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CodeBlock } from "@/components/docs/code-block";
import { PreviewFrame } from "@/components/docs/preview-frame";
import { PropsTable } from "@/components/docs/props-table";
import { extractProps } from "@/lib/props";
import { COMPONENTS, getComponent } from "@/lib/registry";
import { SITE } from "@/lib/site";

const read = (file: string) => readFileSync(path.join(process.cwd(), file), "utf8");

// Unknown slugs 404 straight away instead of being rendered on demand.
export const dynamicParams = false;

export function generateStaticParams() {
  return COMPONENTS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/components/[slug]">): Promise<Metadata> {
  const entry = getComponent((await params).slug);
  return entry ? { title: `${entry.name} · ${SITE.name}`, description: entry.description } : {};
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
  const { props, groups } = extractProps(entry.file);

  return (
    <article className="mx-auto max-w-4xl space-y-12 px-5 py-8 md:px-10 md:py-12">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">{entry.name}</h1>
        <p className="max-w-2xl text-base leading-relaxed text-stone-600">{entry.description}</p>
      </header>

      <PreviewFrame slug={entry.slug} title={entry.name} height={entry.previewHeight} />

      <section aria-labelledby="copy" className="space-y-6">
        <h2 id="copy" className="text-xl font-semibold tracking-tight">
          Copy and use
        </h2>
        <ol className="space-y-8">
          <Step n={1} title="Copy the component">
            <CodeBlock code={source} title={entry.file} />
            {entry.assets && (
              <p className="text-sm text-stone-600">
                Also copy the folder <code className="rounded bg-black/[.06] px-1.5 py-0.5 font-mono text-xs">{entry.assets}</code> into your
                project. It holds the artwork the component loads.
              </p>
            )}
            {entry.notes?.map((note) => (
              <p key={note} className="text-sm text-stone-600">
                {note}
              </p>
            ))}
          </Step>

          <Step n={2} title="Use it">
            <CodeBlock code={entry.usage} title="app/page.tsx" />
          </Step>
        </ol>
      </section>

      <section aria-labelledby="setup" className="space-y-6 border-t border-black/10 pt-10">
        <div className="space-y-1">
          <h2 id="setup" className="text-xl font-semibold tracking-tight">
            One-time setup
          </h2>
          <p className="text-sm text-stone-600">Do this once per project. Every component here shares it. Requires React 19 and Tailwind CSS v4. The components import the helper from <code className="rounded bg-black/[.06] px-1.5 py-0.5 font-mono text-xs">@/lib/utils</code>; if your project has no <code className="rounded bg-black/[.06] px-1.5 py-0.5 font-mono text-xs">@</code> path alias, change that import to a relative path.</p>
        </div>
        <ol className="space-y-8">
          <Step n={1} title="Install the dependencies">
            <CodeBlock code={SITE.install} title="terminal" />
          </Step>
          <Step n={2} title="Add the cn helper">
            <CodeBlock code={utils} title="lib/utils.ts" />
          </Step>
        </ol>
      </section>

      {props.length > 0 && (
        <section aria-labelledby="props" className="space-y-4 border-t border-black/10 pt-10">
          <div className="space-y-1">
            <h2 id="props" className="text-xl font-semibold tracking-tight">
              Props
            </h2>
            <p className="text-sm text-stone-600">Every prop is optional unless marked with a red asterisk.</p>
          </div>
          <PropsTable props={props} groups={groups} />
        </section>
      )}
    </article>
  );
}
