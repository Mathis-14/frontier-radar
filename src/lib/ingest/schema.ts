import { z } from "zod";

// The single contract between the CMA agent and the dashboard.
// agent/agent.json (system prompt §5) mirrors this envelope — change both together.

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");

export const newsItemSchema = z.object({
  company: z.string().min(1),
  title: z.string().min(1),
  url: z.string().url(),
  summary: z.string().optional().default(""),
  published_at: dateStr.optional(),
  category: z.enum(["announcement", "model", "research", "other"]).default("other"),
});

export const modelReleaseSchema = z.object({
  company: z.string().min(1),
  model_name: z.string().min(1),
  released_on: dateStr.optional(),
  tier: z.enum(["frontier", "mid", "small"]).default("frontier"),
  notes: z.string().optional().default(""),
  source_url: z.string().url(),
});

export const benchmarkScoreSchema = z.object({
  benchmark: z.string().min(1),
  model: z.string().min(1),
  company: z.string().optional(),
  score: z.number(),
  as_of: dateStr,
  source_url: z.string().url(),
});

export const financeEventSchema = z.object({
  company: z.string().min(1),
  event_type: z.enum(["funding_round", "valuation_report", "other"]),
  amount_usd: z.number().nullable().optional(),
  valuation_usd: z.number().nullable().optional(),
  round_name: z.string().nullable().optional(),
  announced_on: dateStr,
  source_url: z.string().url(),
});

export const communityPostSchema = z.object({
  company: z.string().min(1),
  source: z.enum(["hn", "reddit", "x"]),
  url: z.string().url(),
  title: z.string().optional().default(""),
  sentiment: z.enum(["positive", "negative", "mixed", "neutral"]).default("neutral"),
  summary: z.string().optional().default(""),
  posted_at: dateStr.optional(),
});

export const agiDailySchema = z.object({
  narrative: z.string().min(1),
  gauge: z.enum(["quiet", "incremental", "notable", "significant", "breakthrough"]),
  movers: z
    .array(
      z.object({
        company: z.string(),
        what: z.string(),
        source_url: z.string().url().optional(),
      })
    )
    .default([]),
});

export const suggestedContactSchema = z.object({
  full_name: z.string().min(1),
  company: z.string().optional().default(""),
  role: z.string().optional().default(""),
  reason: z.string().optional().default(""),
  source_url: z.string().url().optional(),
});

export const ingestPayloadSchema = z.object({
  version: z.literal("1"),
  run_id: z.string().min(1),
  run_date: dateStr,
  news: z.array(newsItemSchema).default([]),
  model_releases: z.array(modelReleaseSchema).default([]),
  benchmarks: z.array(benchmarkScoreSchema).default([]),
  finance: z.array(financeEventSchema).default([]),
  community: z.array(communityPostSchema).default([]),
  agi_daily: agiDailySchema,
  suggested_contacts: z.array(suggestedContactSchema).default([]),
});

export type IngestPayload = z.infer<typeof ingestPayloadSchema>;
