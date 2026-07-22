"use client";

// OriginKit slot: interactive-elements category (card hover spotlight).
// Stand-in — swap for genuine OriginKit source via MCP once the API key is set.

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function SpotlightCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: -200, y: -200 });

  return (
    <div
      ref={ref}
      onMouseMove={(e) => {
        const rect = ref.current?.getBoundingClientRect();
        if (rect) setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }}
      onMouseLeave={() => setPos({ x: -200, y: -200 })}
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border bg-card",
        "transition-shadow duration-300 hover:shadow-lg hover:shadow-primary/5",
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(280px circle at ${pos.x}px ${pos.y}px, rgba(196,112,63,0.10), transparent 65%)`,
        }}
      />
      {children}
    </div>
  );
}
