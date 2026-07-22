import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { NewsRow } from "@/lib/types";

export function NewsList({ items, showCompany = true }: { items: NewsRow[]; showCompany?: boolean }) {
  if (!items.length) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Nothing here yet — the agent files news each morning.
      </p>
    );
  }
  return (
    <ul className="divide-y divide-border/70">
      {items.map((n) => (
        <li key={n.id} className="py-3">
          <a href={n.url} target="_blank" rel="noreferrer" className="group block">
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium leading-snug group-hover:text-primary transition-colors">
                {n.title}
                <ArrowUpRight className="ml-1 inline size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
              </p>
              <Badge variant="secondary" className="shrink-0 capitalize">
                {n.category}
              </Badge>
            </div>
            {n.summary && (
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{n.summary}</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {showCompany && n.company && (
                <>
                  <span
                    aria-hidden
                    className="mr-1.5 inline-block size-2 rounded-full align-baseline"
                    style={{ background: n.company.color ?? "var(--chart-1)" }}
                  />
                  {n.company.name}
                  {" · "}
                </>
              )}
              {n.published_at ?? ""}
            </p>
          </a>
        </li>
      ))}
    </ul>
  );
}
