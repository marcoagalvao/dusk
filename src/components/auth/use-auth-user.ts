"use client";

import { useEffect, useState } from "react";

import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";

export interface AuthUser {
  id: string;
  email?: string;
}

/** `undefined` enquanto a sessão salva é lida (também no render do servidor); `null` sem login. */
export function useAuthUser(): AuthUser | null | undefined {
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    // Dispara na montagem (INITIAL_SESSION) e a cada login/logout, inclusive vindos de outra aba.
    const { data } = getSupabase().auth.onAuthStateChange((_event, session) => {
      const next = session?.user;
      setUser((current) => {
        if (!next) return null;
        // Renovar o token não pode recriar a conexão com o banco.
        return current?.id === next.id ? current : { id: next.id, email: next.email };
      });
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return user;
}
