import { beforeEach, describe, expect, it } from "vitest";

import { SCHEMA_VERSION, type PersistedAppState } from "@/domain/app-data";
import { DEFAULT_SETTINGS } from "@/domain/settings";
import type { Task } from "@/domain/task";

import { applyChanges, emptyRows, stateToRows, type RowChanges, type RowSet } from "./rows";
import { RemoteError, SyncedPersistence, type RemoteStore } from "./synced-persistence";
import type { PersistenceIssue } from "./types";

const TS = "2026-10-01T10:00:00.000Z";

function makeTask(id: string, patch: Partial<Task> = {}): Task {
  return {
    id,
    title: `Tarefa ${id}`,
    status: "todo",
    priority: "normal",
    subtasks: [],
    updates: [],
    createdAt: TS,
    updatedAt: TS,
    ...patch,
  };
}

function makeState(tasks: Task[]): PersistedAppState {
  return { schemaVersion: SCHEMA_VERSION, tasks, projects: [], settings: { ...DEFAULT_SETTINGS } };
}

class FakeRemote implements RemoteStore {
  rows: RowSet = emptyRows();
  applied: RowChanges[] = [];
  failWith: Error | null = null;
  rejectIds = new Set<string>();
  beforeFetch: (() => void) | null = null;
  fetches = 0;

  async fetchAll(): Promise<RowSet> {
    this.fetches += 1;
    if (this.failWith) throw this.failWith;
    this.beforeFetch?.();
    return structuredClone(this.rows);
  }

  async apply(changes: RowChanges): Promise<void> {
    if (this.failWith) throw this.failWith;
    if (Object.values(changes).some((rows) => Object.keys(rows).some((id) => this.rejectIds.has(id)))) {
      throw new RemoteError("violates foreign key", true);
    }
    this.applied.push(structuredClone(changes));
    this.rows = applyChanges(this.rows, changes);
  }
}

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (key) => map.get(key) ?? null,
    key: (index) => [...map.keys()][index] ?? null,
    removeItem: (key) => void map.delete(key),
    setItem: (key, value) => void map.set(key, value),
  };
}

describe("SyncedPersistence", () => {
  let remote: FakeRemote;
  let storage: Storage;
  let issues: PersistenceIssue[];

  function create(legacy?: NonNullable<ConstructorParameters<typeof SyncedPersistence>[0]>["legacy"]) {
    const persistence = new SyncedPersistence({
      getStorage: () => storage,
      onIssue: (issue) => issues.push(issue),
      debounceMs: 0,
      retryMs: 0,
      autoRetry: false,
      legacy,
    });
    persistence.connect("user-1", remote);
    return persistence;
  }

  beforeEach(() => {
    remote = new FakeRemote();
    storage = memoryStorage();
    issues = [];
  });

  it("carrega do banco", async () => {
    remote.rows = stateToRows(makeState([makeTask("t1")]));
    const state = await create().load();
    expect(state?.tasks.map((task) => task.id)).toEqual(["t1"]);
  });

  it("ignora salvamentos antes de carregar: um estado vazio não pode apagar o banco", async () => {
    remote.rows = stateToRows(makeState([makeTask("t1")]));
    const persistence = create();
    persistence.save(makeState([]));
    await persistence.flush();
    expect(remote.applied).toEqual([]);
    expect(Object.keys(remote.rows.tasks)).toEqual(["t1"]);
  });

  it("envia só o que mudou", async () => {
    remote.rows = stateToRows(makeState([makeTask("t1"), makeTask("t2")]));
    const persistence = create();
    await persistence.load();
    persistence.save(makeState([makeTask("t1", { title: "Editada" }), makeTask("t2")]));
    await persistence.flush();
    expect(remote.applied).toHaveLength(1);
    expect(Object.keys(remote.applied[0].tasks ?? {})).toEqual(["t1"]);
    expect(remote.rows.tasks.t1.title).toBe("Editada");
  });

  it("não reenvia nada quando o estado não mudou", async () => {
    const persistence = create();
    const state = makeState([makeTask("t1")]);
    remote.rows = stateToRows(state);
    await persistence.load();
    persistence.save(state);
    await persistence.flush();
    expect(remote.applied).toEqual([]);
  });

  it("apaga no banco o que foi removido", async () => {
    remote.rows = stateToRows(makeState([makeTask("t1")]));
    const persistence = create();
    await persistence.load();
    persistence.save(makeState([]));
    await persistence.flush();
    expect(remote.rows.tasks).toEqual({});
  });

  it("depois de desconectar, zerar o store não apaga o banco", async () => {
    remote.rows = stateToRows(makeState([makeTask("t1")]));
    const persistence = create();
    await persistence.load();
    persistence.disconnect();
    persistence.save(makeState([]));
    await persistence.flush();
    expect(Object.keys(remote.rows.tasks)).toEqual(["t1"]);
  });

  it("sem conexão, mantém a alteração na fila e avisa", async () => {
    const persistence = create();
    await persistence.load();
    remote.failWith = new RemoteError("offline", false);
    persistence.save(makeState([makeTask("t1")]));
    await persistence.flush();
    expect(issues).toContainEqual({ kind: "write-failed" });
    expect(persistence.hasPendingChanges()).toBe(true);
  });

  it("a fila sobrevive a recarregar a página e é enviada ao voltar a conexão", async () => {
    const first = create();
    await first.load();
    remote.failWith = new RemoteError("offline", false);
    first.save(makeState([makeTask("t1")]));
    await first.flush();

    remote.failWith = null;
    const second = create();
    const state = await second.load();
    expect(state?.tasks.map((task) => task.id)).toEqual(["t1"]);
    expect(Object.keys(remote.rows.tasks)).toEqual(["t1"]);
    expect(second.hasPendingChanges()).toBe(false);
  });

  it("sem conexão ao abrir, mostra a última cópia conhecida", async () => {
    remote.rows = stateToRows(makeState([makeTask("t1")]));
    await create().load();

    remote.failWith = new RemoteError("offline", false);
    const state = await create().load();
    expect(state?.tasks.map((task) => task.id)).toEqual(["t1"]);
  });

  it("sem conexão e sem cópia, falha em vez de fingir que está vazio", async () => {
    remote.failWith = new RemoteError("offline", false);
    await expect(create().load()).rejects.toThrow();
  });

  it("se o banco recusar definitivamente, preserva a alteração à parte e destrava a fila", async () => {
    const persistence = create();
    await persistence.load();
    remote.failWith = new RemoteError("violates foreign key", true);
    persistence.save(makeState([makeTask("t1")]));
    await persistence.flush();

    expect(issues).toContainEqual({ kind: "rejected" });
    expect(persistence.hasPendingChanges()).toBe(false);
    expect(storage.getItem("dusk:v2:user-1:rejected")).toContain("t1");
  });

  it("uma linha recusada não leva junto as outras alterações da fila", async () => {
    const persistence = create();
    await persistence.load();
    remote.rejectIds.add("ruim");
    persistence.save(makeState([makeTask("boa"), makeTask("ruim"), makeTask("outra")]));
    await persistence.flush();

    expect(Object.keys(remote.rows.tasks).sort()).toEqual(["boa", "outra"]);
    expect(issues).toContainEqual({ kind: "rejected" });
    expect(persistence.hasPendingChanges()).toBe(false);
    const rejected = storage.getItem("dusk:v2:user-1:rejected") ?? "";
    expect(rejected).toContain("ruim");
    expect(rejected).not.toContain("boa");
  });

  it("sem conseguir gravar a fila no navegador, ainda envia a alteração e avisa", async () => {
    const persistence = create();
    await persistence.load();
    storage.setItem = () => {
      throw new Error("QuotaExceededError");
    };
    persistence.save(makeState([makeTask("t1")]));
    expect(persistence.hasPendingChanges()).toBe(true);
    await persistence.flush();

    expect(Object.keys(remote.rows.tasks)).toEqual(["t1"]);
    expect(issues).toContainEqual({ kind: "local-copy-failed" });
    expect(persistence.hasPendingChanges()).toBe(false);
  });

  it("sem armazenamento no navegador, ainda envia a alteração", async () => {
    const persistence = new SyncedPersistence({ getStorage: () => null, onIssue: (issue) => issues.push(issue), debounceMs: 0, autoRetry: false });
    persistence.connect("user-1", remote);
    await persistence.load();
    persistence.save(makeState([makeTask("t1")]));
    await persistence.flush();
    expect(Object.keys(remote.rows.tasks)).toEqual(["t1"]);
  });

  it("leituras simultâneas compartilham a mesma consulta ao banco", async () => {
    const persistence = create();
    await Promise.all([persistence.load(), persistence.load()]);
    expect(remote.fetches).toBe(1);
  });

  it("forgetCache apaga a cópia local mesmo depois de desconectar", async () => {
    remote.rows = stateToRows(makeState([makeTask("t1")]));
    const persistence = create();
    await persistence.load();
    persistence.disconnect();
    persistence.forgetCache("user-1");
    expect(storage.getItem("dusk:v2:user-1:cache")).toBeNull();
  });

  it("uma edição feita durante o carregamento não é sobrescrita", async () => {
    remote.rows = stateToRows(makeState([makeTask("t1")]));
    const persistence = create();
    await persistence.load();

    const edited = makeState([makeTask("t1", { title: "Editada durante o refresh" })]);
    remote.beforeFetch = () => {
      persistence.save(edited);
      remote.beforeFetch = null;
    };
    const state = await persistence.load();
    expect(state?.tasks[0].title).toBe("Editada durante o refresh");
  });

  it("recarregar sem novidades devolve o mesmo objeto, sem re-render", async () => {
    remote.rows = stateToRows(makeState([makeTask("t1")]));
    const persistence = create();
    const first = await persistence.load();
    const second = await persistence.load();
    expect(second).toBe(first);
  });

  describe("importação dos dados antigos do navegador", () => {
    function legacyOf(state: PersistedAppState | null) {
      const legacy = { archived: false, load: () => (legacy.archived ? null : state), archive: () => void (legacy.archived = true) };
      return legacy;
    }

    it("envia os dados locais quando o banco está vazio", async () => {
      const legacy = legacyOf(makeState([makeTask("local")]));
      const persistence = create(legacy);
      const state = await persistence.load();
      await persistence.flush();
      expect(state?.tasks.map((task) => task.id)).toEqual(["local"]);
      expect(Object.keys(remote.rows.tasks)).toEqual(["local"]);
      expect(legacy.archived).toBe(true);
      expect(issues).toContainEqual({ kind: "legacy-imported", tasks: 1, projects: 0 });
    });

    it("une com o que já está no banco (segundo dispositivo) e importa uma vez só", async () => {
      remote.rows = stateToRows(makeState([makeTask("remoto")]));
      const legacy = legacyOf(makeState([makeTask("local")]));
      const persistence = create(legacy);
      const state = await persistence.load();
      await persistence.flush();
      expect(state?.tasks.map((task) => task.id).sort()).toEqual(["local", "remoto"]);

      await persistence.load();
      expect(remote.applied).toHaveLength(1);
    });

    it("não importa nem arquiva se o banco estiver fora do ar", async () => {
      remote.failWith = new RemoteError("offline", false);
      const legacy = legacyOf(makeState([makeTask("local")]));
      await expect(create(legacy).load()).rejects.toThrow();
      expect(legacy.archived).toBe(false);
    });
  });
});
