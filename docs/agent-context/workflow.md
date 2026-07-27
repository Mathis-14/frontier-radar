# Workflow — rules of engagement

## Repo layout

- **This repo** (`/Users/mathis/Documents/dev/frontier-radar`, public on GitHub as
  `Mathis-14/frontier-radar`) is the canonical dashboard checkout.
- `./agent/` is the local-only CMA build kit (agent.json, outcome.md, LAUNCH.md,
  IDS.env, memory-seed, evals); it is ignored by Git.
- A legacy nested checkout at `./app/` was archived on 2026-07-27 after its tracked
  tree and local branches were verified against this repository and the shared remote.
- Run Git and npm from the repository root, and sanity-check `git rev-parse
  --show-toplevel` before any push.

## Commit / push / PR

- Feature work goes on a branch → PR → the founder merges. Docs-only updates may go
  straight to main only when the founder says so in-session.
- End commit messages with the Claude co-author line; PR bodies end with the
  Claude Code attribution line.
- Never edit `package.json` without `npm install --package-lock-only` — Vercel uses the
  committed npm lockfile and fails on drift.

## Security nevers (repo is PUBLIC)

- Never commit or quote credentials. Local secrets: `.env.local`, `LOGIN-local.txt`
  (dashboard logins — read for Playwright, never echo), `./agent/.env`, `./agent/IDS.env`.
- Login form maps bare usernames → `<name>@frontier-radar.app`; two Supabase users exist,
  signups disabled.
- Rotate `INGEST_TOKEN` before agent go-live (the current one touched a session transcript).

## Build & verify loop

```bash
cd .../frontier-radar
npm run lint && npm run build
lsof -ti :3111 | xargs kill; npm run start -- -p 3111   # reference prod server
```

- Never trust env changes without rebuilding — `NEXT_PUBLIC_*` inlines at build time, and
  the prod server snapshots `public/` at build time (new static assets need a rebuild).
- Visual verification: Playwright scripts in the session scratchpad log in via
  `LOGIN-local.txt` (`#email`/`#password` fields) and screenshot pages. `whileInView`
  animations do NOT fire in fullPage stitched captures — scroll for real before calling
  a zero-value ticker a bug.
- `./scripts/post-fixture.sh http://localhost:3000` tests ingest (200 → deduped:true → 401);
  `npm run seed` loads the fixture through the real ingest path.

## Misc gotchas (never → do instead)

- Never name a zsh loop variable `path` — it shadows `$PATH`; use another name.
- Never parse CMA API responses with `jq` — embedded control chars; use
  `python3 -c "... json.JSONDecoder(strict=False) ..."`.
- Never hand the ingest schema a new enum without updating the agent prompt (see
  `contract.md`).
- UI components enter the codebase only per `docs/UI-KIT.md` (vendored + adapters,
  zero new npm deps, premium-subtle motion, real brand marks).
