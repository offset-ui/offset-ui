import { SITE } from "@/lib/site";

export const componentsPath = "/components";
export const componentPath = (slug: string) => `${componentsPath}/${slug}`;
export const previewPath = (slug: string) => `/preview/${slug}`;
export const thumbnailPath = (slug: string) => `/thumbnails/${slug}.webp`;
export const aiPath = (slug: string) => `${componentPath(slug)}/ai`;
export const componentUrl = (slug: string) => `${SITE.url}${componentPath(slug)}`;
