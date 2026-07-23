"use client";

// OriginKit "Magnetic Hover Button" (genuine source: vendor/magnetic-hover-button/,
// fetched via the OriginKit MCP). Wrapped to expose onClick (the vendor component
// is link-based); preventDefault stops the empty-href navigation.

import MagneticButton from "./vendor/originkit/magnetic-hover-button/magnetic-hover-button";

export function MagneticActionButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <span
      className={disabled ? "pointer-events-none opacity-50" : "inline-block"}
      onClickCapture={(e) => {
        e.preventDefault();
        if (!disabled) onClick();
      }}
    >
      <MagneticButton
        label={label}
        link=""
        fill="var(--primary)"
        textColor="#fffdf7"
        sweepColor="#a85a2e"
        sweepTextColor="#fffdf7"
        radius={10}
        paddingX={16}
        paddingY={8}
        font={{
          fontFamily: "Inter, sans-serif",
          fontWeight: 500,
          fontSize: 14,
          lineHeight: "1em",
          letterSpacing: "-0.01em",
          textAlign: "left",
        }}
      />
    </span>
  );
}
