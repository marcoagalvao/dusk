import { z } from "zod";

import { SCHEMA_VERSION, type AppData, type PersistedAppState } from "@/domain/app-data";
import { PROJECT_COLORS, PROJECT_NAME_MAX_LENGTH, type Project } from "@/domain/project";
import { DEFAULT_SETTINGS, TASK_VIEWS, type AppSettings } from "@/domain/settings";
import { TASK_PRIORITIES, TASK_STATUSES, TASK_UPDATE_TYPES, type Task } from "@/domain/task";
import { isValidDateKey, isValidIsoTimestamp, nowIso } from "@/lib/dates";
import { cleanText } from "@/lib/utils/text";

import { isRecord, migrateState } from "./migrations";

/**
 * Validação de dados não confiáveis (localStorage e backups importados).
 *
 * Estratégia tolerante: campos opcionais inválidos viram `undefined`, enums
 * inválidos voltam ao padrão e itens sem `id`/título são descartados um a um,
 * em vez de rejeitar o arquivo inteiro por causa de um registro ruim.
 */

const id = z.string().trim().min(1);
const requiredText = z.string().trim().min(1);
const optionalText = z.string().transform(cleanText).optional().catch(undefined);
const optionalDate = z.string().refine(isValidDateKey).optional().catch(undefined);
const optionalTimestamp = z.string().refine(isValidIsoTimestamp).optional().catch(undefined);
const timestamp = z
  .string()
  .refine(isValidIsoTimestamp)
  .catch(() => nowIso());

/** Lista tolerante: ignora itens inválidos em vez de falhar. */
function lenientList<T extends z.ZodType>(schema: T) {
  return z.unknown().transform((value): Array<z.output<T>> => {
    if (!Array.isArray(value)) return [];
    return value.flatMap((item) => {
      const result = schema.safeParse(item);
      return result.success ? [result.data] : [];
    });
  });
}

const subtaskSchema = z.object({
  id,
  title: requiredText,
  completed: z.boolean().catch(false),
  createdAt: timestamp,
  completedAt: optionalTimestamp,
});

const taskUpdateSchema = z.object({
  id,
  taskId: z.string().catch(""),
  type: z.enum(TASK_UPDATE_TYPES).catch("progress"),
  preset: optionalText,
  status: z.enum(TASK_STATUSES).catch("todo"),
  done: optionalText,
  waitingFor: optionalText,
  nextAction: optionalText,
  note: optionalText,
  reviewDate: optionalDate,
  createdAt: timestamp,
});

const taskSchema = z.object({
  id,
  title: requiredText,
  status: z.enum(TASK_STATUSES).catch("todo"),
  priority: z.enum(TASK_PRIORITIES).catch("normal"),
  projectId: optionalText,
  dueDate: optionalDate,
  reviewDate: optionalDate,
  focusDate: optionalDate,
  lastDone: optionalText,
  waitingFor: optionalText,
  nextAction: optionalText,
  note: optionalText,
  subtasks: lenientList(subtaskSchema),
  updates: lenientList(taskUpdateSchema),
  createdAt: timestamp,
  updatedAt: timestamp,
  completedAt: optionalTimestamp,
  archivedAt: optionalTimestamp,
});

const projectSchema = z.object({
  id,
  name: requiredText.transform((name) => name.slice(0, PROJECT_NAME_MAX_LENGTH)),
  color: z.enum(PROJECT_COLORS).catch("lavender"),
  description: optionalText,
  archivedAt: optionalTimestamp,
  createdAt: timestamp,
  updatedAt: timestamp,
});

const settingsSchema = z
  .object({
    theme: z.literal("pastel-dusk").catch("pastel-dusk"),
    defaultTaskView: z.enum(TASK_VIEWS).catch(DEFAULT_SETTINGS.defaultTaskView),
    sidebarCollapsed: z.boolean().catch(DEFAULT_SETTINGS.sidebarCollapsed),
    displayName: optionalText,
  })
  .catch({ ...DEFAULT_SETTINGS });

function parseUniqueList<T extends { id: string }>(
  value: unknown,
  schema: z.ZodType<T>,
): { items: T[]; dropped: number } {
  if (!Array.isArray(value)) return { items: [], dropped: 0 };
  const seen = new Set<string>();
  const items: T[] = [];
  for (const raw of value) {
    const result = schema.safeParse(raw);
    if (!result.success || seen.has(result.data.id)) continue;
    seen.add(result.data.id);
    items.push(result.data);
  }
  return { items, dropped: value.length - items.length };
}

/** Garante invariantes entre campos que o schema sozinho não cobre. */
function normalizeTask(task: Task, projectIds: ReadonlySet<string>): Task {
  const completed = task.status === "completed";
  return {
    ...task,
    projectId: task.projectId && projectIds.has(task.projectId) ? task.projectId : undefined,
    completedAt: completed ? (task.completedAt ?? task.updatedAt) : undefined,
    updates: task.updates.map((update) => ({ ...update, taskId: task.id })),
  };
}

export function sanitizeAppData(raw: Record<string, unknown>): { data: AppData; droppedItems: number } {
  const projects = parseUniqueList<Project>(raw.projects, projectSchema);
  const tasks = parseUniqueList<Task>(raw.tasks, taskSchema);
  const settings: AppSettings = settingsSchema.parse(raw.settings);
  const projectIds = new Set(projects.items.map((project) => project.id));

  return {
    data: {
      projects: projects.items,
      tasks: tasks.items.map((task) => normalizeTask(task, projectIds)),
      settings,
    },
    droppedItems: projects.dropped + tasks.dropped,
  };
}

export type ParseStateResult =
  | { ok: true; state: PersistedAppState; droppedItems: number; migratedFrom?: number }
  | { ok: false; reason: "invalid" | "newer" | "missing-migration" };

/** Migra (se preciso) e valida um estado salvo de qualquer versão conhecida. */
export function parsePersistedState(raw: unknown): ParseStateResult {
  const migrated = migrateState(raw);
  if (!migrated.ok) return migrated;

  const { state } = migrated;
  if (!isRecord(state) || !Array.isArray(state.tasks) || !Array.isArray(state.projects)) {
    return { ok: false, reason: "invalid" };
  }

  const { data, droppedItems } = sanitizeAppData(state);
  return {
    ok: true,
    state: { schemaVersion: SCHEMA_VERSION, ...data },
    droppedItems,
    migratedFrom: migrated.migratedFrom,
  };
}
