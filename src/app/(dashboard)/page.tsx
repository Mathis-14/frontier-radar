import { AuroraBackground } from "@/components/originkit/aurora-background";
import { RevealText } from "@/components/originkit/reveal-text";
import { ScrambleText } from "@/components/originkit/scramble-text";
import { TypewriterText } from "@/components/originkit/typewriter-text";
import { BenchmarkTrend } from "@/components/charts/benchmark-trend";
import { GaugeChip } from "@/components/sections/gauge-chip";
import { NewsList } from "@/components/sections/news-list";
import { ReleaseTicker } from "@/components/sections/release-ticker";
import { StatTiles } from "@/components/sections/stat-tiles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    getNews({ limit: 6 }),
    getCompanies(),
    getFinanceEvents(),
    getIngestRuns(1),
  ]);

  const today = agi[0];
  const lastRun = runs[0];
  const itemsToday = lastRun
    ? Object.values(lastRun.item_counts).reduce((a, b) => a + b, 0)
    : 0;
  const topArena = benchmarks
    .filter((b) => b.benchmark === "lmarena-text")
    .sort((a, b) => b.score - a.score)[0];
  const fundingThisMonth = finance
    .filter((f) => f.amount_usd && f.announced_on.slice(0, 7) === (lastRun?.run_date ?? "").slice(0, 7))
    .reduce((sum, f) => sum + (f.amount_usd ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Hero — OriginKit slots: aurora background, scramble headline, blur-reveal narrative */}
      <AuroraBackground className="rounded-2xl border border-border bg-card">
        <div className="p-8">
          <p className="text-sm text-muted-foreground">
            {today ? `Daily synthesis · ${today.run_date}` : "Daily synthesis"}
          </p>
          <h1 className="mt-1 font-heading text-2xl font-semibold tracking-tight">
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
            <div className="mt-5 max-w-2xl">
              <RevealText text={today.narrative} />
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
                  <span>
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
            label: "Top LMArena score",
            value: topArena?.score ?? 0,
            hint: topArena ? topArena.model : "no scores yet",
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
            <CardTitle className="font-heading">LMArena trend</CardTitle>
          </CardHeader>
          <CardContent>
            <BenchmarkTrend scores={benchmarks.filter((b) => b.benchmark === "lmarena-text")} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Latest news</CardTitle>
          </CardHeader>
          <CardContent>
            <NewsList items={news} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
