import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusBannerProps {
  variant: "success" | "error" | "info";
  message: string;
}

const bannerConfig = {
  success: {
    wrapper: "border-secondary/20 bg-secondary-soft text-secondary",
    Icon: CheckCircle2,
  },
  error: {
    wrapper: "border-danger/20 bg-red-100 text-danger dark:bg-red-500/10",
    Icon: AlertCircle,
  },
  info: {
    wrapper: "border-primary/15 bg-primary-soft text-primary",
    Icon: Info,
  },
} as const;

export function StatusBanner({ variant, message }: StatusBannerProps) {
  const { wrapper, Icon } = bannerConfig[variant];

  return (
    <div className={cn("flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm", wrapper)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
