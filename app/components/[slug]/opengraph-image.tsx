import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { BRAND, svgDataUri } from "@/lib/brand";
import { COMPONENTS, getComponent } from "@/lib/registry";
import { SITE } from "@/lib/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${SITE.name} component`;

export function generateStaticParams() {
  return COMPONENTS.map((c) => ({ slug: c.slug }));
}

/** Share image for each component page: its name and one-line description on the brand background. */
export default async function ComponentImage({ params }: { params: Promise<{ slug: string }> }) {
  const entry = getComponent((await params).slug);
  const logo = await readFile(path.join(process.cwd(), "public/brand/logo-complete-dark.svg"), "utf8");
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
          color: "#fafaf9",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- rendered to a PNG by next/og, not shipped as markup */}
        <img src={svgDataUri(logo)} alt="" width={300} height={65} />
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", width: 96, height: 8, borderRadius: 4, background: BRAND.pink }} />
          <div style={{ display: "flex", fontSize: 84, fontWeight: 700, lineHeight: 1.05 }}>{entry?.name ?? SITE.name}</div>
          <div style={{ display: "flex", fontSize: 32, lineHeight: 1.35, color: "#d6d3d1", maxWidth: 980 }}>{entry?.description ?? SITE.description}</div>
        </div>
        <div style={{ display: "flex", fontSize: 26, color: "#a8a29e" }}>{SITE.url.replace("https://", "")}</div>
      </div>
    ),
    size,
  );
}
