import type { ButtonHTMLAttributes, ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  leftIcon?: ReactNode;
}

const variantClasses = {
  primary:
    "bg-primary text-text-inverse shadow-[0_16px_30px_rgba(18,62,114,0.22)] hover:bg-primary-strong",
  secondary:
    "bg-secondary text-text-inverse shadow-[0_16px_30px_rgba(26,160,109,0.2)] hover:brightness-95",
  ghost: "bg-transparent text-foreground hover:bg-primary-soft",
  danger: "bg-danger text-white hover:brightness-95",
} as const;

const sizeClasses = {
  sm: "h-10 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
} as const;

export function Button({
  className,
  variant = "primary",
  size = "md",
  loading,
  disabled,
  leftIcon,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : leftIcon}
      {children}
    </button>
  );
}
