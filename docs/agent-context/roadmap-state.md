# Roadmap & state — snapshot 2026-07-23 (verify before trusting)

## Shipped

- **PR #1 merged 2026-07-23** (`b36beb2`): UI rebuild phases 0–1 — kit scaffolding
  (vendored MagicUI ×8 + ReactBits ×2 + OriginKit move, convention in `docs/UI-KIT.md`),
  sidebar/home animations, sidebar-overflow fix (`min-w-0` on SidebarInset), hero
  typography (65ch/16px + `splitLead`), hero read-more expander (`BriefExpander`),
  real brand marks (`CompanyLogo` + `public/logos/*.svg`).
- First real CMA run 2026-07-22: grader satisfied, payload ingested (session recorded as
  `../agent/evals/case-01/` regression baseline). Fixture rows purged from Supabase.
- Security audit passed pre-deploy (no secrets in tree/history, RLS authenticated-only,
  middleware fails closed in prod).

## Active workstream — multi-agent CMA rebuild

APPROVED by founder 2026-07-23; spec in `multiagent-plan.md`. Implement on a NEW branch
off merged main. This is the next thing to build.

## Paused workstream — UI phases 2–5

`docs/UI-REBUILD-PLAN.md` phases 2–4 (companies/benchmarks/finance/networking pages) +
phase 5 polish wait on founder answers to the plan's Assumption Ledger items 2–5 and the
intensity dial (current: premium-subtle, cream theme + Fraunces). OriginKit MCP was not
connected recently — genuine hero-headline/brand-title text effects still pending
(fallback applied: structure now, effects later; re-check the 10 fetch/day budget).

## BLOCKED — agent go-live (human-only steps, in order)

1. Vercel → Settings → Deployment Protection → Vercel Authentication → "Only Preview
   Deployments" (SSO currently intercepts the agent's POSTs). The real production domain
   is `frontier-radar-*-mathis-14s-projects.vercel.app`-shaped — `frontier-radar.vercel.app`
   belongs to a stranger.
2. Rotate `INGEST_TOKEN` (`openssl rand -hex 32` → `.env.local` + Vercel env).
3. `../agent/LAUNCH.md` step 4 (vault) → step 6 (deployment, cron 0 7 * * * Europe/Paris)
   → step 7 (manual smoke run). With the multi-agent rebuild, specialist creation and the
   coordinator update happen BEFORE the vault/deployment steps — see `multiagent-plan.md`.

## Known data-quality state (from the 2026-07-23 audit)

One run of data total. Benchmarks: only `aa-intelligence-index` (6 scores, one source,
one date) — home page's hardcoded `lmarena-text` tile/chart therefore shows empty.
Finance: one event (settlement, `other`, amount only) — valuations chart empty because no
`valuation_usd` exists yet. Root causes and fixes are folded into `multiagent-plan.md`;
app-side chart fallbacks are a separate, not-yet-scheduled follow-up.
