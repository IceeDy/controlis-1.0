import { z } from "zod";

export const inventoryMovementSchema = z.object({
  productId: z.string().min(1, "Selecione um produto."),
  type: z.enum(["entrada", "ajuste"], {
    message: "Selecione o tipo da movimentação.",
  }),
  quantity: z.coerce.number().min(1, "Informe uma quantidade válida."),
  note: z.string().min(3, "Adicione uma observação breve."),
  date: z.string().min(1, "Informe a data da movimentação."),
});

export type InventoryMovementSchemaInput = z.input<typeof inventoryMovementSchema>;
export type InventoryMovementSchema = z.output<typeof inventoryMovementSchema>;
