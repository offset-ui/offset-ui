# Offset UI

Animated React components built from real Figma designs. Copy, paste, make them yours.

Every component is a single file with typed props, sensible defaults, keyboard and screen-reader support, and `prefers-reduced-motion` handled. Corners use the iOS-style squircle shape where the browser supports it.

## Components

| Component | What it does |
| --- | --- |
| Imposter Captcha | A whack-the-imposter verification game with a collapsing-keys reveal |
| Memory Camera | A retro camera that prints stamp-cutout memories, with cursor tilt |
| Checklist | A hand-drawn check-off list with a drawn tick and a particle dissolve |
| Proximity Scroll Indicator | A progress ring that expands into a section navigator |
| Isometric Keyboard | An isometric keyboard whose keys press in a wave |
| Dynamic Metrics Chart | Sales and units chart with timeframe tabs and an empty state |
| Share Panel | A share dialog with copy link and an invite list |
| Grab Toggle | A switch where a hand grabs the knob |

Live previews and code for each one are on the docs site (this repo): run it locally as below.

## Use a component in your project

1. Install the dependencies (once per project): `npm install motion clsx tailwind-merge`. Requires React 19 and Tailwind CSS v4.
2. Add the `cn` helper from [`lib/utils.ts`](lib/utils.ts).
3. Copy the component file from [`components/ui`](components/ui) into your project. If the docs page for it lists an artwork folder, copy that folder from [`public`](public) too.
4. Import it and use it. Every prop is optional.

```tsx
import { Checklist } from "@/components/ui/checklist";

<Checklist items={[{ id: "a", label: "Ship it" }]} />
```

Some components load their font with `next/font/google`, so they target Next.js. Outside Next.js, replace that import with your own font and pass it through the font prop.

## Run the docs site locally

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. Other scripts: `npm run lint`, `npm run typecheck`, `npm run build`.

## Project structure

```
app/                  docs site (home, /components/[slug]) and /preview/[slug] demo pages
components/ui/        the components (one file each)
components/docs/      docs site UI (sidebar, code block, preview frame)
lib/registry.ts       list of components shown on the docs site
lib/site.ts           name, tagline and links
public/               artwork used by some components
```

To add a component, put the file in `components/ui`, add a demo page in `app/preview/<slug>/page.tsx`, and add an entry to `lib/registry.ts`. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Browser support

Modern evergreen browsers. The squircle corner shape (`corner-shape`) falls back to normal rounded corners where it is not supported.

## Licence and assets

Code is released under the [MIT licence](LICENSE). The sample photos in `public/memory-camera` are demo images only. Replace them with your own before shipping. Fonts (Inter, Noto Color Emoji, Geist) are open-licensed through Google Fonts.

If Offset UI saves you time, a star on GitHub helps us ship the next component sooner.
