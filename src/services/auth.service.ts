import { api, clearStoredToken, getApiErrorMessage, setStoredToken } from "@/lib/api";
import { settingsService } from "@/services/settings.service";
import type { ApiLoginResponse, AuthSession, AuthenticatedUserResponse, LoginPayload } from "@/types/auth";
import type { ApiUser, User } from "@/types/user";

function getAvatarFallback(name: string) {
  return name
    .split(" ")
    .map((part) => part[0]?.toUpperCase())
    .filter(Boolean)
    .slice(0, 2)
    .join("");
}

function mapUser(user: ApiUser): User {
  return {
    id: user.id,
    companyId: user.tenant_id,
    tenantId: user.tenant_id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarFallback: getAvatarFallback(user.name),
    isActive: user.is_active,
    createdAt: user.created_at,
  };
}

async function buildSession(token: string): Promise<AuthSession> {
  setStoredToken(token);

  try {
    const response = await api.get<AuthenticatedUserResponse>("/auth/me");
    const user = mapUser(response.data.user);
    const company = await settingsService.getCompany(user.tenantId);

    return {
      token,
      user,
      company,
    };
  } catch (error) {
    clearStoredToken();
    throw new Error(getApiErrorMessage(error, "Não foi possível carregar a sessão autenticada."));
  }
}

export const authService = {
  async login(payload: LoginPayload): Promise<AuthSession> {
    try {
      const response = await api.post<ApiLoginResponse>("/auth/login", payload);
      return await buildSession(response.data.access_token);
    } catch (error) {
      clearStoredToken();
      throw new Error(getApiErrorMessage(error, "Não foi possível autenticar."));
    }
  },

  async restoreSession(token: string): Promise<AuthSession> {
    return buildSession(token);
  },
};