"use client";

import { useState, type FormEvent } from "react";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

type NewsletterProps = {
  className?: string;
  /** Smaller layout for the sidebar. */
  compact?: boolean;
};

/**
 * "Get the next component". Signs people up to a Buttondown list when SITE.newsletter is set,
 * and otherwise points to GitHub releases so there is never a dead form.
 */
export function Newsletter({ className, compact = false }: NewsletterProps) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  const frame = cn("rounded-2xl border border-black/10 bg-white/50", compact ? "p-3" : "p-6", className);
  const title = "Get the next component";

  if (!SITE.newsletter) {
    return (
      <div className={frame}>
        <p className={cn("font-medium", compact ? "text-xs" : "text-base")}>{title}</p>
        <p className={cn("mt-1 text-stone-600", compact ? "text-xs leading-relaxed" : "text-sm")}>Follow new releases on GitHub and get a note whenever one ships.</p>
        <a
          href={`${SITE.github}/releases`}
          target="_blank"
          rel="noreferrer"
          className={cn(
            "mt-3 inline-flex rounded-full bg-foreground font-medium text-background outline-none transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2",
            compact ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm",
          )}
        >
          Watch releases
        </a>
      </div>
    );
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    if (data.get("website")) return setState("done"); // honeypot: bots fill the hidden field
    setState("sending");
    try {
      // Buttondown's public embed endpoint doesn't send CORS headers, so the reply is opaque; no error means it was sent.
      await fetch(`https://buttondown.com/api/emails/embed-subscribe/${SITE.newsletter}`, { method: "POST", mode: "no-cors", body: data });
      setState("done");
    } catch {
      setState("error");
    }
  }

  return (
    <div className={frame}>
      <p className={cn("font-medium", compact ? "text-xs" : "text-base")}>{title}</p>
      {state === "done" ? (
        <p role="status" className={cn("mt-1 text-stone-600", compact ? "text-xs" : "text-sm")}>
          Thanks! Check your inbox to confirm.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-2 space-y-2">
          <label htmlFor={compact ? "nl-side" : "nl-page"} className="sr-only">
            Email address
          </label>
          <div className={cn("flex gap-2", compact && "flex-col")}>
            <input
              id={compact ? "nl-side" : "nl-page"}
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="min-w-0 flex-1 rounded-full border border-black/15 bg-[#fcfcfb] px-4 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
            />
            {/* Honeypot */}
            <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
            <button
              type="submit"
              disabled={state === "sending"}
              className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background outline-none transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2 disabled:opacity-60"
            >
              {state === "sending" ? "Sending…" : "Notify me"}
            </button>
          </div>
          <p className={cn("text-stone-500", compact ? "text-[11px]" : "text-xs")}>
            {state === "error" ? "Something went wrong. Try again in a moment." : "One email per new component. No spam, unsubscribe anytime."}
          </p>
        </form>
      )}
    </div>
  );
}
