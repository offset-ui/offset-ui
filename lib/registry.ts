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
  /** One line per prop (or group key), shown in the props table. */
  propDocs?: Record<string, string>;
};


/** Newest first. Add a component here and it appears in the sidebar, docs page and preview. */
export const COMPONENTS: ComponentEntry[] = [
  {
    slug: "imposter-captcha",
    name: "Imposter Captcha",
    description: "A whack-the-imposter verification game: catch the imposters before the timer runs out, then watch the keys collapse into a verified reveal.",
    file: "components/ui/imposter-captcha.tsx",
    assets: "public/imposter-captcha",
    previewHeight: 600,
    isNew: true,
    propDocs: {
      target: "Imposters to catch.",
      duration: "Seconds on the clock. 0 means untimed.",
      difficulty: "How fast imposters pop up and hide.",
      scale: "Card size. 1 is 582px wide; it also shrinks to fit its container.",
      colors: "Card and button colours.",
      surface: "Card background.",
      accent: "Background of the counter pill and the Retry button.",
      text: "Replace the headline, subtitle and button labels.",
      assetPath: "Folder in /public that holds the artwork.",
      onSuccess: "Called when every imposter is caught.",
      onFail: "Called when time runs out, with the number missed.",
      onRetry: "Called when the player presses Retry.",
      className: "Extra classes for the outer wrapper.",
    },
    usage: `import { ImposterCaptcha } from "@/components/ui/imposter-captcha";

<ImposterCaptcha
  target={5}
  duration={10}
  difficulty="normal"
  onSuccess={() => setVerified(true)}
  onFail={(missed) => console.log(missed)}
/>`,
    notes: ["Uses the font of the page it is in.", "Set duration={0} for an untimed round (accessibility option)."],
  },
  {
    slug: "memory-camera",
    name: "Memory Camera",
    description: "A retro camera that prints a stamp-cutout memory on every shutter tap, with a flash, recoil, cursor tilt and a scrapbook row.",
    file: "components/ui/memory-camera.tsx",
    assets: "public/memory-camera",
    previewHeight: 760,
    isNew: true,
    propDocs: {
      images: "Up to five image URLs. Without it, a set of flower placeholders is used.",
      scale: "Overall size. 1 is the 735px design frame.",
      stampMask: "Cut the stamp edge into each image. Turn off if your images already have it.",
      paper: "Colour of the paper the stamps are printed on.",
      scatter: "How the printed stamps sit in the row: neatly or scattered.",
      tilt: "The camera leans toward the cursor.",
      replay: "Show a Replay button once every memory is collected.",
      counterLabel: "Builds the counter text, for example 3/5 memories collected.",
      onCapture: "Called after each print, with its index.",
      onComplete: "Called when the last memory is printed.",
      onReset: "Called when Replay is pressed.",
    },
    usage: `import { MemoryCamera } from "@/components/ui/memory-camera";

<MemoryCamera
  images={["/photos/1.jpg", "/photos/2.jpg", "/photos/3.jpg"]}
  onComplete={() => console.log("all collected")}
/>`,
    notes: ["Shows flower placeholders until you pass your own images.", "Pass stampMask={false} if your images already have the stamp edge baked in."],
  },
  {
    slug: "checklist",
    name: "Checklist",
    description: "A hand-drawn check-off list: the tick draws itself, a pen scribble strikes the task, and unchecking dissolves it into particles.",
    file: "components/ui/checklist.tsx",
    propDocs: {
      items: "The tasks, each with a unique id and a label. Add disabled: true to lock one.",
      checked: "Controls which ids are checked. Leave it out to let the list manage itself.",
      defaultChecked: "Ids that start checked when the list manages itself.",
      colors: "Card and accent colours; the tick and the dividers are derived.",
      surface: "Card background.",
      accent: "Checkbox, strike-through, text and particle colour.",
      particles: "How many particles the strike dissolves into when a task is unchecked.",
      ariaLabel: "Accessible name of the list.",
      onCheckedChange: "Called with the full list of checked ids.",
    },
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
    notes: ["Emoji use your system emoji font; set a font-family on a parent to use another, such as Noto Color Emoji."],
  },
  {
    slug: "proximity-scroll-indicator",
    name: "Proximity Scroll Indicator",
    description: "A tiny progress ring that expands into a section navigator, with a hover zoom that follows the cursor.",
    file: "components/ui/proximity-scroll-indicator.tsx",
    propDocs: {
      sections: "The headings to track, each with the id of an element on the page and a label.",
      colors: "Card and ring colours; the track and text colours are derived.",
      surface: "Card background.",
      progress: "Colour of the progress ring and the active heading line.",
      position: "Pin it to the top or the bottom of the screen.",
      className: "Extra classes for the fixed wrapper, for example to move it sideways.",
    },
    previewHeight: 520,
    usage: `import { ProximityScrollIndicator } from "@/components/ui/proximity-scroll-indicator";

<ProximityScrollIndicator
  position="top"
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
    propDocs: {
      theme: "Force light or dark. Leave it out to follow the page theme.",
      colors: "Surface and accent colours; the key outlines are derived from them.",
      surface: "Fill of the board and the keys.",
      accent: "Colour of a pressed key.",
      keyboard: "Also light up keys when the real keyboard is pressed.",
      onKeyActivate: "Called with the key label under the pointer or just typed, and null when the pointer leaves.",
      className: "Extra classes for the wrapper, for example to set the width.",
    },
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
    propDocs: {
      title: "Heading of the card.",
      frames: "One entry per tab: label, sales, units, salesChange, unitsChange, points (one bar each) and labels (x axis). Without it, demo data is shown.",
      timeframe: "The selected tab's label. Leave it out to let the chart manage it.",
      colors: "Card colours; the greys, borders and tooltip are derived from them.",
      surface: "Card background.",
      text: "Text colour; also the tooltip background.",
      bar: "Bar colour.",
      formatSales: "Turns a sales number into text, for example a currency format.",
      formatUnits: "Turns a units number into text.",
      onTimeframeChange: "Called with the label of the tab that was picked.",
      onRefresh: "Called when the Refresh button in the empty state is pressed.",
    },
    usage: `import { DynamicMetricsChart, type MetricsFrame } from "@/components/ui/dynamic-metrics-chart";

const rows = await fetch("/api/sales?range=7d").then((r) => r.json());

const frames: MetricsFrame[] = [
  {
    label: "7D",
    sales: rows.reduce((sum, r) => sum + r.total, 0),
    units: rows.reduce((sum, r) => sum + r.orders, 0),
    salesChange: 8.2,
    unitsChange: -1.4,
    points: rows.map((r) => r.total),
    labels: rows.map((r) => r.day),
  },
];

<DynamicMetricsChart frames={frames} onRefresh={refetch} />`,
    notes: ["The chart only draws what you give it. Map your own data into frames, as in the example, and it handles the rest.", "A frame with an empty points list shows the empty state."],
  },
  {
    slug: "share-panel",
    name: "Share Panel",
    description: "A share dialog with copy link, an anyone-with-the-link switch and an invite list with animated rows.",
    file: "components/ui/share-panel.tsx",
    assets: "public/share-panel",
    propDocs: {
      title: "Heading of the panel.",
      link: "The link that is shown and copied.",
      maxRecipients: "How many people can be invited at once.",
      allowAnyone: "Controls the anyone-with-the-link switch. Leave it out to let the panel manage it.",
      recipients: "Controls the invited people. Leave it out to let the panel manage the list.",
      colors: "Panel colours; the greys and borders are derived from them.",
      background: "Panel and switch-thumb colour.",
      text: "Text colour.",
      accent: "Switch, Invite button and focus colour.",
      onAllowAnyoneChange: "Called when the switch is toggled.",
      onRecipientsChange: "Called with the new list whenever it changes.",
      onCopyLink: "Called after the link is copied.",
      onInvite: "Called before someone is added; reject to show an error.",
      onRemove: "Called with the id of a removed person.",
    },
    previewHeight: 580,
    usage: `import { SharePanel } from "@/components/ui/share-panel";

<SharePanel link="https://example.com/doc" onInvite={(person) => api.invite(person)} />`,
  },
  {
    slug: "grab-toggle",
    name: "Grab Toggle",
    description: "A switch where a cartoon hand reaches in, grabs the knob and drags it across.",
    file: "components/ui/grab-toggle.tsx",
    propDocs: {
      size: "Small, medium or large.",
      checked: "Controlled value. Leave it out to let the switch manage itself.",
      defaultChecked: "Starting position when uncontrolled.",
      disabled: "Dims the switch and blocks clicks.",
      colors: "Track, knob, hand and sleeve colours; the shading is derived.",
      track: "Track colour when off.",
      trackOn: "Track colour when on.",
      knob: "Knob colour when off.",
      knobOn: "Knob colour when on; also the focus ring.",
      skin: "Colour of the hand and thumb.",
      sleeve: "Colour of the sleeve cuff.",
      ariaLabel: "Accessible name read by screen readers.",
      onCheckedChange: "Called with the new value when the switch is clicked.",
      className: "Extra classes for the switch button.",
    },
    previewHeight: 280,
    usage: `import { GrabToggle } from "@/components/ui/grab-toggle";

<GrabToggle onCheckedChange={(on) => console.log(on)} />`,
  },
];

export const getComponent = (slug: string) => COMPONENTS.find((c) => c.slug === slug);
