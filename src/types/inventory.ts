export type InventoryMovementType = "entrada" | "ajuste" | "saida";

export type ApiInventoryMovementType = "entry" | "adjustment" | "sale";

export interface InventoryMovement {
  id: string;
  companyId: string;
  productId: string;
  productName: string;
  type: InventoryMovementType;
  quantity: number;
  note: string;
  date: string;
  stockAfter: number;
}

export interface ApiInventoryMovement {
  id: string;
  tenant_id: string;
  product_id: string;
  type: ApiInventoryMovementType;
  quantity: number;
  note: string | null;
  created_by: string;
  created_at: string;
}

export interface ApiInventoryBalance {
  product_id: string;
  product_name: string;
  category: string;
  stock_quantity: number;
  is_active: boolean;
}

export interface InventoryMovementPayload {
  productId: string;
  type: Extract<InventoryMovementType, "entrada" | "ajuste">;
  quantity: number;
  note: string;
  date: string;
}

export interface InventoryFilters {
  productId?: string;
  type?: InventoryMovementType | "";
}
