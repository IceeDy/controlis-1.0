export type UserRole = "admin" | "manager" | "operator";

export interface ApiUser {
  id: string;
  tenant_id: string;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface User {
  id: string;
  companyId: string;
  tenantId: string;
  name: string;
  email: string;
  role: UserRole;
  avatarFallback: string;
  isActive: boolean;
  createdAt: string;
}