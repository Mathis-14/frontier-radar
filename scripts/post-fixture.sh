#!/usr/bin/env bash
# POST the fixture payload at the ingest endpoint, twice (second must return deduped:true).
# Usage: ./scripts/post-fixture.sh http://localhost:3000   (or the Vercel URL)
set -euo pipefail
BASE_URL="${1:-http://localhost:3000}"
if [ -f .env.local ]; then set -a; source .env.local; set +a; fi
: "${INGEST_TOKEN:?INGEST_TOKEN not set (put it in .env.local)}"

echo "→ POST 1 (expect counts):"
curl -sS -w '\nHTTP %{http_code}\n' -X POST "$BASE_URL/api/ingest" \
  -H "Authorization: Bearer $INGEST_TOKEN" -H "content-type: application/json" \
  -d @fixtures/sample-payload.json

echo "→ POST 2 (expect deduped:true):"
curl -sS -w '\nHTTP %{http_code}\n' -X POST "$BASE_URL/api/ingest" \
  -H "Authorization: Bearer $INGEST_TOKEN" -H "content-type: application/json" \
  -d @fixtures/sample-payload.json

echo "→ Bad token (expect 401):"
curl -sS -o /dev/null -w 'HTTP %{http_code}\n' -X POST "$BASE_URL/api/ingest" \
  -H "Authorization: Bearer wrong" -H "content-type: application/json" -d '{}'
