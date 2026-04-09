import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";

interface SummaryCardProps {
  title: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  accent: "primary" | "secondary" | "warning";
}

const accentClasses = {
  primary: "bg-primary-soft text-primary",
  secondary: "bg-secondary-soft text-secondary",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
} as const;

export function SummaryCard({ title, value, helper, icon: Icon, accent }: SummaryCardProps) {
  return (
    <Card elevated className="relative overflow-hidden">
      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-text-soft">{title}</p>
          <p className="mt-3 text-3xl font-bold text-foreground">{value}</p>
          <p className="mt-3 inline-flex items-center gap-2 text-sm text-text-soft">
            <ArrowUpRight className="h-4 w-4 text-secondary" />
            {helper}
          </p>
        </div>
        <div className={`rounded-3xl p-3 ${accentClasses[accent]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
}
