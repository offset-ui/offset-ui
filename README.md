<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="public/brand/logo-complete-dark.svg">
    <img src="public/brand/logo-complete-light.svg" alt="Offset UI" width="320">
  </picture>
</p>

<p align="center">
  <a href="https://github.com/offset-ui/offset-ui/actions/workflows/ci.yml"><img src="https://github.com/offset-ui/offset-ui/actions/workflows/ci.yml/badge.svg" alt="CI status"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/licence-MIT-1c1917" alt="MIT licence"></a>
  <a href="https://github.com/offset-ui/offset-ui/releases"><img src="https://img.shields.io/github/v/release/offset-ui/offset-ui?color=F494BA&label=release" alt="Latest release"></a>
</p>

# Offset UI

Small interactions, big memories. Open-source React components built pixel-for-pixel from Figma, with motion you will remember.

**Live docs and previews: <https://offset-ui-beta.vercel.app>**

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

The components are plain React, so they work in Next.js, Vite, Remix, Astro and any other React 19 setup. They use your system font by default (Inter if your page loads it); pass `fontFamily` or `typography.fontFamily` to use your own.

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

## Bonus: a code-audit skill

If you build with an AI assistant, [`skills/code-audit.md`](skills/code-audit.md) is a ready-made prompt that audits code before you ship it. It looks for dead code, bugs, security and performance problems, and checks accessibility and reduced motion, then fixes what it finds without changing behaviour. In Claude Code, save it as `.claude/skills/code-audit/SKILL.md` and run it after you build a component. With any other assistant, paste it in and point it at your file.

## Browser support

Modern evergreen browsers. The squircle corner shape (`corner-shape`) falls back to normal rounded corners where it is not supported.

## Licence and assets

Code is released under the [MIT licence](LICENSE). The sample portraits in `public/memory-camera` are AI-generated demo images. Replace them with your own before shipping. Fonts (Inter, Noto Color Emoji, Geist) are open-licensed through Google Fonts.

If Offset UI saves you time, a star on GitHub helps us ship the next component sooner.
