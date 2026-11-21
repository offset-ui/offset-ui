import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";

export function SmartLink({ href, className, style, children }: { href: string; className?: string; style?: CSSProperties; children: ReactNode }) {
  if (href.startsWith("/")) return <Link href={href} className={className} style={style}>{children}</Link>;
  return (
    <a href={href} target={href.startsWith("mailto:") ? undefined : "_blank"} rel="noreferrer" className={className} style={style}>
      {children}
    </a>
  );
}
