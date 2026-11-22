import { Footer } from "@/components/docs/footer";
import { Sidebar } from "@/components/docs/sidebar";
import { Topbar } from "@/components/docs/topbar";

export default function ComponentsLayout({ children }: LayoutProps<"/components">) {
  return (
    <div className="flex min-h-screen flex-col">
      <Topbar motion={false} bordered />
      <div className="mx-auto flex w-full max-w-[1335px] flex-1">
        <Sidebar />
        <main className="flex min-w-0 flex-1">{children}</main>
      </div>
      <Footer />
    </div>
  );
}
