import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SmartLink } from "./smart-link";
import { SquircleLayer } from "./squircle-layer";

const FOCUS = "focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

// `bg-*` / `border-*` are the fallback until <SquircleLayer> draws the smooth shape; `--sq-fill` drives its hover colour.
const VARIANTS = {
  primary: {
    className: "bg-[#111] text-white hover:bg-[#111]/85 [--sq-fill:#111] hover:[--sq-fill:rgb(17_17_17/0.85)]",
    border: undefined,
  },
  outline: {
    className: "border border-foreground/10 text-foreground hover:bg-foreground/[.03] [--sq-fill:var(--background)] hover:[--sq-fill:color-mix(in_srgb,var(--foreground)_3%,var(--background))]",
    border: "color-mix(in srgb, var(--foreground) 10%, transparent)",
  },
} as const;

type ButtonProps = {
  href: string;
  children: ReactNode;
  variant?: keyof typeof VARIANTS;
  /** Corner radius in px. */
  radius?: number;
  /** Corner smoothing: 1 is Figma 100%, 0.6 the iOS default, 0 a plain round corner. */
  smoothing?: number;
  className?: string;
};

export function Button({ href, children, variant = "primary", radius = 8, smoothing = 1, className }: ButtonProps) {
  const { className: variantClass, border } = VARIANTS[variant];
  const style = { "--r": `${radius}px`, "--corner-smoothing": smoothing } as CSSProperties;
  return (
    <SmartLink
      href={href}
      style={style}
      className={cn("smooth inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-(--r) px-5 text-sm font-medium transition-colors", FOCUS, variantClass, className)}
    >
      <SquircleLayer radius="--r" fill="var(--sq-fill)" border={border} />
      {children}
    </SmartLink>
  );
}
