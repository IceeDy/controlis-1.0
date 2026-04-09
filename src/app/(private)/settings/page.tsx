"use client";

import { useEffect, useState } from "react";
import { Building2, Layers3 } from "lucide-react";
import { ProtectedShell } from "@/components/layout/protected-shell";
import { CompanySettingsForm } from "@/components/settings/company-settings-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { StatusBanner } from "@/components/ui/status-banner";
import { settingsService } from "@/services/settings.service";
import { useAuthStore } from "@/store/auth-store";
import type { Company } from "@/types/company";

export default function SettingsPage() {
  const authCompany = useAuthStore((state) => state.company);
  const companyId = authCompany?.id;
  const [company, setCompany] = useState<Company | null>(authCompany);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) {
      return;
    }

    async function loadCompany() {
      const tenantId = companyId;

      if (!tenantId) {
        return;
      }

      try {
        setLoading(true);
        setErrorMessage(null);
        const data = await settingsService.getCompany(tenantId);
        setCompany(data);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Não foi possível carregar as configurações.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadCompany();
  }, [companyId]);

  return (
    <ProtectedShell
      title="Configurações"
      subtitle="Atualize os dados da empresa e mantenha as preferências visuais alinhadas com a operação."
    >
      {errorMessage ? <StatusBanner message={errorMessage} variant="error" /> : null}
      {loading || !company ? (
        <Card className="h-[360px] animate-pulse bg-surface-strong" />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold tracking-[0.2em] text-text-soft uppercase">
                  Empresa
                </p>
                <h2 className="mt-3 text-xl font-semibold text-foreground">Dados institucionais</h2>
                <p className="mt-2 text-sm text-text-soft">
                  Esses dados serão a base para personalização por tenant e futuras integrações externas.
                </p>
              </div>
              <Badge variant="success">Tenant ativo</Badge>
            </div>
            <div className="mt-6">
              <CompanySettingsForm company={company} />
            </div>
          </Card>

          <div className="space-y-5">
            <Card>
              <div className="flex items-start gap-4">
                <div className="rounded-3xl bg-primary-soft p-3 text-primary">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Identidade operacional</h3>
                  <p className="mt-2 text-sm leading-6 text-text-soft">
                    Nome fantasia, segmento e contato permanecem associados ao tenant autenticado para isolar dados e preferências.
                  </p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-start gap-4">
                <div className="rounded-3xl bg-secondary-soft p-3 text-secondary">
                  <Layers3 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Pronto para escalar</h3>
                  <p className="mt-2 text-sm leading-6 text-text-soft">
                    Os dados da empresa agora são carregados e salvos pela API real do Controlis sem reescrever a interface.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </ProtectedShell>
  );
}
