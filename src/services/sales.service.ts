import { api, getApiErrorMessage } from "@/lib/api";
import type { ApiProduct } from "@/types/product";
import type { ApiSale, ApiSaleDetail, Sale, SaleFilters, SalePayload } from "@/types/sale";

function toNumber(value: number | string) {
  return Number(value);
}

function buildProductNamesById(products: ApiProduct[]) {
  return new Map(products.map((product) => [product.id, product.name]));
}

function mapSaleDetail(sale: ApiSaleDetail, productNamesById: Map<string, string>): Sale {
  return {
    id: sale.id,
    companyId: sale.tenant_id,
    date: sale.sale_date,
    status: "concluida",
    total: toNumber(sale.total_amount),
    items: sale.items.map((item) => ({
      productId: item.product_id,
      productName:
        productNamesById.get(item.product_id) ?? `Produto ${item.product_id.slice(0, 8)}`,
      quantity: item.quantity,
      unitPrice: toNumber(item.unit_price),
      subtotal: toNumber(item.subtotal),
    })),
  };
}

function matchesDateFilter(sale: ApiSale, filters: SaleFilters) {
  const saleDate = new Date(sale.sale_date);
  const afterStart = !filters.startDate || saleDate >= new Date(filters.startDate);
  const beforeEnd = !filters.endDate || saleDate <= new Date(`${filters.endDate}T23:59:59`);
  return afterStart && beforeEnd;
}

async function fetchSaleDetail(saleId: string) {
  const response = await api.get<ApiSaleDetail>(`/sales/${saleId}`);
  return response.data;
}

async function fetchProductNamesById() {
  const response = await api.get<ApiProduct[]>("/products");
  return buildProductNamesById(response.data);
}

export const salesService = {
  async list(tenantId: string, filters: SaleFilters = {}): Promise<Sale[]> {
    void tenantId;

    try {
      const [response, productNamesById] = await Promise.all([
        api.get<ApiSale[]>("/sales"),
        fetchProductNamesById(),
      ]);
      const filteredSales = response.data.filter((sale) => matchesDateFilter(sale, filters));
      const detailedSales = await Promise.all(filteredSales.map((sale) => fetchSaleDetail(sale.id)));
      return detailedSales.map((sale) => mapSaleDetail(sale, productNamesById));
    } catch (error) {
      throw new Error(getApiErrorMessage(error, "Não foi possível carregar as vendas."));
    }
  },

  async create(tenantId: string, payload: SalePayload): Promise<Sale> {
    void tenantId;

    try {
      const productNamesById = await fetchProductNamesById();
      const response = await api.post<ApiSaleDetail>("/sales", {
        sale_date: payload.date,
        items: payload.items.map((item) => ({
          product_id: item.productId,
          quantity: item.quantity,
        })),
      });

      return mapSaleDetail(response.data, productNamesById);
    } catch (error) {
      throw new Error(getApiErrorMessage(error, "Não foi possível registrar a venda."));
    }
  },

  async getById(saleId: string): Promise<Sale> {
    try {
      const [response, productNamesById] = await Promise.all([
        api.get<ApiSaleDetail>(`/sales/${saleId}`),
        fetchProductNamesById(),
      ]);
      return mapSaleDetail(response.data, productNamesById);
    } catch (error) {
      throw new Error(getApiErrorMessage(error, "Não foi possível carregar a venda."));
    }
  },
};