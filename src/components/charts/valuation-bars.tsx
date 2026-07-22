"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatUsd } from "@/lib/format";
import type { FinanceEventRow } from "@/lib/types";

const INK_MUTED = "var(--muted-foreground)";
const GRID = "var(--border)";

/** Horizontal bars: latest reported valuation per company (magnitude → bar form). */
export function ValuationBars({ events }: { events: FinanceEventRow[] }) {
  const latest = new Map<string, { name: string; color: string; valuation: number }>();
  for (const e of events) {
    if (!e.valuation_usd || !e.company) continue;
    const cur = latest.get(e.company.slug);
    if (!cur) {
      latest.set(e.company.slug, {
        name: e.company.name,
        color: e.company.color ?? "var(--chart-1)",
        valuation: e.valuation_usd,
      });
    }
  }
  const data = [...latest.values()].sort((a, b) => b.valuation - a.valuation);

  if (!data.length) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No valuations reported yet.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 52)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 56, bottom: 0, left: 8 }}>
        <CartesianGrid stroke={GRID} strokeDasharray="2 4" horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={formatUsd}
          tick={{ fill: INK_MUTED, fontSize: 12 }}
          axisLine={{ stroke: GRID }}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={130}
          tick={{ fill: "var(--foreground)", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(v) => formatUsd(Number(v))}
          contentStyle={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            color: "var(--foreground)",
            fontSize: 12,
          }}
        />
        <Bar dataKey="valuation" barSize={18} radius={[0, 4, 4, 0]}>
          {data.map((d) => (
            <Cell key={d.name} fill={d.color} />
          ))}
          <LabelList
            dataKey="valuation"
            position="right"
            formatter={(v) => (typeof v === "number" ? formatUsd(v) : v)}
            style={{ fill: "var(--foreground)", fontSize: 12 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
