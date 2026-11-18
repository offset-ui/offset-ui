import type { CSSProperties } from "react";
import { svgDataUri } from "@/lib/brand";
import { readSource } from "@/lib/source";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_TEXT = { primary: "#fafaf9", muted: "#d6d3d1", subtle: "#a8a29e" };

export const logoDataUri = () => svgDataUri(readSource("public/brand/logo-complete-dark.svg"));

type OgImageProps = { src: string; width: number; height: number; style?: CSSProperties };

export function OgImage({ src, width, height, style }: OgImageProps) {
  // eslint-disable-next-line @next/next/no-img-element -- rendered to a PNG by next/og, not shipped as markup
  return <img src={src} alt="" width={width} height={height} style={style} />;
}
