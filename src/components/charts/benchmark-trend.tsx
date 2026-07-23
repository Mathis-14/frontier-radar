"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
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

const TOOLTIP_STYLE = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--foreground)",
  fontSize: 12,
};

/**
 * One benchmark over time. With a single as_of date a line chart degrades to
 * floating dots, so this renders a ranked leaderboard instead and switches to
 * multi-series lines (one per model, ≤5 series, company colors) once a second
 * date lands.
 */
export function BenchmarkTrend({
  scores,
  maxSeries = 5,
  maxBars = 8,
}: {
  scores: BenchmarkScoreRow[];
  maxSeries?: number;
  maxBars?: number;
}) {
  // latest score per model decides ranking and which series are shown
  const latestByModel = new Map<string, BenchmarkScoreRow>();
  for (const s of scores) {
    const cur = latestByModel.get(s.model);
    if (!cur || s.as_of > cur.as_of) latestByModel.set(s.model, s);
  }

  if (!latestByModel.size) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No scores yet — they land with the agent&apos;s morning runs.
      </p>
    );
  }

  // A line needs one model with two dated scores; until any series has that,
  // a ranked leaderboard of the latest scores reads far better than stray dots.
  const datesByModel = new Map<string, Set<string>>();
  for (const s of scores) {
    (datesByModel.get(s.model) ?? datesByModel.set(s.model, new Set()).get(s.model)!).add(s.as_of);
  }
  const canDrawLines = [...datesByModel.values()].some((d) => d.size >= 2);

  if (!canDrawLines) {
    const data = [...latestByModel.values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, maxBars)
      .map((s) => ({
        model: s.model,
        score: s.score,
        color: s.company?.color ?? "var(--chart-1)",
      }));
    return (
      <div>
        <ResponsiveContainer width="100%" height={Math.max(160, data.length * 40)}>
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 48, bottom: 0, left: 8 }}>
            <CartesianGrid stroke={GRID} strokeDasharray="2 4" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, "auto"]}
              tick={{ fill: INK_MUTED, fontSize: 12 }}
              axisLine={{ stroke: GRID }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="model"
              width={150}
              tick={{ fill: "var(--foreground)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "transparent" }} />
            <Bar dataKey="score" barSize={16} radius={[0, 4, 4, 0]}>
              {data.map((d) => (
                <Cell key={d.model} fill={d.color} />
              ))}
              <LabelList
                dataKey="score"
                position="right"
                style={{ fill: "var(--foreground)", fontSize: 12 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Latest score per model — trend lines draw themselves as daily runs accumulate.
        </p>
      </div>
    );
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
        <Tooltip contentStyle={TOOLTIP_STYLE} />
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
