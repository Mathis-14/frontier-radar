# Workflow — rules of engagement

## Repo layout & the twin-checkout trap

- **This repo** (`app/` on disk, public on GitHub `Mathis-14/frontier-radar`) — the dashboard.
- `../agent/` — the CMA build kit (agent.json, outcome.md, LAUNCH.md, IDS.env, memory-seed,
  evals). On local disk next to `app/`; treat as local-only.
- **TRAP:** the outer folder (the parent directory of this `app/` checkout) is a SECOND,
  stale clone of the SAME GitHub remote, and the shell cwd silently resets to it between
  commands.
  A git command run there once pushed a stale branch to the shared remote.
  **Never run git from the outer clone → prefix every git/pnpm command with an explicit
  `cd .../frontier-radar/app &&` and sanity-check `git rev-parse HEAD` before any push.**

## Commit / push / PR

- Feature work goes on a branch → PR → the founder merges. Docs-only updates may go
  straight to main only when the founder says so in-session.
- End commit messages with the Claude co-author line; PR bodies end with the
  Claude Code attribution line.
- Never edit `package.json` without `pnpm install --lockfile-only` — Vercel builds with
  `--frozen-lockfile` and fails on drift.

## Security nevers (repo is PUBLIC)

- Never commit or quote credentials. Local secrets: `.env.local`, `LOGIN-local.txt`
  (dashboard logins — read for Playwright, never echo), `../agent/.env`, `../agent/IDS.env`.
- Login form maps bare usernames → `<name>@frontier-radar.app`; two Supabase users exist,
  signups disabled.
- Rotate `INGEST_TOKEN` before agent go-live (the current one touched a session transcript).

## Build & verify loop

```bash
cd .../frontier-radar/app
pnpm lint && pnpm build
lsof -ti :3111 | xargs kill; pnpm start -p 3111   # reference prod server
```

- Never trust env changes without rebuilding — `NEXT_PUBLIC_*` inlines at build time, and
  the prod server snapshots `public/` at build time (new static assets need a rebuild).
- Visual verification: Playwright scripts in the session scratchpad log in via
  `LOGIN-local.txt` (`#email`/`#password` fields) and screenshot pages. `whileInView`
  animations do NOT fire in fullPage stitched captures — scroll for real before calling
  a zero-value ticker a bug.
- `./scripts/post-fixture.sh http://localhost:3000` tests ingest (200 → deduped:true → 401);
  `pnpm seed` loads the fixture through the real ingest path.

## Misc gotchas (never → do instead)

- Never name a zsh loop variable `path` — it shadows `$PATH`; use another name.
- Never parse CMA API responses with `jq` — embedded control chars; use
  `python3 -c "... json.JSONDecoder(strict=False) ..."`.
- Never hand the ingest schema a new enum without updating the agent prompt (see
  `contract.md`).
- UI components enter the codebase only per `docs/UI-KIT.md` (vendored + adapters,
  zero new npm deps, premium-subtle motion, real brand marks).
