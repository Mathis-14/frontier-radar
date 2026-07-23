"use client";

// OriginKit slot: "Text Morph" (text category).
// Stand-in — swap for genuine OriginKit source via MCP once the API key is set.

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function TextMorph({
  words,
  className,
  interval = 2600,
}: {
  words: string[];
  className?: string;
  interval?: number;
}) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (words.length <= 1) return;
    const timer = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % words.length);
        setVisible(true);
      }, 300);
    }, interval);
    return () => clearInterval(timer);
  }, [words, interval]);

  return (
    <span
      className={cn(
        "inline-block transition-all duration-300",
        visible ? "opacity-100 blur-0 translate-y-0" : "opacity-0 blur-sm -translate-y-1",
        className
      )}
    >
      {words[index]}
    </span>
  );
}
