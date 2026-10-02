import type { PersistStorage } from "zustand/middleware";

import { SCHEMA_VERSION, type AppData } from "@/domain/app-data";
import { LocalStoragePersistence } from "@/lib/persistence/local-storage-persistence";
import type { AppPersistence, PersistenceIssue } from "@/lib/persistence/types";

import { toast } from "./ui-store";

const WRITE_FAILURE_TOAST_INTERVAL = 15_000;
let lastWriteFailureToast = 0;

function notifyIssue(issue: PersistenceIssue): void {
  switch (issue.kind) {
    case "unreadable":
      toast.error(
        "Os dados salvos neste navegador não puderam ser lidos. Uma cópia foi preservada; importe um backup para restaurar.",
        { duration: 10_000 },
      );
      break;
    case "newer-version":
      toast.error(
        "Os dados deste navegador foram salvos por uma versão mais nova do Dusk. Uma cópia foi preservada.",
        { duration: 10_000 },
      );
      break;
    case "repaired":
      toast.error(
        `${issue.droppedItems} ${issue.droppedItems === 1 ? "item inválido foi ignorado" : "itens inválidos foram ignorados"} ao carregar os dados. Uma cópia do original foi preservada.`,
        { duration: 8000 },
      );
      break;
    case "write-failed": {
      const now = Date.now();
      if (now - lastWriteFailureToast < WRITE_FAILURE_TOAST_INTERVAL) return;
      lastWriteFailureToast = now;
      toast.error("Não foi possível salvar no navegador. Exporte um backup para não perder alterações.");
      break;
    }
  }
}

export const appPersistence: AppPersistence = new LocalStoragePersistence({ onIssue: notifyIssue });

/**
 * Ponte entre o persist middleware do Zustand e o `AppPersistence`. O formato
 * salvo é o `PersistedAppState` do PRD, não o envelope padrão do Zustand.
 * A migration de schema acontece dentro de `load()`, por isso a versão
 * devolvida já é sempre a atual.
 */
export function createPersistStorage(persistence: AppPersistence): PersistStorage<AppData> {
  return {
    getItem: () => {
      const persisted = persistence.load();
      if (!persisted) return null;
      const { schemaVersion, ...state } = persisted;
      return { state, version: schemaVersion };
    },
    setItem: (_name, value) => {
      persistence.save({ schemaVersion: SCHEMA_VERSION, ...value.state });
    },
    removeItem: () => persistence.clear(),
  };
}
