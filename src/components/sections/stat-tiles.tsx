"use client";

import { NumberTicker, type TickerFormat } from "@/components/kit/number-ticker";
import { StatCard } from "@/components/kit/stat-card";
import { CardContent } from "@/components/ui/card";

export interface StatTile {
  label: string;
  value: number;
  /** serializable format hint — resolved to a formatter on the client */
  format?: TickerFormat;
  hint?: string;
}

export function StatTiles({ tiles }: { tiles: StatTile[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {tiles.map((t) => (
        <StatCard key={t.label}>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">{t.label}</p>
            <p className="mt-1 font-heading text-3xl font-semibold">
              <NumberTicker value={t.value} format={t.format ?? "int"} />
            </p>
            {t.hint && <p className="mt-1 text-xs text-muted-foreground">{t.hint}</p>}
          </CardContent>
        </StatCard>
      ))}
    </div>
  );
}
