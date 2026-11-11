export type ComponentEntry = {
  slug: string;
  name: string;
  description: string;
  /** Component source, relative to the project root. */
  file: string;
  /** Folder in /public the component needs (artwork), if any. */
  assets?: string;
  /** Height of the preview window in px. */
  previewHeight: number;
  isNew?: boolean;
  /** Short usage example shown under the code. */
  usage: string;
  /** Extra requirements worth knowing before copying. */
  notes?: string[];
};

const NEXT_FONT = "Loads its font with next/font/google. Outside Next.js, replace that import with your own font and pass it through the font prop.";

/** Newest first. Add a component here and it appears in the sidebar, docs page and preview. */
export const COMPONENTS: ComponentEntry[] = [
  {
    slug: "imposter-captcha",
    name: "Imposter Captcha",
    description: "A whack-the-imposter verification game: catch the imposters before the timer runs out, then watch the keys collapse into a verified reveal.",
    file: "components/ui/imposter-captcha.tsx",
    assets: "public/imposter-captcha",
    previewHeight: 520,
    isNew: true,
    usage: `import { ImposterCaptcha } from "@/components/ui/imposter-captcha";

<ImposterCaptcha
  target={5}
  duration={10}
  onSuccess={() => setVerified(true)}
  onFail={(missed) => console.log(missed)}
/>`,
    notes: [NEXT_FONT, "Set duration={0} for an untimed round (accessibility option)."],
  },
  {
    slug: "memory-camera",
    name: "Memory Camera",
    description: "A retro camera that prints a stamp-cutout memory on every shutter tap, with a flash, recoil, cursor tilt and a scrapbook row.",
    file: "components/ui/memory-camera.tsx",
    assets: "public/memory-camera",
    previewHeight: 760,
    isNew: true,
    usage: `import { MemoryCamera } from "@/components/ui/memory-camera";

<MemoryCamera
  images={["/photos/1.png", "/photos/2.png", "/photos/3.png"]}
  onComplete={() => console.log("all collected")}
/>`,
    notes: [NEXT_FONT, "Up to five images. Pass stampMask={false} if your images already have the stamp edge baked in."],
  },
  {
    slug: "checklist",
    name: "Checklist",
    description: "A hand-drawn check-off list: the tick draws itself, a pen scribble strikes the task, and unchecking dissolves it into particles.",
    file: "components/ui/checklist.tsx",
    previewHeight: 400,
    isNew: true,
    usage: `import { Checklist } from "@/components/ui/checklist";

<Checklist
  items={[
    { id: "read", label: "Read 5 pages of a book" },
    { id: "plants", label: "Water the plants" },
  ]}
  onCheckedChange={(ids) => console.log(ids)}
/>`,
    notes: [NEXT_FONT],
  },
  {
    slug: "proximity-scroll-indicator",
    name: "Proximity Scroll Indicator",
    description: "A tiny progress ring that expands into a section navigator, with a hover zoom that follows the cursor.",
    file: "components/ui/proximity-scroll-indicator.tsx",
    previewHeight: 520,
    usage: `import { ProximityScrollIndicator } from "@/components/ui/proximity-scroll-indicator";

<ProximityScrollIndicator
  sections={[
    { id: "intro", label: "Intro" },
    { id: "features", label: "Features" },
  ]}
/>`,
    notes: ["Each section id must match an element id on the page."],
  },
  {
    slug: "isometric-keyboard",
    name: "Isometric Keyboard",
    description: "An isometric keyboard whose keys press in a wave that follows the cursor.",
    file: "components/ui/isometric-keyboard.tsx",
    previewHeight: 440,
    usage: `import { IsometricKeyboard } from "@/components/ui/isometric-keyboard";

<IsometricKeyboard theme="light" onKeyActivate={(label) => console.log(label)} />`,
  },
  {
    slug: "dynamic-metrics-chart",
    name: "Dynamic Metrics Chart",
    description: "A sales and units chart with timeframe tabs, animated bars and a built-in empty state.",
    file: "components/ui/dynamic-metrics-chart.tsx",
    previewHeight: 640,
    usage: `import { DynamicMetricsChart } from "@/components/ui/dynamic-metrics-chart";

<DynamicMetricsChart frames={frames} defaultTimeframe="7d" onRefresh={refetch} />`,
    notes: ["Frames with zero units show the empty state automatically."],
  },
  {
    slug: "share-panel",
    name: "Share Panel",
    description: "A share dialog with copy link, an anyone-with-the-link switch and an invite list with animated rows.",
    file: "components/ui/share-panel.tsx",
    assets: "public/share-panel",
    previewHeight: 580,
    usage: `import { SharePanel } from "@/components/ui/share-panel";

<SharePanel link="https://example.com/doc" onInvite={(person) => api.invite(person)} />`,
  },
  {
    slug: "grab-toggle",
    name: "Grab Toggle",
    description: "A switch where a cartoon hand reaches in, grabs the knob and drags it across.",
    file: "components/ui/grab-toggle.tsx",
    previewHeight: 280,
    usage: `import { GrabToggle } from "@/components/ui/grab-toggle";

<GrabToggle onCheckedChange={(on) => console.log(on)} />`,
  },
];

export const getComponent = (slug: string) => COMPONENTS.find((c) => c.slug === slug);
