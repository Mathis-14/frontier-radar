# UI Kit — component sourcing convention ("the way we do things")

How animated/visual components enter this codebase. Full rebuild rationale and phase
plan: `docs/UI-REBUILD-PLAN.md`.

## Layout

```
src/components/kit/
  vendor/                 # verbatim upstream — the ONLY place @ts-nocheck is allowed
    originkit/<name>/     # fetched via the OriginKit MCP (budget: 10 get_component/day)
    magicui/<name>.tsx    # copy-paste vendored from the magicui.design registry
    reactbits/<name>.tsx  # copy-paste vendored from reactbits.dev (TS+Tailwind variant)
  *.tsx                   # typed, themed ADAPTERS — the only import surface for app code
```

## Rules

1. **Sourcing map.** OriginKit MCP = effects only (text, image reveals, cursors,
   ambient, particles — it ships no structural cards/sidebars/nav). `search` is free;
   `get_component` costs budget — **always search first**. ReactBits = structural
   cards/nav/lists. MagicUI = tickers/marquees/borders/buttons. 21st.dev only for a
   named gap. Unfit OriginKit fetches are archived in `originkit-archive/` so budget
   is never re-spent on them.
2. **Vendor header contract.** Every `vendor/` file starts with:
   `// @ts-nocheck — vendored <lib>` + source URL + fetch date + a list of local
   modifications (e.g. `motion/react` → `framer-motion` import rewrite).
3. **Adapters only.** Pages and sections never import `kit/vendor/**` — they import
   the typed adapters at `kit/*.tsx`. Adapters take theme via CSS vars; hardcoded
   vendor colors are lifted to props at the adapter boundary.
4. **Install method: copy-paste vendoring, never the shadcn CLI registry** — the CLI
   would add the `motion` package (duplicating `framer-motion`) and churn the frozen
   lockfile. Rewrite `motion/react` imports to `framer-motion` (identical API in v12).
5. **Zero new npm packages.** Animations run on the already-installed
   `framer-motion@12` + `gsap@3.15`. Escape hatch: one deliberate `pnpm add` with the
   lockfile committed in the same commit.
6. **Every kit file is a client component** (`"use client"`); only serializable props
   cross the server→client boundary (see the `StatTile.format` hint precedent).
7. **Vendor animation keyframes** live in `src/app/globals.css` under the
   "Kit vendor animations" `@theme` block — copied verbatim from the upstream registry.
8. **Motion intensity: premium-subtle.** Spotlight/tilt on hover; beam/shine on at
   most 2 hero cards; no permanent heavy motion. Everything animated must degrade
   under `prefers-reduced-motion`.
