/**
 * Seed the database with the fixture payload — same code path as /api/ingest.
 * Usage: pnpm seed   (requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local)
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { ingestPayloadSchema } from "../src/lib/ingest/schema";
import { upsertPayload } from "../src/lib/ingest/upsert";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first.");
    process.exit(1);
  }
  const db = createClient(url, key, { auth: { persistSession: false } });
  const payload = ingestPayloadSchema.parse(
    JSON.parse(readFileSync("fixtures/sample-payload.json", "utf8"))
  );
  const counts = await upsertPayload(db, payload);
  console.log("Seeded:", counts);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
