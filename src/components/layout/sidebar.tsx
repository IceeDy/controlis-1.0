"use client";

import Link from "next/link";
import { useEffect } from "react";
import { LogOut, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { navigationItems } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { useUiStore } from "@/store/ui-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

function SidebarContent() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const company = useAuthStore((state) => state.company);
  const logout = useAuthStore((state) => state.logout);
  const setMobileSidebarOpen = useUiStore((state) => state.setMobileSidebarOpen);

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname, setMobileSidebarOpen]);

  return (
    <div className="flex h-full flex-col gap-8 rounded-[30px] border border-border bg-surface px-4 py-5 shadow-[var(--shadow-lg)] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3 px-2 lg:block">
        <Logo />
        <button
          aria-label="Fechar menu"
          className="rounded-2xl p-2 text-text-soft hover:bg-primary-soft lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          type="button"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-2">
        <div className="px-3">
          <p className="text-xs font-semibold tracking-[0.24em] text-text-soft uppercase">
            Navegação
          </p>
        </div>
        <nav className="space-y-1.5">
          {navigationItems.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-text-inverse shadow-[0_18px_32px_rgba(18,62,114,0.22)]"
                    : "text-text-soft hover:bg-primary-soft hover:text-primary",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto space-y-4 rounded-[24px] bg-surface-strong px-4 py-4">
        <div className="space-y-2">
          <Badge className="w-fit">{company?.tenantCode ?? "tenant-demo"}</Badge>
          <div>
            <p className="font-semibold text-foreground">{user?.name ?? "Usuário"}</p>
            <p className="text-sm text-text-soft">{user?.role ?? "Acesso padrão"}</p>
          </div>
        </div>
        <Button
          className="w-full justify-center"
          variant="ghost"
          leftIcon={<LogOut className="h-4 w-4" />}
          onClick={() => {
            logout();
            router.replace("/login");
          }}
          type="button"
        >
          Sair
        </Button>
      </div>
    </div>
  );
}

export function Sidebar() {
  const isMobileSidebarOpen = useUiStore((state) => state.isMobileSidebarOpen);
  const setMobileSidebarOpen = useUiStore((state) => state.setMobileSidebarOpen);

  return (
    <>
      <aside className="hidden h-[calc(100vh-2rem)] w-[290px] shrink-0 lg:block">
        <SidebarContent />
      </aside>

      {isMobileSidebarOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Fechar navegação"
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
            type="button"
          />
          <div className="relative h-full w-[88vw] max-w-[320px] p-4">
            <SidebarContent />
          </div>
        </div>
      ) : null}
    </>
  );
}
