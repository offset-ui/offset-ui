import { ImageResponse } from "next/og";
import { BRAND, svgDataUri, tileSvg } from "@/lib/brand";
import { OgImage } from "@/lib/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<OgImage src={svgDataUri(tileSvg())} width={size.width} height={size.height} style={{ background: BRAND.ink }} />, size);
}
