"use client";

import { Building2, Menu } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useUiStore } from "@/store/ui-store";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface HeaderProps {
  title: string;
  subtitle: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const company = useAuthStore((state) => state.company);
  const user = useAuthStore((state) => state.user);
  const setMobileSidebarOpen = useUiStore((state) => state.setMobileSidebarOpen);

  return (
    <header className="sticky top-0 z-20 mb-6 flex flex-col gap-4 rounded-[28px] border border-border bg-surface px-5 py-4 shadow-[var(--shadow-md)] backdrop-blur-xl sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <button
            aria-label="Abrir menu"
            className="mt-1 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-surface-strong text-foreground lg:hidden"
            onClick={() => setMobileSidebarOpen(true)}
            type="button"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <p className="text-xs font-semibold tracking-[0.24em] text-text-soft uppercase">
              Controlis
            </p>
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            <p className="mt-1 text-sm text-text-soft">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <div className="hidden rounded-2xl border border-border bg-surface-strong px-4 py-3 sm:block">
            <p className="text-sm font-semibold text-foreground">{user?.name}</p>
            <p className="text-xs text-text-soft">{user?.email}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl bg-surface-strong px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-primary-soft p-2 text-primary">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{company?.tradingName}</p>
            <p className="text-xs text-text-soft">{company?.segment}</p>
          </div>
        </div>
        <Badge variant="success">Empresa ativa</Badge>
      </div>
    </header>
  );
}
