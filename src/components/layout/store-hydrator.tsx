"use client";

import { useEffect } from "react";

import { useAppStore } from "@/store/app-store";
import { appPersistence } from "@/store/persistence";
import { useUiStore } from "@/store/ui-store";

/**
 * Carrega os dados salvos depois da montagem (evita mismatch de hidratação
 * SSR) e recarrega quando outra aba altera os dados.
 */
export function StoreHydrator() {
  useEffect(() => {
    const markHydrated = useUiStore.getState().setHydrated;
    Promise.resolve(useAppStore.persist.rehydrate()).finally(markHydrated);

    return appPersistence.subscribe?.(() => {
      // Sem dados salvos (outra aba apagou tudo): zera a memória também, senão a
      // próxima alteração desta aba regravaria os dados apagados.
      if (appPersistence.load() === null) useAppStore.getState().resetData();
      else void useAppStore.persist.rehydrate();
    });
  }, []);

  return null;
}
