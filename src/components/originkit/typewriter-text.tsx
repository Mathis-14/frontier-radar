"use client";

// OriginKit "Type Writer" (genuine source: vendor/typewriter/, fetched via the
// OriginKit MCP). Adapter with the app's cream palette.

import Typewriter from "./vendor/typewriter/typewriter";

export function TypewriterText({ texts }: { texts: string[] }) {
  return (
    <Typewriter
      texts={texts}
      prefix=""
      color="var(--muted-foreground)"
      typedColor="var(--muted-foreground)"
      cursorColor="var(--primary)"
      font={{
        fontFamily: "Inter, sans-serif",
        fontSize: 14,
        fontWeight: 400,
        lineHeight: "1.4em",
        letterSpacing: "0em",
        textAlign: "left",
      }}
      deleteSpeed={20}
      showCursor
      hideCursorOnType={false}
      cursorChar="▎"
    />
  );
}
