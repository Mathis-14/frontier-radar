# Roadmap & state — snapshot 2026-08-03 (verify before trusting)

## Shipped

- **Repo consolidation + polish 2026-07-27 (PRs #5–#7)**: interactive 3D networking map;
  the nested `app/` twin checkout archived — single root checkout is canonical; README
  rewritten for external readers with screenshots (`docs/assets/readme/`).
- **Finance audit + hardening 2026-07-23 (PM, PRs #3–#4)**: transcript audit confirmed bad
  finance data; fixes: radar-finance →v4 (fetch-verify cited pages, per-company sweep,
  currency rounded to source precision, `round_name` labels, valuations baseline),
  radar-benchmarks →v3 (bare canonical model names), coordinator →v8 (cross-domain money
  sweep, maintains `/mnt/memory/finance/valuations.md`). Finance baseline session ingested
  6 verified events as run `2026-07-23-finance-baseline`. Plus model-name normalization at
  ingest+read, benchmark leaderboard/trend dual mode, finance two-chart layout.
- **Multi-agent CMA rebuild 2026-07-23 (AM, PR #2)**: 4 specialists (`claude-sonnet-4-6`)
  + coordinator (`claude-opus-4-8`), regression-gated (`agent/evals/case-02/`). July-23
  payload manually ingested (run `2026-07-23-e54be149`).
- **PR #1 2026-07-23**: UI rebuild phases 0–1 (kit, hero, brand marks).
- First real CMA run 2026-07-22 (`agent/evals/case-01/`); security audit passed.

## Active workstream — go-live

Production domain is CONFIRMED: `https://frontier-radar-snowy.vercel.app` (public; only
the auto-generated `*-mathis-14s-projects.vercel.app` URLs sit behind Vercel SSO, which is
expected under Standard Protection). `/api/ingest` on it is reachable and correctly 401s
without the bearer token. Remaining launch steps (`agent/LAUNCH.md`): 4 (vault, token
staged in `agent/IDS.env`) → 6 (deployment, cron 0 7 * * * Europe/Paris) → 7 (smoke run).

**Incident 2026-08-03**: Supabase free-tier project paused after 7 idle days (last
activity 07-27) — DNS for the project host disappears; logged-in visitors get 504s
(middleware hangs refreshing the session) while anonymous requests still render /login.
Fix: founder restores in the Supabase dashboard. Prevention: the daily cron counts as
activity, or upgrade the project. Check before every demo.

## BLOCKED — waiting on founder (each is a one-word go)

1. **Supabase restore** (dashboard → project → Restore) — prerequisite for everything.
2. **Go-live go** → run LAUNCH.md steps 4/6/7 against the confirmed domain.
3. **"update the agent memory"** — dedup lists not synced for the two manual 07-23
   ingests; first cron run may re-report a few items once.
4. **"fix the two finance rows"** — legacy rows (mistral 07-22 $22.8B unlabeled;
   anthropic 07-20 unlabeled) need a direct DB update; ingest can't correct existing rows
   (`ignoreDuplicates`). Cosmetic.
5. **"create the demo account"** — demo user for external viewers (credentials to
   LOGIN-local.txt only, never the repo).

## Data state (unchanged since 07-23)

Benchmarks: 31 rows / 26 normalized models on `aa-intelligence-index`, two as_of dates,
zero cross-date model overlap → leaderboard bars until the cron produces overlapping days.
Finance: 8 events, full valuation landscape. Trend lines build from cron accumulation.
