"use client";

import { MoonStar, SunMedium } from "lucide-react";
import { useThemeStore } from "@/store/theme-store";

export function ThemeToggle() {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  return (
    <button
      aria-label="Alternar tema"
      className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-surface text-foreground transition-colors hover:border-primary/30 hover:bg-primary-soft"
      onClick={toggleTheme}
      type="button"
    >
      {theme === "dark" ? <SunMedium className="h-5 w-5" /> : <MoonStar className="h-5 w-5" />}
    </button>
  );
}
