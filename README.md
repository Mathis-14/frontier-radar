# Frontier Radar

A personal AI-industry intelligence dashboard. Every morning a **Claude Managed Agent** (see `../agent/`) browses the web for news, model releases, benchmarks, community sentiment and finance events across the tracked AI companies, and POSTs one structured payload to this app's `/api/ingest`. The dashboard renders it: **Road to AGI** daily synthesis, per-company feeds, benchmark comparisons, valuations, and a networking mini-CRM.

Runs in **demo mode** (fixture data, no auth) until Supabase env vars are set.

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
- `src/components/originkit/` — animated component slots (swap for genuine OriginKit source via its MCP; each file names its target component)
- `src/lib/queries.ts` — all reads; falls back to `fixtures/sample-payload.json` in demo mode
- `../agent/LAUNCH.md` — the managed-agent launch runbook (test session → scheduled deployment)
