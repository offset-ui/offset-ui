import { Sidebar } from "@/components/docs/sidebar";

export default function ComponentsLayout({ children }: LayoutProps<"/components">) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
