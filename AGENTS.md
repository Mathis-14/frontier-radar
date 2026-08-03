<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Frontier Radar — Agent Guide

Daily AI-industry intelligence dashboard: a scheduled Claude Managed Agents run researches news, benchmarks, finance, and community signals, then delivers one validated JSON payload the app ingests and renders. Product vision and feature walkthrough live in `README.md` — it is the source of truth for what the product must be.

**North star: the live dashboard at https://frontier-radar-snowy.vercel.app is always demo-ready. `main` is the demo-safe line — every merged state must be presentable.**

In plan mode, run `/iterate-q` before locking the plan.

This file is the engineering source of truth: read it before any task, update it in the same change when a durable decision or constraint appears. Deep session memory lives in `docs/agent-context/` — read `INDEX.md` and its read-first files before working, and update `docs/agent-context/roadmap-state.md` when you ship.

## Core flow (what the code implements)

```
Scheduled CMA run (coordinator + 4 specialists) → one schema-v1 JSON payload
POST /api/ingest (Authorization: Bearer INGEST_TOKEN)
  → zod parse (src/lib/ingest/schema.ts)
  → idempotent upserts (src/lib/ingest/upsert.ts — reruns dedup by run_id)
Dashboard pages (src/app/(dashboard)/*) read via src/lib/queries.ts only
```

## Stack — locked, do not re-litigate

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript + Tailwind v4 |
| Data & auth | Supabase (Postgres; two users, signups disabled) |
| Charts / 3D | Recharts · Three.js |
| Agent | Claude Managed Agents — coordinator `claude-opus-4-8` + 4 specialists `claude-sonnet-4-6` (kit in `agent/`, local-only) |
| Hosting | Vercel (`frontier-radar-snowy.vercel.app`) |
| Package manager | npm — never edit `package.json` without `npm install --package-lock-only` |

## Commands

```bash
npm run dev                                        # dev server (port 3000)
./scripts/post-fixture.sh http://localhost:3000    # THE ingest smoke: 200 counts → deduped:true → 401
npm run seed                                       # load the fixture through the real ingest path
npm run lint && npm run build                      # must pass before every commit
```

## Architecture

```
src/app             # routes: (dashboard)/{home,benchmarks,finance,networking,companies}, login, api/ingest
src/components      # ui/ (shadcn primitives) · kit/ (animated adapters) · sections/ · app composites
src/lib             # ingest/{schema,upsert}.ts · queries.ts · supabase/
supabase/migrations # schema
fixtures/ scripts/  # sample payload · smoke + seed scripts
docs/agent-context  # session memory for agents — INDEX.md first
agent/              # CMA build kit — local-only, gitignored, never committed
```

- Parse at the boundary: every external payload goes through zod (`src/lib/ingest/schema.ts`) before anything touches the DB.
- The ingest schema and the agent prompt mirror each other — change both together (see `docs/agent-context/contract.md`).
- UI components enter the codebase only per `docs/UI-KIT.md`: vendored + typed adapters, pages never import `kit/vendor/**`, zero new npm deps.
- Don't scaffold: no folders, seams, or abstractions the dashboard doesn't need today.

## Mocks first

- Without Supabase env vars the app runs fixture-backed demo mode — it must always look real on screen.
- `fixtures/sample-payload.json` is the pre-baked fallback; `npm run seed` loads it through the real ingest path.

## External APIs — verified facts (checked 2026-07-23)

- Claude Managed Agents API responses embed control chars — parse with python3 `JSONDecoder(strict=False)`, NEVER `jq`.
- Memory-store endpoints take `anthropic-beta: agent-memory-2026-07-22` ALONE (adding the managed-agents beta header → 400).
- The coordinator pins specialist versions at create/update time — editing a specialist requires re-running the coordinator update.
- Full recipes and gotchas: `docs/agent-context/cma-runbook.md`.

## What never relaxes

- Repo is PUBLIC. No secrets or PII in code, commits, or logs. Local-only, never committed: `.env.local`, `LOGIN-local.txt`, `agent/.env`, `agent/IDS.env`.
- `npm run lint && npm run build` pass before every commit.
- Every LLM/external payload is schema-parsed before the code acts on it.
- The smoke script is never weakened to make it pass; every new ingest behavior adds its check there.
- Search before building (`rg`) — the codebase or the vendored kit probably already does it.
- This file stays current.
- **Repo safety:** never commit on `main` — work on a branch only; never commit without the user's go; never `push --force`, never rewrite history, never merge another branch without explicit approval. Review the diff (`git diff` + staged) before every commit — commit only what you intend. No destructive commands (`reset --hard`, branch deletion, `rm -rf`, dropping data) without explicit approval.

## Decision log (append-only, Why first)

- D001 — Multi-agent CMA: coordinator + 4 domain specialists. Why: a single agent drowned the weak domains (thin finance/benchmarks output).
- D002 — Benchmark model names are bare canonical (no "(max)"-style suffixes), normalized at ingest and read. Why: the upsert key is `(benchmark, model, as_of)`; suffixes fragment chart series.
- D003 — Finance rows are insert-only (`ignoreDuplicates`); corrections happen via direct DB update, never re-POST. Why: re-POSTing can never overwrite an existing row.
- D004 — UI components are vendored per `docs/UI-KIT.md` and imported via adapters only, zero new npm deps. Why: consistency, budget, no supply-chain surprises.
- D005 — Single root checkout (2026-07-27); the nested `app/` twin clone is archived. Why: two clones of one remote caused wrong-repo pushes.

## Demo checklist (run before showing the dashboard)

- [ ] `./scripts/post-fixture.sh` green against the target (local or prod)
- [ ] Supabase project not paused (free tier pauses after ~7 idle days → 504s for logged-in visitors)
- [ ] Live URL + login checked in a real browser: https://frontier-radar-snowy.vercel.app
- [ ] Rollback point known (`git log --oneline -1` on `main`)
