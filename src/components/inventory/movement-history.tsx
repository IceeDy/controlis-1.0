import { Badge } from "@/components/ui/badge";
import { Table, TableShell, Td, Th } from "@/components/ui/table";
import { formatDateTime, formatNumber } from "@/lib/format";
import type { InventoryMovement } from "@/types/inventory";

interface MovementHistoryProps {
  movements: InventoryMovement[];
}

function getMovementVariant(type: InventoryMovement["type"]) {
  if (type === "entrada") {
    return "success" as const;
  }

  if (type === "ajuste") {
    return "warning" as const;
  }

  return "default" as const;
}

function getMovementLabel(type: InventoryMovement["type"]) {
  if (type === "entrada") {
    return "Entrada";
  }

  if (type === "ajuste") {
    return "Ajuste";
  }

  return "Saída";
}

export function MovementHistory({ movements }: MovementHistoryProps) {
  return (
    <TableShell>
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Histórico de movimentações</h3>
          <p className="text-sm text-text-soft">Últimos registros operacionais de estoque.</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <thead className="bg-surface-strong">
            <tr>
              <Th>Produto</Th>
              <Th>Tipo</Th>
              <Th>Quantidade</Th>
              <Th>Saldo após</Th>
              <Th>Data</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {movements.map((movement) => (
              <tr key={movement.id}>
                <Td>
                  <div>
                    <p className="font-medium text-foreground">{movement.productName}</p>
                    <p className="text-xs text-text-soft">{movement.note}</p>
                  </div>
                </Td>
                <Td>
                  <Badge variant={getMovementVariant(movement.type)}>
                    {getMovementLabel(movement.type)}
                  </Badge>
                </Td>
                <Td>{formatNumber(movement.quantity)}</Td>
                <Td>{formatNumber(movement.stockAfter)} un.</Td>
                <Td>{formatDateTime(movement.date)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </TableShell>
  );
}
