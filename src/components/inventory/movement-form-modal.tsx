"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { StatusBanner } from "@/components/ui/status-banner";
import { Textarea } from "@/components/ui/textarea";
import {
  inventoryMovementSchema,
  type InventoryMovementSchema,
  type InventoryMovementSchemaInput,
} from "@/schemas/inventory-schema";
import { inventoryService } from "@/services/inventory.service";
import type { Product } from "@/types/product";

interface MovementFormModalProps {
  open: boolean;
  tenantId?: string;
  products: Product[];
  onClose: () => void;
  onSaved: (message: string) => Promise<void> | void;
}

const defaultValues: InventoryMovementSchemaInput = {
  productId: "",
  type: "entrada",
  quantity: 1,
  note: "",
  date: new Date().toISOString().slice(0, 16),
};

export function MovementFormModal({
  open,
  tenantId,
  products,
  onClose,
  onSaved,
}: MovementFormModalProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<InventoryMovementSchemaInput, unknown, InventoryMovementSchema>({
    resolver: zodResolver(inventoryMovementSchema),
    defaultValues,
  });

  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
    }
  }, [form, open]);

  async function onSubmit(values: InventoryMovementSchema) {
    if (!tenantId) {
      return;
    }

    try {
      setSubmitError(null);
      await inventoryService.createMovement(tenantId, values);
      await onSaved("Movimentação registrada com sucesso.");
      onClose();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Não foi possível registrar a movimentação.",
      );
    }
  }

  return (
    <Modal
      description="Registre entradas e ajustes manuais mantendo o histórico organizado por empresa."
      onClose={onClose}
      open={open}
      title="Movimentar estoque"
    >
      <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
        {submitError ? <StatusBanner message={submitError} variant="error" /> : null}
        <div className="grid gap-5 md:grid-cols-2">
          <FormField error={form.formState.errors.productId?.message} label="Produto">
            <Select {...form.register("productId")}>
              <option value="">Selecione</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField error={form.formState.errors.type?.message} label="Tipo">
            <Select {...form.register("type")}>
              <option value="entrada">Entrada</option>
              <option value="ajuste">Ajuste manual</option>
            </Select>
          </FormField>
          <FormField error={form.formState.errors.quantity?.message} label="Quantidade">
            <Input min="1" step="1" type="number" {...form.register("quantity")} />
          </FormField>
          <FormField error={form.formState.errors.date?.message} label="Data">
            <Input type="datetime-local" {...form.register("date")} />
          </FormField>
        </div>
        <FormField error={form.formState.errors.note?.message} label="Observação">
          <Textarea placeholder="Descreva o motivo da movimentação" {...form.register("note")} />
        </FormField>
        <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
          <Button onClick={onClose} type="button" variant="ghost">
            Cancelar
          </Button>
          <Button loading={form.formState.isSubmitting} type="submit">
            Registrar movimentação
          </Button>
        </div>
      </form>
    </Modal>
  );
}
