"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { StatusBanner } from "@/components/ui/status-banner";
import { formatCurrency } from "@/lib/format";
import {
  saleSchema,
  type SaleSchema,
  type SaleSchemaInput,
} from "@/schemas/sale-schema";
import { salesService } from "@/services/sales.service";
import type { Product } from "@/types/product";

interface SaleFormModalProps {
  open: boolean;
  tenantId?: string;
  products: Product[];
  onClose: () => void;
  onSaved: (message: string) => Promise<void> | void;
}

const defaultValues: SaleSchemaInput = {
  date: new Date().toISOString().slice(0, 16),
  items: [{ productId: "", quantity: 1 }],
};

export function SaleFormModal({
  open,
  tenantId,
  products,
  onClose,
  onSaved,
}: SaleFormModalProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const productMap = new Map(products.map((product) => [product.id, product]));

  const form = useForm<SaleSchemaInput, unknown, SaleSchema>({
    resolver: zodResolver(saleSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedItems = useWatch({
    control: form.control,
    name: "items",
  }) ?? [];
  const total = watchedItems.reduce((sum, item) => {
    const product = productMap.get(item.productId);
    return sum + (product?.salePrice ?? 0) * (Number(item.quantity) || 0);
  }, 0);

  async function onSubmit(values: SaleSchema) {
    if (!tenantId) {
      return;
    }

    try {
      setSubmitError(null);
      await salesService.create(tenantId, values);
      await onSaved("Venda registrada com sucesso.");
      form.reset(defaultValues);
      onClose();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Não foi possível registrar a venda.",
      );
    }
  }

  return (
    <Modal
      description="Monte a venda com múltiplos itens e cálculo automático de subtotais e total geral."
      onClose={onClose}
      open={open}
      size="xl"
      title="Nova venda"
    >
      <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
        {submitError ? <StatusBanner message={submitError} variant="error" /> : null}

        <FormField error={form.formState.errors.date?.message} label="Data da venda">
          <Input type="datetime-local" {...form.register("date")} />
        </FormField>

        <div className="space-y-4 rounded-[28px] border border-border bg-surface px-4 py-4 sm:px-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-foreground">Itens da venda</h3>
              <p className="text-sm text-text-soft">Selecione produtos e quantidades para compor o pedido.</p>
            </div>
            <Button
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => append({ productId: "", quantity: 1 })}
              type="button"
              variant="ghost"
            >
              Adicionar item
            </Button>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => {
              const selectedProduct = productMap.get(watchedItems[index]?.productId);
              const quantity = Number(watchedItems[index]?.quantity) || 0;
              const subtotal = (selectedProduct?.salePrice ?? 0) * quantity;

              return (
                <div key={field.id} className="grid gap-4 rounded-[24px] border border-border bg-surface-strong px-4 py-4 md:grid-cols-[1.2fr_160px_160px_auto] md:items-end">
                  <FormField
                    error={form.formState.errors.items?.[index]?.productId?.message}
                    label={`Produto ${index + 1}`}
                  >
                    <Select {...form.register(`items.${index}.productId`)}>
                      <option value="">Selecione</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                  <FormField
                    error={form.formState.errors.items?.[index]?.quantity?.message}
                    label="Quantidade"
                  >
                    <Input min="1" step="1" type="number" {...form.register(`items.${index}.quantity`)} />
                  </FormField>
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-foreground">Subtotal</span>
                    <div className="flex h-12 items-center rounded-2xl border border-border bg-surface px-4 text-sm font-semibold text-foreground">
                      {formatCurrency(subtotal)}
                    </div>
                  </div>
                  <Button
                    className="md:mb-0.5"
                    leftIcon={<Trash2 className="h-4 w-4" />}
                    onClick={() => remove(index)}
                    type="button"
                    variant="ghost"
                    disabled={fields.length === 1}
                  >
                    Remover
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-[28px] border border-border bg-primary px-5 py-5 text-text-inverse shadow-[0_20px_40px_rgba(18,62,114,0.28)]">
          <p className="text-sm text-white/75">Resumo final da venda</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-3xl font-bold">{formatCurrency(total)}</p>
              <p className="text-sm text-white/75">Total calculado automaticamente</p>
            </div>
            <p className="text-sm text-white/75">
              {watchedItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)} unidades no pedido
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
          <Button onClick={onClose} type="button" variant="ghost">
            Cancelar
          </Button>
          <Button loading={form.formState.isSubmitting} type="submit">
            Finalizar venda
          </Button>
        </div>
      </form>
    </Modal>
  );
}
