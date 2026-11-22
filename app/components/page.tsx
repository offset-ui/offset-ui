import type { Metadata } from "next";
import { BackLink } from "@/components/docs/back-link";
import { ComponentGrid } from "@/components/docs/component-grid";
import { COMPONENTS } from "@/lib/registry";
import { SITE } from "@/lib/site";

const DESCRIPTION = "Every component, each with the prompt and the code to rebuild it in your AI agent of choice.";

export const metadata: Metadata = { title: `All components · ${SITE.name}`, description: DESCRIPTION };

export default function ComponentsIndex() {
  return (
    <div className="min-w-0 flex-1 space-y-8 px-4 py-10 md:px-10 md:py-14">
      <header className="space-y-4">
        <BackLink href="/">Back to Home</BackLink>
        <div className="space-y-1">
          <h1 className="page-title">All Components</h1>
          <p className="max-w-2xl text-base leading-[26px] text-muted">
            {COMPONENTS.length} components. {DESCRIPTION}
          </p>
        </div>
      </header>
      <ComponentGrid className="sm:grid-cols-2" />
    </div>
  );
}
