import { ArrowUpRight, Minus, ThumbsDown, ThumbsUp, Scale } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { CommunityPostRow } from "@/lib/types";

const SENTIMENT: Record<
  CommunityPostRow["sentiment"],
  { icon: React.ComponentType<{ className?: string }>; label: string }
> = {
  positive: { icon: ThumbsUp, label: "Positive" },
  negative: { icon: ThumbsDown, label: "Negative" },
  mixed: { icon: Scale, label: "Mixed" },
  neutral: { icon: Minus, label: "Neutral" },
};

const SOURCE_LABEL = { hn: "Hacker News", reddit: "Reddit", x: "X" } as const;

export function CommunityList({
  posts,
  showCompany = true,
}: {
  posts: CommunityPostRow[];
  showCompany?: boolean;
}) {
  if (!posts.length) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No community chatter captured yet.
      </p>
    );
  }
  return (
    <ul className="divide-y divide-border/70">
      {posts.map((p) => {
        const s = SENTIMENT[p.sentiment];
        return (
          <li key={p.id} className="py-3">
            <a href={p.url} target="_blank" rel="noreferrer" className="group block">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium leading-snug transition-colors group-hover:text-primary">
                  {p.title || p.url}
                  <ArrowUpRight className="ml-1 inline size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                </p>
                <Badge variant="outline" className="shrink-0 gap-1">
                  <s.icon className="size-3" />
                  {s.label}
                </Badge>
              </div>
              {p.summary && (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.summary}</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                {SOURCE_LABEL[p.source]}
                {showCompany && p.company ? ` · ${p.company.name}` : ""}
                {p.posted_at ? ` · ${p.posted_at}` : ""}
              </p>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
