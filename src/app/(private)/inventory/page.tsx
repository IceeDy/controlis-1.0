"use client";

import { useEffect, useState } from "react";
import { Boxes, Plus } from "lucide-react";
import { MovementFormModal } from "@/components/inventory/movement-form-modal";
import { MovementHistory } from "@/components/inventory/movement-history";
import { ProtectedShell } from "@/components/layout/protected-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { StatusBanner } from "@/components/ui/status-banner";
import { Table, TableShell, Td, Th } from "@/components/ui/table";
import { inventoryService } from "@/services/inventory.service";
import { useAuthStore } from "@/store/auth-store";
import type { InventoryMovement, InventoryMovementType } from "@/types/inventory";
import type { Product } from "@/types/product";

export default function InventoryPage() {
  const companyId = useAuthStore((state) => state.company?.id);
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [productFilter, setProductFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<InventoryMovementType | "">("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (!companyId) {
      return;
    }

    async function loadSnapshot() {
      const tenantId = companyId;

      if (!tenantId) {
        return;
      }

      try {
        setLoading(true);
        const snapshot = await inventoryService.getSnapshot(tenantId, {
          productId: productFilter,
          type: typeFilter,
        });
        setProducts(snapshot.products);
        setMovements(snapshot.movements);
      } catch (error) {
        setFeedback({
          type: "error",
          message: error instanceof Error ? error.message : "Não foi possível carregar o estoque.",
        });
      } finally {
        setLoading(false);
      }
    }

    void loadSnapshot();
  }, [companyId, productFilter, typeFilter]);

  async function refreshWithMessage(message: string) {
    const tenantId = companyId;

    if (!tenantId) {
      return;
    }

    const snapshot = await inventoryService.getSnapshot(tenantId, {
      productId: productFilter,
      type: typeFilter,
    });
    setProducts(snapshot.products);
    setMovements(snapshot.movements);
    setFeedback({ type: "success", message });
  }

  const lowStockCount = products.filter((product) => product.stockCurrent <= product.minStock).length;
  const totalUnits = products.reduce((sum, product) => sum + product.stockCurrent, 0);

  return (
    <ProtectedShell
      title="Estoque"
      subtitle="Acompanhe saldos atuais, ajuste entradas manuais e mantenha o histórico operacional auditável."
    >
      <div className="space-y-5">
        <div className="grid gap-5 md:grid-cols-3">
          <Card>
            <p className="text-sm text-text-soft">Itens monitorados</p>
            <p className="mt-3 text-3xl font-bold text-foreground">{products.length}</p>
          </Card>
          <Card>
            <p className="text-sm text-text-soft">Unidades em estoque</p>
            <p className="mt-3 text-3xl font-bold text-foreground">{totalUnits}</p>
          </Card>
          <Card>
            <p className="text-sm text-text-soft">Estoque crítico</p>
            <p className="mt-3 text-3xl font-bold text-danger">{lowStockCount}</p>
          </Card>
        </div>

        <Card className="space-y-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-foreground">Saldo e movimentações</h2>
                <Badge>{movements.length} registros</Badge>
              </div>
              <p className="mt-2 text-sm text-text-soft">
                Registre entradas e ajustes manuais sem misturar dados entre empresas.
              </p>
            </div>
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setFormOpen(true)} type="button">
              Movimentar estoque
            </Button>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Select value={productFilter} onChange={(event) => setProductFilter(event.target.value)}>
              <option value="">Todos os produtos</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </Select>
            <Select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as InventoryMovementType | "")}
            >
              <option value="">Todos os tipos</option>
              <option value="entrada">Entrada</option>
              <option value="ajuste">Ajuste</option>
              <option value="saida">Saída por venda</option>
            </Select>
          </div>
          {feedback ? <StatusBanner message={feedback.message} variant={feedback.type} /> : null}
        </Card>

        {loading ? (
          <Card className="h-[420px] animate-pulse bg-surface-strong" />
        ) : (
          <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
            <TableShell>
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Posição de estoque</h3>
                  <p className="text-sm text-text-soft">Saldo atual por item cadastrado.</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <thead className="bg-surface-strong">
                    <tr>
                      <Th>Produto</Th>
                      <Th>Categoria</Th>
                      <Th>Saldo</Th>
                      <Th>Mínimo</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {products.map((product) => (
                      <tr key={product.id}>
                        <Td>
                          <div>
                            <p className="font-medium text-foreground">{product.name}</p>
                            <p className="text-xs text-text-soft">{product.sku}</p>
                          </div>
                        </Td>
                        <Td>{product.category}</Td>
                        <Td>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-foreground">{product.stockCurrent} un.</span>
                            {product.stockCurrent <= product.minStock ? (
                              <Badge variant="warning">Crítico</Badge>
                            ) : (
                              <Badge variant="success">Saudável</Badge>
                            )}
                          </div>
                        </Td>
                        <Td>{product.minStock} un.</Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </TableShell>

            {movements.length === 0 ? (
              <EmptyState
                description="Nenhuma movimentação atende aos filtros atuais. Registre entradas ou ajustes para começar o histórico operacional."
                icon={Boxes}
                title="Sem movimentações encontradas"
              />
            ) : (
              <MovementHistory movements={movements} />
            )}
          </div>
        )}
      </div>

      {formOpen ? (
        <MovementFormModal
          onClose={() => setFormOpen(false)}
          onSaved={refreshWithMessage}
          open={formOpen}
          products={products}
          tenantId={companyId}
        />
      ) : null}
    </ProtectedShell>
  );
}
