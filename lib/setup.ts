import type { ComponentEntry } from "@/lib/registry";
import { SITE } from "@/lib/site";
import { readSource } from "@/lib/source";

export function describeSetup(entry: ComponentEntry) {
  return {
    requirements: "React 19 and Tailwind CSS v4",
    install: SITE.install,
    utils: readSource("lib/utils.ts"),
    source: readSource(entry.file),
    assets: entry.assets,
    notes: entry.notes ?? [],
  };
}
