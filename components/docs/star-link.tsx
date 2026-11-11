import type { ReactNode } from "react";
import { formatCount } from "@/lib/format";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

type StarLinkProps = {
  /** Live star count from getStarCount(). Nothing is shown for null or 0, so an empty repo never advertises "0 stars". */
  stars: number | null;
  className?: string;
  children?: ReactNode;
};

/** A link to the repo with the live star count, e.g. "★ GitHub 128". */
export function StarLink({ stars, className, children = "GitHub" }: StarLinkProps) {
  return (
    <a
      href={SITE.github}
      target="_blank"
      rel="noreferrer"
      className={cn("inline-flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-stone-400", className)}
    >
      <span aria-hidden>★</span>
      {children}
      {stars !== null && stars > 0 && (
        <span className="rounded-full bg-[#F494BA]/30 px-2 py-0.5 text-xs font-medium tabular-nums text-stone-800" aria-label={`${stars} stars`}>
          {formatCount(stars)}
        </span>
      )}
    </a>
  );
}
