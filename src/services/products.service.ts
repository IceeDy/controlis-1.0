import { api, getApiErrorMessage } from "@/lib/api";
import type { ApiProduct, Product, ProductFilters, ProductPayload } from "@/types/product";

const DEFAULT_LOW_STOCK_THRESHOLD = 10;

function toNumber(value: number | string) {
  return Number(value);
}

function buildSku(productId: string) {
  return `PROD-${productId.slice(0, 8).toUpperCase()}`;
}

function mapProduct(product: ApiProduct): Product {
  return {
    id: product.id,
    companyId: product.tenant_id,
    sku: buildSku(product.id),
    name: product.name,
    category: product.category,
    salePrice: toNumber(product.sale_price),
    costPrice: toNumber(product.cost_price),
    stockCurrent: product.stock_quantity,
    minStock: DEFAULT_LOW_STOCK_THRESHOLD,
    isActive: product.is_active,
    updatedAt: product.updated_at,
  };
}

function buildProductPayload(payload: ProductPayload) {
  return {
    name: payload.name,
    category: payload.category,
    sale_price: payload.salePrice,
    cost_price: payload.costPrice,
    stock_quantity: payload.stockCurrent,
  };
}

function buildListParams(filters: ProductFilters) {
  const params: Record<string, string> = {};

  if (filters.search?.trim()) {
    params.search = filters.search.trim();
  }

  if (filters.category?.trim() && filters.category !== "Todas") {
    params.category = filters.category.trim();
  }

  return params;
}

export const productService = {
  async list(tenantId: string, filters: ProductFilters = {}): Promise<Product[]> {
    void tenantId;

    try {
      const response = await api.get<ApiProduct[]>("/products", {
        params: buildListParams(filters),
      });
      return response.data.map(mapProduct);
    } catch (error) {
      throw new Error(getApiErrorMessage(error, "Não foi possível carregar os produtos."));
    }
  },

  async create(tenantId: string, payload: ProductPayload): Promise<Product> {
    void tenantId;

    try {
      const response = await api.post<ApiProduct>("/products", buildProductPayload(payload));
      return mapProduct(response.data);
    } catch (error) {
      throw new Error(getApiErrorMessage(error, "Não foi possível criar o produto."));
    }
  },

  async update(tenantId: string, productId: string, payload: ProductPayload): Promise<Product> {
    void tenantId;

    try {
      const response = await api.put<ApiProduct>(`/products/${productId}`, buildProductPayload(payload));
      return mapProduct(response.data);
    } catch (error) {
      throw new Error(getApiErrorMessage(error, "Não foi possível atualizar o produto."));
    }
  },

  async remove(tenantId: string, productId: string): Promise<void> {
    void tenantId;

    try {
      await api.delete(`/products/${productId}`);
    } catch (error) {
      throw new Error(getApiErrorMessage(error, "Não foi possível excluir o produto."));
    }
  },
};