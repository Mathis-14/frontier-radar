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
- **Home stat tile + trend chart hardcode `benchmark === "lmarena-text"`**
  (`src/app/(dashboard)/page.tsx`). If the agent never lands lmarena scores, home shows
  0 / "no scores yet" even when other benchmarks have data.
- **Trend charts need ≥2 distinct `as_of` dates** per benchmark to draw a line; a single
  morning run yields single-point charts. Only cron accumulation fixes this.
- **Benchmark `model` strings are chart series keys** — inconsistent names across runs
  ("GPT-5.6 Luna (max)" vs "GPT-5.6 Luna") fragment series. Upsert conflict key is
  `(benchmark, model, as_of)`.
- Home "Disclosed funding this month" sums every `amount_usd` in the current month
  regardless of `event_type` — a settlement displays as "funding".

Potential app-side follow-ups (NOT scheduled): chart fallback to `amount_usd`, stop
hardcoding lmarena on home, model-name normalization at ingest.
