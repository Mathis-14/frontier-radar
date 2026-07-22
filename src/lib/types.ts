export type CompanyRef = { slug: string; name: string; color: string | null } | null;

export interface CompanyRow {
  id: string;
  slug: string;
  name: string;
  is_tracked: boolean;
  color: string | null;
}

export interface NewsRow {
  id: string;
  title: string;
  url: string;
  summary: string | null;
  published_at: string | null;
  category: "announcement" | "model" | "research" | "other";
  company: CompanyRef;
}

export interface ModelReleaseRow {
  id: string;
  model_name: string;
  released_on: string | null;
  tier: "frontier" | "mid" | "small";
  notes: string | null;
  source_url: string | null;
  company: CompanyRef;
}

export interface BenchmarkScoreRow {
  id: string;
  benchmark: string;
  model: string;
  score: number;
  as_of: string;
  source_url: string | null;
  company: CompanyRef;
}

export interface FinanceEventRow {
  id: string;
  event_type: "funding_round" | "valuation_report" | "other";
  amount_usd: number | null;
  valuation_usd: number | null;
  round_name: string | null;
  announced_on: string;
  source_url: string | null;
  company: CompanyRef;
}

export interface CommunityPostRow {
  id: string;
  source: "hn" | "reddit" | "x";
  url: string;
  title: string | null;
  sentiment: "positive" | "negative" | "mixed" | "neutral";
  summary: string | null;
  posted_at: string | null;
  company: CompanyRef;
}

export interface AgiDailyRow {
  id: string;
  run_date: string;
  narrative: string;
  gauge: "quiet" | "incremental" | "notable" | "significant" | "breakthrough";
  movers: { company: string; what: string; source_url?: string }[];
}

export interface ContactRow {
  id: string;
  full_name: string;
  company: string | null;
  role: string | null;
  status: "met" | "to_contact";
  notes: string | null;
  source: "manual" | "agent";
  updated_at: string;
}

export interface SuggestedContactRow {
  id: string;
  full_name: string;
  company: string | null;
  role: string | null;
  reason: string | null;
  source_url: string | null;
  status: "pending" | "accepted" | "dismissed";
  run_date: string | null;
}

export interface IngestRunRow {
  id: string;
  run_id: string;
  run_date: string;
  item_counts: Record<string, number>;
  status: "ok" | "invalid";
  received_at: string;
}
