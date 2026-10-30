import { getSupabase } from "@/lib/supabase/client";
import { appPersistence } from "@/store/persistence";
import { toast } from "@/store/ui-store";

/** Devolve a mensagem de erro para o formulário, ou `null` se entrou. */
export async function signIn(email: string, password: string): Promise<string | null> {
  const { error } = await getSupabase().auth.signInWithPassword({ email: email.trim(), password });
  if (!error) return null;
  if (error.code === "invalid_credentials") return "E-mail ou senha incorretos.";
  if (error.status === 429) return "Muitas tentativas. Aguarde um pouco e tente de novo.";
  return "Não foi possível entrar. Verifique sua conexão e tente de novo.";
}

/** Não sai com alterações ainda não enviadas: elas ficariam presas neste navegador. */
export async function signOut(): Promise<void> {
  await appPersistence.flush();
  if (appPersistence.hasPendingChanges()) {
    toast.error("Ainda há alterações sem enviar ao banco. Verifique a conexão antes de sair.");
    return;
  }

  // Só desconecta depois de sair de verdade: sem rede, o login continua e as edições precisam continuar valendo.
  const userId = appPersistence.connectedUserId();
  const { error } = await getSupabase().auth.signOut();
  if (error) {
    toast.error("Não foi possível sair. Verifique sua conexão e tente de novo.");
    return;
  }

  // A cópia local sai junto; o `useStoreHydration` zera a memória ao desmontar.
  appPersistence.disconnect();
  if (userId) appPersistence.forgetCache(userId);
}
