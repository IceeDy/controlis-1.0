"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusBanner } from "@/components/ui/status-banner";
import { settingsSchema, type SettingsSchema } from "@/schemas/settings-schema";
import { settingsService } from "@/services/settings.service";
import { useAuthStore } from "@/store/auth-store";
import { useThemeStore } from "@/store/theme-store";
import type { Company } from "@/types/company";

interface CompanySettingsFormProps {
  company: Company;
}

export function CompanySettingsForm({ company }: CompanySettingsFormProps) {
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const updateCompany = useAuthStore((state) => state.updateCompany);
  const setTheme = useThemeStore((state) => state.setTheme);

  const form = useForm<SettingsSchema>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: company.name,
      segment: company.segment,
      email: company.email,
      phone: company.phone,
      preferredTheme: company.preferredTheme,
      compactDashboard: company.compactDashboard,
    },
  });

  useEffect(() => {
    form.reset({
      name: company.name,
      segment: company.segment,
      email: company.email,
      phone: company.phone,
      preferredTheme: company.preferredTheme,
      compactDashboard: company.compactDashboard,
    });
  }, [company, form]);

  async function onSubmit(values: SettingsSchema) {
    try {
      const nextCompany = await settingsService.updateCompany(company.id, values);
      updateCompany(nextCompany);
      setTheme(nextCompany.preferredTheme);
      setFeedback({ type: "success", message: "Dados da empresa atualizados com sucesso." });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Não foi possível atualizar as configurações.",
      });
    }
  }

  return (
    <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
      {feedback ? <StatusBanner message={feedback.message} variant={feedback.type} /> : null}
      <div className="grid gap-5 md:grid-cols-2">
        <FormField error={form.formState.errors.name?.message} label="Nome da empresa">
          <Input {...form.register("name")} />
        </FormField>
        <FormField error={form.formState.errors.segment?.message} label="Segmento">
          <Input {...form.register("segment")} />
        </FormField>
        <FormField error={form.formState.errors.email?.message} label="Email">
          <Input {...form.register("email")} />
        </FormField>
        <FormField error={form.formState.errors.phone?.message} label="Telefone">
          <Input {...form.register("phone")} />
        </FormField>
        <FormField error={form.formState.errors.preferredTheme?.message} label="Tema preferido">
          <Select {...form.register("preferredTheme")}>
            <option value="light">Claro</option>
            <option value="dark">Escuro</option>
          </Select>
        </FormField>
        <div className="rounded-[24px] border border-border bg-surface-strong px-4 py-4">
          <p className="text-sm font-medium text-foreground">Preferências visuais</p>
          <label className="mt-4 flex items-center gap-3 text-sm text-text-soft">
            <input className="h-4 w-4 rounded border-border" type="checkbox" {...form.register("compactDashboard")} />
            Usar dashboard em modo compacto
          </label>
        </div>
      </div>
      <div className="flex justify-end border-t border-border pt-5">
        <Button loading={form.formState.isSubmitting} type="submit">
          Atualizar dados
        </Button>
      </div>
    </form>
  );
}
