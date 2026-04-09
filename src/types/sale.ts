export type SaleStatus = "concluida" | "cancelada";

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  companyId: string;
  date: string;
  status: SaleStatus;
  items: SaleItem[];
  total: number;
}

export interface ApiSale {
  id: string;
  tenant_id: string;
  total_amount: number | string;
  sale_date: string;
  created_by: string;
  created_at: string;
}

export interface ApiSaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number | string;
  subtotal: number | string;
}

export interface ApiSaleDetail extends ApiSale {
  items: ApiSaleItem[];
}

export interface SalePayloadItem {
  productId: string;
  quantity: number;
}

export interface SalePayload {
  date: string;
  items: SalePayloadItem[];
}

export interface SaleFilters {
  startDate?: string;
  endDate?: string;
}
