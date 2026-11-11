import { cn } from "@/lib/utils";
import { CollapseToggle, CopyButton } from "./code-actions";

type CodeBlockProps = {
  code: string;
  /** File name or label shown in the header. */
  title?: string;
  className?: string;
};

/** Code longer than this many lines starts collapsed. */
const COLLAPSE_AFTER = 14;

/** Rendered on the server: only the small copy and collapse buttons ship JavaScript. */
export function CodeBlock({ code, title, className }: CodeBlockProps) {
  const long = code.split("\n").length > COLLAPSE_AFTER;
  return (
    <div
      data-code
      data-expanded={long ? "false" : "true"}
      className={cn("group/code overflow-hidden rounded-xl border border-black/10 bg-stone-950 text-stone-100", className)}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
        <span className="truncate font-mono text-xs text-stone-400">{title}</span>
        <CopyButton />
      </div>
      <pre className="max-h-80 overflow-auto p-4 font-mono text-[13px] leading-relaxed group-data-[expanded=true]/code:max-h-none">
        <code>{code}</code>
      </pre>
      {long && <CollapseToggle />}
    </div>
  );
}
