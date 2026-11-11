import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { BRAND, svgDataUri } from "@/lib/brand";
import { SITE } from "@/lib/site";

export const alt = `${SITE.name}: ${SITE.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const logo = await readFile(path.join(process.cwd(), "public/brand/logo-complete-dark.svg"), "utf8");
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 36,
          background: BRAND.ink,
          color: "#fafaf9",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- rendered to a PNG by next/og, not shipped as markup */}
        <img src={svgDataUri(logo)} alt="" width={720} height={157} />
        <div style={{ display: "flex", fontSize: 44, color: "#d6d3d1", textAlign: "center", maxWidth: 900 }}>
          Small interactions, big memories.
        </div>
        <div style={{ display: "flex", fontSize: 26, color: "#a8a29e" }}>Open-source React components, built from Figma.</div>
      </div>
    ),
    size,
  );
}
