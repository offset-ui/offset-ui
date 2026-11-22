import type { CSSProperties } from "react";
import { COMPONENTS } from "@/lib/registry";
import { cn } from "@/lib/utils";
import { ComponentCard } from "./component-card";

export function ComponentGrid({ className }: { className: string }) {
  return (
    <ul className={cn("grid gap-6", className)}>
      {COMPONENTS.map((c, i) => (
        <li key={c.slug} className="card-in" style={{ "--i": i } as CSSProperties}>
          <ComponentCard slug={c.slug} name={c.name} description={c.description} isNew={c.isNew} priority={i < 2} />
        </li>
      ))}
    </ul>
  );
}
