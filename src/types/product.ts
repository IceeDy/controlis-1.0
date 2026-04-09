export interface Product {
  id: string;
  companyId: string;
  sku: string;
  name: string;
  category: string;
  salePrice: number;
  costPrice: number;
  stockCurrent: number;
  minStock: number;
  isActive: boolean;
  updatedAt: string;
}

export interface ApiProduct {
  id: string;
  tenant_id: string;
  name: string;
  category: string;
  sale_price: number | string;
  cost_price: number | string;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductFilters {
  search?: string;
  category?: string;
}

export interface ProductPayload {
  name: string;
  category: string;
  salePrice: number;
  costPrice: number;
  stockCurrent: number;
}
