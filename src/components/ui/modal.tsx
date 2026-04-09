"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: "md" | "lg" | "xl";
}

const sizeClasses = {
  md: "max-w-2xl",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
} as const;

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = "lg",
}: ModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <button
        aria-label="Fechar modal"
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
        onClick={onClose}
        type="button"
      />
      <div
        aria-modal="true"
        role="dialog"
        className={cn(
          "relative z-10 max-h-[90vh] w-full overflow-hidden rounded-[32px] border border-border bg-surface-strong shadow-[var(--shadow-lg)]",
          sizeClasses[size],
        )}
      >
        <div className="flex items-start justify-between gap-6 border-b border-border px-6 py-5 sm:px-8">
          <div>
            <h2 className="text-xl font-semibold text-foreground">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm text-text-soft">{description}</p>
            ) : null}
          </div>
          <button
            aria-label="Fechar"
            className="rounded-full p-2 text-text-soft transition-colors hover:bg-primary-soft hover:text-primary"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[calc(90vh-96px)] overflow-y-auto px-6 py-6 sm:px-8">
          {children}
        </div>
      </div>
    </div>
  );
}
