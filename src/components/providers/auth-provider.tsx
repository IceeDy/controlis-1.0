"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AUTH_UNAUTHORIZED_EVENT } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { useThemeStore } from "@/store/theme-store";

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const companyTheme = useAuthStore((state) => state.company?.preferredTheme);
  const logout = useAuthStore((state) => state.logout);
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const storageReady = useAuthStore((state) => state.storageReady);
  const setTheme = useThemeStore((state) => state.setTheme);

  useEffect(() => {
    if (!storageReady) {
      return;
    }

    void restoreSession();
  }, [restoreSession, storageReady]);

  useEffect(() => {
    if (!companyTheme) {
      return;
    }

    setTheme(companyTheme);
  }, [companyTheme, setTheme]);

  useEffect(() => {
    function handleUnauthorized() {
      logout();

      if (pathname !== "/login") {
        router.replace("/login");
      }
    }

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);

    return () => {
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    };
  }, [logout, pathname, router]);

  return children;
}