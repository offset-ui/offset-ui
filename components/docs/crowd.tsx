import type { CSSProperties } from "react";
import { CROWD } from "@/lib/crowd";
import { cn } from "@/lib/utils";
import { CrowdLife } from "./crowd-life";

const { width, height, peepWidth, peepHeight, people } = CROWD;
const stage = { aspectRatio: `${width}/${height}`, width: `max(100cqw, ${Math.ceil((width / height) * 100)}cqh)` };
const pct = (value: number, total: number) => `${(value / total) * 100}%`;

export function Crowd({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("relative md:aspect-(--ratio) md:h-auto", className)} style={{ "--ratio": `${width}/${height}` } as CSSProperties}>
      <div className="absolute inset-0 overflow-hidden [container-type:size]">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2" style={stage}>
          {people.map((p, i) => {
            const { say } = p;
            return (
              <div
                key={i}
                data-peep
                data-say={say}
                className={cn("pointer-events-none absolute origin-bottom", say && "transition-[translate] duration-200 hover:-translate-y-1")}
                style={{ left: pct(p.x, width), top: pct(p.y, height), width: pct(peepWidth * p.s, width), height: pct(peepHeight * p.s, height), transform: `rotate(${p.r}deg)` }}
              >
                <svg className="pointer-events-none block size-full" style={p.flip ? { transform: "scaleX(-1)" } : undefined}>
                  <use href={`/crowd.svg#peep-${p.id}`} style={say ? { pointerEvents: "visiblePainted", cursor: "help" } : undefined} />
                </svg>
              </div>
            );
          })}
        </div>
      </div>
      <CrowdLife />
    </div>
  );
}
