import { cn } from "@/lib/utils";
import { NewBadge } from "./new-badge";
import { SquircleLayer } from "./squircle-layer";

export function MotionPill({ className }: { className?: string }) {
  return (
    <div className={cn("smooth flex items-center gap-2 rounded-(--radius-control) bg-brand/5 px-3 py-1.5", className)}>
      <SquircleLayer radius="--radius-control" fill="color-mix(in srgb, var(--brand) 5%, transparent)" />
      <span className="block h-5 whitespace-nowrap font-display text-sm leading-5 tracking-[-0.07em] text-foreground" style={{ wordSpacing: "0.09em", paddingRight: 2 }}>
        <span className="font-normal">Offset</span> <span className="font-futura font-bold italic">MOTION</span>
      </span>
      <NewBadge>Coming Soon</NewBadge>
    </div>
  );
}
