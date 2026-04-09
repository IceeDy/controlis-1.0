import { Badge } from "@/components/ui/badge";
import { Table, TableShell, Td, Th } from "@/components/ui/table";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { Sale } from "@/types/sale";

interface SalesTableProps {
  sales: Sale[];
}

export function SalesTable({ sales }: SalesTableProps) {
  return (
    <TableShell>
      <div className="overflow-x-auto">
        <Table>
          <thead className="bg-surface-strong">
            <tr>
              <Th>Venda</Th>
              <Th>Data</Th>
              <Th>Itens</Th>
              <Th>Total</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sales.map((sale) => (
              <tr key={sale.id}>
                <Td>
                  <div>
                    <p className="font-semibold text-foreground">#{sale.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-xs text-text-soft">
                      {sale.items[0]?.productName}
                      {sale.items.length > 1 ? ` +${sale.items.length - 1} itens` : ""}
                    </p>
                  </div>
                </Td>
                <Td>{formatDateTime(sale.date)}</Td>
                <Td>{sale.items.reduce((sum, item) => sum + item.quantity, 0)} un.</Td>
                <Td className="font-semibold text-foreground">{formatCurrency(sale.total)}</Td>
                <Td>
                  <Badge variant={sale.status === "concluida" ? "success" : "danger"}>
                    {sale.status === "concluida" ? "Concluída" : "Cancelada"}
                  </Badge>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </TableShell>
  );
}
