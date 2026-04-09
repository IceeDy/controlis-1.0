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
import { productCategories } from "@/lib/constants";
import {
  productSchema,
  type ProductSchema,
  type ProductSchemaInput,
} from "@/schemas/product-schema";
import { productService } from "@/services/products.service";
import type { Product } from "@/types/product";

interface ProductFormModalProps {
  open: boolean;
  tenantId?: string;
  product?: Product | null;
  onClose: () => void;
  onSaved: (message: string) => Promise<void> | void;
}

const defaultValues: ProductSchemaInput = {
  name: "",
  category: "",
  salePrice: 0,
  costPrice: 0,
  stockCurrent: 0,
};

export function ProductFormModal({
  open,
  tenantId,
  product,
  onClose,
  onSaved,
}: ProductFormModalProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<ProductSchemaInput, unknown, ProductSchema>({
    resolver: zodResolver(productSchema),
    defaultValues,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset(
      product
        ? {
            name: product.name,
            category: product.category,
            salePrice: product.salePrice,
            costPrice: product.costPrice,
            stockCurrent: product.stockCurrent,
          }
        : defaultValues,
    );
  }, [form, open, product]);

  async function onSubmit(values: ProductSchema) {
    if (!tenantId) {
      return;
    }

    try {
      setSubmitError(null);

      if (product) {
        await productService.update(tenantId, product.id, values);
        await onSaved("Produto atualizado com sucesso.");
      } else {
        await productService.create(tenantId, values);
        await onSaved("Produto criado com sucesso.");
      }

      onClose();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Não foi possível salvar o produto.",
      );
    }
  }

  return (
    <Modal
      description="Cadastre ou atualize produtos mantendo a estrutura pronta para integração com API real."
      onClose={onClose}
      open={open}
      title={product ? "Editar produto" : "Novo produto"}
    >
      <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
        {submitError ? <StatusBanner message={submitError} variant="error" /> : null}
        <div className="grid gap-5 md:grid-cols-2">
          <FormField error={form.formState.errors.name?.message} label="Nome do produto">
            <Input placeholder="Ex.: Café torrado 500g" {...form.register("name")} />
          </FormField>
          <FormField error={form.formState.errors.category?.message} label="Categoria">
            <Select {...form.register("category")}>
              <option value="">Selecione</option>
              {productCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField error={form.formState.errors.salePrice?.message} label="Preço de venda">
            <Input min="0" step="0.01" type="number" {...form.register("salePrice")} />
          </FormField>
          <FormField error={form.formState.errors.costPrice?.message} label="Custo">
            <Input min="0" step="0.01" type="number" {...form.register("costPrice")} />
          </FormField>
          <FormField
            error={form.formState.errors.stockCurrent?.message}
            label="Estoque atual"
          >
            <Input min="0" step="1" type="number" {...form.register("stockCurrent")} />
          </FormField>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
          <Button onClick={onClose} type="button" variant="ghost">
            Cancelar
          </Button>
          <Button loading={form.formState.isSubmitting} type="submit">
            {product ? "Salvar alterações" : "Cadastrar produto"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
