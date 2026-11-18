"use client";

import { useId, useState, type FormEvent } from "react";
import { repoUrl, SITE } from "@/lib/site";

const FRAME = "rounded-2xl border border-black/[.08] p-6";
const TITLE = <p className="text-base font-medium">Get the next component</p>;
const BUTTON = "rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background focus-ring transition-opacity hover:opacity-85 focus-visible:ring-offset-2";

export function Newsletter() {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const inputId = useId();

  if (!SITE.newsletter) {
    return (
      <div className={FRAME}>
        {TITLE}
        <p className="mt-1 text-sm text-stone-600">Follow new releases on GitHub and get a note whenever one ships.</p>
        <a href={repoUrl("/releases")} target="_blank" rel="noreferrer" className={`${BUTTON} mt-3 inline-flex`}>
          Watch releases
        </a>
      </div>
    );
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    if (data.get("website")) return setState("done");
    setState("sending");
    try {
      // Buttondown's public embed endpoint sends no CORS headers, so the reply is opaque; no error means it was sent.
      await fetch(`https://buttondown.com/api/emails/embed-subscribe/${SITE.newsletter}`, { method: "POST", mode: "no-cors", body: data });
      setState("done");
    } catch {
      setState("error");
    }
  }

  return (
    <div className={FRAME}>
      {TITLE}
      {state === "done" ? (
        <p role="status" className="mt-1 text-sm text-stone-600">
          Thanks! Check your inbox to confirm.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-2 space-y-2">
          <label htmlFor={inputId} className="sr-only">
            Email address
          </label>
          <div className="flex gap-2">
            <input
              id={inputId}
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="min-w-0 flex-1 rounded-full border border-black/[.1] bg-[#fcfcfb] px-4 py-2 text-sm focus-ring"
            />
            <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
            <button type="submit" disabled={state === "sending"} className={`${BUTTON} disabled:opacity-60`}>
              {state === "sending" ? "Sending…" : "Notify me"}
            </button>
          </div>
          <p className="text-xs text-stone-500">{state === "error" ? "Something went wrong. Try again in a moment." : "One email per new component. No spam, unsubscribe anytime."}</p>
        </form>
      )}
    </div>
  );
}
