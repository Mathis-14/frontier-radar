"use client";

// Themed adapter over vendored MagicUI AnimatedShinyText (docs/UI-KIT.md):
// strips the demo's muted/centered defaults so it inherits the local text style.

import { AnimatedShinyText } from "./vendor/magicui/animated-shiny-text";
import { cn } from "@/lib/utils";

export function ShinyText({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <AnimatedShinyText className={cn("mx-0 max-w-none text-current", className)}>
      {children}
    </AnimatedShinyText>
  );
}
