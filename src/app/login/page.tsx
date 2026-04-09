"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";
import { StatusBanner } from "@/components/ui/status-banner";
import { initialAccessCredentials } from "@/lib/constants";
import { loginSchema, type LoginSchema } from "@/schemas/auth-schema";
import { useAuthStore } from "@/store/auth-store";

export default function LoginPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const login = useAuthStore((state) => state.login);

  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: initialAccessCredentials.email,
      password: initialAccessCredentials.password,
    },
  });

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, router]);

  async function onSubmit(values: LoginSchema) {
    try {
      setErrorMessage(null);
      await login(values);
      router.replace("/dashboard");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Não foi possível autenticar.",
      );
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-[1480px] overflow-hidden rounded-[36px] border border-border bg-surface shadow-[var(--shadow-lg)] lg:grid-cols-[1.1fr_0.9fr]">
        <section className="relative flex flex-col justify-between overflow-hidden bg-[linear-gradient(160deg,#0d2f58_0%,#123e72_58%,#1aa06d_180%)] px-6 py-8 text-white sm:px-10 sm:py-10 lg:px-14 lg:py-14">
          <div className="absolute -top-20 right-0 h-72 w-72 rounded-full bg-white/12 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-56 w-56 rounded-full bg-secondary/25 blur-3xl" />
          <div className="relative z-10 space-y-10">
            <Logo className="text-white [&_*]:text-white" />
            <div className="max-w-xl space-y-6">
              <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold tracking-[0.2em] uppercase text-white/80">
                Gestão centralizada para pequenos comércios
              </span>
              <div className="space-y-4">
                <h1 className="text-4xl leading-tight font-semibold sm:text-5xl">
                  Controle produtos, estoque e vendas com visão executiva em um só lugar.
                </h1>
                <p className="max-w-lg text-base leading-7 text-white/78 sm:text-lg">
                  O Controlis organiza a operação diária com painéis claros, fluxo rápido e estrutura pronta para crescer por empresa.
                </p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  value: "+18%",
                  label: "ganho operacional no mês",
                },
                {
                  value: "24h",
                  label: "histórico de estoque acessível",
                },
                {
                  value: "Multi-tenant",
                  label: "arquitetura pronta para escalar",
                },
              ].map((item) => (
                <div key={item.label} className="rounded-[28px] border border-white/10 bg-white/8 px-5 py-4 backdrop-blur-md">
                  <p className="text-2xl font-semibold">{item.value}</p>
                  <p className="mt-2 text-sm leading-6 text-white/72">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative z-10 mt-10 rounded-[28px] border border-white/10 bg-white/8 p-5 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/12 p-2">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">Acesso inicial do ambiente</p>
                <p className="text-sm text-white/70">
                  Use o usuário seeded do backend para validar a integração com a API real.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-4 py-8 sm:px-8 lg:px-12">
          <Card elevated className="w-full max-w-xl bg-surface-strong p-0">
            <div className="border-b border-border px-6 py-6 sm:px-8">
              <p className="text-sm font-semibold tracking-[0.24em] text-text-soft uppercase">
                Acesso seguro
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-foreground">Entrar no Controlis</h2>
              <p className="mt-2 text-sm leading-6 text-text-soft">
                Faça login para acompanhar vendas, estoque e indicadores da sua operação.
              </p>
            </div>
            <form className="space-y-5 px-6 py-6 sm:px-8 sm:py-8" onSubmit={form.handleSubmit(onSubmit)}>
              {errorMessage ? <StatusBanner message={errorMessage} variant="error" /> : null}
              <StatusBanner
                message={`Acesso inicial: ${initialAccessCredentials.email} / ${initialAccessCredentials.password}`}
                variant="info"
              />
              <FormField
                error={form.formState.errors.email?.message}
                htmlFor="email"
                label="Email"
              >
                <div className="relative">
                  <Mail className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-text-soft" />
                  <Input
                    id="email"
                    placeholder="voce@empresa.com.br"
                    className="pl-11"
                    {...form.register("email")}
                  />
                </div>
              </FormField>
              <FormField
                error={form.formState.errors.password?.message}
                htmlFor="password"
                label="Senha"
              >
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-text-soft" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Digite sua senha"
                    className="pl-11"
                    {...form.register("password")}
                  />
                </div>
              </FormField>
              <Button className="w-full" loading={form.formState.isSubmitting} size="lg" type="submit">
                Entrar
              </Button>
            </form>
          </Card>
        </section>
      </div>
    </div>
  );
}
