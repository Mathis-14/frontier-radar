"use client";

// OriginKit "Curved Marquee" (genuine source: vendor/curvedmarquee/, fetched via
// the OriginKit MCP) — the frontier-model release ticker.

import CurvedLoop from "@/components/originkit/vendor/curvedmarquee/curvedmarquee";
import type { ModelReleaseRow } from "@/lib/types";

export function ReleaseTicker({ releases }: { releases: ModelReleaseRow[] }) {
  if (!releases.length) return null;
  const text = releases
    .map((r) => `${r.model_name} — ${r.company?.name ?? ""}${r.released_on ? ` · ${r.released_on}` : ""}`)
    .join("   ✦   ");
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <CurvedLoop
        text={text}
        color="var(--foreground)"
        direction="left"
        baseVelocity={0.6}
        curveAmount={18}
        gap={40}
        font={{
          fontFamily: "Inter, sans-serif",
          fontWeight: 500,
          fontSize: 14,
          letterSpacing: "0em",
          lineHeight: "1em",
          textAlign: "left",
        }}
      />
    </div>
  );
}
