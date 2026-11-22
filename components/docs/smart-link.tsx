import type { ReactNode } from "react";
import Link from "next/link";

export function SmartLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  if (href.startsWith("/")) return <Link href={href} className={className}>{children}</Link>;
  return (
    <a href={href} target={href.startsWith("mailto:") ? undefined : "_blank"} rel="noreferrer" className={className}>
      {children}
    </a>
  );
}
