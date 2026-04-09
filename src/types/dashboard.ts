export interface DashboardSummary {
  totalSoldToday: number;
  totalSoldMonth: number;
  salesCount: number;
  lowStockCount: number;
}

export interface LowStockProduct {
  id: string;
  name: string;
  category: string;
  stockCurrent: number;
  minStock: number;
}

export interface BestSeller {
  productId: string;
  productName: string;
  unitsSold: number;
  revenue: number;
}

export interface OperationalInsight {
  title: string;
  description: string;
  tone: "neutral" | "positive" | "warning";
}

export interface DashboardData {
  summary: DashboardSummary;
  lowStockProducts: LowStockProduct[];
  bestSellers: BestSeller[];
  insights: OperationalInsight[];
}

export interface ApiDashboardLowStockProduct {
  product_id: string;
  name: string;
  category: string;
  stock_quantity: number;
}

export interface ApiDashboardBestSeller {
  product_id: string;
  name: string;
  total_quantity: number;
  total_revenue: number | string;
}

export interface ApiDashboardSummaryResponse {
  total_sold_today: number | string;
  total_sold_month: number | string;
  sales_count_month: number;
  low_stock_products_count: number;
  low_stock_products: ApiDashboardLowStockProduct[];
  top_selling_products: ApiDashboardBestSeller[];
}
