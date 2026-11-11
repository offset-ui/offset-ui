import { ImageResponse } from "next/og";
import { BRAND, svgDataUri, tileSvg } from "@/lib/brand";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    // eslint-disable-next-line @next/next/no-img-element -- rendered to a PNG by next/og, not shipped as markup
    <img src={svgDataUri(tileSvg(false))} alt="" width={180} height={180} style={{ background: BRAND.ink }} />,
    size,
  );
}
