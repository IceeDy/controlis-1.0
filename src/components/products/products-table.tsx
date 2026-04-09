import { PencilLine, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableShell, Td, Th } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Product } from "@/types/product";

interface ProductsTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export function ProductsTable({ products, onEdit, onDelete }: ProductsTableProps) {
  return (
    <TableShell>
      <div className="overflow-x-auto">
        <Table>
          <thead className="bg-surface-strong">
            <tr>
              <Th>Produto</Th>
              <Th>Categoria</Th>
              <Th>Preço</Th>
              <Th>Custo</Th>
              <Th>Estoque</Th>
              <Th>Atualizado</Th>
              <Th className="text-right">Ações</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.map((product) => {
              const lowStock = product.stockCurrent <= product.minStock;

              return (
                <tr key={product.id}>
                  <Td>
                    <div>
                      <p className="font-semibold text-foreground">{product.name}</p>
                      <p className="text-xs text-text-soft">{product.sku}</p>
                    </div>
                  </Td>
                  <Td>{product.category}</Td>
                  <Td>{formatCurrency(product.salePrice)}</Td>
                  <Td>{formatCurrency(product.costPrice)}</Td>
                  <Td>
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{product.stockCurrent} un.</span>
                      {lowStock ? <Badge variant="warning">Baixo</Badge> : <Badge variant="success">OK</Badge>}
                    </div>
                  </Td>
                  <Td>{formatDate(product.updatedAt)}</Td>
                  <Td>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<PencilLine className="h-4 w-4" />}
                        onClick={() => onEdit(product)}
                        type="button"
                      >
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<Trash2 className="h-4 w-4" />}
                        className="text-danger hover:bg-red-100 dark:hover:bg-red-500/10"
                        onClick={() => onDelete(product)}
                        type="button"
                      >
                        Excluir
                      </Button>
                    </div>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>
    </TableShell>
  );
}
