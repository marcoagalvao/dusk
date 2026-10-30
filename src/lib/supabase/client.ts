import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// O Next só embute NEXT_PUBLIC_* quando a variável é lida pelo nome completo.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

let client: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(url && publishableKey);
}

/**
 * Cliente único do navegador. O app é todo client-side: a sessão fica no
 * localStorage e a proteção dos dados é o RLS do banco, não o servidor do Next.
 */
export function getSupabase(): SupabaseClient {
  if (!url || !publishableKey) throw new Error("Supabase não configurado: veja .env.example");
  client ??= createClient(url, publishableKey);
  return client;
}
