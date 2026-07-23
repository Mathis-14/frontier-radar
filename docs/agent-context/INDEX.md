# Frontier Radar — agent context (index)

Personal AI-industry intelligence dashboard: a Claude Managed Agent (CMA) sweeps the web
each morning and POSTs one JSON payload to this Next.js 16 + Supabase app on Vercel.
This folder is the session memory for any agent (Claude/Codex) picking the project up cold.

**Read first** `workflow.md`, then `roadmap-state.md`. Read the rest when your task touches it.

| File | What it is / when to read |
| --- | --- |
| `workflow.md` | Rules of engagement: repo layout + twin-checkout trap, commit/push rules, security nevers, build & verify loop. Read before any work. |
| `roadmap-state.md` | Dated snapshot: shipped log, active workstream, blocked go-live steps. Read second. |
| `multiagent-plan.md` | APPROVED next build: coordinator + 4 Sonnet 4.6 specialists. Read before touching `../agent/`. |
| `contract.md` | The agent↔app ingest contract + dashboard data-shape truths (what each page needs to not look empty). |
| `cma-runbook.md` | Live CMA objects, Managed Agents API recipes and gotchas, multiagent API facts. |

Related repo docs (not duplicated here): `docs/UI-KIT.md` (component sourcing convention),
`docs/UI-REBUILD-PLAN.md` (UI phases 0–5 plan), `../agent/LAUNCH.md` (CMA launch runbook).

**Maintenance rule:** update `roadmap-state.md` when a PR lands; append to the other files
only when a decision or gotcha proves durable. Keep every file under ~150 lines.
Never write credentials anywhere in this repo — it is PUBLIC.
