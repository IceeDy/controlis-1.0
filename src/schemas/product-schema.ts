import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(3, "Informe o nome do produto."),
  category: z.string().min(1, "Selecione uma categoria."),
  salePrice: z.coerce.number().min(0.01, "Informe um preço de venda válido."),
  costPrice: z.coerce.number().min(0.01, "Informe um custo válido."),
  stockCurrent: z.coerce.number().min(0, "O estoque não pode ser negativo."),
});

export type ProductSchemaInput = z.input<typeof productSchema>;
export type ProductSchema = z.output<typeof productSchema>;
