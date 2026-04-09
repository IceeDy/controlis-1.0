import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
}

export function Card({ className, elevated = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-border bg-surface p-6 backdrop-blur-xl",
        elevated ? "shadow-[var(--shadow-lg)]" : "shadow-[var(--shadow-md)]",
        className,
      )}
      {...props}
    />
  );
}
