import { getProps } from "@/lib/props";
import type { ComponentEntry } from "@/lib/registry";
import { componentUrl } from "@/lib/routes";
import { describeSetup } from "@/lib/setup";
import { repoUrl, SITE } from "@/lib/site";

const fenced = (language: string, code: string) => `\`\`\`${language}\n${code.trim()}\n\`\`\``;

export function buildAiPrompt(entry: ComponentEntry): string {
  const setup = describeSetup(entry);
  const propLines = getProps(entry)
    .props.map((p) => `- ${p.name}${p.required ? "" : "?"}: ${p.type}${p.default ? ` (default ${p.default})` : ""}${p.description ? `. ${p.description}` : ""}`)
    .join("\n");

  const steps = [
    `Create lib/utils.ts with:\n${fenced("ts", setup.utils)}`,
    `Create ${entry.file} with exactly this code:\n${fenced("tsx", setup.source)}`,
    ...(setup.assets ? [`Copy the artwork folder ${setup.assets} from ${repoUrl(`/tree/main/${setup.assets}`)} into my project's public folder.`] : []),
    `Use it like this:\n\`\`\`tsx\n${entry.usage}\n\`\`\``,
  ].map((step, i) => `${i + 1}. ${step}`);

  return [
    `Add the "${entry.name}" component from ${SITE.name} (${componentUrl(entry.slug)}) to my React project.`,
    `Requirements: ${setup.requirements}. Install: ${setup.install}`,
    ...steps,
    ...(setup.notes.length ? [`Notes:\n${setup.notes.map((n) => `- ${n}`).join("\n")}`] : []),
    ...(propLines ? [`Props:\n${propLines}`] : []),
    "Adapt the import paths to my project's alias (the component imports cn from @/lib/utils). Do not change the component's behaviour or styling.",
  ].join("\n\n");
}
