"use client";

import { Check, CloudOff, LoaderCircle } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { useUiStore } from "@/store/ui-store";

/** Estado do envio ao banco; ícone e texto, nunca só cor. */
export function SyncBadge({ className }: { className?: string }) {
  const status = useUiStore((state) => state.syncStatus);

  if (status === "offline") {
    return (
      <span role="status" className={cn("inline-flex items-center gap-1.5 text-label text-status-waiting", className)}>
        <CloudOff aria-hidden="true" className="size-3.5" />
        Sem conexão, salvo neste navegador
      </span>
    );
  }
  if (status === "saving") {
    return (
      <span role="status" className={cn("inline-flex items-center gap-1.5 text-label text-ink-muted", className)}>
        <LoaderCircle aria-hidden="true" className="size-3.5 animate-spin" />
        Salvando
      </span>
    );
  }
  return (
    <span role="status" className={cn("inline-flex items-center gap-1.5 text-label text-ink-subtle", className)}>
      <Check aria-hidden="true" className="size-3.5" />
      Salvo no banco
    </span>
  );
}
