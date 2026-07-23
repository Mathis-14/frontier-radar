"use client";

// Themed adapter over vendored MagicUI Marquee (docs/UI-KIT.md):
// edge-faded ticker strip, pauses on hover. Keeps the original adapter API so
// section code is untouched; duration maps to the vendor's --duration var.

import { Marquee as VendorMarquee } from "./vendor/magicui/marquee";
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
    <VendorMarquee
      pauseOnHover
      className={cn(
        "p-0 [--gap:2rem] [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] motion-reduce:[&>div]:animate-none",
        className
      )}
      style={{ "--duration": `${durationSeconds}s` } as React.CSSProperties}
    >
      {children}
    </VendorMarquee>
  );
}
