import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SmartLink } from "./smart-link";
import { SquircleLayer } from "./squircle-layer";

const FOCUS = "focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export const VARIANTS = {
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
};

export function Button({ href, children, variant = "primary" }: ButtonProps) {
  const { className: variantClass, border } = VARIANTS[variant];
  return (
    <SmartLink
      href={href}
      className={cn("smooth inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-(--radius-control) px-5 text-sm font-medium transition-colors", FOCUS, variantClass)}
    >
      <SquircleLayer radius="--radius-control" fill="var(--sq-fill)" border={border} />
      {children}
    </SmartLink>
  );
}
