import type { Company } from "@/types/company";
import type { ApiUser, User } from "@/types/user";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ApiLoginResponse {
  access_token: string;
  token_type: "bearer";
}

export interface AuthenticatedUserResponse {
  user: ApiUser;
}

export interface AuthSession {
  token: string;
  user: User;
  company: Company;
}
