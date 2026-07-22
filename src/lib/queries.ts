import "server-only";
import { createSupabaseServerClient, isSupabaseConfigured } from "./supabase/server";
import {
  DEMO_AGI,
  DEMO_BENCHMARKS,
  DEMO_COMMUNITY,
  DEMO_COMPANIES,
  DEMO_CONTACTS,
  DEMO_FINANCE,
  DEMO_INGEST_RUNS,
  DEMO_NEWS,
  DEMO_RELEASES,
  DEMO_SUGGESTED,
} from "./demo-data";
import type {
  AgiDailyRow,
  BenchmarkScoreRow,
  CommunityPostRow,
  CompanyRow,
  ContactRow,
  FinanceEventRow,
  IngestRunRow,
  ModelReleaseRow,
  NewsRow,
  SuggestedContactRow,
} from "./types";

/** True when the app is running from fixture data (no Supabase configured yet). */
export function isDemoMode() {
  return !isSupabaseConfigured();
}

const COMPANY_JOIN = "company:companies(slug, name, color)";

export async function getCompanies(): Promise<CompanyRow[]> {
  if (isDemoMode()) return DEMO_COMPANIES;
  const db = await createSupabaseServerClient();
  const { data } = await db.from("companies").select("*").eq("is_tracked", true).order("name");
  return (data as CompanyRow[]) ?? [];
}

export async function getAgiDaily(limit = 14): Promise<AgiDailyRow[]> {
  if (isDemoMode()) return DEMO_AGI;
  const db = await createSupabaseServerClient();
  const { data } = await db
    .from("agi_daily")
    .select("*")
    .order("run_date", { ascending: false })
    .limit(limit);
  return (data as AgiDailyRow[]) ?? [];
}

export async function getNews(opts?: { companySlug?: string; limit?: number }): Promise<NewsRow[]> {
  if (isDemoMode())
    return DEMO_NEWS.filter((n) => !opts?.companySlug || n.company?.slug === opts.companySlug);
  const db = await createSupabaseServerClient();
  let q = db
    .from("news_items")
    .select(`id, title, url, summary, published_at, category, ${COMPANY_JOIN}`)
    .order("published_at", { ascending: false })
    .limit(opts?.limit ?? 50);
  if (opts?.companySlug) q = q.eq("companies.slug", opts.companySlug);
  const { data } = await q;
  const rows = (data as unknown as NewsRow[]) ?? [];
  return opts?.companySlug ? rows.filter((r) => r.company?.slug === opts.companySlug) : rows;
}

export async function getModelReleases(limit = 30): Promise<ModelReleaseRow[]> {
  if (isDemoMode()) return DEMO_RELEASES;
  const db = await createSupabaseServerClient();
  const { data } = await db
    .from("model_releases")
    .select(`id, model_name, released_on, tier, notes, source_url, ${COMPANY_JOIN}`)
    .order("released_on", { ascending: false })
    .limit(limit);
  return (data as unknown as ModelReleaseRow[]) ?? [];
}

export async function getBenchmarkScores(): Promise<BenchmarkScoreRow[]> {
  if (isDemoMode()) return DEMO_BENCHMARKS;
  const db = await createSupabaseServerClient();
  const { data } = await db
    .from("benchmark_scores")
    .select(`id, benchmark, model, score, as_of, source_url, ${COMPANY_JOIN}`)
    .order("as_of", { ascending: false })
    .limit(500);
  return (data as unknown as BenchmarkScoreRow[]) ?? [];
}

export async function getFinanceEvents(): Promise<FinanceEventRow[]> {
  if (isDemoMode()) return DEMO_FINANCE;
  const db = await createSupabaseServerClient();
  const { data } = await db
    .from("finance_events")
    .select(
      `id, event_type, amount_usd, valuation_usd, round_name, announced_on, source_url, ${COMPANY_JOIN}`
    )
    .order("announced_on", { ascending: false })
    .limit(200);
  return (data as unknown as FinanceEventRow[]) ?? [];
}

export async function getCommunityPosts(opts?: {
  companySlug?: string;
  limit?: number;
}): Promise<CommunityPostRow[]> {
  if (isDemoMode())
    return DEMO_COMMUNITY.filter(
      (p) => !opts?.companySlug || p.company?.slug === opts.companySlug
    );
  const db = await createSupabaseServerClient();
  const { data } = await db
    .from("community_posts")
    .select(`id, source, url, title, sentiment, summary, posted_at, ${COMPANY_JOIN}`)
    .order("posted_at", { ascending: false })
    .limit(opts?.limit ?? 50);
  const rows = (data as unknown as CommunityPostRow[]) ?? [];
  return opts?.companySlug ? rows.filter((r) => r.company?.slug === opts.companySlug) : rows;
}

export async function getContacts(): Promise<ContactRow[]> {
  if (isDemoMode()) return DEMO_CONTACTS;
  const db = await createSupabaseServerClient();
  const { data } = await db.from("contacts").select("*").order("updated_at", { ascending: false });
  return (data as ContactRow[]) ?? [];
}

export async function getSuggestedContacts(): Promise<SuggestedContactRow[]> {
  if (isDemoMode()) return DEMO_SUGGESTED;
  const db = await createSupabaseServerClient();
  const { data } = await db
    .from("suggested_contacts")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  return (data as SuggestedContactRow[]) ?? [];
}

export async function getIngestRuns(limit = 10): Promise<IngestRunRow[]> {
  if (isDemoMode()) return DEMO_INGEST_RUNS;
  const db = await createSupabaseServerClient();
  const { data } = await db
    .from("ingest_runs")
    .select("*")
    .order("received_at", { ascending: false })
    .limit(limit);
  return (data as IngestRunRow[]) ?? [];
}
