import { describe, expect, it, vi } from "vitest";

import { SCHEMA_VERSION } from "@/domain/app-data";
import { DEFAULT_SETTINGS } from "@/domain/settings";

import { LocalStoragePersistence, STORAGE_KEY } from "./local-storage-persistence";
import { migrateState } from "./migrations";
import { parsePersistedState } from "./schema";

class MemoryStorage implements Storage {
  private map = new Map<string, string>();
  get length() {
    return this.map.size;
  }
  clear() {
    this.map.clear();
  }
  getItem(key: string) {
    return this.map.get(key) ?? null;
  }
  key(index: number) {
    return [...this.map.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.map.delete(key);
  }
  setItem(key: string, value: string) {
    this.map.set(key, value);
  }
  keys() {
    return [...this.map.keys()];
  }
}

const validTask = {
  id: "t1",
  title: "Site",
  status: "waiting",
  priority: "high",
  projectId: "p1",
  subtasks: [],
  updates: [],
  createdAt: "2026-10-01T10:00:00.000Z",
  updatedAt: "2026-10-01T10:00:00.000Z",
};
const validProject = {
  id: "p1",
  name: "Integradas",
  color: "sage",
  createdAt: "2026-10-01T10:00:00.000Z",
  updatedAt: "2026-10-01T10:00:00.000Z",
};
const validState = {
  schemaVersion: SCHEMA_VERSION,
  tasks: [validTask],
  projects: [validProject],
  settings: DEFAULT_SETTINGS,
};

describe("parsePersistedState", () => {
  it("aceita estado válido", () => {
    const result = parsePersistedState(validState);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.droppedItems).toBe(0);
    expect(result.state.tasks[0]).toMatchObject({ id: "t1", status: "waiting", projectId: "p1" });
  });

  it("descarta itens inválidos e conserta campos com valores padrão", () => {
    const result = parsePersistedState({
      ...validState,
      tasks: [
        { ...validTask, status: "doing", priority: 42, dueDate: "amanhã", subtasks: "nope" },
        { id: "", title: "sem id" },
        { id: "t3" },
        "lixo",
      ],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.droppedItems).toBe(3);
    expect(result.state.tasks).toHaveLength(1);
    expect(result.state.tasks[0]).toMatchObject({ status: "todo", priority: "normal", subtasks: [] });
    expect(result.state.tasks[0].dueDate).toBeUndefined();
  });

  it("remove projectId órfão, ids duplicados e corrige completedAt", () => {
    const result = parsePersistedState({
      ...validState,
      projects: [],
      tasks: [
        { ...validTask, status: "completed" },
        { ...validTask, title: "duplicada" },
        { ...validTask, id: "t2", completedAt: "2026-10-01T10:00:00.000Z" },
      ],
    });
    if (!result.ok) throw new Error("esperava ok");
    expect(result.state.tasks).toHaveLength(2);
    expect(result.state.tasks[0].projectId).toBeUndefined();
    expect(result.state.tasks[0].completedAt).toBe(validTask.updatedAt);
    expect(result.state.tasks[1].completedAt).toBeUndefined();
  });

  it("usa configurações padrão quando ausentes ou inválidas", () => {
    const result = parsePersistedState({ ...validState, settings: { defaultTaskView: "grid" } });
    if (!result.ok) throw new Error("esperava ok");
    expect(result.state.settings).toEqual({ ...DEFAULT_SETTINGS, displayName: undefined });
  });

  it("rejeita estrutura sem versão ou de versão futura", () => {
    expect(parsePersistedState({ tasks: [], projects: [] })).toEqual({ ok: false, reason: "invalid" });
    expect(parsePersistedState({ ...validState, schemaVersion: SCHEMA_VERSION + 1 })).toEqual({
      ok: false,
      reason: "newer",
    });
    expect(parsePersistedState({ schemaVersion: SCHEMA_VERSION, tasks: "x", projects: [] })).toEqual({
      ok: false,
      reason: "invalid",
    });
  });
});

describe("migrateState", () => {
  it("aplica migrations em sequência até a versão alvo", () => {
    const migrations = {
      1: (state: Record<string, unknown>) => ({ ...state, renamed: true }),
      2: (state: Record<string, unknown>) => ({ ...state, extra: 1 }),
    };
    const result = migrateState({ schemaVersion: 1 }, migrations, 3);
    expect(result).toEqual({ ok: true, migratedFrom: 1, state: { schemaVersion: 3, renamed: true, extra: 1 } });
  });

  it("falha quando falta uma migration intermediária", () => {
    expect(migrateState({ schemaVersion: 1 }, {}, 2)).toEqual({ ok: false, reason: "missing-migration" });
  });
});

describe("LocalStoragePersistence", () => {
  function setup(initial?: string) {
    const storage = new MemoryStorage();
    if (initial !== undefined) storage.setItem(STORAGE_KEY, initial);
    const onIssue = vi.fn();
    const persistence = new LocalStoragePersistence({ getStorage: () => storage, onIssue });
    return { storage, onIssue, persistence };
  }

  it("carrega da chave dusk:v1", () => {
    expect(setup().persistence.load()).toBeNull();
    const parsed = parsePersistedState(validState);
    if (!parsed.ok) throw new Error("esperava ok");
    expect(setup(JSON.stringify(validState)).persistence.load()).toEqual(parsed.state);
  });

  it("preserva conteúdo corrompido antes de começar vazio", () => {
    const { storage, onIssue, persistence } = setup("{not json");
    expect(persistence.load()).toBeNull();
    expect(onIssue).toHaveBeenCalledWith(expect.objectContaining({ kind: "unreadable" }));
    const recoveryKey = storage.keys().find((key) => key.startsWith("dusk:v1:recovery:"));
    expect(recoveryKey && storage.getItem(recoveryKey)).toBe("{not json");
  });

  it("tira da chave ativa o conteúdo ilegível já preservado: outra carga da página não repete o aviso", () => {
    const { storage, onIssue } = setup("{not json");
    new LocalStoragePersistence({ getStorage: () => storage, onIssue }).load();
    new LocalStoragePersistence({ getStorage: () => storage, onIssue }).load();
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
    expect(onIssue).toHaveBeenCalledTimes(1);
    expect(storage.keys().filter((key) => key.includes(":recovery:"))).toHaveLength(1);
  });

  it("não duplica cópia nem aviso ao recarregar o mesmo conteúdo ruim", () => {
    const { storage, onIssue, persistence } = setup("{not json");
    persistence.load();
    persistence.load();
    expect(onIssue).toHaveBeenCalledTimes(1);
    expect(storage.keys().filter((key) => key.includes(":recovery:"))).toHaveLength(1);
  });

  it("avisa quando dados vieram de versão mais nova", () => {
    const { onIssue, persistence } = setup(JSON.stringify({ ...validState, schemaVersion: 99 }));
    expect(persistence.load()).toBeNull();
    expect(onIssue).toHaveBeenCalledWith(expect.objectContaining({ kind: "newer-version" }));
  });

  it("avisa quando itens foram descartados na leitura", () => {
    const { onIssue, persistence } = setup(JSON.stringify({ ...validState, tasks: [validTask, { bad: true }] }));
    expect(persistence.load()?.tasks).toHaveLength(1);
    expect(onIssue).toHaveBeenCalledWith(expect.objectContaining({ kind: "repaired", droppedItems: 1 }));
  });
});
