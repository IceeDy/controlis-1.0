import { api, getApiErrorMessage } from "@/lib/api";
import type { Company } from "@/types/company";
import type { ApiCompanySettingsResponse, CompanySettingsPayload } from "@/types/settings";

const COMPANY_PREFERENCES_STORAGE_KEY = "controlis-company-preferences";

function getStoredPreferences() {
  if (typeof window === "undefined") {
    return {} as Record<string, { compactDashboard: boolean }>;
  }

  const rawValue = window.localStorage.getItem(COMPANY_PREFERENCES_STORAGE_KEY);

  if (!rawValue) {
    return {} as Record<string, { compactDashboard: boolean }>;
  }

  try {
    return JSON.parse(rawValue) as Record<string, { compactDashboard: boolean }>;
  } catch {
    return {} as Record<string, { compactDashboard: boolean }>;
  }
}

function readCompactDashboardPreference(tenantId: string) {
  return getStoredPreferences()[tenantId]?.compactDashboard ?? false;
}

function writeCompactDashboardPreference(tenantId: string, compactDashboard: boolean) {
  if (typeof window === "undefined") {
    return;
  }

  const preferences = getStoredPreferences();
  preferences[tenantId] = { compactDashboard };
  window.localStorage.setItem(COMPANY_PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
}

function buildTenantCode(tenantId: string) {
  return tenantId.slice(0, 8).toUpperCase();
}

function mapCompany(response: ApiCompanySettingsResponse, compactDashboard?: boolean): Company {
  return {
    id: response.tenant_id,
    name: response.company_name,
    tradingName: response.company_name,
    segment: response.segment,
    email: response.email,
    phone: response.phone,
    tenantCode: buildTenantCode(response.tenant_id),
    preferredTheme: response.theme_preference,
    compactDashboard: compactDashboard ?? readCompactDashboardPreference(response.tenant_id),
    createdAt: response.created_at,
  };
}

export const settingsService = {
  async getCompany(tenantId: string): Promise<Company> {
    void tenantId;

    try {
      const response = await api.get<ApiCompanySettingsResponse>("/settings/company");
      return mapCompany(response.data);
    } catch (error) {
      throw new Error(getApiErrorMessage(error, "Não foi possível carregar as configurações da empresa."));
    }
  },

  async updateCompany(tenantId: string, payload: CompanySettingsPayload): Promise<Company> {
    void tenantId;

    try {
      const response = await api.put<ApiCompanySettingsResponse>("/settings/company", {
        company_name: payload.name,
        segment: payload.segment,
        email: payload.email,
        phone: payload.phone,
        theme_preference: payload.preferredTheme,
      });

      writeCompactDashboardPreference(response.data.tenant_id, payload.compactDashboard);
      return mapCompany(response.data, payload.compactDashboard);
    } catch (error) {
      throw new Error(getApiErrorMessage(error, "Não foi possível atualizar as configurações da empresa."));
    }
  },
};