"use client";

import { useState } from "react";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

const pill =
  "inline-flex items-center gap-2 rounded-full border border-black/10 px-3.5 py-1.5 text-xs font-medium text-stone-700 outline-none transition-colors hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-stone-400";

/** Briefly flips a label after an action, for copy buttons. */
function useFlash(ms = 1800) {
  const [on, setOn] = useState(false);
  return [
    on,
    () => {
      setOn(true);
      setTimeout(() => setOn(false), ms);
    },
  ] as const;
}

/** Copies a ready-made brief (setup, full code, props, usage) for Cursor, Claude, v0 and other assistants. */
export function CopyForAi({ slug }: { slug: string }) {
  const [copied, flash] = useFlash();
  const [failed, setFailed] = useState(false);

  async function copy() {
    try {
      const load = fetch(`/components/${slug}/ai`).then(async (res) => {
        if (!res.ok) throw new Error(String(res.status));
        return new Blob([await res.text()], { type: "text/plain" });
      });
      // Handing the clipboard a promise keeps Safari happy: it only allows the write inside the click.
      if (typeof ClipboardItem !== "undefined") await navigator.clipboard.write([new ClipboardItem({ "text/plain": load })]);
      else await navigator.clipboard.writeText(await (await load).text());
      setFailed(false);
      flash();
    } catch {
      setFailed(true);
    }
  }

  return (
    <button type="button" onClick={copy} className={cn(pill, "bg-foreground text-background hover:bg-foreground/85")}>
      <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z" />
      </svg>
      <span role="status">{failed ? "Couldn't copy, try again" : copied ? "Copied for AI" : "Copy for AI"}</span>
    </button>
  );
}

/** Share on X and LinkedIn, or copy the link. */
export function ShareLinks({ slug, name }: { slug: string; name: string }) {
  const [copied, flash] = useFlash();
  const url = `${SITE.url}/components/${slug}`;
  const text = `${name}: a ${SITE.name} component`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      flash();
    } catch {
      window.prompt("Copy this link", url);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Share this component">
      <a
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noreferrer"
        className={pill}
      >
        <svg aria-hidden width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        Post
      </a>
      <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`} target="_blank" rel="noreferrer" className={pill}>
        <svg aria-hidden width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 110-4.13 2.06 2.06 0 010 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
        </svg>
        Share
      </a>
      <button type="button" onClick={copyLink} className={pill}>
        <svg aria-hidden width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
        </svg>
        <span role="status">{copied ? "Link copied" : "Copy link"}</span>
      </button>
    </div>
  );
}
