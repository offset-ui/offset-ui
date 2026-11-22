"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import type { NavItem } from "@/lib/registry";
import { componentPath, thumbnailPath } from "@/lib/routes";
import { NewBadge } from "./new-badge";
import { SquircleLayer } from "./squircle-layer";

const CARD =
  "group smooth block rounded-(--radius-card) border border-hairline bg-card p-[3px] transition-colors hover:border-foreground/20 [--sq-border:color-mix(in_srgb,var(--foreground)_5%,transparent)] hover:[--sq-border:color-mix(in_srgb,var(--foreground)_20%,transparent)] focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";
const LiveThumbnail = dynamic(() => import("./live-thumbnail").then((module) => module.LiveThumbnail));
const HOVER_PLAYS = "(hover: hover) and (prefers-reduced-motion: no-preference)";

type ComponentCardProps = Pick<NavItem, "slug" | "name" | "description" | "isNew"> & { priority?: boolean };

export function ComponentCard({ slug, name, description, isNew, priority }: ComponentCardProps) {
  const [playing, setPlaying] = useState(false);

  return (
    <Link
      href={componentPath(slug)}
      onPointerEnter={() => matchMedia(HOVER_PLAYS).matches && setPlaying(true)}
      onPointerLeave={() => setPlaying(false)}
      className={CARD}
    >
      <SquircleLayer radius="--radius-card" fill="var(--card)" border="var(--sq-border)" />
      <div aria-hidden className="relative aspect-[16/10] overflow-hidden rounded-[20px] bg-[#f7f7f6]">
        <Image src={thumbnailPath(slug)} alt="" fill priority={priority} sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw" className="object-cover" />
        {playing && <LiveThumbnail slug={slug} play />}
      </div>
      <div className="px-3 pb-2 pt-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium leading-5">{name}</h3>
          {isNew && <NewBadge />}
        </div>
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted">{description}</p>
      </div>
    </Link>
  );
}
