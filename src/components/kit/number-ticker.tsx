"use client";

// Themed adapter over vendored MagicUI NumberTicker (docs/UI-KIT.md).
// Takes the serializable format hint ("int" | "usd") so server components can
// pass tiles across the RSC boundary; "usd" decomposes into prefix/suffix
// around the animated compact value, mirroring lib/format.ts formatUsd.

import { NumberTicker as VendorNumberTicker } from "./vendor/magicui/number-ticker";
import { cn } from "@/lib/utils";

export type TickerFormat = "int" | "usd";

function usdParts(n: number) {
  if (n >= 1e12) return { value: n / 1e12, decimals: 1, suffix: "T" };
  if (n >= 1e9) return { value: n / 1e9, decimals: n >= 1e10 ? 0 : 1, suffix: "B" };
  if (n >= 1e6) return { value: n / 1e6, decimals: 0, suffix: "M" };
  return { value: n, decimals: 0, suffix: "" };
}

export function NumberTicker({
  value,
  format = "int",
  className,
}: {
  value: number;
  format?: TickerFormat;
  className?: string;
}) {
  const parts =
    format === "usd" ? usdParts(value) : { value, decimals: 0, suffix: "" };
  return (
    <span className={cn("tabular-nums", className)}>
      {format === "usd" && "$"}
      <VendorNumberTicker
        value={parts.value}
        decimalPlaces={parts.decimals}
        className="tracking-normal text-current dark:text-current"
      />
      {parts.suffix}
    </span>
  );
}
