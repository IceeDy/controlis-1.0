import { api, getApiErrorMessage } from "@/lib/api";
import type { ApiDashboardSummaryResponse, DashboardData, OperationalInsight } from "@/types/dashboard";

const DEFAULT_LOW_STOCK_THRESHOLD = 10;

function toNumber(value: number | string) {
  return Number(value);
}

function buildInsights(summary: DashboardData["summary"]): OperationalInsight[] {
  return [
    {
      title: "Movimento do dia",
      description:
        summary.totalSoldToday > 0
          ? "O backend já consolidou vendas de hoje em tempo real."
          : "Ainda não houve vendas registradas hoje para o tenant autenticado.",
      tone: summary.totalSoldToday > 0 ? "positive" : "neutral",
    },
    {
      title: "Risco de estoque",
      description:
        summary.lowStockCount > 0
          ? "Existem produtos abaixo do limite operacional recomendado."
          : "Nenhum produto crítico no momento.",
      tone: summary.lowStockCount > 0 ? "warning" : "positive",
    },
    {
      title: "Ritmo comercial",
      description:
        summary.salesCount > 0
          ? "As vendas do mês já estão refletidas no dashboard do backend."
          : "Ainda não há vendas no mês corrente para este tenant.",
      tone: summary.salesCount > 0 ? "positive" : "neutral",
    },
  ];
}

function mapDashboardResponse(response: ApiDashboardSummaryResponse): DashboardData {
  const summary = {
    totalSoldToday: toNumber(response.total_sold_today),
    totalSoldMonth: toNumber(response.total_sold_month),
    salesCount: response.sales_count_month,
    lowStockCount: response.low_stock_products_count,
  };

  return {
    summary,
    lowStockProducts: response.low_stock_products.map((product) => ({
      id: product.product_id,
      name: product.name,
      category: product.category,
      stockCurrent: product.stock_quantity,
      minStock: DEFAULT_LOW_STOCK_THRESHOLD,
    })),
    bestSellers: response.top_selling_products.map((item) => ({
      productId: item.product_id,
      productName: item.name,
      unitsSold: item.total_quantity,
      revenue: toNumber(item.total_revenue),
    })),
    insights: buildInsights(summary),
  };
}

export const dashboardService = {
  async getSummary(tenantId: string): Promise<DashboardData> {
    void tenantId;

    try {
      const response = await api.get<ApiDashboardSummaryResponse>("/dashboard/summary");
      return mapDashboardResponse(response.data);
    } catch (error) {
      throw new Error(getApiErrorMessage(error, "Não foi possível carregar o dashboard."));
    }
  },
};