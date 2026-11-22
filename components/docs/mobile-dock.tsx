"use client";

import { useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import { openSearch } from "./search";
import type { NavGroup } from "@/lib/registry";
import { SidebarNav } from "./sidebar-nav";
import { SquircleLayer } from "./squircle-layer";

const DOCK_FILL = "color-mix(in srgb, var(--foreground) 5%, var(--background))";
const ICON = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export function MobileDock({ groups }: { groups: NavGroup[] }) {
  const drawer = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const openMenu = () => {
    setOpen(true);
    drawer.current?.showModal();
  };
  return (
    <>
      <div
        style={{ background: DOCK_FILL, "--sq-fill": DOCK_FILL } as CSSProperties}
        className="smooth fixed bottom-5 left-1/2 z-30 flex h-[35px] w-[167px] -translate-x-1/2 items-center rounded-(--radius-control) shadow-[0_2px_8px_rgb(0_0_0/0.06)] md:hidden"
      >
        <SquircleLayer radius="--radius-control" fill="var(--sq-fill)" />
        <button type="button" onClick={openSearch} aria-label="Search components" className="flex h-full min-w-0 flex-1 items-center gap-2 rounded-l-lg pl-3 pr-1.5 text-left text-sm text-muted focus-ring">
          <Image aria-hidden src="/icons/search.svg" alt="" width={16} height={16} className="shrink-0" />
          <span className="truncate">Search Com...</span>
        </button>
        <span aria-hidden className="h-[23px] w-px bg-foreground/5" />
        <button type="button" aria-label="Open menu" onClick={openMenu} className="flex h-full items-center rounded-r-lg pl-2 pr-3 focus-ring">
          <Image aria-hidden src="/icons/menu.svg" alt="" width={16} height={16} />
        </button>
      </div>

      <dialog
        ref={drawer}
        aria-label="Menu"
        onClose={() => setOpen(false)}
        onClick={(e) => (e.target === e.currentTarget || (e.target as HTMLElement).closest("a")) && e.currentTarget.close()}
        className="m-0 h-dvh max-h-none w-[min(20rem,85vw)] overflow-y-auto bg-background p-0 text-foreground shadow-2xl backdrop:bg-black/30 backdrop:backdrop-blur-sm open:animate-[drawer-in_.25s_ease-out] motion-reduce:animate-none md:hidden"
      >
        <div className="flex min-h-full flex-col">
          <button type="button" aria-label="Close menu" onClick={() => drawer.current?.close()} className="mr-3 mt-3 flex size-9 shrink-0 items-center justify-center self-end rounded-lg text-muted focus-ring hover:bg-foreground/[.04]">
            <svg aria-hidden {...ICON}>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          {open && <SidebarNav groups={groups} />}
        </div>
      </dialog>
    </>
  );
}
