import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  compact?: boolean;
  className?: string;
}

export function Logo({ compact = false, className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-text-inverse shadow-[0_16px_30px_rgba(18,62,114,0.24)]">
        <ShieldCheck className="h-5 w-5" />
      </div>
      {compact ? null : (
        <div>
          <span className="block text-lg font-extrabold tracking-[0.18em] text-foreground uppercase">
            Controlis
          </span>
          <span className="block text-xs text-text-soft">Operação sob controle</span>
        </div>
      )}
    </div>
  );
}
