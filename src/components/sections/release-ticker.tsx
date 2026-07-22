import { Marquee } from "@/components/originkit/marquee";
import { Badge } from "@/components/ui/badge";
import type { ModelReleaseRow } from "@/lib/types";

export function ReleaseTicker({ releases }: { releases: ModelReleaseRow[] }) {
  if (!releases.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card py-3">
      <Marquee durationSeconds={Math.max(20, releases.length * 8)}>
        {releases.map((r) => (
          <span key={r.id} className="flex items-center gap-2 text-sm">
            <span
              aria-hidden
              className="size-2 rounded-full"
              style={{ background: r.company?.color ?? "var(--chart-1)" }}
            />
            <span className="font-medium">{r.model_name}</span>
            <span className="text-muted-foreground">
              {r.company?.name}
              {r.released_on ? ` · ${r.released_on}` : ""}
            </span>
            <Badge variant="outline" className="capitalize">
              {r.tier}
            </Badge>
          </span>
        ))}
      </Marquee>
    </div>
  );
}
