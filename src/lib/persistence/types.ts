import type { PersistedAppState } from "@/domain/app-data";

/**
 * Contrato de persistência do app. A UI e o store não sabem onde os dados
 * ficam: trocar LocalStorage por Supabase significa implementar esta interface.
 */
export interface AppPersistence {
  load(): PersistedAppState | null;
  save(state: PersistedAppState): void;
  clear(): void;
  /** Notifica quando os dados mudam fora desta instância (ex.: outra aba). */
  subscribe?(onExternalChange: () => void): () => void;
}

export type PersistenceIssue =
  | { kind: "unreadable"; recoveryKey?: string }
  | { kind: "newer-version"; recoveryKey?: string }
  | { kind: "repaired"; droppedItems: number; recoveryKey?: string }
  | { kind: "write-failed" };
