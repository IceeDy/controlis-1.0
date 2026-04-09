import { z } from "zod";

export const saleSchema = z.object({
  date: z.string().min(1, "Informe a data da venda."),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Selecione um produto."),
        quantity: z.coerce.number().min(1, "A quantidade precisa ser maior que zero."),
      }),
    )
    .min(1, "Adicione ao menos um item à venda."),
});

  export type SaleSchemaInput = z.input<typeof saleSchema>;
  export type SaleSchema = z.output<typeof saleSchema>;
