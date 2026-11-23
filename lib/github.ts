import { SITE } from "@/lib/site";

const STAR_REVALIDATE_SECONDS = 3600;

export async function getStarCount(): Promise<number | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${SITE.repo}`, {
      headers: { Accept: "application/vnd.github+json" },
      next: { revalidate: STAR_REVALIDATE_SECONDS },
    });
    if (!res.ok) return null;
    const data: { stargazers_count?: unknown } = await res.json();
    return typeof data.stargazers_count === "number" ? data.stargazers_count : null;
  } catch {
    return null;
  }
}

