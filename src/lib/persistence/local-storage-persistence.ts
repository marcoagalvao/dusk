import type { PersistedAppState } from "@/domain/app-data";
import { nowIso } from "@/lib/dates";

import { parsePersistedState } from "./schema";
import type { AppPersistence, PersistenceIssue } from "./types";

export const STORAGE_KEY = "dusk:v1";

interface LocalStoragePersistenceOptions {
  key?: string;
  getStorage?: () => Storage | null;
  onIssue?: (issue: PersistenceIssue) => void;
}

function defaultStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    // Acesso ao localStorage pode lançar SecurityError quando bloqueado.
    return null;
  }
}

export class LocalStoragePersistence implements AppPersistence {
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
      this.report(storage, raw, (recoveryKey) => ({ kind: "unreadable", recoveryKey }));
      return null;
    }

    const result = parsePersistedState(json);
    if (!result.ok) {
      this.report(storage, raw, (recoveryKey) =>
        result.reason === "newer" ? { kind: "newer-version", recoveryKey } : { kind: "unreadable", recoveryKey },
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

  save(state: PersistedAppState): void {
    const storage = this.getStorage();
    if (!storage) return;

    const serialized = JSON.stringify(state);
    try {
      // Evita escritas redundantes (e eventos `storage` em outras abas).
      if (storage.getItem(this.key) === serialized) return;
      storage.setItem(this.key, serialized);
    } catch {
      this.onIssue({ kind: "write-failed" });
    }
  }

  clear(): void {
    try {
      this.getStorage()?.removeItem(this.key);
    } catch {
      this.onIssue({ kind: "write-failed" });
    }
  }

  subscribe(onExternalChange: () => void): () => void {
    if (typeof window === "undefined") return () => {};
    const handler = (event: StorageEvent) => {
      if (event.key === this.key || event.key === null) onExternalChange();
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }

  /** Preserva o original e avisa uma única vez por conteúdo problemático. */
  private report(storage: Storage, raw: string, toIssue: (recoveryKey?: string) => PersistenceIssue): void {
    if (raw === this.lastReportedRaw) return;
    this.lastReportedRaw = raw;
    this.onIssue(toIssue(this.preserve(storage, raw)));
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
