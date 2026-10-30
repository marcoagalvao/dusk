import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import type { AppData } from "@/domain/app-data";
import { DEFAULT_SETTINGS } from "@/domain/settings";

import { applyChanges, diffRows, isEmptyChanges, mergeAppData, rowsToState, splitChanges, stateToRows, TABLES } from "./rows";
import { parsePersistedState } from "./schema";

const TS = "2026-10-01T10:00:00.000Z";

const data: AppData = {
  projects: [{ id: "p1", name: "Integradas", color: "sage", createdAt: TS, updatedAt: TS }],
  tasks: [
    {
      id: "t1",
      title: "Site",
      status: "waiting",
      priority: "high",
      projectId: "p1",
      dueDate: "2026-10-05",
      waitingFor: "Cliente",
      subtasks: [
        { id: "s1", title: "Layout", completed: true, createdAt: TS, completedAt: TS },
        { id: "s2", title: "Textos", completed: false, createdAt: TS },
      ],
      updates: [{ id: "u1", taskId: "t1", type: "progress", status: "waiting", done: "Enviei", createdAt: TS }],
      createdAt: TS,
      updatedAt: TS,
    },
  ],
  settings: { ...DEFAULT_SETTINGS, displayName: "Marco" },
};

function roundTrip(input: AppData): AppData {
  const result = parsePersistedState(rowsToState(stateToRows(input)));
  if (!result.ok) throw new Error("estado inválido");
  const { tasks, projects, settings } = result.state;
  return { tasks, projects, settings };
}

describe("stateToRows / rowsToState", () => {
  it("preserva tarefas, subtarefas, histórico, projetos e configurações na ida e volta", () => {
    expect(roundTrip(data)).toEqual(data);
  });

  it("guarda campos opcionais ausentes como null para o upsert em lote ter colunas uniformes", () => {
    const rows = stateToRows(data);
    expect(rows.tasks.t1.review_date).toBeNull();
    expect(rows.subtasks.s2.completed_at).toBeNull();
  });

  it("devolve subtarefas e histórico na ordem original, mesmo vindo fora de ordem do banco", () => {
    const rows = stateToRows(data);
    const reversed = { ...rows, subtasks: { s2: rows.subtasks.s2, s1: rows.subtasks.s1 } };
    const result = parsePersistedState(rowsToState(reversed));
    expect(result.ok && result.state.tasks[0].subtasks.map((subtask) => subtask.id)).toEqual(["s1", "s2"]);
  });

  it("normaliza timestamps do Postgres para o ISO usado pelo app", () => {
    const rows = stateToRows(data);
    rows.tasks.t1.created_at = "2026-10-01T10:00:00+00:00";
    const result = parsePersistedState(rowsToState(rows));
    expect(result.ok && result.state.tasks[0].createdAt).toBe(TS);
  });
});

describe("schema do banco", () => {
  /** Colunas de cada `create table` da migration, sem o dono da linha e sem as constraints. */
  function migrationColumns(): Record<string, string[]> {
    const sql = readFileSync(new URL("../../../supabase/migrations/0001_initial_schema.sql", import.meta.url), "utf8");
    const tables = [...sql.matchAll(/create table public\.(\w+) \(\n([\s\S]*?)\n\);/g)];
    return Object.fromEntries(
      tables.map(([, table, body]) => [
        table,
        body
          .split("\n")
          .map((line) => line.trim().split(/\s+/)[0])
          .filter((column) => !["user_id", "primary", "foreign"].includes(column))
          .sort(),
      ]),
    );
  }

  it("as linhas geradas pelo app têm exatamente as colunas das tabelas", () => {
    const rows = stateToRows(data);
    const generated = Object.fromEntries(
      TABLES.map((table) => [table, Object.keys(Object.values(rows[table])[0]).sort()]),
    );
    expect(generated).toEqual(migrationColumns());
  });
});

describe("diffRows", () => {
  it("não gera mudanças quando nada mudou", () => {
    expect(isEmptyChanges(diffRows(stateToRows(data), stateToRows(data)))).toBe(true);
  });

  it("envia apenas a linha alterada", () => {
    const next: AppData = { ...data, tasks: [{ ...data.tasks[0], title: "Site novo" }] };
    const changes = diffRows(stateToRows(data), stateToRows(next));
    expect(Object.keys(changes)).toEqual(["tasks"]);
    expect(changes.tasks?.t1?.title).toBe("Site novo");
  });

  it("marca como null o que foi removido, incluindo os filhos da tarefa", () => {
    const changes = diffRows(stateToRows(data), stateToRows({ ...data, tasks: [] }));
    expect(changes.tasks).toEqual({ t1: null });
    expect(changes.subtasks).toEqual({ s1: null, s2: null });
    expect(changes.task_updates).toEqual({ u1: null });
  });

  it("aplicar o diff sobre a base resulta no estado novo", () => {
    const next: AppData = { ...data, tasks: [], projects: [] };
    const base = stateToRows(data);
    expect(applyChanges(base, diffRows(base, stateToRows(next)))).toEqual(stateToRows(next));
  });
});

describe("splitChanges", () => {
  it("separa por linha, com pais antes ao gravar e filhos antes ao apagar", () => {
    const parts = splitChanges({
      projects: { p1: { id: "p1" }, p2: null },
      tasks: { t1: { id: "t1" }, t2: null },
    });
    expect(parts).toEqual([
      { projects: { p1: { id: "p1" } } },
      { tasks: { t1: { id: "t1" } } },
      { tasks: { t2: null } },
      { projects: { p2: null } },
    ]);
  });
});

describe("mergeAppData", () => {
  it("une dados de dois dispositivos sem perder nenhum item", () => {
    const other: AppData = {
      ...data,
      tasks: [{ ...data.tasks[0], id: "t2", title: "Outra", subtasks: [], updates: [] }],
      projects: [],
    };
    const merged = mergeAppData(data, other);
    expect(merged.tasks.map((task) => task.id).sort()).toEqual(["t1", "t2"]);
    expect(merged.projects.map((project) => project.id)).toEqual(["p1"]);
  });

  it("no mesmo id, fica a versão atualizada por último", () => {
    const newer = { ...data.tasks[0], title: "Mais nova", updatedAt: "2026-10-09T10:00:00.000Z" };
    expect(mergeAppData(data, { ...data, tasks: [newer] }).tasks[0].title).toBe("Mais nova");
    expect(mergeAppData({ ...data, tasks: [newer] }, data).tasks[0].title).toBe("Mais nova");
  });
});
