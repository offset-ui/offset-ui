import { Fragment } from "react";
import { createHighlighter } from "shiki";
import { cn } from "@/lib/utils";
import { CollapseToggle, CopyButton } from "./code-actions";

type CodeBlockProps = {
  code: string;
  title?: string;
  className?: string;
};

const COLLAPSE_AFTER = 14;
const highlighter = createHighlighter({ themes: ["github-light"], langs: ["tsx", "bash"] });

export async function CodeBlock({ code, title, className }: CodeBlockProps) {
  const long = code.split("\n").length > COLLAPSE_AFTER;
  const { tokens } = (await highlighter).codeToTokens(code.trimEnd(), { lang: title === "terminal" ? "bash" : "tsx", theme: "github-light" });
  return (
    <div
      data-code
      data-expanded={long ? "false" : "true"}
      className={cn("group/code overflow-hidden rounded-xl border border-black/[.08] bg-white text-stone-800", className)}
    >
      <div className="flex items-center justify-between border-b border-black/[.08] px-4 py-2.5">
        <span className="truncate font-mono text-xs text-stone-500">{title}</span>
        <CopyButton />
      </div>
      <pre className="max-h-80 overflow-auto p-4 font-mono text-[13px] leading-relaxed group-data-[expanded=true]/code:max-h-none">
        <code>
          {tokens.map((line, i) => (
            <Fragment key={i}>
              {line.map((token, j) => (
                <span key={j} style={{ color: token.color }}>
                  {token.content}
                </span>
              ))}
              {"\n"}
            </Fragment>
          ))}
        </code>
      </pre>
      {long && <CollapseToggle />}
    </div>
  );
}
