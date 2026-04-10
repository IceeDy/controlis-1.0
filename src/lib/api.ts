import axios, { AxiosError } from "axios";

const DEFAULT_API_URL = "http://localhost:8000";
const API_PREFIX = "/api/v1";
const ACCESS_TOKEN_STORAGE_KEY = "controlis-access-token";
export const AUTH_UNAUTHORIZED_EVENT = "controlis:unauthorized";

function normalizeApiBaseUrl(rawBaseUrl: string) {
  const trimmedBaseUrl = rawBaseUrl.trim().replace(/\/+$/, "");

  if (trimmedBaseUrl.endsWith(API_PREFIX)) {
    return trimmedBaseUrl;
  }

  return `${trimmedBaseUrl}${API_PREFIX}`;
}

function isBrowser() {
  return typeof window !== "undefined";
}

function decodeBase64Url(value: string) {
  if (!isBrowser() || typeof window.atob !== "function") {
    return null;
  }

  const normalizedValue = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalizedValue.length % 4;
  const paddedValue = padding === 0 ? normalizedValue : normalizedValue.padEnd(normalizedValue.length + (4 - padding), "=");

  try {
    return window.atob(paddedValue);
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string) {
  const [, payload] = token.split(".");

  if (!payload) {
    return true;
  }

  const decodedPayload = decodeBase64Url(payload);

  if (!decodedPayload) {
    return true;
  }

  try {
    const parsedPayload = JSON.parse(decodedPayload) as { exp?: number };

    if (typeof parsedPayload.exp !== "number") {
      return false;
    }

    return parsedPayload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

export function getStoredToken() {
  if (!isBrowser()) {
    return null;
  }

  return window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
}

export function setStoredToken(token: string) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
}

export function clearStoredToken() {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
}

function emitUnauthorizedEvent() {
  if (!isBrowser()) {
    return;
  }

  window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT));
}

function isFastApiValidationDetail(detail: unknown): detail is Array<{ msg?: string }> {
  return Array.isArray(detail);
}

function readDetailMessage(detail: unknown): string | null {
  if (typeof detail === "string" && detail.trim().length > 0) {
    return detail;
  }

  if (isFastApiValidationDetail(detail)) {
    const messages = detail
      .map((item) => item?.msg)
      .filter((message): message is string => Boolean(message));

    if (messages.length > 0) {
      return messages.join(" ");
    }
  }

  if (
    detail !== null &&
    typeof detail === "object" &&
    "detail" in detail &&
    typeof (detail as { detail?: unknown }).detail === "string"
  ) {
    return (detail as { detail: string }).detail;
  }

  return null;
}

export function getApiErrorMessage(error: unknown, fallbackMessage: string) {
  if (axios.isAxiosError(error)) {
    const responseMessage = readDetailMessage(error.response?.data?.detail);

    if (responseMessage) {
      return responseMessage;
    }

    if (error.code === AxiosError.ERR_NETWORK) {
      return "Não foi possível conectar ao backend. Verifique se a API está disponível.";
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallbackMessage;
}

export const api = axios.create({
  baseURL: normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL),
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const requestUrl = error.config?.url ?? "";
    const isLoginRequest = requestUrl.includes("/auth/login");

    if (error.response?.status === 401 && !isLoginRequest) {
      clearStoredToken();
      emitUnauthorizedEvent();
    }

    return Promise.reject(error);
  },
);