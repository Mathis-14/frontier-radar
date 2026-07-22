import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const contactSchema = z.object({
  id: z.string().uuid().optional(),
  full_name: z.string().min(1),
  company: z.string().optional().default(""),
  role: z.string().optional().default(""),
  status: z.enum(["met", "to_contact"]).default("to_contact"),
  notes: z.string().optional().default(""),
  source: z.enum(["manual", "agent"]).default("manual"),
});

const suggestionActionSchema = z.object({
  suggestion_id: z.string().uuid(),
  action: z.enum(["accepted", "dismissed"]),
});

async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/** Create/update a contact, or act on a suggestion (accept copies it into contacts). */
export async function POST(request: Request) {
  const { supabase, user } = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);

  const action = suggestionActionSchema.safeParse(body);
  if (action.success) {
    const { suggestion_id, action: verdict } = action.data;
    const { data: sugg, error } = await supabase
      .from("suggested_contacts")
      .update({ status: verdict })
      .eq("id", suggestion_id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (verdict === "accepted" && sugg) {
      const { error: insErr } = await supabase.from("contacts").insert({
        full_name: sugg.full_name,
        company: sugg.company,
        role: sugg.role,
        notes: sugg.reason,
        status: "to_contact",
        source: "agent",
      });
      if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation failed", issues: parsed.error.issues }, { status: 422 });
  }
  const { id, ...fields } = parsed.data;
  const query = id
    ? supabase.from("contacts").update({ ...fields, updated_at: new Date().toISOString() }).eq("id", id)
    : supabase.from("contacts").insert(fields);
  const { error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const { supabase, user } = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const { error } = await supabase.from("contacts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
