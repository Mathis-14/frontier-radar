# The agent↔app contract & dashboard data-shape truths

## Ingest contract (single source of truth)

`src/lib/ingest/schema.ts` — zod envelope v1. The CMA system prompt (§5 in
`../agent/agent.json`) mirrors it; **change both together**. Enforced: http(s)-only URLs
(XSS guard — agent input is untrusted web content), `community.source ∈ hn|reddit|x`,
gauge enum, `YYYY-MM-DD` dates.

`POST /api/ingest`: bearer `INGEST_TOKEN` (timing-safe compare) · 422 returns the zod
issues (the agent's Outcome loop self-corrects on them) · idempotent via
`ingest_runs UNIQUE(run_id)` — a replayed POST returns `{deduped:true}` · unknown company
slugs are auto-inserted as untracked.

## Dashboard data-shape truths (what pages need to not look empty)

Verified 2026-07-23 against the live DB + code:

- **Finance page headline chart** (`ValuationBars`) plots only events with
  `valuation_usd` set — events carrying only `amount_usd` (e.g. a settlement) render in
  the table but leave the chart at "No valuations reported yet."
- **Home stat tile + trend chart feature the benchmark with the most scores** (dynamic
  since 2026-07-23, `src/app/(dashboard)/page.tsx`) — no slug is hardcoded anymore; empty
  only when there are zero benchmark rows.
- **Trend charts need ≥2 distinct `as_of` dates** per benchmark to draw a line; a single
  morning run yields single-point charts. Only cron accumulation fixes this.
- **Benchmark `model` strings are chart series keys** — normalized since 2026-07-23:
  `normalizeModelName` (`src/lib/ingest/upsert.ts`) strips config/effort suffixes like
  "(max)" at ingest AND at read time (legacy rows), collapsing variants to the best score
  per `(benchmark, model, as_of)` — which stays the upsert conflict key.
- Home "Disclosed funding this month" sums every `amount_usd` in the current month
  regardless of `event_type` — a settlement displays as "funding".

Potential app-side follow-ups (NOT scheduled): finance chart fallback to `amount_usd`.
