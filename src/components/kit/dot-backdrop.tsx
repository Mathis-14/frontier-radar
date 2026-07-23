"use client";

// Themed adapter over vendored MagicUI DotPattern (docs/UI-KIT.md):
// faint dotted backdrop, masked to fade out by the top third of its parent.

import { DotPattern } from "./vendor/magicui/dot-pattern";
import { cn } from "@/lib/utils";

export function DotBackdrop({ className }: { className?: string }) {
  return (
    <DotPattern
      width={18}
      height={18}
      cr={1}
      className={cn(
        "text-sidebar-foreground opacity-[0.05] [mask-image:linear-gradient(to_bottom,black,transparent_33%)]",
        className
      )}
    />
  );
}
