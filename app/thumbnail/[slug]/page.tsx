import type { Metadata } from "next";
import { LiveThumbnail } from "@/components/docs/live-thumbnail";
import { componentParams, requireComponent } from "@/lib/registry";

export const dynamicParams = false;
export const generateStaticParams = componentParams;
export const metadata: Metadata = { robots: { index: false } };

export default async function ThumbnailCapture({ params }: PageProps<"/thumbnail/[slug]">) {
  const { slug } = await params;
  requireComponent(slug);
  return (
    <div className="relative h-[440px] w-[704px] overflow-hidden bg-[#f7f7f6]">
      <LiveThumbnail slug={slug} />
    </div>
  );
}
