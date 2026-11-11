import { readFileSync } from "node:fs";
import path from "node:path";
import { extractProps } from "@/lib/props";
import type { ComponentEntry } from "@/lib/registry";
import { SITE } from "@/lib/site";

const read = (file: string) => readFileSync(path.join(/* turbopackIgnore: true */ process.cwd(), file), "utf8");

/** One paste-ready brief for an AI coding assistant: setup, the full component, its props and a usage example. */
export function buildAiPrompt(entry: ComponentEntry): string {
  const { props } = extractProps(entry.file);
  const propLines = props
    .map((p) => `- ${p.name}${p.required ? "" : "?"}: ${p.type}${p.default ? ` (default ${p.default})` : ""}${p.description ? `. ${p.description}` : ""}`)
    .join("\n");

  const steps = [
    `Add the "${entry.name}" component from ${SITE.name} (${SITE.url}/components/${entry.slug}) to my React project.`,
    `Requirements: React 19 and Tailwind CSS v4. Install: ${SITE.install}`,
    `1. Create lib/utils.ts with:\n\`\`\`ts\n${read("lib/utils.ts").trim()}\n\`\`\``,
    `2. Create ${entry.file} with exactly this code:\n\`\`\`tsx\n${read(entry.file).trim()}\n\`\`\``,
  ];
  if (entry.assets) {
    steps.push(`3. Copy the artwork folder ${entry.assets} from ${SITE.github}/tree/main/${entry.assets} into my project's public folder.`);
  }
  steps.push(`${entry.assets ? "4" : "3"}. Use it like this:\n\`\`\`tsx\n${entry.usage}\n\`\`\``);
  if (entry.notes?.length) steps.push(`Notes:\n${entry.notes.map((n) => `- ${n}`).join("\n")}`);
  if (propLines) steps.push(`Props:\n${propLines}`);
  steps.push("Adapt the import paths to my project's alias (the component imports cn from @/lib/utils). Do not change the component's behaviour or styling.");

  return steps.join("\n\n");
}
