import { Activity, CircleAlert, CircleCheckBig } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { OperationalInsight } from "@/types/dashboard";

interface OperationalSummaryProps {
  insights: OperationalInsight[];
}

const toneConfig = {
  positive: {
    Icon: CircleCheckBig,
    badge: "success" as const,
  },
  warning: {
    Icon: CircleAlert,
    badge: "warning" as const,
  },
  neutral: {
    Icon: Activity,
    badge: "default" as const,
  },
};

export function OperationalSummary({ insights }: OperationalSummaryProps) {
  return (
    <Card className="h-full">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Resumo operacional</h3>
          <p className="text-sm text-text-soft">Leitura executiva do que merece atenção na rotina.</p>
        </div>
        <Badge>Atualizado agora</Badge>
      </div>
      <div className="mt-6 space-y-4">
        {insights.map((insight) => {
          const { Icon, badge } = toneConfig[insight.tone];

          return (
            <div key={insight.title} className="rounded-2xl border border-border bg-surface-strong px-4 py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-primary-soft p-2 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="font-semibold text-foreground">{insight.title}</p>
                </div>
                <Badge variant={badge}>{insight.tone === "positive" ? "Positivo" : insight.tone === "warning" ? "Atenção" : "Estável"}</Badge>
              </div>
              <p className="mt-3 text-sm leading-6 text-text-soft">{insight.description}</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
