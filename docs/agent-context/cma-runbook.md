# CMA runbook notes — live objects & Managed Agents API

Full launch sequence: `../agent/LAUNCH.md` (resumable; every step sources `IDS.env` and
skips existing objects). This file holds the lookup recipes and API facts around it.

## Live objects (recipe, never hardcode)

```bash
cat ../agent/IDS.env   # AGENT_ID (v2, claude-opus-4-8), ENV_ID, MEMSTORE_ID, SESSION_ID
```

As of 2026-07-23 there is **no VAULT_ID and no DEPLOYMENT_ID** — all dashboard data came
from the single manual test session; the 07:00 Europe/Paris cron does not exist yet.

Memory store files: `/config/companies.md` (tracked list — edit to change coverage, no
redeploy), `/reported/{urls,models,finance}.md` (21-day dedup), `/benchmarks/latest.md`.
List-memories returns no content — read `content_size_bytes` or retrieve individually.

## API recipes

```bash
BASE=https://api.anthropic.com/v1
H=(-H "x-api-key: $ANTHROPIC_API_KEY" -H "anthropic-version: 2023-06-01" \
   -H "anthropic-beta: managed-agents-2026-04-01" -H "content-type: application/json")
curl -sS "$BASE/models" "${H[@]:0:4}"   # verify model IDs (claude-sonnet-4-6 confirmed 2026-07-23)
```

- Memory-store endpoints use header `anthropic-beta: agent-memory-2026-07-22` INSTEAD of
  the managed-agents header (sending both → 400).
- Parse responses with `python3` `JSONDecoder(strict=False)`, never `jq`.
- Manual deployment runs need explicit `-X POST` (bodyless curl → 405).
- Vault credentials are egress-substituted and host-pinned — the agent can use
  `$INGEST_TOKEN` without being able to read it. `INGEST_URL` rides as plain task text.

## Multiagent coordinator (for `multiagent-plan.md`)

```json
"multiagent": { "type": "coordinator", "agents": [
  {"type": "agent", "id": "$SPECIALIST_ID"},
  {"type": "agent", "id": "$SPECIALIST_ID", "version": 2}
]}
```

- Threads share sandbox/filesystem/vault; each has isolated context and its own
  model/system/tools. `{"type":"self"}` spawns coordinator copies.
- Roster pinned to versions resolved at coordinator create/update — updating a specialist
  does NOT propagate until the coordinator is updated too.
- Limits: 1 nesting level, 20 unique roster agents, 25 concurrent threads.
- Docs: platform.claude.com/docs/en/managed-agents/{multiagent-orchestration,agent-setup,
  scheduled-deployments,memory}.
