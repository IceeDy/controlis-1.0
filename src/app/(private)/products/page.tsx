"use client";

import { useEffect, useState } from "react";
import { PackageSearch, Plus } from "lucide-react";
import { ProtectedShell } from "@/components/layout/protected-shell";
import { ProductFormModal } from "@/components/products/product-form-modal";
import { ProductsTable } from "@/components/products/products-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { StatusBanner } from "@/components/ui/status-banner";
import { productCategories } from "@/lib/constants";
import { productService } from "@/services/products.service";
import { useAuthStore } from "@/store/auth-store";
import type { Product } from "@/types/product";

export default function ProductsPage() {
  const companyId = useAuthStore((state) => state.company?.id);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todas");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (!companyId) {
      return;
    }

    async function loadProducts() {
      const tenantId = companyId;

      if (!tenantId) {
        return;
      }

      try {
        setLoading(true);
        const data = await productService.list(tenantId, {
          search,
          category,
        });
        setProducts(data);
      } catch (error) {
        setFeedback({
          type: "error",
          message: error instanceof Error ? error.message : "Não foi possível carregar os produtos.",
        });
      } finally {
        setLoading(false);
      }
    }

    void loadProducts();
  }, [category, companyId, search]);

  async function refreshWithMessage(message: string) {
    const tenantId = companyId;

    if (!tenantId) {
      return;
    }

    const data = await productService.list(tenantId, { search, category });
    setProducts(data);
    setFeedback({ type: "success", message });
  }

  async function confirmDelete() {
    const tenantId = companyId;

    if (!tenantId || !deleteTarget) {
      return;
    }

    try {
      await productService.remove(tenantId, deleteTarget.id);
      await refreshWithMessage("Produto excluído com sucesso.");
      setDeleteTarget(null);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Não foi possível excluir o produto.",
      });
    }
  }

  return (
    <ProtectedShell
      title="Produtos"
      subtitle="Catálogo centralizado com busca rápida, categorias e gestão completa do cadastro."
    >
      <div className="space-y-5">
        <Card className="space-y-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-foreground">Catálogo de produtos</h2>
                <Badge>{products.length} itens</Badge>
              </div>
              <p className="mt-2 text-sm text-text-soft">
                Gerencie preços, custos e posição de estoque com estrutura pronta para backend FastAPI.
              </p>
            </div>
            <Button
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => {
                setSelectedProduct(null);
                setFormOpen(true);
              }}
              type="button"
            >
              Novo produto
            </Button>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
            <Input
              placeholder="Buscar por nome do produto"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="Todas">Todas as categorias</option>
              {productCategories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </div>
          {feedback ? <StatusBanner message={feedback.message} variant={feedback.type} /> : null}
        </Card>

        {loading ? (
          <Card className="h-[380px] animate-pulse bg-surface-strong" />
        ) : products.length === 0 ? (
          <EmptyState
            action={
              <Button
                onClick={() => {
                  setSelectedProduct(null);
                  setFormOpen(true);
                }}
                type="button"
              >
                Cadastrar primeiro produto
              </Button>
            }
            description="Nenhum produto corresponde aos filtros atuais. Cadastre um novo item para começar a estruturar o catálogo."
            icon={PackageSearch}
            title="Sem produtos encontrados"
          />
        ) : (
          <ProductsTable
            onDelete={(product) => setDeleteTarget(product)}
            onEdit={(product) => {
              setSelectedProduct(product);
              setFormOpen(true);
            }}
            products={products}
          />
        )}
      </div>

      {formOpen ? (
        <ProductFormModal
          onClose={() => setFormOpen(false)}
          onSaved={refreshWithMessage}
          open={formOpen}
          product={selectedProduct}
          tenantId={companyId}
        />
      ) : null}

      <Modal
        description="Essa ação envia a exclusão para a API real do tenant autenticado."
        onClose={() => setDeleteTarget(null)}
        open={Boolean(deleteTarget)}
        size="md"
        title="Excluir produto"
      >
        <div className="space-y-5">
          <p className="text-sm leading-6 text-text-soft">
            Deseja realmente excluir <strong className="text-foreground">{deleteTarget?.name}</strong>?
          </p>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button onClick={() => setDeleteTarget(null)} type="button" variant="ghost">
              Cancelar
            </Button>
            <Button onClick={() => void confirmDelete()} type="button" variant="danger">
              Confirmar exclusão
            </Button>
          </div>
        </div>
      </Modal>
    </ProtectedShell>
  );
}
