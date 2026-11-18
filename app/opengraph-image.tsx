import { ImageResponse } from "next/og";
import { BRAND } from "@/lib/brand";
import { logoDataUri, OG_SIZE, OG_TEXT, OgImage } from "@/lib/og";
import { SITE } from "@/lib/site";

export const alt = `${SITE.name}: ${SITE.tagline}`;
export const size = OG_SIZE;
export const contentType = "image/png";

export default function OpenGraphImage() {
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
          color: OG_TEXT.primary,
        }}
      >
        <OgImage src={logoDataUri()} width={720} height={157} />
        <div style={{ display: "flex", fontSize: 44, color: OG_TEXT.muted, textAlign: "center", maxWidth: 900 }}>{SITE.tagline}</div>
        <div style={{ display: "flex", fontSize: 26, color: OG_TEXT.subtle }}>Open-source React components, built from Figma.</div>
      </div>
    ),
    size,
  );
}
