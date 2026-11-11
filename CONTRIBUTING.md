# Contributing to Offset UI

Thanks for helping. Small, focused pull requests are easiest to review.

## Set up

```bash
npm install
npm run dev
```

Before opening a pull request, run `npm run typecheck`, `npm run lint` and `npm run build`. CI runs the same checks.

## Adding a component

- One component per file: `components/ui/<kebab-name>.tsx`. Add `"use client"` only if it uses state, effects, refs or events.
- All text, colours, sizes and speeds come from props, each with a sensible default, so the component works with no props. Accept `className` and merge it with `cn()`.
- Export the prop types.
- Keyboard accessible, visible focus ring, semantic HTML, and respect `prefers-reduced-motion`. Check text contrast against WCAG AA.
- Dependencies stay at `motion`, `clsx` and `tailwind-merge`. Open an issue before adding another.
- Add a demo page at `app/preview/<kebab-name>/page.tsx` and an entry in `lib/registry.ts` with a short usage example.
- Artwork goes in `public/<kebab-name>/`. Only submit images you have the right to share under the MIT licence.

## Reporting bugs and requesting components

Use the issue templates. For bugs, include the browser, what you expected and what happened.

## Code of conduct

Please follow our [Code of Conduct](CODE_OF_CONDUCT.md). For security issues, see [SECURITY.md](SECURITY.md).
