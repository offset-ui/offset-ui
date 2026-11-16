"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export type SearchItem = { slug: string; name: string; description: string; category: string };

export function Search({ items }: { items: SearchItem[] }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const needle = query.trim().toLowerCase();
  const results = items
    .filter((item) => `${item.name} ${item.category} ${item.description}`.toLowerCase().includes(needle))
    .sort((a, b) => Number(!a.name.toLowerCase().includes(needle)) - Number(!b.name.toLowerCase().includes(needle)));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        dialog.current?.showModal();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (slug: string) => {
    dialog.current?.close();
    router.push(`/components/${slug}`);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        className="flex h-9 items-center gap-2 rounded-full bg-black/[.05] px-3 text-sm text-stone-500 outline-none transition-colors hover:bg-black/[.08] focus-visible:ring-2 focus-visible:ring-stone-400 sm:w-72"
      >
        <svg aria-hidden width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <circle cx="7" cy="7" r="4.5" />
          <path d="m10.5 10.5 3 3" />
        </svg>
        <span className="hidden flex-1 text-left sm:block">Search components…</span>
        <kbd className="hidden rounded bg-black/[.06] px-1.5 font-sans text-[11px] sm:block">Ctrl K</kbd>
        <span className="sr-only sm:hidden">Search components</span>
      </button>

      <dialog
        ref={dialog}
        aria-label="Search components"
        onClose={() => {
          setQuery("");
          setActive(0);
        }}
        onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
        className="m-auto mt-[12vh] w-[min(560px,calc(100%-2rem))] rounded-2xl border border-black/10 bg-background p-0 text-foreground shadow-2xl backdrop:bg-black/30 backdrop:backdrop-blur-sm"
      >
        <input
          autoFocus
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              e.preventDefault();
              setActive((i) => (i + (e.key === "ArrowDown" ? 1 : -1) + results.length) % Math.max(results.length, 1));
            } else if (e.key === "Enter" && results[active]) go(results[active].slug);
          }}
          placeholder="Search components…"
          aria-label="Search components"
          className="w-full rounded-t-2xl border-b border-black/10 bg-transparent px-4 py-3.5 text-base outline-none placeholder:text-stone-400"
        />
        <ul role="listbox" className="max-h-80 overflow-y-auto p-2">
          {results.map((item, i) => (
            <li key={item.slug} role="option" aria-selected={i === active}>
              <button
                type="button"
                onClick={() => go(item.slug)}
                onMouseEnter={() => setActive(i)}
                className={`flex w-full items-center justify-between gap-4 rounded-lg px-3 py-2.5 text-left text-sm ${i === active ? "bg-black/[.06]" : ""}`}
              >
                <span className="font-medium">{item.name}</span>
                <span className="text-xs text-stone-500">{item.category}</span>
              </button>
            </li>
          ))}
          {results.length === 0 && <li className="px-3 py-6 text-center text-sm text-stone-500">No components match &ldquo;{query}&rdquo;.</li>}
        </ul>
      </dialog>
    </>
  );
}
