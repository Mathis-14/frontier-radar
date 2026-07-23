"use client";

// Shared hover-lift stat surface (in-house, premium-subtle per docs/UI-KIT.md §8).

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card
      className={cn(
        "transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        className
      )}
    >
      {children}
    </Card>
  );
}
