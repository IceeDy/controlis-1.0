import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PreferredTheme } from "@/types/company";

interface ThemeState {
  theme: PreferredTheme;
  setTheme: (theme: PreferredTheme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "light",
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set({ theme: get().theme === "dark" ? "light" : "dark" }),
    }),
    {
      name: "controlis-theme",
    },
  ),
);
