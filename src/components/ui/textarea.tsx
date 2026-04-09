import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "min-h-[120px] w-full rounded-2xl border border-border bg-surface-strong px-4 py-3 text-sm text-foreground placeholder:text-text-soft",
        "transition-colors focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none",
        className,
      )}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";
