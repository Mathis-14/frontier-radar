"use client";

import { NumberTicker } from "@/components/kit/number-ticker";
import { Card, CardContent } from "@/components/ui/card";
import { formatUsd } from "@/lib/format";

export interface StatTile {
  label: string;
  value: number;
  /** serializable format hint — resolved to a formatter on the client */
  format?: "int" | "usd";
  hint?: string;
}

const FORMATTERS = {
  int: (n: number) => Math.round(n).toLocaleString("en-US"),
  usd: (n: number) => formatUsd(n),
} as const;

export function StatTiles({ tiles }: { tiles: StatTile[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {tiles.map((t) => (
        <Card key={t.label}>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">{t.label}</p>
            <p className="mt-1 font-heading text-3xl font-semibold">
              <NumberTicker value={t.value} format={FORMATTERS[t.format ?? "int"]} />
            </p>
            {t.hint && <p className="mt-1 text-xs text-muted-foreground">{t.hint}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
