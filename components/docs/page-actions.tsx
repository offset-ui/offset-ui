"use client";

import { useState, type ReactNode } from "react";
import { aiPath, componentUrl } from "@/lib/routes";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";
import { VARIANTS } from "./button";
import { SquircleLayer } from "./squircle-layer";
import { useFlash } from "./use-flash";

const ICONS = {
  sparkle: { d: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z", stroke: true },
  link: { d: "M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71", stroke: true },
  x: { d: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z", stroke: false },
};

const buttonClass = (variant: keyof typeof VARIANTS) =>
  cn("smooth inline-flex items-center gap-1.5 rounded-(--radius-control) px-3.5 py-1.5 text-xs font-medium transition-colors focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background", VARIANTS[variant].className);

function Content({ variant, icon, children }: { variant: keyof typeof VARIANTS; icon: keyof typeof ICONS; children: ReactNode }) {
  const { d, stroke } = ICONS[icon];
  return (
    <>
      <SquircleLayer radius="--radius-control" fill="var(--sq-fill)" border={VARIANTS[variant].border} />
      <svg aria-hidden width="13" height="13" viewBox="0 0 24 24" fill={stroke ? "none" : "currentColor"} stroke={stroke ? "currentColor" : undefined} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={d} />
      </svg>
      {children}
    </>
  );
}

export function CopyForAi({ slug }: { slug: string }) {
  const [copied, flash] = useFlash();
  const [failed, setFailed] = useState(false);

  async function copy() {
    try {
      const load = fetch(aiPath(slug)).then(async (res) => {
        if (!res.ok) throw new Error(String(res.status));
        return new Blob([await res.text()], { type: "text/plain" });
      });
      // Safari only allows the clipboard write inside the click, so the clipboard gets a promise.
      if (typeof ClipboardItem !== "undefined") await navigator.clipboard.write([new ClipboardItem({ "text/plain": load })]);
      else await navigator.clipboard.writeText(await (await load).text());
      setFailed(false);
      flash();
    } catch {
      setFailed(true);
    }
  }

  return (
    <button type="button" onClick={copy} className={buttonClass("primary")}>
      <Content variant="primary" icon="sparkle">
        <span role="status">{failed ? "Couldn't copy, try again" : copied ? "Copied for AI" : "Copy for AI"}</span>
      </Content>
    </button>
  );
}

export function ShareLink({ slug }: { slug: string }) {
  const [copied, flash] = useFlash();
  const url = componentUrl(slug);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      flash();
    } catch {
      window.prompt("Copy this link", url);
    }
  }

  return (
    <button type="button" onClick={copyLink} className={buttonClass("outline")}>
      <Content variant="outline" icon="link">
        <span role="status">{copied ? "Link copied" : "Share Link"}</span>
      </Content>
    </button>
  );
}

export function PostOnX({ slug, name }: { slug: string; name: string }) {
  const text = `${name}: a ${SITE.name} component`;
  return (
    <a
      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(componentUrl(slug))}`}
      target="_blank"
      rel="noreferrer"
      className={buttonClass("outline")}
    >
      <Content variant="outline" icon="x">
        Post on X
      </Content>
    </a>
  );
}
