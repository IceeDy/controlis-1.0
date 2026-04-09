"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CreditCard, DollarSign, ShoppingBag } from "lucide-react";
import { BestSellersList } from "@/components/dashboard/best-sellers-list";
import { CriticalStockTable } from "@/components/dashboard/critical-stock-table";
import { OperationalSummary } from "@/components/dashboard/operational-summary";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { ProtectedShell } from "@/components/layout/protected-shell";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBanner } from "@/components/ui/status-banner";
import { formatCompactNumber, formatCurrency } from "@/lib/format";
import { dashboardService } from "@/services/dashboard.service";
import { useAuthStore } from "@/store/auth-store";
import type { DashboardData } from "@/types/dashboard";

export default function DashboardPage() {
  const companyId = useAuthStore((state) => state.company?.id);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) {
      return;
    }

    async function loadData() {
      const tenantId = companyId;

      if (!tenantId) {
        return;
      }

      try {
        setLoading(true);
        setErrorMessage(null);
        const summary = await dashboardService.getSummary(tenantId);
        setData(summary);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Não foi possível carregar o dashboard.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, [companyId]);

  const isEmptyDashboard =
    !loading &&
    data !== null &&
    data.summary.totalSoldToday === 0 &&
    data.summary.totalSoldMonth === 0 &&
    data.summary.salesCount === 0 &&
    data.lowStockProducts.length === 0 &&
    data.bestSellers.length === 0;

  return (
    <ProtectedShell
      title="Dashboard"
      subtitle="Visão consolidada da operação, vendas e saúde do estoque em tempo real."
    >
      <div className="space-y-5">
        <div className="grid gap-5 xl:grid-cols-4 md:grid-cols-2">
          {loading || !data
            ? Array.from({ length: 4 }).map((_, index) => (
                <Card key={index} className="h-[172px] animate-pulse bg-surface-strong" />
              ))
            : (
                <>
                  <SummaryCard
                    accent="primary"
                    helper="movimento acumulado do dia"
                    icon={DollarSign}
                    title="Total vendido hoje"
                    value={formatCurrency(data.summary.totalSoldToday)}
                  />
                  <SummaryCard
                    accent="secondary"
                    helper="resultado parcial do mês"
                    icon={CreditCard}
                    title="Total vendido no mês"
                    value={formatCurrency(data.summary.totalSoldMonth)}
                  />
                  <SummaryCard
                    accent="primary"
                    helper="vendas concluídas neste mês"
                    icon={ShoppingBag}
                    title="Quantidade de vendas"
                    value={formatCompactNumber(data.summary.salesCount)}
                  />
                  <SummaryCard
                    accent="warning"
                    helper="itens exigindo atenção"
                    icon={AlertTriangle}
                    title="Produtos com estoque baixo"
                    value={formatCompactNumber(data.summary.lowStockCount)}
                  />
                </>
              )}
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
          {loading || !data ? (
            <Card className="h-[420px] animate-pulse bg-surface-strong" />
          ) : (
            <CriticalStockTable products={data.lowStockProducts} />
          )}
          {loading || !data ? (
            <Card className="h-[420px] animate-pulse bg-surface-strong" />
          ) : (
            <BestSellersList items={data.bestSellers} />
          )}
        </div>

        <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <Card className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <div>
              <p className="text-sm font-semibold tracking-[0.2em] text-text-soft uppercase">
                Panorama rápido
              </p>
              <h3 className="mt-3 text-lg font-semibold text-foreground">
                Indicadores para acompanhamento diário
              </h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {[
                "Produtos com maior saída concentrados em mercearia e bebidas.",
                "Operação de estoque com baixa incidência de ajustes corretivos.",
                "Dashboard preparado para consumo de API por tenant autenticado.",
              ].map((item) => (
                <div key={item} className="rounded-2xl bg-surface-strong px-4 py-4 text-sm leading-6 text-text-soft">
                  {item}
                </div>
              ))}
            </div>
          </Card>
          {loading || !data ? (
            <Card className="h-[320px] animate-pulse bg-surface-strong" />
          ) : (
            <OperationalSummary insights={data.insights} />
          )}
        </div>
        {errorMessage ? <StatusBanner message={errorMessage} variant="error" /> : null}
        {isEmptyDashboard ? (
          <EmptyState
            description="Ainda não há vendas nem alertas de estoque para exibir. Assim que a operação começar, os indicadores aparecerão aqui."
            icon={ShoppingBag}
            title="Sem dados operacionais no momento"
          />
        ) : null}
      </div>
    </ProtectedShell>
  );
}
