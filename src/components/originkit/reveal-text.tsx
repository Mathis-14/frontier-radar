"use client";

// OriginKit "Scroll Text Reveal" (genuine source: vendor/scroll-text-reveal/,
// fetched via the OriginKit MCP). Line-mask reveal for the daily narrative.

import LineMaskSplit from "./vendor/scroll-text-reveal/scroll-text-reveal";

export function RevealText({ text }: { text: string }) {
  return (
    <LineMaskSplit
      text={text}
      color="var(--foreground)"
      font={{
        fontFamily: "Inter, sans-serif",
        fontSize: 15,
        fontWeight: "400",
        lineHeight: "170%",
        letterSpacing: 0,
        textAlign: "left",
      }}
      tag="p"
      splitMode="lines"
      blurEnabled
      transition={{ type: "tween", duration: 0.7, ease: "easeOut", delay: 0.1 }}
    />
  );
}
