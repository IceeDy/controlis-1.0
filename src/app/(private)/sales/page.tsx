"use client";

import { useEffect, useState } from "react";
import { Plus, ReceiptText } from "lucide-react";
import { ProtectedShell } from "@/components/layout/protected-shell";
import { SaleFormModal } from "@/components/sales/sale-form-modal";
import { SalesTable } from "@/components/sales/sales-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { StatusBanner } from "@/components/ui/status-banner";
import { formatCurrency } from "@/lib/format";
import { productService } from "@/services/products.service";
import { salesService } from "@/services/sales.service";
import { useAuthStore } from "@/store/auth-store";
import type { Product } from "@/types/product";
import type { Sale } from "@/types/sale";

export default function SalesPage() {
  const companyId = useAuthStore((state) => state.company?.id);
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (!companyId) {
      return;
    }

    async function loadData() {
      const tenantId = companyId;

      if (!tenantId) {
        return;
      }

      try {
        setLoading(true);
        const [salesData, productsData] = await Promise.all([
          salesService.list(tenantId, { startDate, endDate }),
          productService.list(tenantId),
        ]);
        setSales(salesData);
        setProducts(productsData);
      } catch (error) {
        setFeedback({
          type: "error",
          message: error instanceof Error ? error.message : "Não foi possível carregar as vendas.",
        });
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, [companyId, endDate, startDate]);

  async function refreshWithMessage(message: string) {
    const tenantId = companyId;

    if (!tenantId) {
      return;
    }

    const [salesData, productsData] = await Promise.all([
      salesService.list(tenantId, { startDate, endDate }),
      productService.list(tenantId),
    ]);
    setSales(salesData);
    setProducts(productsData);
    setFeedback({ type: "success", message });
  }

  const totalValue = sales.reduce((sum, sale) => sum + sale.total, 0);

  return (
    <ProtectedShell
      title="Vendas"
      subtitle="Registre novas vendas, acompanhe o histórico e monitore o valor transacionado por período."
    >
      <div className="space-y-5">
        <div className="grid gap-5 md:grid-cols-3">
          <Card>
            <p className="text-sm text-text-soft">Vendas filtradas</p>
            <p className="mt-3 text-3xl font-bold text-foreground">{sales.length}</p>
          </Card>
          <Card>
            <p className="text-sm text-text-soft">Valor total</p>
            <p className="mt-3 text-3xl font-bold text-foreground">{formatCurrency(totalValue)}</p>
          </Card>
          <Card>
            <p className="text-sm text-text-soft">Ticket médio</p>
            <p className="mt-3 text-3xl font-bold text-foreground">
              {formatCurrency(sales.length > 0 ? totalValue / sales.length : 0)}
            </p>
          </Card>
        </div>

        <Card className="space-y-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-foreground">Histórico de vendas</h2>
                <Badge>{sales.length} registros</Badge>
              </div>
              <p className="mt-2 text-sm text-text-soft">
                Visualize as vendas realizadas e registre novos lançamentos com baixa automática de estoque.
              </p>
            </div>
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setFormOpen(true)} type="button">
              Nova venda
            </Button>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
          </div>
          {feedback ? <StatusBanner message={feedback.message} variant={feedback.type} /> : null}
        </Card>

        {loading ? (
          <Card className="h-[360px] animate-pulse bg-surface-strong" />
        ) : sales.length === 0 ? (
          <EmptyState
            action={
              <Button onClick={() => setFormOpen(true)} type="button">
                Registrar primeira venda
              </Button>
            }
            description="Ainda não há vendas no período selecionado. Cadastre uma nova venda para iniciar o histórico comercial."
            icon={ReceiptText}
            title="Nenhuma venda encontrada"
          />
        ) : (
          <SalesTable sales={sales} />
        )}
      </div>

      {formOpen ? (
        <SaleFormModal
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
