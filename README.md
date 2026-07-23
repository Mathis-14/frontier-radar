# Frontier Radar

A personal AI-industry intelligence dashboard, fed entirely by **Claude Managed Agents**.
Every morning a multi-agent team browses the web and delivers one structured JSON payload
to this app; the dashboard turns it into a morning brief.

**Pages**: *Road to AGI* (daily synthesis + capability gauge + movers) · *Companies*
(per-company feeds) · *Benchmarks* (score leaderboard that becomes trend lines as days
accumulate) · *Finance* (valuations + disclosed amounts, every figure linked to its
source) · *Networking* (a mini-CRM seeded by people who surfaced in the news).

## How the data gets here

```
07:00 cron ─ coordinator (Claude Opus 4.8, Managed Agents "multiagent" feature)
              ├─ radar-news        (Claude Sonnet 4.6) news · releases · contacts
              ├─ radar-benchmarks  (Claude Sonnet 4.6) fixed slugs, per-source recipes
              ├─ radar-finance     (Claude Sonnet 4.6) rounds · valuations · capex
              └─ radar-community   (Claude Sonnet 4.6) HN · Reddit · X sentiment
              → merges, dedups vs its memory store, writes the daily synthesis,
                POSTs one schema-v1 payload → /api/ingest → Supabase → this UI
```

The four specialists run in parallel with isolated contexts and hand off through shared
session files; the coordinator is the only thread that touches memory or the network
credential (host-pinned in a Managed Agents vault — the agent can use the ingest token
without ever being able to read it).

## Stack

Next.js 16 (App Router, RSC) · Tailwind v4 · shadcn/Base UI + vendored motion kit
(see `docs/UI-KIT.md`) · Recharts · Supabase (Postgres + auth, RLS, signups disabled) ·
Vercel. Agent side: Anthropic Managed Agents API (agents, environments, memory stores,
vaults, scheduled deployments) — runbook in `../agent/LAUNCH.md` (local, not in this repo).

Runs in **demo mode** (fixture data, no auth) until Supabase env vars are set.
Access to the live deployment is by credential only — shared privately, never in this repo.

## Setup

1. **Supabase**: create a project at supabase.com → run `supabase/migrations/0001_init.sql` in the SQL Editor → Authentication → Users → Add user (your login; signups stay disabled).
2. **Env**: fill `.env.local` (see keys below) — same values go in Vercel → Project → Settings → Environment Variables.
3. **Seed** (optional): `pnpm seed` loads the fixture payload through the real ingest code path.
4. **Run**: `pnpm dev` — or deploy by importing this repo in Vercel (root = this folder).

| Env var | Where it comes from |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API (server-only) |
| `INGEST_TOKEN` | `openssl rand -hex 32` — same value goes in the agent's 🔐 vault |

## Verify the ingest path

```bash
./scripts/post-fixture.sh http://localhost:3000
# POST 1 → counts · POST 2 → {"deduped":true} · bad token → 401
```

## Structure

- `src/lib/ingest/schema.ts` — the zod contract with the agent (single source of truth)
- `src/app/api/ingest/route.ts` — bearer auth, validation, idempotent upserts
- `src/lib/queries.ts` — all reads (+ model-name normalization); demo-mode fixture fallback
- `src/components/kit/` + `src/components/charts/` — vendored motion/UI kit and charts (`docs/UI-KIT.md`)
- `docs/agent-context/` — working memory for coding agents picking the project up cold
- `../agent/LAUNCH.md` — the managed-agent launch runbook (specialists → coordinator → vault → cron)
