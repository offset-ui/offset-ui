import { Footer } from "@/components/docs/footer";
import { Sidebar } from "@/components/docs/sidebar";
import { Topbar } from "@/components/docs/topbar";
import { getStarCount } from "@/lib/github";

export default async function ComponentsLayout({ children }: LayoutProps<"/components">) {
  const stars = await getStarCount();
  return (
    <div className="flex min-h-screen flex-col">
      <Topbar stars={stars} />
      <div className="flex flex-1 flex-col md:flex-row">
        <Sidebar />
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex-1">{children}</div>
          <Footer />
        </main>
      </div>
    </div>
  );
}
