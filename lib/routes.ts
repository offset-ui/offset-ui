import { SITE } from "@/lib/site";

export const componentPath = (slug: string) => `/components/${slug}`;
export const previewPath = (slug: string) => `/preview/${slug}`;
export const aiPath = (slug: string) => `${componentPath(slug)}/ai`;
export const componentUrl = (slug: string) => `${SITE.url}${componentPath(slug)}`;
