import { buildAiPrompt } from "@/lib/ai-prompt";
import { COMPONENTS, getComponent } from "@/lib/registry";

export const dynamicParams = false;

export function generateStaticParams() {
  return COMPONENTS.map((c) => ({ slug: c.slug }));
}

export async function GET(_req: Request, ctx: RouteContext<"/components/[slug]/ai">) {
  const entry = getComponent((await ctx.params).slug);
  if (!entry) return new Response("Not found", { status: 404 });
  return new Response(buildAiPrompt(entry), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
