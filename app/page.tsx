import { preload } from "react-dom";
import { Button } from "@/components/docs/button";
import { ComponentGrid } from "@/components/docs/component-grid";
import { Crowd } from "@/components/docs/crowd";
import { HomeFooter } from "@/components/docs/home-footer";
import { Topbar } from "@/components/docs/topbar";
import { COMPONENTS } from "@/lib/registry";
import { componentsPath } from "@/lib/routes";
import { SITE } from "@/lib/site";

const HERO_FONTS = ["/fonts/SFCompactText-Regular.woff2", "/fonts/SFCompactText-HeavyItalic.woff2"];

export default function Home() {
  HERO_FONTS.forEach((href) => preload(href, { as: "font", type: "font/woff2", crossOrigin: "anonymous" }));
  return (
    <div className="flex min-h-screen flex-col">
      <Topbar />

      <section className="flex min-h-[calc(100svh-var(--topbar-h))] flex-col border-b border-black/[.08] text-center hero-clip">
        <div className="flex flex-1 items-center justify-center px-4 py-12 [@media(min-height:800px)]:py-20">
          <div className="mx-auto flex max-w-[486px] flex-col items-center gap-8 motion-safe:animate-[rise_.7s_ease-out_both]">
            <h1 className="font-display text-[40px] font-normal leading-[1.086] tracking-(--display-tracking) text-foreground sm:text-5xl md:text-[56px]">
              <span className="block whitespace-nowrap">Make Interfaces people</span>
              <span className="block whitespace-nowrap">
                {"want to  "}
                <em className="shine-text font-[790] italic tracking-(--display-tracking-italic)">touch twice</em>
              </span>
            </h1>
            <p className="text-base leading-[normal] text-muted">
              Original components crafted by a <span className="text-brand">designer</span>, each with the prompt and the code to rebuild it in your AI agent of choice.{" "}
              <span className="text-foreground underline decoration-from-font [text-underline-position:from-font]">MIT licensed.</span> Free to use for personal and commercial use.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 p-1">
              <Button href={componentsPath}>Browse components</Button>
              <Button href={SITE.github} variant="outline">
                Star on GitHub
                <span aria-hidden>↗</span>
              </Button>
            </div>
          </div>
        </div>
        <Crowd className="crowd-drop h-36 sm:h-44 md:max-h-[36svh]" />
      </section>

      <main className="mx-auto w-full max-w-[1335px] flex-1 px-4 py-16 md:px-6">
        <section aria-labelledby="all" className="flex flex-col gap-6">
          <div className="flex items-baseline justify-between">
            <h2 id="all" className="section-title scroll-mt-20 leading-7">
              All Components
            </h2>
            <span className="text-sm text-muted">{COMPONENTS.length}</span>
          </div>

          <ComponentGrid className="sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" />
        </section>
      </main>

      <HomeFooter />
    </div>
  );
}
