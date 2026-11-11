import { Sidebar } from "@/components/docs/sidebar";
import { getStarCount } from "@/lib/github";

export default async function ComponentsLayout({ children }: LayoutProps<"/components">) {
  const stars = await getStarCount();
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar stars={stars} />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
