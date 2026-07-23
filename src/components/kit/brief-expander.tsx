"use client";

import { useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Progressive-disclosure narrative: a large serif lead (the takeaway) with the
 * full text behind a smoothly animated "read more". Height animation degrades
 * to an instant toggle under prefers-reduced-motion via MotionConfig.
 */
export function BriefExpander({
  lead,
  rest,
}: {
  lead: string;
  rest: string[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <MotionConfig reducedMotion="user">
      <div className="max-w-prose">
        <p className="font-heading text-xl leading-relaxed font-normal text-foreground/90 text-pretty">
          {lead}
        </p>
        {rest.length > 0 && (
          <>
            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  key="body"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                  className="overflow-hidden"
                >
                  <div className="space-y-4 pt-4 text-base leading-[1.65] text-muted-foreground">
                    {rest.map((p, i) => (
                      <p key={i} className="text-pretty">
                        {p}
                      </p>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/75"
            >
              <ChevronDown
                aria-hidden
                className={cn(
                  "size-4 transition-transform duration-300 motion-reduce:transition-none",
                  open && "rotate-180"
                )}
              />
              {open ? "Collapse the brief" : "Read the full brief"}
            </button>
          </>
        )}
      </div>
    </MotionConfig>
  );
}
