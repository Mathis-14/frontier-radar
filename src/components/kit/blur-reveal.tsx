"use client";

// OriginKit slot: text/animation category (blur + fade reveal on view).
// Stand-in — swap for genuine OriginKit source via MCP once the API key is set.

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function BlurReveal({
  className,
  children,
  delay = 0,
}: {
  className?: string;
  children: React.ReactNode;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setTimeout(() => setShown(true), delay);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out",
        shown ? "opacity-100 blur-0 translate-y-0" : "opacity-0 blur-sm translate-y-3",
        className
      )}
    >
      {children}
    </div>
  );
}
