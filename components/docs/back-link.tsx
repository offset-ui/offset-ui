import Image from "next/image";
import Link from "next/link";

export function BackLink({ href, children }: { href: string; children: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1.5 rounded-sm text-sm underline underline-offset-4 focus-ring">
      <Image aria-hidden src="/icons/arrow-left.svg" alt="" width={12} height={12} />
      {children}
    </Link>
  );
}
