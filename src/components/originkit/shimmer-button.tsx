"use client";

// OriginKit slot: button category (animated/shimmer button).
// Stand-in — swap for genuine OriginKit source via MCP once the API key is set.

import { cn } from "@/lib/utils";

export function ShimmerButton({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-lg",
        "bg-primary px-4 py-2 text-sm font-medium text-primary-foreground",
        "transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]",
        "disabled:pointer-events-none disabled:opacity-50",
        className
      )}
    >
      <span
        aria-hidden
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full"
      />
      <span className="relative">{children}</span>
    </button>
  );
}
