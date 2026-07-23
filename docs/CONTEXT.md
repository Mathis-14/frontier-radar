# Frontier Radar — agent context

Session memory for any agent (Claude/Codex) picking this project up cold.
**Maintenance rule:** update the "State" section when something ships; append gotchas when proven. Keep < 150 lines. Never write credentials here — this repo is PUBLIC.

## What this is

Personal AI-industry intelligence dashboard. A **Claude Managed Agent** (CMA) sweeps the web each morning (news, model releases, benchmarks, community sentiment, valuations for 8 tracked labs), grades itself against an Outcome rubric, and POSTs one JSON payload to this app. Next.js 16 + Tailwind v4 + shadcn (Base UI flavor: `render` prop, not `asChild`) + Supabase, deployed on Vercel.

## Layout (two halves)

- **This repo (`app/` on disk, public on GitHub `Mathis-14/frontier-radar`)** — the dashboard.
- **`../agent/` — NOT in this repo, local disk only** — the CMA build kit: `agent.json` (system prompt v2), `outcome.md` (5 binary criteria), `first_prompt.txt` (relative dates only), `deployment.json` (cron template), `memory-seed/`, `evals/case-01/` (first verified run = regression baseline), `LAUNCH.md` (**the runbook** — resumable curl sequence), `IDS.env` (live object IDs), `.env` (Anthropic key, mode 600).

## The contract (single source of truth)

`src/lib/ingest/schema.ts` — zod envelope v1. The agent's system prompt (§5 in `../agent/agent.json`) mirrors it; **change both together**. Enforced: http(s)-only URLs (XSS guard — agent input is untrusted web content), `community.source ∈ hn|reddit|x`, gauge enum. `POST /api/ingest`: bearer `INGEST_TOKEN` (timing-safe), 422 with zod issues (the agent's Outcome loop self-corrects on these), idempotent via `ingest_runs UNIQUE(run_id)` → replay returns `{deduped:true}`.

## Live CMA objects (recipe, don't hardcode)

```bash
cat ../agent/IDS.env   # AGENT_ID (version 2, claude-opus-4-8), ENV_ID, MEMSTORE_ID, SESSION_ID
```
Memory store files: `/config/companies.md` (tracked list — edit to change coverage, no redeploy), `/reported/{urls,models,finance}.md` (21-day dedup), `/benchmarks/latest.md`. List-memories API returns **no content** — read `content_size_bytes` or retrieve individually.

## State — 2026-07-22 (verify before trusting)

- First real agent run: grader `satisfied`, payload injected (after mapping `hackernews→hn`; agent updated to **v2** with explicit enum — self-corrects via 422 once wired to the live endpoint). Fixture/demo rows purged from Supabase.
- Auth: Supabase, signups disabled, two users exist (see Supabase → Authentication; local creds file `LOGIN-local.txt`, gitignored — **never commit or quote credentials**). Login form maps bare usernames → `<name>@frontier-radar.app`.
- OriginKit (fetched via their MCP, key in `.env.local` as `ORIGINKIT_API_KEY`, 10 fetches/day, 7 used on 2026-07-22): **in use** = typewriter, scroll-text-reveal, magnetic-hover-button, stardust (masked top band, opacity 25%). **Reverted as unfit** (Framer-trigger/hero-scale issues): scrambletext, curvedmarquee — raw sources kept in `originkit-archive/`. `vendor/` files are `@ts-nocheck` by design.
- Security audit passed (pre-deploy): no secrets in tree or git history; RLS `authenticated`-only; middleware fails closed (503) in prod without env vars; contact provenance server-side.
- **UI rebuild — phases 0–1 done, AT CHECKPOINT (2026-07-23, committed locally, not pushed)**: kit scaffolding + sidebar/home animations landed per `docs/UI-REBUILD-PLAN.md` (sourcing convention now in `docs/UI-KIT.md`). Vendored MagicUI ×8 + ReactBits ×2 (copy-paste, `motion/react`→`framer-motion`); `src/components/originkit/` moved to `src/components/kit/` (vendor lint-exempt). Checkpoint screenshots verified (tickers/stagger fire on real scroll — full-page captures show 0s, artifact only). **Awaiting founder**: Assumption Ledger items 2–5 + intensity dial, then phases 2–5. OriginKit MCP was NOT connected this session → hero-headline + brand-title genuine text effects still pending (plan §3 fallback: structure now, effects later); re-check budget before fetching.

## Next actions

**Active workstream — UI rebuild**: follow `docs/UI-REBUILD-PLAN.md` (component mapping, kit layout `src/components/kit/{vendor,adapters}`, sourcing convention → new `docs/UI-KIT.md`, migration phases 0–5, verification list). Assumption Ledger items 2–5 in that file are ASSUMED (founder was AFK) — confirm at the screenshot checkpoint.

## BLOCKED — agent go-live (in order)

1. Vercel → Settings → **Deployment Protection → Vercel Authentication → "Only Preview Deployments"** (currently the SSO intercepts everything, including the agent's future POSTs). Get the exact production URL from the dashboard (Visit button). Note: `frontier-radar.vercel.app` belongs to a **stranger's project** — the real domain is `frontier-radar-*-mathis-14s-projects.vercel.app` shaped.
2. **Rotate `INGEST_TOKEN`** before go-live (`openssl rand -hex 32` → `.env.local` + Vercel env) — the current one touched a session transcript.
3. Run `../agent/LAUNCH.md` step 4 (🔐 vault: set `APP_HOST` + `INGEST_TOKEN` in `IDS.env` first), then step 6 (🗓️ deployment, cron `0 7 * * *` Europe/Paris — `initial_events` replay verbatim: **relative dates only**), then step 7 (manual `-X POST` smoke run).
4. Re-run a manual test session before promoting any new agent version to the deployment (baseline: `../agent/evals/case-01/`).

## Gotchas (never → do instead)

- Never edit `package.json` without `pnpm install --lockfile-only` — Vercel builds with `--frozen-lockfile` and fails on drift.
- Never trust env changes without rebuilding — `NEXT_PUBLIC_*` is inlined at **build** time (`pnpm build && pnpm start -p 3111`).
- Never parse CMA API responses with `jq` — embedded control chars; use `python3 -c "... json.JSONDecoder(strict=False) ..."`.
- Never name a zsh loop variable `path` — it shadows `$PATH` (broke a LAUNCH.md seed loop once).
- Never hand the ingest schema a new enum without updating the agent prompt (§ contract above).

## Commands

```bash
pnpm build && pnpm start -p 3111        # local prod (reference server)
./scripts/post-fixture.sh http://localhost:3000   # ingest test: 200 → deduped:true → 401
pnpm seed                                # load fixture through the real ingest path
```

Never commit: `.env.local`, `LOGIN-local.txt`, `../agent/.env`, `../agent/IDS.env`.
