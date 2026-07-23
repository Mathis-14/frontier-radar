import type { SupabaseClient } from "@supabase/supabase-js";
import type { IngestPayload } from "./schema";

/** Strip UTM/tracking params so URL-based dedup is stable across runs. */
export function normalizeUrl(raw: string): string {
  try {
    const u = new URL(raw);
    const drop = [...u.searchParams.keys()].filter(
      (k) => k.startsWith("utm_") || ["ref", "fbclid", "gclid"].includes(k)
    );
    drop.forEach((k) => u.searchParams.delete(k));
    u.hash = "";
    return u.toString().replace(/\/$/, "");
  } catch {
    return raw;
  }
}

/**
 * Strip effort/config qualifiers leaderboards append to model names
 * ("GPT-5.6 Sol (max)" → "GPT-5.6 Sol") so one model stays one chart
 * series across runs. Qualifier list is closed on purpose: parentheses
 * that carry identity (e.g. "(7B)") must survive.
 */
const MODEL_QUALIFIER =
  /\s*\((?:max|high|xhigh|low|medium|minimal|standard|fast|thinking|extended thinking|with fallback|effort[^)]*)\)$/i;

export function normalizeModelName(raw: string): string {
  let name = raw.trim();
  while (MODEL_QUALIFIER.test(name)) name = name.replace(MODEL_QUALIFIER, "").trim();
  return name;
}

export type UpsertCounts = Record<string, number>;

export async function upsertPayload(
  db: SupabaseClient,
  payload: IngestPayload
): Promise<UpsertCounts> {
  // Resolve company slugs → ids; auto-insert unknown slugs as untracked.
  const slugs = new Set<string>();
  for (const item of [
    ...payload.news,
    ...payload.model_releases,
    ...payload.finance,
    ...payload.community,
  ])
    slugs.add(item.company);
  for (const b of payload.benchmarks) if (b.company) slugs.add(b.company);

  const { data: existing, error: compErr } = await db.from("companies").select("id, slug");
  if (compErr) throw compErr;
  const idBySlug = new Map((existing ?? []).map((c) => [c.slug, c.id]));

  const missing = [...slugs].filter((s) => !idBySlug.has(s));
  if (missing.length) {
    const { data: inserted, error } = await db
      .from("companies")
      .upsert(
        missing.map((slug) => ({ slug, name: slug, is_tracked: false })),
        { onConflict: "slug" }
      )
      .select("id, slug");
    if (error) throw error;
    for (const c of inserted ?? []) idBySlug.set(c.slug, c.id);
  }

  const counts: UpsertCounts = {};
  const cid = (slug?: string) => (slug ? (idBySlug.get(slug) ?? null) : null);

  if (payload.news.length) {
    const { error } = await db.from("news_items").upsert(
      payload.news.map((n) => ({
        company_id: cid(n.company),
        title: n.title,
        url: normalizeUrl(n.url),
        summary: n.summary,
        published_at: n.published_at ?? payload.run_date,
        category: n.category,
        run_date: payload.run_date,
      })),
      { onConflict: "url", ignoreDuplicates: true }
    );
    if (error) throw error;
  }
  counts.news = payload.news.length;

  if (payload.model_releases.length) {
    const { error } = await db.from("model_releases").upsert(
      payload.model_releases.map((m) => ({
        company_id: cid(m.company),
        model_name: m.model_name,
        released_on: m.released_on ?? payload.run_date,
        tier: m.tier,
        notes: m.notes,
        source_url: m.source_url,
      })),
      { onConflict: "company_id,model_name", ignoreDuplicates: true }
    );
    if (error) throw error;
  }
  counts.model_releases = payload.model_releases.length;

  if (payload.benchmarks.length) {
    // Config variants of one model collapse to a single row (the best score) —
    // also keeps the upsert legal: Postgres rejects two rows with the same
    // conflict key in one statement.
    const bestByKey = new Map<string, (typeof payload.benchmarks)[number]>();
    for (const b of payload.benchmarks) {
      const model = normalizeModelName(b.model);
      const key = `${b.benchmark}::${model}::${b.as_of}`;
      const cur = bestByKey.get(key);
      if (!cur || b.score > cur.score) bestByKey.set(key, { ...b, model });
    }
    const { error } = await db.from("benchmark_scores").upsert(
      [...bestByKey.values()].map((b) => ({
        benchmark: b.benchmark,
        model: b.model,
        company_id: cid(b.company),
        score: b.score,
        as_of: b.as_of,
        source_url: b.source_url,
      })),
      { onConflict: "benchmark,model,as_of" }
    );
    if (error) throw error;
    counts.benchmarks = bestByKey.size;
  } else {
    counts.benchmarks = 0;
  }

  if (payload.finance.length) {
    const { error } = await db.from("finance_events").upsert(
      payload.finance.map((f) => ({
        company_id: cid(f.company),
        event_type: f.event_type,
        amount_usd: f.amount_usd ?? null,
        valuation_usd: f.valuation_usd ?? null,
        round_name: f.round_name ?? null,
        announced_on: f.announced_on,
        source_url: f.source_url,
      })),
      { onConflict: "company_id,event_type,announced_on", ignoreDuplicates: true }
    );
    if (error) throw error;
  }
  counts.finance = payload.finance.length;

  if (payload.community.length) {
    const { error } = await db.from("community_posts").upsert(
      payload.community.map((c) => ({
        company_id: cid(c.company),
        source: c.source,
        url: normalizeUrl(c.url),
        title: c.title,
        sentiment: c.sentiment,
        summary: c.summary,
        posted_at: c.posted_at ?? payload.run_date,
      })),
      { onConflict: "url", ignoreDuplicates: true }
    );
    if (error) throw error;
  }
  counts.community = payload.community.length;

  {
    const { error } = await db.from("agi_daily").upsert(
      {
        run_date: payload.run_date,
        narrative: payload.agi_daily.narrative,
        gauge: payload.agi_daily.gauge,
        movers: payload.agi_daily.movers,
      },
      { onConflict: "run_date" }
    );
    if (error) throw error;
    counts.agi_daily = 1;
  }

  if (payload.suggested_contacts.length) {
    // ignoreDuplicates so a re-suggested person never resets an accepted/dismissed status
    const { error } = await db.from("suggested_contacts").upsert(
      payload.suggested_contacts.map((s) => ({
        full_name: s.full_name,
        company: s.company,
        role: s.role,
        reason: s.reason,
        source_url: s.source_url ?? null,
        run_date: payload.run_date,
      })),
      { onConflict: "full_name,company", ignoreDuplicates: true }
    );
    if (error) throw error;
  }
  counts.suggested_contacts = payload.suggested_contacts.length;

  return counts;
}
