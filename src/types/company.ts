export type PreferredTheme = "light" | "dark";

export interface Company {
  id: string;
  name: string;
  tradingName: string;
  segment: string;
  email: string;
  phone: string;
  tenantCode: string;
  preferredTheme: PreferredTheme;
  compactDashboard: boolean;
  createdAt: string;
}
