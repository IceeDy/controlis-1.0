import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableShell, Td, Th } from "@/components/ui/table";
import type { LowStockProduct } from "@/types/dashboard";

interface CriticalStockTableProps {
  products: LowStockProduct[];
}

export function CriticalStockTable({ products }: CriticalStockTableProps) {
  return (
    <TableShell>
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Estoque crítico</h3>
          <p className="text-sm text-text-soft">Itens que precisam de reposição com maior urgência.</p>
        </div>
        <Badge variant="warning">Monitoramento diário</Badge>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <thead className="bg-surface-strong">
            <tr>
              <Th>Produto</Th>
              <Th>Categoria</Th>
              <Th>Saldo atual</Th>
              <Th>Estoque mínimo</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.map((product) => (
              <tr key={product.id}>
                <Td>
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-amber-100 p-2 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{product.name}</p>
                      <p className="text-xs text-text-soft">Cobertura abaixo do ideal</p>
                    </div>
                  </div>
                </Td>
                <Td>{product.category}</Td>
                <Td className="font-semibold text-danger">{product.stockCurrent} un.</Td>
                <Td>{product.minStock} un.</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </TableShell>
  );
}
