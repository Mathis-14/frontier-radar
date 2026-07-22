import { cn } from "@/lib/utils";
import type { AgiDailyRow } from "@/lib/types";

const LEVELS: AgiDailyRow["gauge"][] = [
  "quiet",
  "incremental",
  "notable",
  "significant",
  "breakthrough",
];

/** Qualitative capability gauge — 5 fixed levels, no invented precision. */
export function GaugeChip({ gauge }: { gauge: AgiDailyRow["gauge"] }) {
  const level = LEVELS.indexOf(gauge);
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5">
      <span className="flex items-center gap-1" aria-hidden>
        {LEVELS.map((l, i) => (
          <span
            key={l}
            className={cn(
              "size-2 rounded-full transition-colors",
              i <= level ? "bg-primary" : "bg-secondary"
            )}
          />
        ))}
      </span>
      <span className="text-sm font-medium capitalize">{gauge}</span>
    </span>
  );
}
