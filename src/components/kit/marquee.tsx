"use client";

// OriginKit slot: marquee / ticker strip.
// Stand-in — swap for genuine OriginKit source via MCP once the API key is set.

import { cn } from "@/lib/utils";

export function Marquee({
  className,
  children,
  durationSeconds = 30,
}: {
  className?: string;
  children: React.ReactNode;
  durationSeconds?: number;
}) {
  return (
    <div className={cn("group relative overflow-hidden", className)}>
      <div
        className="flex w-max gap-8 pr-8 animate-[marquee_linear_infinite] group-hover:[animation-play-state:paused]"
        style={{ animationDuration: `${durationSeconds}s` }}
      >
        <div className="flex shrink-0 items-center gap-8">{children}</div>
        <div className="flex shrink-0 items-center gap-8" aria-hidden>
          {children}
        </div>
      </div>
      <style jsx>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
