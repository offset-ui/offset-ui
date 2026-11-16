import { CROWD } from "@/lib/crowd";
import { cn } from "@/lib/utils";
import { CrowdLife } from "./crowd-life";

const { width, height, peepWidth, peepHeight, people } = CROWD;
const pct = (value: number, total: number) => `${(value / total) * 100}%`;

export function Crowd({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("relative", className)}>
      <div className="absolute inset-0 overflow-hidden [container-type:size]">
        <div className="absolute bottom-0 left-1/2 aspect-[1440/290] w-[max(100cqw,497cqh)] -translate-x-1/2">
          {people.map((p, i) => {
            const say = "say" in p ? (p.say as string) : undefined;
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
