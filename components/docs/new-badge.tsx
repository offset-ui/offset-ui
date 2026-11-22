import { cn } from "@/lib/utils";
import { SquircleLayer } from "./squircle-layer";

export function NewBadge({ className, children = "New" }: { className?: string; children?: string }) {
  return (
    <span className={cn("smooth rounded-(--radius-badge) bg-brand/8 px-1.5 py-0.5 text-[10px] font-medium leading-[15px] text-brand/75", className)}>
      <SquircleLayer radius="--radius-badge" fill="color-mix(in srgb, var(--brand) 8%, transparent)" />
      {children}
    </span>
  );
}
