import type { ComponentEntry } from "@/lib/registry";
import { SITE } from "@/lib/site";
import { readSource } from "@/lib/source";

const LICENCE_NOTE = "Keep the MIT licence notice at the top of the file when you copy it.";

export function describeSetup(entry: ComponentEntry) {
  return {
    requirements: "React 19 and Tailwind CSS v4",
    install: [SITE.install, ...(entry.dependencies ?? [])].join(" "),
    utils: readSource("lib/utils.ts"),
    source: readSource(entry.file),
    assets: entry.assets,
    notes: [...(entry.notes ?? []), LICENCE_NOTE],
  };
}
