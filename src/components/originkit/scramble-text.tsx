"use client";

// OriginKit slot: "Scramble Text" (text category).
// Stand-in implementation — swap for the genuine OriginKit source via its MCP
// (originkit_get, stack: nextjs, styling: tailwind) once the API key is set.

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export function ScrambleText({
  text,
  className,
  speed = 30,
}: {
  text: string;
  className?: string;
  speed?: number;
}) {
  const [display, setDisplay] = useState(text);
  const frame = useRef(0);

  useEffect(() => {
    frame.current = 0;
    const interval = setInterval(() => {
      frame.current += 1;
      const settled = Math.floor(frame.current / 2);
      setDisplay(
        text
          .split("")
          .map((ch, i) => {
            if (ch === " " || i < settled) return ch;
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join("")
      );
      if (settled >= text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span className={cn("font-heading", className)} aria-label={text}>
      {display}
    </span>
  );
}
