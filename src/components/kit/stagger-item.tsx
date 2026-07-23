"use client";

// Stagger-in list row (in-house, after the ReactBits Animated List pattern —
// see kit/vendor/reactbits/animated-list.tsx; that component owns its own
// scroll container + string items, so rows here animate in place instead).

import { motion, MotionConfig } from "framer-motion";

export function StaggerItem({
  index = 0,
  className,
  children,
}: {
  index?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <MotionConfig reducedMotion="user">
      <motion.li
        className={className}
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.35, ease: "easeOut", delay: index * 0.06 }}
      >
        {children}
      </motion.li>
    </MotionConfig>
  );
}
