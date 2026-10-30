import type { PersistedAppState } from "@/domain/app-data";

import { defaultStorage } from "./local-storage-persistence";
import {
  applyChanges,
  diffRows,
  isEmptyChanges,
  mergeAppData,
  mergeChanges,
  rowsToState,
  SETTINGS_KEY,
  splitChanges,
  stateToRows,
  TABLES,
  type RowChanges,
  type RowSet,
} from "./rows";
import { parsePersistedState } from "./schema";
import type { AppPersistence, PersistenceIssue, SyncStatus } from "./types";

const DEFAULT_DEBOUNCE_MS = 400;
const DEFAULT_RETRY_MS = 2000;
const MAX_RETRY_MS = 60_000;
const REFRESH_INTERVAL_MS = 60_000;

/** Onde as linhas moram de verdade. No app, `SupabaseRemote`. */
export interface RemoteStore {
  fetchAll(): Promise<RowSet>;
  apply(changes: RowChanges): Promise<void>;
}

/** `permanent`: reenviar não vai adiantar (ex.: violação de constraint). */
export class RemoteError extends Error {
  constructor(
    message: string,
    readonly permanent: boolean,
  ) {
    super(message);
    this.name = "RemoteError";
  }
}

/** Dados que existiam no navegador antes do banco (`dusk:v1`). */
export interface LegacySource {
  load(): PersistedAppState | null;
  archive(): void;
}

interface Session {
  userId: string;
  remote: RemoteStore;
  /** O que o banco tem (ou terá, somando a fila). `null` até o primeiro load. */
  baseline: RowSet | null;
  lastState: PersistedAppState | null;
  revision: number;
  legacyChecked: boolean;
  flushing: Promise<void> | null;
  loading: Promise<PersistedAppState | null> | null;
  /** A fila, quando o navegador não aceitou gravá-la. Só dura enquanto a aba estiver aberta. */
  unstoredOutbox: RowChanges | null;
  retryMs: number;
}

interface SyncedPersistenceOptions {
  getStorage?: () => Storage | null;
  onIssue?: (issue: PersistenceIssue) => void;
  onStatus?: (status: SyncStatus) => void;
  legacy?: LegacySource;
  debounceMs?: number;
  retryMs?: number;
  autoRetry?: boolean;
}

/**
 * Banco como fonte da verdade, com o navegador como rede de segurança.
 *
 * Cada `save` calcula a diferença para a última base conhecida e a grava numa
 * fila em localStorage antes de enviar. Assim uma alteração sobrevive a queda de
 * conexão, fechar a aba ou recarregar: a fila é reenviada no próximo `load`.
 * Só linhas alteradas viajam, então duas abas ou dispositivos não se sobrescrevem
 * a não ser que editem o mesmo item (nesse caso, vence a última gravação).
 */
export class SyncedPersistence implements AppPersistence {
  private readonly getStorage: () => Storage | null;
  private readonly onIssue: (issue: PersistenceIssue) => void;
  private readonly onStatus: (status: SyncStatus) => void;
  private readonly legacy?: LegacySource;
  private readonly debounceMs: number;
  private readonly baseRetryMs: number;
  private readonly autoRetry: boolean;
  private session: Session | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(options: SyncedPersistenceOptions = {}) {
    this.getStorage = options.getStorage ?? defaultStorage;
    this.onIssue = options.onIssue ?? (() => {});
    this.onStatus = options.onStatus ?? (() => {});
    this.legacy = options.legacy;
    this.debounceMs = options.debounceMs ?? DEFAULT_DEBOUNCE_MS;
    this.baseRetryMs = options.retryMs ?? DEFAULT_RETRY_MS;
    this.autoRetry = options.autoRetry ?? true;
  }

  connect(userId: string, remote: RemoteStore): void {
    this.clearTimer();
    this.session = {
      userId,
      remote,
      baseline: null,
      lastState: null,
      revision: 0,
      legacyChecked: false,
      flushing: null,
      loading: null,
      unstoredOutbox: null,
      retryMs: this.baseRetryMs,
    };
    this.onStatus("idle");
  }

  /** Depois disso, `save` não faz nada: zerar o store no logout não pode apagar o banco. */
  disconnect(): void {
    this.clearTimer();
    this.session = null;
    this.onStatus("idle");
  }

  forgetCache(userId: string): void {
    this.remove(this.keyOf(userId, "cache"));
  }

  connectedUserId(): string | null {
    return this.session?.userId ?? null;
  }

  /** O primeiro load já terminou? Sem ele não há dados confiáveis para mostrar. */
  isReady(): boolean {
    return Boolean(this.session?.baseline);
  }

  hasPendingChanges(): boolean {
    return Boolean(this.session) && !isEmptyChanges(this.readOutbox(this.session!));
  }

  /** Foco e visibilidade disparam juntos: quem chega durante uma leitura aproveita a mesma. */
  load(): Promise<PersistedAppState | null> {
    const session = this.session;
    if (!session) return Promise.resolve(null);
    session.loading ??= this.read(session).finally(() => {
      session.loading = null;
    });
    return session.loading;
  }

  private async read(session: Session): Promise<PersistedAppState | null> {
    const revisionAtStart = session.revision;
    await this.flush();

    let remoteRows: RowSet;
    try {
      remoteRows = await session.remote.fetchAll();
    } catch (error) {
      if (session !== this.session) return null;
      if (session.lastState) return session.lastState;
      const cached = this.readCache(session);
      if (!cached) throw error;
      session.baseline = stateToRows(cached);
      session.lastState = cached;
      return cached;
    }
    if (session !== this.session) return null;

    // O usuário editou enquanto a leitura estava em andamento: ela já nasceu velha.
    if (session.revision !== revisionAtStart && session.lastState) return session.lastState;

    const parsed = parsePersistedState(rowsToState(applyChanges(remoteRows, this.readOutbox(session))));
    if (!parsed.ok) throw new Error(`Dados do banco inválidos: ${parsed.reason}`);

    const rows = stateToRows(parsed.state);
    if (session.baseline && session.lastState && isEmptyChanges(diffRows(session.baseline, rows))) {
      return session.lastState;
    }

    session.baseline = rows;
    session.lastState = parsed.state;
    this.writeCache(session, parsed.state);

    return this.importLegacy(session, parsed.state, SETTINGS_KEY in remoteRows.user_settings);
  }

  save(state: PersistedAppState): void {
    const session = this.session;
    if (!session?.baseline) return;

    const rows = stateToRows(state);
    const changes = diffRows(session.baseline, rows);
    session.lastState = state;
    if (isEmptyChanges(changes)) return;

    session.revision += 1;
    session.baseline = rows;
    this.writeOutbox(session, mergeChanges(this.readOutbox(session), changes));
    this.writeCache(session, state);
    this.onStatus("saving");
    this.schedule(this.debounceMs);
  }

  /** Envia a fila agora. Nunca rejeita: falhas viram status e aviso. */
  flush(): Promise<void> {
    this.clearTimer();
    const session = this.session;
    if (!session) return Promise.resolve();
    session.flushing ??= this.drain(session).finally(() => {
      session.flushing = null;
    });
    return session.flushing;
  }

  subscribe(onExternalChange: () => void): () => void {
    if (typeof window === "undefined") return () => {};

    const onVisibility = () => {
      if (document.visibilityState === "visible") onExternalChange();
      else void this.flush();
    };
    const onOnline = () => void this.flush().then(onExternalChange);
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") onExternalChange();
    }, REFRESH_INTERVAL_MS);

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onExternalChange);
    window.addEventListener("online", onOnline);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onExternalChange);
      window.removeEventListener("online", onOnline);
    };
  }

  private async drain(session: Session): Promise<void> {
    for (;;) {
      const sending = this.readOutbox(session);
      if (isEmptyChanges(sending)) {
        session.retryMs = this.baseRetryMs;
        if (session === this.session) this.onStatus("saved");
        return;
      }

      if (session === this.session) this.onStatus("saving");
      try {
        await this.send(session, sending);
      } catch {
        if (session === this.session) {
          this.onStatus("offline");
          this.onIssue({ kind: "write-failed" });
          if (this.autoRetry) {
            this.schedule(session.retryMs);
            session.retryMs = Math.min(session.retryMs * 2, MAX_RETRY_MS);
          }
        }
        return;
      }
    }
  }

  /** Uma recusa definitiva é isolada linha a linha: só a linha recusada fica de fora. */
  private async send(session: Session, changes: RowChanges): Promise<void> {
    try {
      await session.remote.apply(changes);
    } catch (error) {
      if (!(error instanceof RemoteError && error.permanent)) throw error;
      const rows = splitChanges(changes);
      if (rows.length > 1) {
        for (const row of rows) await this.send(session, row);
        return;
      }
      this.setAside(session, changes);
      this.onIssue({ kind: "rejected" });
    }
    this.removeFromOutbox(session, changes);
  }

  private importLegacy(session: Session, state: PersistedAppState, hasRemoteSettings: boolean): PersistedAppState {
    if (session.legacyChecked || !this.legacy) return state;
    session.legacyChecked = true;

    const legacy = this.legacy.load();
    if (!legacy) return state;

    const merged: PersistedAppState = {
      ...state,
      ...mergeAppData(state, legacy),
      settings: hasRemoteSettings ? state.settings : legacy.settings,
    };
    this.save(merged);
    this.legacy.archive();
    if (legacy.tasks.length > 0 || legacy.projects.length > 0) {
      this.onIssue({ kind: "legacy-imported", tasks: legacy.tasks.length, projects: legacy.projects.length });
    }
    return merged;
  }

  private schedule(delay: number): void {
    this.clearTimer();
    this.timer = setTimeout(() => void this.flush(), delay);
  }

  private clearTimer(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  private keyOf(userId: string, part: "outbox" | "cache" | "rejected"): string {
    return `dusk:v2:${userId}:${part}`;
  }

  private readJson<T>(key: string): T | null {
    try {
      const raw = this.getStorage()?.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  private write(key: string, value: unknown): boolean {
    try {
      const storage = this.getStorage();
      storage?.setItem(key, JSON.stringify(value));
      return Boolean(storage);
    } catch {
      return false;
    }
  }

  private remove(key: string): void {
    try {
      this.getStorage()?.removeItem(key);
    } catch {
      // Sem acesso ao armazenamento não há o que limpar.
    }
  }

  private readOutbox(session: Session): RowChanges {
    return session.unstoredOutbox ?? this.readJson<RowChanges>(this.keyOf(session.userId, "outbox")) ?? {};
  }

  private writeOutbox(session: Session, changes: RowChanges): void {
    const key = this.keyOf(session.userId, "outbox");
    session.unstoredOutbox = null;
    if (isEmptyChanges(changes)) {
      this.remove(key);
    } else if (!this.write(key, changes)) {
      // Fica na memória para ainda ser enviada; a versão antiga no navegador não vale mais.
      this.remove(key);
      session.unstoredOutbox = changes;
      this.onIssue({ kind: "local-copy-failed" });
    }
  }

  /** Tira da fila só o que foi enviado e não mudou de novo enquanto estava em trânsito. */
  private removeFromOutbox(session: Session, sent: RowChanges): void {
    const current = this.readOutbox(session);
    for (const table of TABLES) {
      const pending = current[table];
      if (!pending) continue;
      for (const [id, row] of Object.entries(sent[table] ?? {})) {
        if (JSON.stringify(pending[id]) === JSON.stringify(row)) delete pending[id];
      }
    }
    this.writeOutbox(session, current);
  }

  private setAside(session: Session, changes: RowChanges): void {
    const key = this.keyOf(session.userId, "rejected");
    const previous = this.readJson<RowChanges[]>(key) ?? [];
    this.write(key, [...previous, changes]);
  }

  private readCache(session: Session): PersistedAppState | null {
    const raw = this.readJson<unknown>(this.keyOf(session.userId, "cache"));
    if (!raw) return null;
    const parsed = parsePersistedState(raw);
    return parsed.ok ? parsed.state : null;
  }

  private writeCache(session: Session, state: PersistedAppState): void {
    this.write(this.keyOf(session.userId, "cache"), state);
  }
}
