"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";

interface ProtectedShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function ProtectedShell({
  title,
  subtitle,
  children,
}: ProtectedShellProps) {
  const router = useRouter();
  const hydrated = useAuthStore((state) => state.hydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace("/login");
    }
  }, [hydrated, isAuthenticated, router]);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="rounded-[28px] border border-border bg-surface px-8 py-6 text-sm text-text-soft shadow-[var(--shadow-md)]">
          Preparando seu ambiente...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen p-4 lg:p-5">
      <div className="mx-auto flex max-w-[1600px] gap-5">
        <Sidebar />
        <div className="min-w-0 flex-1">
          <Header title={title} subtitle={subtitle} />
          <main>{children}</main>
        </div>
      </div>
    </div>
  );
}
