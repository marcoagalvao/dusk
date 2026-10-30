import { SCHEMA_VERSION, type AppData } from "@/domain/app-data";

/**
 * Conversão entre o estado do app (`AppData`, aninhado e em camelCase) e as
 * linhas das tabelas do Supabase, mais o cálculo do que mudou entre dois estados.
 * Tudo aqui é puro: a rede fica em `supabase-remote.ts`.
 */

export const TABLES = ["projects", "tasks", "subtasks", "task_updates", "user_settings"] as const;
export type TableName = (typeof TABLES)[number];

export type RowValue = string | number | boolean | null;
export type Row = Record<string, RowValue>;

/** Todas as linhas conhecidas, por tabela e id. */
export type RowSet = Record<TableName, Record<string, Row>>;

/** O que precisa mudar: linha nova/alterada, ou `null` para apagar. */
export type RowChanges = Partial<Record<TableName, Record<string, Row | null>>>;

/** `user_settings` tem uma linha só por usuário; esta é a chave dela nos mapas. */
export const SETTINGS_KEY = "settings";

export function emptyRows(): RowSet {
  return { projects: {}, tasks: {}, subtasks: {}, task_updates: {}, user_settings: {} };
}

function byId<T extends { id: string }>(items: readonly T[], toRow: (item: T, index: number) => Row): Record<string, Row> {
  return Object.fromEntries(items.map((item, index) => [item.id, toRow(item, index)]));
}

export function stateToRows(data: AppData): RowSet {
  const subtasks: Record<string, Row> = {};
  const updates: Record<string, Row> = {};

  for (const task of data.tasks) {
    Object.assign(
      subtasks,
      byId(task.subtasks, (subtask, position) => ({
        id: subtask.id,
        task_id: task.id,
        title: subtask.title,
        completed: subtask.completed,
        position,
        created_at: subtask.createdAt,
        completed_at: subtask.completedAt ?? null,
      })),
    );
    Object.assign(
      updates,
      byId(task.updates, (update, position) => ({
        id: update.id,
        task_id: task.id,
        type: update.type,
        preset: update.preset ?? null,
        status: update.status,
        done: update.done ?? null,
        waiting_for: update.waitingFor ?? null,
        next_action: update.nextAction ?? null,
        note: update.note ?? null,
        review_date: update.reviewDate ?? null,
        position,
        created_at: update.createdAt,
      })),
    );
  }

  return {
    projects: byId(data.projects, (project) => ({
      id: project.id,
      name: project.name,
      color: project.color,
      description: project.description ?? null,
      archived_at: project.archivedAt ?? null,
      created_at: project.createdAt,
      updated_at: project.updatedAt,
    })),
    tasks: byId(data.tasks, (task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      project_id: task.projectId ?? null,
      due_date: task.dueDate ?? null,
      review_date: task.reviewDate ?? null,
      focus_date: task.focusDate ?? null,
      last_done: task.lastDone ?? null,
      waiting_for: task.waitingFor ?? null,
      next_action: task.nextAction ?? null,
      note: task.note ?? null,
      created_at: task.createdAt,
      updated_at: task.updatedAt,
      completed_at: task.completedAt ?? null,
      archived_at: task.archivedAt ?? null,
    })),
    subtasks,
    task_updates: updates,
    user_settings: {
      [SETTINGS_KEY]: {
        theme: data.settings.theme,
        default_task_view: data.settings.defaultTaskView,
        sidebar_collapsed: data.settings.sidebarCollapsed,
        display_name: data.settings.displayName ?? null,
      },
    },
  };
}

function optional(value: RowValue | undefined): string | undefined {
  return value === null || value === undefined ? undefined : String(value);
}

/** O Postgres devolve `+00:00`; o app compara timestamps como texto e usa o formato do `toISOString`. */
function timestamp(value: RowValue | undefined): string | undefined {
  const text = optional(value);
  if (!text) return undefined;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? text : date.toISOString();
}

function groupByTask(rows: Record<string, Row>): Map<string, Row[]> {
  const groups = new Map<string, Row[]>();
  for (const row of Object.values(rows)) {
    const taskId = String(row.task_id);
    groups.set(taskId, [...(groups.get(taskId) ?? []), row]);
  }
  for (const group of groups.values()) group.sort((a, b) => Number(a.position) - Number(b.position));
  return groups;
}

/**
 * Remonta o estado a partir das linhas. O resultado passa por
 * `parsePersistedState`, a mesma validação tolerante de backups importados.
 */
export function rowsToState(rows: RowSet): unknown {
  const subtasksByTask = groupByTask(rows.subtasks);
  const updatesByTask = groupByTask(rows.task_updates);
  const settings = rows.user_settings[SETTINGS_KEY];

  const tasks = Object.values(rows.tasks)
    .sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))
    .map((row) => ({
      id: row.id,
      title: row.title,
      status: row.status,
      priority: row.priority,
      projectId: optional(row.project_id),
      dueDate: optional(row.due_date),
      reviewDate: optional(row.review_date),
      focusDate: optional(row.focus_date),
      lastDone: optional(row.last_done),
      waitingFor: optional(row.waiting_for),
      nextAction: optional(row.next_action),
      note: optional(row.note),
      subtasks: (subtasksByTask.get(String(row.id)) ?? []).map((subtask) => ({
        id: subtask.id,
        title: subtask.title,
        completed: subtask.completed,
        createdAt: timestamp(subtask.created_at),
        completedAt: timestamp(subtask.completed_at),
      })),
      updates: (updatesByTask.get(String(row.id)) ?? []).map((update) => ({
        id: update.id,
        taskId: row.id,
        type: update.type,
        preset: optional(update.preset),
        status: update.status,
        done: optional(update.done),
        waitingFor: optional(update.waiting_for),
        nextAction: optional(update.next_action),
        note: optional(update.note),
        reviewDate: optional(update.review_date),
        createdAt: timestamp(update.created_at),
      })),
      createdAt: timestamp(row.created_at),
      updatedAt: timestamp(row.updated_at),
      completedAt: timestamp(row.completed_at),
      archivedAt: timestamp(row.archived_at),
    }));

  const projects = Object.values(rows.projects)
    .sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))
    .map((row) => ({
      id: row.id,
      name: row.name,
      color: row.color,
      description: optional(row.description),
      archivedAt: timestamp(row.archived_at),
      createdAt: timestamp(row.created_at),
      updatedAt: timestamp(row.updated_at),
    }));

  return {
    schemaVersion: SCHEMA_VERSION,
    tasks,
    projects,
    settings: settings && {
      theme: settings.theme,
      defaultTaskView: settings.default_task_view,
      sidebarCollapsed: settings.sidebar_collapsed,
      displayName: optional(settings.display_name),
    },
  };
}

export function diffRows(base: RowSet, next: RowSet): RowChanges {
  const changes: RowChanges = {};
  for (const table of TABLES) {
    const tableChanges: Record<string, Row | null> = {};
    for (const [id, row] of Object.entries(next[table])) {
      const previous = base[table][id];
      if (!previous || JSON.stringify(previous) !== JSON.stringify(row)) tableChanges[id] = row;
    }
    for (const id of Object.keys(base[table])) {
      if (!(id in next[table])) tableChanges[id] = null;
    }
    if (Object.keys(tableChanges).length > 0) changes[table] = tableChanges;
  }
  return changes;
}

export function applyChanges(rows: RowSet, changes: RowChanges): RowSet {
  const result = emptyRows();
  for (const table of TABLES) {
    const merged = { ...rows[table] };
    for (const [id, row] of Object.entries(changes[table] ?? {})) {
      if (row === null) delete merged[id];
      else merged[id] = row;
    }
    result[table] = merged;
  }
  return result;
}

/** Junta duas filas de mudanças; o que vem em `later` vence por linha. */
export function mergeChanges(earlier: RowChanges, later: RowChanges): RowChanges {
  const merged: RowChanges = { ...earlier };
  for (const table of TABLES) {
    if (later[table]) merged[table] = { ...earlier[table], ...later[table] };
  }
  return merged;
}

/** Uma mudança por linha, na ordem que respeita as chaves estrangeiras: pais antes ao gravar, filhos antes ao apagar. */
export function splitChanges(changes: RowChanges): RowChanges[] {
  const writes: RowChanges[] = [];
  const deletes: RowChanges[] = [];
  for (const table of TABLES) {
    for (const [id, row] of Object.entries(changes[table] ?? {})) {
      (row === null ? deletes : writes).push({ [table]: { [id]: row } });
    }
  }
  return [...writes, ...deletes.reverse()];
}

export function isEmptyChanges(changes: RowChanges): boolean {
  return TABLES.every((table) => Object.keys(changes[table] ?? {}).length === 0);
}

function mergeById<T extends { id: string; updatedAt: string }>(base: readonly T[], incoming: readonly T[]): T[] {
  const merged = new Map(base.map((item) => [item.id, item]));
  for (const item of incoming) {
    const current = merged.get(item.id);
    if (!current || item.updatedAt > current.updatedAt) merged.set(item.id, item);
  }
  return [...merged.values()];
}

/** União sem perda entre dois conjuntos de dados (importação dos dados antigos de cada navegador). */
export function mergeAppData(base: AppData, incoming: AppData): AppData {
  return {
    tasks: mergeById(base.tasks, incoming.tasks),
    projects: mergeById(base.projects, incoming.projects),
    settings: base.settings,
  };
}
