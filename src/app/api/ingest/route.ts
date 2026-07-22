import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { ingestPayloadSchema } from "@/lib/ingest/schema";
import { upsertPayload } from "@/lib/ingest/upsert";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function tokenMatches(header: string | null): boolean {
  const expected = process.env.INGEST_TOKEN;
  if (!expected || !header?.startsWith("Bearer ")) return false;
  const got = Buffer.from(header.slice(7));
  const want = Buffer.from(expected);
  return got.length === want.length && timingSafeEqual(got, want);
}

export async function POST(request: Request) {
  if (!tokenMatches(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "supabase not configured" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 422 });
  }

  const parsed = ingestPayloadSchema.safeParse(body);
  if (!parsed.success) {
    // 422 with the issues — the agent's Outcome loop reads these and self-corrects.
    return NextResponse.json(
      { error: "validation failed", issues: parsed.error.issues },
      { status: 422 }
    );
  }
  const payload = parsed.data;
  const db = createSupabaseAdminClient();

  // Idempotency anchor: one row per run_id; a replayed POST is a clean no-op.
  const { error: runErr, data: runRow } = await db
    .from("ingest_runs")
    .upsert(
      {
        run_id: payload.run_id,
        run_date: payload.run_date,
        payload_version: payload.version,
        item_counts: {},
      },
      { onConflict: "run_id", ignoreDuplicates: true }
    )
    .select("id");
  if (runErr) {
    return NextResponse.json({ error: runErr.message }, { status: 500 });
  }
  if (!runRow?.length) {
    return NextResponse.json({ run_id: payload.run_id, deduped: true });
  }

  try {
    const counts = await upsertPayload(db, payload);
    await db.from("ingest_runs").update({ item_counts: counts }).eq("run_id", payload.run_id);
    return NextResponse.json({ run_id: payload.run_id, deduped: false, counts });
  } catch (e) {
    // Mark the run invalid so a corrected re-POST with the same run_id isn't swallowed.
    await db
      .from("ingest_runs")
      .update({ status: "invalid" })
      .eq("run_id", payload.run_id);
    await db.from("ingest_runs").delete().eq("run_id", payload.run_id);
    const message = e instanceof Error ? e.message : "upsert failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
