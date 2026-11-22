import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SquircleLayer } from "./squircle-layer";

type CardProps = { header: ReactNode; headerClassName?: string; children: ReactNode };

export function Card({ header, headerClassName, children }: CardProps) {
  return (
    <div className="smooth rounded-(--radius-card) border border-hairline bg-card p-1">
      <SquircleLayer radius="--radius-card" fill="var(--card)" border="var(--hairline)" />
      <div className={cn("flex items-center justify-between px-3 py-1.5", headerClassName)}>{header}</div>
      <div className="smooth overflow-hidden rounded-(--r) bg-white [--r:20px]">
        <SquircleLayer radius="--r" fill="#fff" />
        {children}
      </div>
    </div>
  );
}
