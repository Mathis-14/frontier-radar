-- Frontier Radar — initial schema
-- Uniques make agent re-runs idempotent: every table the agent feeds upserts ON CONFLICT.

create table companies (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  is_tracked boolean not null default true,
  color text,
  created_at timestamptz not null default now()
);

create table news_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  title text not null,
  url text not null unique,
  summary text,
  published_at date,
  category text not null default 'other' check (category in ('announcement','model','research','other')),
  run_date date,
  created_at timestamptz not null default now()
);

create table model_releases (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  model_name text not null,
  released_on date,
  tier text not null default 'frontier' check (tier in ('frontier','mid','small')),
  notes text,
  source_url text,
  created_at timestamptz not null default now(),
  unique (company_id, model_name)
);

create table benchmark_scores (
  id uuid primary key default gen_random_uuid(),
  benchmark text not null,
  model text not null,
  company_id uuid references companies(id) on delete set null,
  score numeric not null,
  as_of date not null,
  source_url text,
  created_at timestamptz not null default now(),
  unique (benchmark, model, as_of)
);

create table finance_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  event_type text not null check (event_type in ('funding_round','valuation_report','other')),
  amount_usd numeric,
  valuation_usd numeric,
  round_name text,
  announced_on date not null,
  source_url text,
  created_at timestamptz not null default now(),
  unique (company_id, event_type, announced_on)
);

create table community_posts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  source text not null check (source in ('hn','reddit','x')),
  url text not null unique,
  title text,
  sentiment text not null default 'neutral' check (sentiment in ('positive','negative','mixed','neutral')),
  summary text,
  posted_at date,
  created_at timestamptz not null default now()
);

create table agi_daily (
  id uuid primary key default gen_random_uuid(),
  run_date date not null unique,
  narrative text not null,
  gauge text not null check (gauge in ('quiet','incremental','notable','significant','breakthrough')),
  movers jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create table contacts (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  company text,
  role text,
  status text not null default 'to_contact' check (status in ('met','to_contact')),
  notes text,
  source text not null default 'manual' check (source in ('manual','agent')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table suggested_contacts (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  company text,
  role text,
  reason text,
  source_url text,
  status text not null default 'pending' check (status in ('pending','accepted','dismissed')),
  run_date date,
  created_at timestamptz not null default now(),
  unique (full_name, company)
);

create table ingest_runs (
  id uuid primary key default gen_random_uuid(),
  run_id text not null unique,
  run_date date not null,
  payload_version text not null,
  item_counts jsonb not null default '{}',
  status text not null default 'ok' check (status in ('ok','invalid')),
  received_at timestamptz not null default now()
);

-- RLS: single authenticated user gets full read (and CRM write); the ingest route
-- uses the service-role key server-side, which bypasses RLS.
alter table companies enable row level security;
alter table news_items enable row level security;
alter table model_releases enable row level security;
alter table benchmark_scores enable row level security;
alter table finance_events enable row level security;
alter table community_posts enable row level security;
alter table agi_daily enable row level security;
alter table contacts enable row level security;
alter table suggested_contacts enable row level security;
alter table ingest_runs enable row level security;

create policy "authenticated read companies" on companies for select to authenticated using (true);
create policy "authenticated read news" on news_items for select to authenticated using (true);
create policy "authenticated read releases" on model_releases for select to authenticated using (true);
create policy "authenticated read benchmarks" on benchmark_scores for select to authenticated using (true);
create policy "authenticated read finance" on finance_events for select to authenticated using (true);
create policy "authenticated read community" on community_posts for select to authenticated using (true);
create policy "authenticated read agi" on agi_daily for select to authenticated using (true);
create policy "authenticated read ingest_runs" on ingest_runs for select to authenticated using (true);
create policy "authenticated crud contacts" on contacts for all to authenticated using (true) with check (true);
create policy "authenticated crud suggested" on suggested_contacts for all to authenticated using (true) with check (true);

-- Seed the tracked companies (chart hues match the app's cream palette)
-- Colors: fixed per company (color follows the entity), CVD/contrast-validated vs the cream surface
insert into companies (slug, name, color) values
  ('openai', 'OpenAI', '#2F6FB3'),
  ('anthropic', 'Anthropic', '#C4703F'),
  ('google-deepmind', 'Google DeepMind', '#55803A'),
  ('meta', 'Meta AI', '#7B5EA7'),
  ('xai', 'xAI', '#0E9488'),
  ('mistral', 'Mistral AI', '#B07E1F'),
  ('deepseek', 'DeepSeek', '#9C4A6E'),
  ('alibaba-qwen', 'Alibaba Qwen', '#C13B52');
