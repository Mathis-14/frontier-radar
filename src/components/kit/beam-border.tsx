"use client";

// Themed adapter over vendored MagicUI BorderBeam (docs/UI-KIT.md):
// terracotta→amber beam tracing the parent's border radius. Parent must be
// positioned (relative) with a border; respects prefers-reduced-motion.

import { MotionConfig } from "framer-motion";
import { BorderBeam as VendorBorderBeam } from "./vendor/magicui/border-beam";

export function BeamBorder({
  duration = 10,
  size = 80,
}: {
  duration?: number;
  size?: number;
}) {
  return (
    <MotionConfig reducedMotion="user">
      <VendorBorderBeam
        size={size}
        duration={duration}
        colorFrom="var(--primary)"
        colorTo="var(--chart-5)"
      />
    </MotionConfig>
  );
}
