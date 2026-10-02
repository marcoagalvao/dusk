"use client";

import { CircleAlert, Check, X } from "lucide-react";
import { useEffect } from "react";

import { useUiStore, type Toast } from "@/store/ui-store";
import { cn } from "@/lib/utils/cn";

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useUiStore((state) => state.dismissToast);

  useEffect(() => {
    const timer = setTimeout(() => dismiss(toast.id), toast.duration);
    return () => clearTimeout(timer);
  }, [dismiss, toast.id, toast.duration]);

  return (
    <div
      role={toast.tone === "error" ? "alert" : "status"}
      className="pointer-events-auto flex w-full animate-toast-in items-center gap-3 rounded-card border border-line bg-raised py-2.5 pr-2 pl-3.5 text-compact text-ink shadow-float sm:w-auto sm:max-w-md"
    >
      {toast.tone === "success" && <Check aria-hidden="true" className="size-4 shrink-0 text-status-completed" />}
      {toast.tone === "error" && <CircleAlert aria-hidden="true" className="size-4 shrink-0 text-status-blocked" />}
      <p className="min-w-0 flex-1">{toast.message}</p>
      {toast.action && (
        <button
          type="button"
          onClick={() => {
            toast.action?.onAction();
            dismiss(toast.id);
          }}
          className="focus-ring h-8 shrink-0 rounded-[8px] px-2.5 text-label font-semibold text-primary transition-colors duration-120 hover:bg-line/50"
        >
          {toast.action.label}
        </button>
      )}
      <button
        type="button"
        aria-label="Dispensar aviso"
        onClick={() => dismiss(toast.id)}
        className="focus-ring grid size-8 shrink-0 place-items-center rounded-[8px] text-ink-subtle transition-colors duration-120 hover:bg-line/50 hover:text-ink"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

export function Toaster() {
  const toasts = useUiStore((state) => state.toasts);

  return (
    <div
      aria-live="polite"
      className={cn(
        "pointer-events-none fixed inset-x-3 z-[60] flex flex-col items-stretch gap-2",
        "bottom-[calc(5.75rem+env(safe-area-inset-bottom))] lg:inset-x-auto lg:right-6 lg:bottom-6 lg:items-end",
      )}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
