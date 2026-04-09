import { api, getApiErrorMessage } from "@/lib/api";
import type {
  ApiInventoryBalance,
  ApiInventoryMovement,
  InventoryFilters,
  InventoryMovement,
  InventoryMovementPayload,
} from "@/types/inventory";
import type { Product } from "@/types/product";

const DEFAULT_LOW_STOCK_THRESHOLD = 10;

function buildSku(productId: string) {
  return `PROD-${productId.slice(0, 8).toUpperCase()}`;
}

function mapBalance(balance: ApiInventoryBalance): Product {
  return {
    id: balance.product_id,
    companyId: "",
    sku: buildSku(balance.product_id),
    name: balance.product_name,
    category: balance.category,
    salePrice: 0,
    costPrice: 0,
    stockCurrent: balance.stock_quantity,
    minStock: DEFAULT_LOW_STOCK_THRESHOLD,
    isActive: balance.is_active,
    updatedAt: new Date().toISOString(),
  };
}

function mapMovementType(type: ApiInventoryMovement["type"]): InventoryMovement["type"] {
  if (type === "entry") {
    return "entrada";
  }

  if (type === "adjustment") {
    return "ajuste";
  }

  return "saida";
}

function mapPayloadType(type: InventoryMovementPayload["type"]) {
  return type === "entrada" ? "entry" : "adjustment";
}

function computeStockAfter(
  movements: ApiInventoryMovement[],
  balancesByProductId: Map<string, number>,
  productNamesById: Map<string, string>,
): InventoryMovement[] {
  const rollingBalances = new Map(balancesByProductId);

  return movements.map((movement) => {
    const currentBalance = rollingBalances.get(movement.product_id) ?? 0;
    rollingBalances.set(movement.product_id, currentBalance - movement.quantity);

    return {
      id: movement.id,
      companyId: movement.tenant_id,
      productId: movement.product_id,
      productName: productNamesById.get(movement.product_id) ?? `Produto ${movement.product_id.slice(0, 8)}`,
      type: mapMovementType(movement.type),
      quantity: movement.quantity,
      note: movement.note ?? "Sem observações.",
      date: movement.created_at,
      stockAfter: currentBalance,
    };
  });
}

function applyFilters(movements: InventoryMovement[], filters: InventoryFilters) {
  return movements.filter((movement) => {
    const matchesProduct = !filters.productId || movement.productId === filters.productId;
    const matchesType = !filters.type || movement.type === filters.type;
    return matchesProduct && matchesType;
  });
}

export const inventoryService = {
  async getSnapshot(
    tenantId: string,
    filters: InventoryFilters = {},
  ): Promise<{ products: Product[]; movements: InventoryMovement[] }> {
    void tenantId;

    try {
      const [balancesResponse, movementsResponse] = await Promise.all([
        api.get<ApiInventoryBalance[]>("/inventory/balances"),
        api.get<ApiInventoryMovement[]>("/inventory/movements"),
      ]);

      const products = balancesResponse.data.map(mapBalance);
      const balancesByProductId = new Map(products.map((product) => [product.id, product.stockCurrent]));
      const productNamesById = new Map(products.map((product) => [product.id, product.name]));
      const movements = computeStockAfter(movementsResponse.data, balancesByProductId, productNamesById);

      return {
        products,
        movements: applyFilters(movements, filters),
      };
    } catch (error) {
      throw new Error(getApiErrorMessage(error, "Não foi possível carregar o estoque."));
    }
  },

  async createMovement(tenantId: string, payload: InventoryMovementPayload): Promise<InventoryMovement> {
    void tenantId;

    try {
      const response = await api.post<ApiInventoryMovement>("/inventory/movements", {
        product_id: payload.productId,
        type: mapPayloadType(payload.type),
        quantity: payload.type === "entrada" ? payload.quantity : -payload.quantity,
        note: payload.note,
      });

      return {
        id: response.data.id,
        companyId: response.data.tenant_id,
        productId: response.data.product_id,
        productName: `Produto ${response.data.product_id.slice(0, 8)}`,
        type: mapMovementType(response.data.type),
        quantity: response.data.quantity,
        note: response.data.note ?? payload.note,
        date: response.data.created_at,
        stockAfter: 0,
      };
    } catch (error) {
      throw new Error(getApiErrorMessage(error, "Não foi possível registrar a movimentação."));
    }
  },
};