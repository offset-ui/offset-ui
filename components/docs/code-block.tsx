import { Fragment } from "react";
import { createHighlighter } from "shiki";
import { Card } from "./card";
import { CollapseToggle, CopyButton } from "./code-actions";

type CodeBlockProps = {
  code: string;
  title?: string;
  lang?: "tsx" | "bash";
  bare?: boolean;
};

const COLLAPSE_AFTER = 14;
const highlighter = createHighlighter({ themes: ["github-light"], langs: ["tsx", "bash"] });

export async function CodeBlock({ code, title, lang = "tsx", bare }: CodeBlockProps) {
  const long = !bare && code.split("\n").length > COLLAPSE_AFTER;
  const { tokens, fg } = (await highlighter).codeToTokens(code.trimEnd(), { lang, theme: "github-light" });
  const body = (
    <div data-code data-expanded={long ? "false" : "true"} className="group/code">
      <div className="flex items-start">
        <pre style={{ color: fg }} className="max-h-80 min-w-0 flex-1 overflow-auto p-4 font-mono text-[13px] leading-[21px] group-data-[expanded=true]/code:max-h-none">
          <code>
            {tokens.map((line, i) => (
              <Fragment key={i}>
                {line
                  .reduce<{ color?: string; content: string }[]>((runs, { color, content }) => {
                    const last = runs.at(-1);
                    if (last && last.color === color) last.content += content;
                    else runs.push({ color, content });
                    return runs;
                  }, [])
                  .map(({ color, content }, j) => (color?.toLowerCase() === fg ? content : <span key={j} style={{ color }}>{content}</span>))}
                {"\n"}
              </Fragment>
            ))}
          </code>
        </pre>
        <CopyButton />
      </div>
      {long && <CollapseToggle />}
    </div>
  );
  return bare ? body : <Card header={<span className="truncate font-mono text-xs text-foreground/40">{title}</span>}>{body}</Card>;
}
