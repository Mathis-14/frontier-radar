# Frontier Radar — UI rebuild: boxes + sidebar (hybrid OriginKit / ReactBits / MagicUI)

## Context

The founder felt the first pass didn't honor his ask for OriginKit components, and wants the "boxes" (cards/tiles/panels) and the sidebar rebuilt with animated components, drawing on OriginKit plus new idea sources (magicui.design, reactbits.dev, 21st.dev, ui.shadcn.com). Verified via OriginKit's own MCP: **OriginKit ships only effects** (~46 components — text ×24, image reveals ×10, cursors ×7, ambient ×5, particle backgrounds, effect buttons) — **no structural cards, sidebars, bento grids, or nav**. So the honest way to maximize OriginKit is the hybrid: structure from ReactBits + MagicUI (free copy-paste), genuine OriginKit effects layered on top. Also requested: improve "the way we do things" → a documented component-sourcing convention.

App: `/Users/mathis/Documents/dev/frontier-radar/app` — Next.js 16 App Router, Tailwind v4 (CSS-only config), shadcn **Base UI flavor** (`render` prop, never `asChild`), Recharts, cream/terracotta theme (Fraunces + Inter), pnpm + Vercel `--frozen-lockfile`.

## Assumption Ledger

| # | Assumption | Questioned how | Status | Impact if wrong |
|---|---|---|---|---|
| 1 | OriginKit has no structural sidebar/card components | Their MCP: list_components/search swept (text/image/cursor/animation categories + card/sidebar/nav/dashboard searches → zero structural hits) | CONFIRMED (evidence) | — |
| 2 | Sourcing = hybrid: ReactBits+MagicUI structure, genuine OriginKit effects on top | AskUserQuestion (no answer — recommended option) | ASSUMED | switch to max-OriginKit → more experimental look, fewer usable pieces |
| 3 | Scope = sidebar + all 5 pages, one coherent kit | AskUserQuestion (no answer — recommended option) | ASSUMED | narrow to sidebar+home only — plan phases already give that checkpoint |
| 4 | Intensity = premium-subtle (spotlight/tilt hover; beam/shine on max 2 hero cards; no permanent heavy motion) | AskUserQuestion (no answer — recommended option) | ASSUMED | "animé assumé" → swap in Border Glow/Electric Border + gooey nav at same slots |
| 5 | Cream theme + Fraunces + shadcn Base UI skeleton (forms/dialogs/tables) stay | Founder said "correct and iterate until UI clean" about this theme; never asked to change it | ASSUMED | retheme is a separate pass; kit consumes CSS vars so it survives |
| 6 | OriginKit budget: 10 get_component/day, **~3 left today** (7 used 2026-07-22); list/search free | github README + today's MCP calls | CONFIRMED (evidence) | if fetches fail → build structure today, effects tomorrow |
| 7 | Zero new npm packages: `framer-motion@12` + `gsap@3.15` already installed (used by vendored OriginKit files) | package.json read by Plan agent | CONFIRMED (evidence) | escape hatch: one deliberate `pnpm add` + lockfile committed together |
| 8 | Charts stay Recharts with the validated palette (dataviz rules) | prior session decision, committed | CONFIRMED | — |

## 1. Component mapping (current → target)

| Surface | Target | Source |
|---|---|---|
| Sidebar shell (`ui/sidebar.tsx`) | **keep** shadcn Base UI primitives | — |
| Sidebar nav (`app-sidebar.tsx`) | animated active-pill: `layoutId` pill sliding behind active item + icon micro-scale on hover | in-house (~30 lines framer-motion; ReactBits Gooey/Pill Nav are horizontal — wrong shape) |
| Sidebar brand tile | radar-sweep (conic-gradient behind the lucide Radar icon) + ShinyText-style title | in-house CSS + OriginKit text fetch |
| Sidebar bg | faint MagicUI Dot Pattern, masked top third, ~4% opacity (skippable at checkpoint) | MagicUI |
| Home hero | **keep** genuine stardust/aurora + MagicUI **Border Beam** on the hero card (glow card 1/2) | MagicUI |
| Hero headline | genuine OriginKit text effect (NOT scramble — already archived unfit) | OriginKit fetch |
| ReleaseTicker | MagicUI **Marquee** (edge fade, pause on hover) behind existing adapter | MagicUI |
| StatTiles | MagicUI **Number Ticker** + shared hover-lift `StatCard` (keep serializable `format` hint — RSC-safe precedent) | MagicUI |
| News list rows | stagger-in reveal (ReactBits Animated List pattern) | ReactBits |
| Companies grid | MagicUI **Magic Card** (spotlight) + optional ReactBits Tilted Card at ≤4° | MagicUI + ReactBits |
| Company [slug] tabs | keep Tabs/Cards; panel fade-in via tw-animate-css | zero-dep |
| Benchmarks matrix | MagicUI **Shine Border** (static shine — glow card 2/2); table + charts untouched | MagicUI |
| Benchmarks/Finance cards | shared hover-lift StatCard surface; tables stay shadcn | kit |
| Networking suggestions | Magic Card surface; **keep** genuine MagneticActionButton; ghost Dismiss stays | MagicUI |
| ContactsManager | keep dialog/table; in-house ShimmerButton → MagicUI Shimmer Button (via Base UI `render` prop) | MagicUI |
| Dead stand-ins | delete unused `blur-reveal.tsx`, `text-morph.tsx` in polish pass | — |

**Install method: copy-paste vendoring everywhere, never the shadcn CLI registry** (it would add the `motion` package duplicating framer-motion + churn the frozen lockfile). Rewrite `motion/react` → `framer-motion` imports (identical API in v12).

## 2. Kit organization + sourcing convention ("the way we do things")

```
src/components/kit/
  vendor/                 # verbatim upstream, ONLY place @ts-nocheck allowed
    originkit/<name>/     # moved from src/components/originkit/vendor/
    magicui/<name>.tsx    # marquee, number-ticker, magic-card, border-beam, shine-border, dot-pattern, shimmer-button
    reactbits/<name>.tsx  # animated-list, tilted-card (TS+Tailwind variant)
  *.tsx                   # typed themed ADAPTERS — the only import surface for app code
```

Rules, written to a new `docs/UI-KIT.md` (linked from `AGENTS.md`; `docs/agent-context/roadmap-state.md` updated on ship):
1. Sourcing map: OriginKit MCP = effects (search free, get_component costs budget — always search first); ReactBits = structural cards/nav/lists; MagicUI = tickers/marquees/borders/buttons; 21st.dev only for a named gap. Unfit fetches archived in `originkit-archive/` so budget is never re-spent.
2. Vendor header contract: `// @ts-nocheck — vendored <lib>` + source URL + fetch date + local modifications list.
3. Pages/sections never import `kit/vendor/**` — adapters only, fully typed, theme via CSS vars (hardcoded vendor colors lifted to props).
4. Cut over the ~8 existing import sites in one commit; no re-export shims.

## 3. OriginKit budget spend (today ≈ 3)

1. One ambient grid (`reactivegrid` or `kineticgrid`) — low-opacity underlay (sidebar header zone or hero).
2. One premium hero text effect (decrypted/shiny family, not scramble).
3. `encrypt-button` — thematically perfect for an intelligence dashboard (Accept action / login submit) — or hold as buffer if #1/#2 need a re-fetch.
Tomorrow: image-reveal for company [slug] headers, second text effect for section headings, tweak re-fetches.

## 4. Migration order

- **Phase 0 — kit scaffolding** (no visual change): create `kit/`, `git mv` originkit vendor files, cut over imports, vendor MagicUI/ReactBits sources, write `docs/UI-KIT.md`. Gate: `pnpm build` green.
- **Phase 1 — sidebar + home**: nav pill, radar-sweep brand, dot pattern, hero border-beam, OriginKit fetches, marquee + ticker swaps, news stagger.
- **📸 CHECKPOINT** — `pnpm build && pnpm start -p 3111`, screenshots to the founder; intensity dial adjusted here before propagating.
- **Phase 2 — companies + [slug]** · **Phase 3 — benchmarks + finance** · **Phase 4 — networking** (per mapping above).
- **Phase 5 — polish**: `prefers-reduced-motion` audit (marquee/beam/sweep pause or degrade), dark-mode pass, delete dead stand-ins, update `docs/agent-context/roadmap-state.md`, commit + push → Vercel.

## 5. Verification

1. `pnpm lint && pnpm build` per phase (catches RSC boundary breaks).
2. `pnpm start -p 3111`; eyeball all 6 routes + login, **including demo-mode empty states**.
3. RSC audit: every kit file `"use client"`; only serializable props cross server→client.
4. Reduced-motion emulation: animated pieces stop or fade static.
5. Theme integrity: grep new files for hex literals (must be CSS vars/props); `.dark` sanity check.
6. Lockfile: `git status` shows no package.json/pnpm-lock drift (else `pnpm install` + both committed together).

## Critical files

`src/components/app-sidebar.tsx` · `src/app/(dashboard)/page.tsx` · `src/components/originkit/*` (tree reorganized into `src/components/kit/`) · `src/components/sections/{stat-tiles,release-ticker}.tsx` + networking suggestion cards · `src/app/globals.css` · new `docs/UI-KIT.md`
