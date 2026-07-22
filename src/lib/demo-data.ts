// Demo dataset derived from fixtures/sample-payload.json — used automatically
// whenever Supabase env vars are absent, so the dashboard is previewable
// before any keys or agent runs exist.
import payload from "../../fixtures/sample-payload.json";
import type {
  AgiDailyRow,
  BenchmarkScoreRow,
  CommunityPostRow,
  CompanyRef,
  CompanyRow,
  ContactRow,
  FinanceEventRow,
  IngestRunRow,
  ModelReleaseRow,
  NewsRow,
  SuggestedContactRow,
} from "./types";

export const DEMO_COMPANIES: CompanyRow[] = [
  { id: "c-openai", slug: "openai", name: "OpenAI", is_tracked: true, color: "#2F6FB3" },
  { id: "c-anthropic", slug: "anthropic", name: "Anthropic", is_tracked: true, color: "#C4703F" },
  { id: "c-gdm", slug: "google-deepmind", name: "Google DeepMind", is_tracked: true, color: "#55803A" },
  { id: "c-meta", slug: "meta", name: "Meta AI", is_tracked: true, color: "#7B5EA7" },
  { id: "c-xai", slug: "xai", name: "xAI", is_tracked: true, color: "#0E9488" },
  { id: "c-mistral", slug: "mistral", name: "Mistral AI", is_tracked: true, color: "#B07E1F" },
  { id: "c-deepseek", slug: "deepseek", name: "DeepSeek", is_tracked: true, color: "#9C4A6E" },
  { id: "c-qwen", slug: "alibaba-qwen", name: "Alibaba Qwen", is_tracked: true, color: "#C13B52" },
];

const ref = (slug?: string): CompanyRef => {
  const c = DEMO_COMPANIES.find((c) => c.slug === slug);
  return c ? { slug: c.slug, name: c.name, color: c.color } : null;
};

export const DEMO_NEWS: NewsRow[] = payload.news.map((n, i) => ({
  id: `news-${i}`,
  title: n.title,
  url: n.url,
  summary: n.summary,
  published_at: n.published_at,
  category: n.category as NewsRow["category"],
  company: ref(n.company),
}));

export const DEMO_RELEASES: ModelReleaseRow[] = payload.model_releases.map((m, i) => ({
  id: `rel-${i}`,
  model_name: m.model_name,
  released_on: m.released_on,
  tier: m.tier as ModelReleaseRow["tier"],
  notes: m.notes,
  source_url: m.source_url,
  company: ref(m.company),
}));

export const DEMO_BENCHMARKS: BenchmarkScoreRow[] = payload.benchmarks.map((b, i) => ({
  id: `bench-${i}`,
  benchmark: b.benchmark,
  model: b.model,
  score: b.score,
  as_of: b.as_of,
  source_url: b.source_url,
  company: ref(b.company),
}));

export const DEMO_FINANCE: FinanceEventRow[] = payload.finance.map((f, i) => ({
  id: `fin-${i}`,
  event_type: f.event_type as FinanceEventRow["event_type"],
  amount_usd: "amount_usd" in f ? (f.amount_usd as number) : null,
  valuation_usd: f.valuation_usd ?? null,
  round_name: "round_name" in f ? (f.round_name as string) : null,
  announced_on: f.announced_on,
  source_url: f.source_url,
  company: ref(f.company),
}));

export const DEMO_COMMUNITY: CommunityPostRow[] = payload.community.map((c, i) => ({
  id: `comm-${i}`,
  source: c.source as CommunityPostRow["source"],
  url: c.url,
  title: c.title,
  sentiment: c.sentiment as CommunityPostRow["sentiment"],
  summary: c.summary,
  posted_at: c.posted_at,
  company: ref(c.company),
}));

export const DEMO_AGI: AgiDailyRow[] = [
  {
    id: "agi-0",
    run_date: payload.run_date,
    narrative: payload.agi_daily.narrative,
    gauge: payload.agi_daily.gauge as AgiDailyRow["gauge"],
    movers: payload.agi_daily.movers,
  },
];

export const DEMO_SUGGESTED: SuggestedContactRow[] = payload.suggested_contacts.map((s, i) => ({
  id: `sugg-${i}`,
  full_name: s.full_name,
  company: s.company,
  role: s.role,
  reason: s.reason,
  source_url: s.source_url ?? null,
  status: "pending",
  run_date: payload.run_date,
}));

export const DEMO_CONTACTS: ContactRow[] = [
  {
    id: "contact-0",
    full_name: "Example Founder Friend",
    company: "openai",
    role: "Solutions engineer",
    status: "met",
    notes: "Met at the Paris AI meetup — demo data.",
    source: "manual",
    updated_at: payload.run_date,
  },
];

export const DEMO_INGEST_RUNS: IngestRunRow[] = [
  {
    id: "run-0",
    run_id: payload.run_id,
    run_date: payload.run_date,
    item_counts: {
      news: payload.news.length,
      benchmarks: payload.benchmarks.length,
      finance: payload.finance.length,
      community: payload.community.length,
    },
    status: "ok",
    received_at: `${payload.run_date}T07:04:00Z`,
  },
];
