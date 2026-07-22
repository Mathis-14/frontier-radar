"use client";

// OriginKit "Scramble Text" (genuine source: vendor/scrambletext/, fetched via
// the OriginKit MCP). This file adapts it to the app's prop API.

import GlitchCharReveal from "./vendor/scrambletext/scrambletext";
import { cn } from "@/lib/utils";

export function ScrambleText({
  text,
  className,
}: {
  text: string;
  className?: string;
  speed?: number;
}) {
  return (
    <span className={cn("inline-block", className)}>
      <GlitchCharReveal
        words={text}
        tag="span"
        color="var(--foreground)"
        font={{
          fontFamily: "Fraunces, Georgia, serif",
          fontSize: 30,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          lineHeight: "1.2em",
          textAlign: "left",
        }}
      />
    </span>
  );
}
