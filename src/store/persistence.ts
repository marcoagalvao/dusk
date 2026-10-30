import type { PersistStorage } from "zustand/middleware";

import { SCHEMA_VERSION, type AppData } from "@/domain/app-data";
import { LocalStoragePersistence } from "@/lib/persistence/local-storage-persistence";
import { SyncedPersistence } from "@/lib/persistence/synced-persistence";
import type { AppPersistence, PersistenceIssue } from "@/lib/persistence/types";

import { toast, useUiStore } from "./ui-store";

const REPEATED_TOAST_INTERVAL = 15_000;
const lastToastAt = new Map<PersistenceIssue["kind"], number>();

/** Falhas se repetem a cada tentativa ou linha: o aviso não precisa se repetir junto. */
function canToastAgain(kind: PersistenceIssue["kind"]): boolean {
  const now = Date.now();
  if (now - (lastToastAt.get(kind) ?? 0) < REPEATED_TOAST_INTERVAL) return false;
  lastToastAt.set(kind, now);
  return true;
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

function notifyIssue(issue: PersistenceIssue): void {
  switch (issue.kind) {
    case "unreadable":
      toast.error(
        "Os dados antigos deste navegador não puderam ser lidos. Uma cópia foi preservada; importe um backup para restaurar.",
        { duration: 10_000 },
      );
      break;
    case "newer-version":
      toast.error(
        "Os dados antigos deste navegador foram salvos por uma versão mais nova do Dusk. Uma cópia foi preservada.",
        { duration: 10_000 },
      );
      break;
    case "repaired":
      toast.error(
        `${issue.droppedItems} ${issue.droppedItems === 1 ? "item inválido foi ignorado" : "itens inválidos foram ignorados"} ao carregar os dados. Uma cópia do original foi preservada.`,
        { duration: 8000 },
      );
      break;
    case "write-failed":
      if (!canToastAgain(issue.kind)) return;
      toast.error("Sem conexão com o banco. Suas alterações ficam neste navegador e serão enviadas quando a conexão voltar.");
      break;
    case "local-copy-failed":
      if (!canToastAgain(issue.kind)) return;
      toast.error("O navegador não conseguiu guardar suas alterações. Mantenha esta aba aberta até o envio terminar.");
      break;
    case "rejected":
      if (!canToastAgain(issue.kind)) return;
      toast.error("O banco recusou uma alteração. Uma cópia foi guardada neste navegador e a tela voltará ao que está salvo.", {
        duration: 10_000,
      });
      break;
    case "legacy-imported":
      toast.success(
        `${plural(issue.tasks, "tarefa", "tarefas")} e ${plural(issue.projects, "projeto", "projetos")} deste navegador foram levados para o banco.`,
        { duration: 8000 },
      );
      break;
  }
}

export const appPersistence = new SyncedPersistence({
  onIssue: notifyIssue,
  onStatus: (status) => useUiStore.getState().setSyncStatus(status),
  legacy: new LocalStoragePersistence({ onIssue: notifyIssue }),
});

/**
 * Ponte entre o persist middleware do Zustand e o `AppPersistence`. O formato
 * salvo é o `PersistedAppState` do PRD, não o envelope padrão do Zustand.
 * A validação e as migrations acontecem dentro de `load()`, por isso a versão
 * devolvida já é sempre a atual.
 */
export function createPersistStorage(persistence: AppPersistence): PersistStorage<AppData> {
  return {
    getItem: async () => {
      const persisted = await persistence.load();
      if (!persisted) return null;
      const { schemaVersion, ...state } = persisted;
      return { state, version: schemaVersion };
    },
    setItem: (_name, value) => {
      persistence.save({ schemaVersion: SCHEMA_VERSION, ...value.state });
    },
    // Apagar passa pelo `save` (a diferença vira DELETE no banco).
    removeItem: () => {},
  };
}
