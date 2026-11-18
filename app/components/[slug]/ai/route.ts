import { buildAiPrompt } from "@/lib/ai-prompt";
import { componentParams, requireComponent } from "@/lib/registry";

export const dynamicParams = false;
export const generateStaticParams = componentParams;

export async function GET(_req: Request, ctx: RouteContext<"/components/[slug]/ai">) {
  const entry = requireComponent((await ctx.params).slug);
  return new Response(buildAiPrompt(entry), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
