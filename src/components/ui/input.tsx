import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "h-12 w-full rounded-2xl border border-border bg-surface-strong px-4 text-sm text-foreground placeholder:text-text-soft",
          "transition-colors focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
