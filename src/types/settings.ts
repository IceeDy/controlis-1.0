export interface CompanySettingsPayload {
  name: string;
  segment: string;
  email: string;
  phone: string;
  preferredTheme: "light" | "dark";
  compactDashboard: boolean;
}

export interface ApiCompanySettingsResponse {
  id: string;
  tenant_id: string;
  company_name: string;
  segment: string;
  email: string;
  phone: string;
  theme_preference: "light" | "dark";
  created_at: string;
  updated_at: string;
}
