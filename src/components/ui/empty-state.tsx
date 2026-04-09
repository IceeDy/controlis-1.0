import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <Card className="flex flex-col items-center justify-center gap-4 border-dashed py-12 text-center">
      <div className="rounded-3xl bg-primary-soft p-4 text-primary">
        <Icon className="h-7 w-7" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="mx-auto max-w-md text-sm leading-6 text-text-soft">{description}</p>
      </div>
      {action}
    </Card>
  );
}
