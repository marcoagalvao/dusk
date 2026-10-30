"use client";

import { useCallback, useEffect, useRef } from "react";

import { SupabaseRemote } from "@/lib/persistence/supabase-remote";
import { getSupabase } from "@/lib/supabase/client";
import { useAppStore } from "@/store/app-store";
import { appPersistence } from "@/store/persistence";
import { useUiStore } from "@/store/ui-store";

/**
 * Liga a persistência ao usuário logado e carrega os dados do banco. Só
 * enquanto o usuário está montado: ao sair, a memória é zerada (depois de
 * desconectar, para o reset não virar DELETE no banco).
 */
export function useStoreHydration(userId: string): { retry: () => void } {
  const attempt = useRef(0);

  const hydrate = useCallback(async () => {
    const current = ++attempt.current;
    await useAppStore.persist.rehydrate();
    // StrictMode e "Tentar de novo" podem sobrepor tentativas: vale só a última.
    if (current !== attempt.current) return;
    const ready = appPersistence.isReady();
    const { setHydrated, setLoadFailed } = useUiStore.getState();
    setLoadFailed(!ready);
    setHydrated(ready);
  }, []);

  useEffect(() => {
    appPersistence.connect(userId, new SupabaseRemote(getSupabase(), userId));
    void hydrate();

    // Outra aba ou dispositivo pode ter mudado algo: `load` só troca o estado se houver novidade.
    // Passa por `hydrate` para a tela sair do erro quando a conexão voltar sozinha.
    const unsubscribe = appPersistence.subscribe(() => void hydrate());
    return () => {
      unsubscribe();
      appPersistence.disconnect();
      useAppStore.getState().resetData();
      useUiStore.getState().setHydrated(false);
    };
  }, [userId, hydrate]);

  return { retry: () => void hydrate() };
}
