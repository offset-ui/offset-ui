import { ImageResponse } from "next/og";
import { BRAND } from "@/lib/brand";
import { logoDataUri, logoSize, OG_SIZE, OG_TEXT, OgImage } from "@/lib/og";
import { componentParams, requireComponent } from "@/lib/registry";
import { SITE } from "@/lib/site";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = `${SITE.name} component`;
export const dynamicParams = false;
export const generateStaticParams = componentParams;

export default async function ComponentImage({ params }: { params: Promise<{ slug: string }> }) {
  const entry = requireComponent((await params).slug);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: BRAND.ink,
          color: OG_TEXT.primary,
        }}
      >
        <OgImage src={logoDataUri()} {...logoSize(300)} />
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", width: 96, height: 8, borderRadius: 4, background: BRAND.pink }} />
          <div style={{ display: "flex", fontSize: 84, fontWeight: 700, lineHeight: 1.05 }}>{entry.name}</div>
          <div style={{ display: "flex", fontSize: 32, lineHeight: 1.35, color: OG_TEXT.muted, maxWidth: 980 }}>{entry.description}</div>
        </div>
        <div style={{ display: "flex", fontSize: 26, color: OG_TEXT.subtle }}>{SITE.url.replace("https://", "")}</div>
      </div>
    ),
    size,
  );
}
