import { cn } from "@/lib/utils";

export function NewBadge({ className }: { className?: string }) {
  return <span className={cn("rounded-full bg-brand/25 px-2 py-0.5 text-[10px] font-medium text-pink-800", className)}>New</span>;
}
