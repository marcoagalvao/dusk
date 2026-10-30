import type { PersistedAppState } from "@/domain/app-data";
import { nowIso } from "@/lib/dates";

import { parsePersistedState } from "./schema";
import type { PersistenceIssue } from "./types";

export const STORAGE_KEY = "dusk:v1";

interface LocalStoragePersistenceOptions {
  key?: string;
  getStorage?: () => Storage | null;
  onIssue?: (issue: PersistenceIssue) => void;
}

export function defaultStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    // Acesso ao localStorage pode lançar SecurityError quando bloqueado.
    return null;
  }
}

/**
 * Formato antigo, de quando os dados viviam só no navegador. Hoje serve apenas
 * para ler o que ainda está em `dusk:v1` e levar para o banco (`LegacySource`).
 */
export class LocalStoragePersistence {
  private readonly key: string;
  private readonly getStorage: () => Storage | null;
  private readonly onIssue: (issue: PersistenceIssue) => void;
  /** Conteúdo problemático já preservado e notificado (evita cópias e avisos repetidos). */
  private lastReportedRaw: string | null = null;

  constructor(options: LocalStoragePersistenceOptions = {}) {
    this.key = options.key ?? STORAGE_KEY;
    this.getStorage = options.getStorage ?? defaultStorage;
    this.onIssue = options.onIssue ?? (() => {});
  }

  load(): PersistedAppState | null {
    const storage = this.getStorage();
    if (!storage) return null;

    let raw: string | null;
    try {
      raw = storage.getItem(this.key);
    } catch {
      return null;
    }
    if (raw === null) return null;

    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      this.report(storage, raw, (recoveryKey) => ({ kind: "unreadable", recoveryKey }), { drop: true });
      return null;
    }

    const result = parsePersistedState(json);
    if (!result.ok) {
      this.report(storage, raw, (recoveryKey) =>
        result.reason === "newer" ? { kind: "newer-version", recoveryKey } : { kind: "unreadable", recoveryKey },
        { drop: true },
      );
      return null;
    }

    if (result.droppedItems > 0) {
      this.report(storage, raw, (recoveryKey) => ({
        kind: "repaired",
        droppedItems: result.droppedItems,
        recoveryKey,
      }));
    }

    return result.state;
  }

  /** Tira os dados da chave ativa depois de importados, mantendo uma cópia. */
  archive(): void {
    const storage = this.getStorage();
    const raw = storage?.getItem(this.key);
    if (!storage || raw === null || raw === undefined) return;
    try {
      storage.setItem(`${this.key}:imported:${nowIso()}`, raw);
      storage.removeItem(this.key);
    } catch {
      this.onIssue({ kind: "write-failed" });
    }
  }

  /** Preserva o original e avisa uma única vez por conteúdo problemático. */
  private report(
    storage: Storage,
    raw: string,
    toIssue: (recoveryKey?: string) => PersistenceIssue,
    { drop = false }: { drop?: boolean } = {},
  ): void {
    if (raw === this.lastReportedRaw) return;
    this.lastReportedRaw = raw;
    const recoveryKey = this.preserve(storage, raw);
    // Sem isso, cada abertura da página repetiria o aviso e criaria outra cópia.
    if (drop && recoveryKey) storage.removeItem(this.key);
    this.onIssue(toIssue(recoveryKey));
  }

  /** Guarda uma cópia do conteúdo original antes de descartá-lo ou repará-lo. */
  private preserve(storage: Storage, raw: string): string | undefined {
    const recoveryKey = `${this.key}:recovery:${nowIso()}`;
    try {
      storage.setItem(recoveryKey, raw);
      return recoveryKey;
    } catch {
      return undefined;
    }
  }
}
