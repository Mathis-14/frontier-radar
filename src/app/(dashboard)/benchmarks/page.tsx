import { BenchmarkTrend } from "@/components/charts/benchmark-trend";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getBenchmarkScores } from "@/lib/queries";
import type { BenchmarkScoreRow } from "@/lib/types";

export const dynamic = "force-dynamic";

function latestMatrix(scores: BenchmarkScoreRow[]) {
  // latest score per (benchmark, model)
  const latest = new Map<string, BenchmarkScoreRow>();
  for (const s of scores) {
    const key = `${s.benchmark}::${s.model}`;
    const cur = latest.get(key);
    if (!cur || s.as_of > cur.as_of) latest.set(key, s);
  }
  const benchmarks = [...new Set([...latest.values()].map((s) => s.benchmark))].sort();
  const models = [...new Set([...latest.values()].map((s) => s.model))];
  // order models by their best relative standing: use first benchmark's score desc as a simple stable order
  models.sort((a, b) => {
    const sa = latest.get(`${benchmarks[0]}::${a}`)?.score ?? -Infinity;
    const sb = latest.get(`${benchmarks[0]}::${b}`)?.score ?? -Infinity;
    return sb - sa;
  });
  return { latest, benchmarks, models };
}

export default async function BenchmarksPage() {
  const scores = await getBenchmarkScores();
  const { latest, benchmarks, models } = latestMatrix(scores);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Benchmarks</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Latest reported scores per model — each cell carries its own as-of date; scores are
          never aggregated across benchmarks.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Latest scores</CardTitle>
        </CardHeader>
        <CardContent>
          {models.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No benchmark scores yet — they land with the agent&apos;s morning runs.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model</TableHead>
                  {benchmarks.map((b) => (
                    <TableHead key={b} className="text-right">
                      {b}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {models.map((m) => {
                  const anyCell = benchmarks
                    .map((b) => latest.get(`${b}::${m}`))
                    .find(Boolean);
                  return (
                    <TableRow key={m}>
                      <TableCell className="font-medium">
                        <span
                          aria-hidden
                          className="mr-2 inline-block size-2 rounded-full align-baseline"
                          style={{
                            background: anyCell?.company?.color ?? "var(--chart-1)",
                          }}
                        />
                        {m}
                      </TableCell>
                      {benchmarks.map((b) => {
                        const cell = latest.get(`${b}::${m}`);
                        return (
                          <TableCell key={b} className="text-right tabular-nums">
                            {cell ? (
                              <span title={`as of ${cell.as_of}`}>{cell.score}</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {benchmarks.map((b) => (
          <Card key={b}>
            <CardHeader>
              <CardTitle className="font-heading">{b}</CardTitle>
            </CardHeader>
            <CardContent>
              <BenchmarkTrend scores={scores.filter((s) => s.benchmark === b)} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
