import { create } from "zustand";
import { persist } from "zustand/middleware";
import { clearStoredToken, getStoredToken, setStoredToken } from "@/lib/api";
import { authService } from "@/services/auth.service";
import type { AuthSession, LoginPayload } from "@/types/auth";
import type { Company } from "@/types/company";

interface AuthState {
  token: string | null;
  user: AuthSession["user"] | null;
  company: Company | null;
  hydrated: boolean;
  storageReady: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  setSession: (session: AuthSession) => void;
  login: (payload: LoginPayload) => Promise<void>;
  restoreSession: () => Promise<void>;
  updateCompany: (company: Company) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      company: null,
      hydrated: false,
      storageReady: false,
      isLoading: false,
      isAuthenticated: false,
      setSession: (session) => {
        setStoredToken(session.token);

        return set({
          token: session.token,
          user: session.user,
          company: session.company,
          isAuthenticated: true,
          isLoading: false,
          hydrated: true,
        });
      },
      login: async (payload) => {
        set({ isLoading: true });

        try {
          const session = await authService.login(payload);
          setStoredToken(session.token);
          set({
            token: session.token,
            user: session.user,
            company: session.company,
            isAuthenticated: true,
            isLoading: false,
            hydrated: true,
          });
        } catch (error) {
          clearStoredToken();
          set({ isLoading: false, isAuthenticated: false });
          throw error;
        }
      },
      restoreSession: async () => {
        const { hydrated, isLoading, storageReady, token } = get();

        if (hydrated || isLoading || !storageReady) {
          return;
        }

        const storedToken = token ?? getStoredToken();

        if (!storedToken) {
          clearStoredToken();
          set({
            token: null,
            user: null,
            company: null,
            hydrated: true,
            isAuthenticated: false,
            isLoading: false,
          });
          return;
        }

        set({ isLoading: true });

        try {
          const session = await authService.restoreSession(storedToken);
          setStoredToken(session.token);
          set({
            token: session.token,
            user: session.user,
            company: session.company,
            isAuthenticated: true,
            isLoading: false,
            hydrated: true,
          });
        } catch {
          clearStoredToken();
          set({
            token: null,
            user: null,
            company: null,
            hydrated: true,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },
      updateCompany: (company) => set({ company }),
      logout: () => {
        clearStoredToken();

        return set({
          token: null,
          user: null,
          company: null,
          isAuthenticated: false,
          isLoading: false,
          hydrated: true,
        });
      },
    }),
    {
      name: "controlis-auth",
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        company: state.company,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.storageReady = true;
        }
      },
    },
  ),
);
