"use client";

// OriginKit slot: background-animation category (soft gradient/aurora).
// Stand-in — swap for genuine OriginKit source via MCP once the API key is set.

import { cn } from "@/lib/utils";

export function AuroraBackground({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-16 size-[26rem] rounded-full bg-[#e8cdb4]/60 blur-3xl animate-[aurora-a_14s_ease-in-out_infinite]" />
        <div className="absolute -bottom-28 left-1/3 size-[24rem] rounded-full bg-[#d9e0c5]/50 blur-3xl animate-[aurora-b_18s_ease-in-out_infinite]" />
        <div className="absolute -top-16 right-0 size-[22rem] rounded-full bg-[#f0dfae]/50 blur-3xl animate-[aurora-c_16s_ease-in-out_infinite]" />
      </div>
      <div className="relative">{children}</div>
      <style jsx>{`
        @keyframes aurora-a {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(3rem, 1.5rem) scale(1.15); }
        }
        @keyframes aurora-b {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-2.5rem, -1rem) scale(1.1); }
        }
        @keyframes aurora-c {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-1.5rem, 2rem) scale(0.95); }
        }
      `}</style>
    </div>
  );
}
