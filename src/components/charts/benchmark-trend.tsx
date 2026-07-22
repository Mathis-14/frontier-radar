"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { BenchmarkScoreRow } from "@/lib/types";

const INK_MUTED = "var(--muted-foreground)";
const GRID = "var(--border)";

/**
 * Multi-series line chart of one benchmark over time (one line per model).
 * Color follows the model's company (fixed, never cycled); ≤5 series shown,
 * the rest fold away — pick top models by latest score.
 */
export function BenchmarkTrend({
  scores,
  maxSeries = 5,
}: {
  scores: BenchmarkScoreRow[];
  maxSeries?: number;
}) {
  // latest score per model decides which series are shown
  const latestByModel = new Map<string, BenchmarkScoreRow>();
  for (const s of scores) {
    const cur = latestByModel.get(s.model);
    if (!cur || s.as_of > cur.as_of) latestByModel.set(s.model, s);
  }
  const models = [...latestByModel.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSeries)
    .map((s) => s.model);

  const byDate = new Map<string, Record<string, number | string>>();
  for (const s of scores) {
    if (!models.includes(s.model)) continue;
    const row = byDate.get(s.as_of) ?? { as_of: s.as_of };
    row[s.model] = s.score;
    byDate.set(s.as_of, row);
  }
  const data = [...byDate.values()].sort((a, b) =>
    String(a.as_of).localeCompare(String(b.as_of))
  );

  const colorFor = (model: string) =>
    latestByModel.get(model)?.company?.color ?? "var(--chart-1)";

  if (!data.length) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No scores yet — they land with the agent&apos;s morning runs.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
        <CartesianGrid stroke={GRID} strokeDasharray="2 4" vertical={false} />
        <XAxis
          dataKey="as_of"
          tick={{ fill: INK_MUTED, fontSize: 12 }}
          axisLine={{ stroke: GRID }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: INK_MUTED, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          domain={["auto", "auto"]}
          width={48}
        />
        <Tooltip
          contentStyle={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            color: "var(--foreground)",
            fontSize: 12,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: INK_MUTED }} />
        {models.map((model) => (
          <Line
            key={model}
            type="monotone"
            dataKey={model}
            stroke={colorFor(model)}
            strokeWidth={2}
            dot={{ r: 4, strokeWidth: 0, fill: colorFor(model) }}
            activeDot={{ r: 5 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
