import { AuroraBackground } from "@/components/kit/aurora-background";
import { BeamBorder } from "@/components/kit/beam-border";
import { BriefExpander } from "@/components/kit/brief-expander";
import { ScrambleText } from "@/components/kit/scramble-text";
import { TypewriterText } from "@/components/kit/typewriter-text";
import { BenchmarkTrend } from "@/components/charts/benchmark-trend";
import { GaugeChip } from "@/components/sections/gauge-chip";
import { NewsList } from "@/components/sections/news-list";
import { ReleaseTicker } from "@/components/sections/release-ticker";
import { StatTiles } from "@/components/sections/stat-tiles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { splitLead } from "@/lib/format";
import {
  getAgiDaily,
  getBenchmarkScores,
  getCompanies,
  getFinanceEvents,
  getIngestRuns,
  getModelReleases,
  getNews,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [agi, releases, benchmarks, news, companies, finance, runs] = await Promise.all([
    getAgiDaily(),
    getModelReleases(),
    getBenchmarkScores(),
    getNews({ limit: 12 }),
    getCompanies(),
    getFinanceEvents(),
    getIngestRuns(1),
  ]);

  const today = agi[0];
  const lastRun = runs[0];
  const itemsToday = lastRun
    ? Object.values(lastRun.item_counts).reduce((a, b) => a + b, 0)
    : 0;
  // feature the benchmark with the most scores instead of pinning one slug
  const benchmarkCounts = new Map<string, number>();
  for (const b of benchmarks) {
    benchmarkCounts.set(b.benchmark, (benchmarkCounts.get(b.benchmark) ?? 0) + 1);
  }
  const featuredBenchmark = [...benchmarkCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const featuredScores = benchmarks.filter((b) => b.benchmark === featuredBenchmark);
  const topScore = [...featuredScores].sort((a, b) => b.score - a.score)[0];
  const fundingThisMonth = finance
    .filter((f) => f.amount_usd && f.announced_on.slice(0, 7) === (lastRun?.run_date ?? "").slice(0, 7))
    .reduce((sum, f) => sum + (f.amount_usd ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Hero — OriginKit slots: aurora background, scramble headline, blur-reveal narrative */}
      <AuroraBackground className="rounded-2xl border border-border bg-card">
        <BeamBorder />
        <div className="p-8">
          <p className="text-sm text-muted-foreground">
            {today ? `Daily synthesis · ${today.run_date}` : "Daily synthesis"}
          </p>
          <h1 className="mt-1 font-heading text-2xl font-semibold tracking-tight text-balance">
            <ScrambleText text="Road to AGI" />
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {today && <GaugeChip gauge={today.gauge} />}
            <TypewriterText
              texts={[
                "capability movement today, judged only from sourced items",
                "news · benchmarks · community · finance, every morning",
                "gathered by your managed agent while you slept",
              ]}
            />
          </div>
          {today ? (
            <div className="mt-5">
              <BriefExpander {...splitLead(today.narrative)} />
            </div>
          ) : (
            <p className="mt-5 text-muted-foreground">
              No synthesis yet — it lands with the agent&apos;s first morning run.
            </p>
          )}
          {today && today.movers.length > 0 && (
            <ul className="mt-5 grid gap-2 sm:grid-cols-2">
              {today.movers.map((m, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span
                    aria-hidden
                    className="mt-1.5 size-2 shrink-0 rounded-full"
                    style={{
                      background:
                        companies.find((c) => c.slug === m.company)?.color ?? "var(--chart-1)",
                    }}
                  />
                  <span className="text-pretty">
                    <span className="font-medium">
                      {companies.find((c) => c.slug === m.company)?.name ?? m.company}
                    </span>{" "}
                    — {m.what}{" "}
                    {m.source_url && (
                      <a
                        href={m.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary underline-offset-2 hover:underline"
                      >
                        source
                      </a>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </AuroraBackground>

      <ReleaseTicker releases={releases} />

      <StatTiles
        tiles={[
          { label: "Items in the last run", value: itemsToday, hint: lastRun ? `run of ${lastRun.run_date}` : undefined },
          {
            label: featuredBenchmark ? `Top score · ${featuredBenchmark}` : "Top benchmark score",
            value: topScore?.score ?? 0,
            hint: topScore ? topScore.model : "no scores yet",
          },
          {
            label: "Disclosed funding this month",
            value: fundingThisMonth,
            format: "usd" as const,
          },
          { label: "Companies tracked", value: companies.length },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">
              {featuredBenchmark ? `${featuredBenchmark} trend` : "Benchmark trend"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BenchmarkTrend scores={featuredScores} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Latest news</CardTitle>
          </CardHeader>
          <CardContent className="max-h-[32rem] overflow-y-auto">
            <NewsList items={news} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
