import { CROWD } from "@/lib/crowd";
import { cn } from "@/lib/utils";
import { CrowdBlink } from "./crowd-blink";

const { width, height, peepWidth, peepHeight, people } = CROWD;
const pct = (value: number, total: number) => `${(value / total) * 100}%`;

export function Crowd({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("relative overflow-hidden [container-type:size]", className)}>
      <div className="absolute bottom-0 left-1/2 aspect-[1440/290] w-[max(100cqw,497cqh)] -translate-x-1/2">
        {people.map((p, i) => (
          <div
            key={i}
            data-peep
            className="absolute origin-bottom"
            style={{ left: pct(p.x, width), top: pct(p.y, height), width: pct(peepWidth * p.s, width), height: pct(peepHeight * p.s, height), transform: `rotate(${p.r}deg)` }}
          >
            <svg className="block size-full" style={p.flip ? { transform: "scaleX(-1)" } : undefined}>
              <use href={`/crowd.svg#peep-${p.id}`} />
            </svg>
          </div>
        ))}
      </div>
      <CrowdBlink />
    </div>
  );
}
