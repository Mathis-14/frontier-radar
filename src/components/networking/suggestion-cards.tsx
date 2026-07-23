"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X } from "lucide-react";
import { MagneticActionButton } from "@/components/kit/magnetic-button";
import { SpotlightCard } from "@/components/kit/spotlight-card";
import { Button } from "@/components/ui/button";
import type { SuggestedContactRow } from "@/lib/types";

export function SuggestionCards({ suggestions }: { suggestions: SuggestedContactRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function act(id: string, action: "accepted" | "dismissed") {
    setBusy(id);
    const res = await fetch("/api/contacts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ suggestion_id: id, action }),
    });
    setBusy(null);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ?? "Something went wrong");
      return;
    }
    toast.success(action === "accepted" ? "Added to your contacts" : "Dismissed");
    router.refresh();
  }

  if (!suggestions.length) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No pending suggestions — the agent proposes people from each morning&apos;s news.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {suggestions.map((s) => (
        <SpotlightCard key={s.id} className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium">{s.full_name}</p>
              <p className="text-sm text-muted-foreground">
                {[s.role, s.company].filter(Boolean).join(" · ")}
              </p>
            </div>
            {s.source_url && (
              <a
                href={s.source_url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary underline-offset-2 hover:underline"
              >
                source
              </a>
            )}
          </div>
          {s.reason && <p className="mt-2 text-sm text-muted-foreground">{s.reason}</p>}
          <div className="mt-4 flex items-center gap-2">
            <MagneticActionButton
              label="Accept"
              disabled={busy === s.id}
              onClick={() => act(s.id, "accepted")}
            />
            <Button
              variant="ghost"
              size="sm"
              disabled={busy === s.id}
              onClick={() => act(s.id, "dismissed")}
            >
              <X className="size-4" /> Dismiss
            </Button>
          </div>
        </SpotlightCard>
      ))}
    </div>
  );
}
