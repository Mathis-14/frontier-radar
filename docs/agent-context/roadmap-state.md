# Roadmap & state — snapshot 2026-07-23 evening (verify before trusting)

## Shipped

- **Finance audit + hardening 2026-07-23 (PM)**: founder flagged wrong finance data; a
  transcript audit confirmed it (settlement was a Sept-2025 story re-dated; Mistral €20B
  recorded as $22.8B off-page; AMD-$5B found by community thread but never promoted to
  finance; specialist searched 5/8 companies). Fixes: radar-finance →v4 (fetch-verify the
  cited page, per-company sweep, currency rounded to source precision, `round_name` label
  on every event, `/finance/valuations.md` baseline), radar-benchmarks →v3 (bare canonical
  model names, one row per model), coordinator →v8 (cross-domain money sweep, maintains
  valuations.md). A dedicated finance baseline session produced 6 verified events
  (Anthropic $965B, OpenAI $852B, xAI $230B, DeepSeek $50B, Mistral $23B talks, AMD $5B)
  ingested as run `2026-07-23-finance-baseline`.
- **PR #3 (branch `feat/benchmark-model-naming`, OPEN)**: model-name normalization at
  ingest+read, benchmark leaderboard mode (bars until any series has 2 dates), restored
  lmarena removal (PR #2 was merged before its second commit — cherry-picked), full-width
  single-benchmark card, finance two-chart layout + transparent hover cursor, 12-item
  scrollable home news list, external-reader README, docs updates.
- **Multi-agent CMA rebuild + regression pass 2026-07-23 (AM)**, merged as PR #2: 4
  specialists (`claude-sonnet-4-6`) + coordinator, LAUNCH.md steps 1a/1b/5b, baseline
  `../agent/evals/case-02/`. July-23 multiagent payload manually ingested
  (run `2026-07-23-e54be149`: 25 benchmark scores, 42 items).
- **PR #1 merged 2026-07-23** (`b36beb2`): UI rebuild phases 0–1 (kit, hero, brand marks).
- First real CMA run 2026-07-22 (`../agent/evals/case-01/`); security audit passed.

## Active workstream — land PR #3, then go-live

Founder merges PR #3 → production picks up all UI/data fixes. Then go-live (below).
After that: UI phases 2–5 (paused on Assumption Ledger answers, see `docs/UI-REBUILD-PLAN.md`).

## BLOCKED — waiting on founder (each is a one-word go)

1. **Production domain** (`frontier-radar-*-mathis-14s-projects.vercel.app`-shaped) →
   unlocks LAUNCH.md step 4 (vault) → 6 (cron 0 7 * * * Europe/Paris) → 7 (smoke run).
   Founder already did the Vercel Deployment Protection change + INGEST_TOKEN rotation
   (new token in `.env.local` + Vercel + staged in `../agent/IDS.env`).
2. **"update the agent memory"** — dedup lists NOT synced for the two manual 2026-07-23
   ingests (write permission-blocked); first cron run may re-report a few items once.
   Prepared files: scratchpad new-{urls,finance,benchmarks}.md (regenerate if lost).
3. **"fix the two finance rows"** — legacy rows (mistral 07-22 $22.8B unlabeled;
   anthropic 07-20 unlabeled) need a direct DB PATCH; ingest can't correct existing rows
   (`ignoreDuplicates`). Cosmetic only.
4. **"create the demo account"** — demo@frontier-radar.app for the Anthropic contact
   (README ready; credentials go to LOGIN-local.txt, never the repo).

## Data state (after the two manual ingests)

Benchmarks: 31 rows / 26 normalized models on `aa-intelligence-index`, two as_of dates but
zero cross-date model overlap → charts show leaderboard bars; lines start when the cron
produces day 2 with stable names. Finance: 8 events, full valuation landscape. Trend lines
and "Disclosed funding this month" build up from cron accumulation.
