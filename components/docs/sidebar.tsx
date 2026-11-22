import { NAV_GROUPS } from "@/lib/registry";
import { SidebarNav } from "./sidebar-nav";

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-foreground/[.08] md:block">
      <div className="sticky top-(--topbar-h) flex h-[calc(100svh-var(--topbar-h)-var(--footer-h))] flex-col overflow-y-auto">
        <SidebarNav groups={NAV_GROUPS} />
      </div>
    </aside>
  );
}
