import type { PersistedAppState } from "@/domain/app-data";

/**
 * Contrato de persistência do app. A UI e o store não sabem onde os dados
 * ficam: a implementação atual é `SyncedPersistence` (Supabase + fila local).
 */
export interface AppPersistence {
  /** Lê o estado mais recente. Rejeita quando não há como obter nenhum dado. */
  load(): Promise<PersistedAppState | null>;
  /** Registra o estado atual; o envio ao banco acontece em segundo plano. */
  save(state: PersistedAppState): void;
  /** Notifica quando os dados podem ter mudado fora desta aba (outra aba, outro dispositivo). */
  subscribe?(onExternalChange: () => void): () => void;
}

export type PersistenceIssue =
  | { kind: "unreadable"; recoveryKey?: string }
  | { kind: "newer-version"; recoveryKey?: string }
  | { kind: "repaired"; droppedItems: number; recoveryKey?: string }
  | { kind: "write-failed" }
  /** O navegador não guardou a fila: se a aba fechar antes do envio, a alteração se perde. */
  | { kind: "local-copy-failed" }
  /** O banco recusou a alteração em definitivo; uma cópia foi guardada neste navegador. */
  | { kind: "rejected" }
  | { kind: "legacy-imported"; tasks: number; projects: number };

export type SyncStatus = "idle" | "saving" | "saved" | "offline";
