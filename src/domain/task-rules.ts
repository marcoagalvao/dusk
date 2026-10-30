import { isValidDateKey } from "@/lib/dates";
import { createId } from "@/lib/utils/id";
import { cleanText } from "@/lib/utils/text";

import type { Subtask, Task, TaskPriority, TaskStatus, TaskUpdate } from "./task";

/**
 * Regras de negócio de tarefas como funções puras: recebem a tarefa atual e o
 * instante (`now`, ISO) e devolvem uma nova tarefa. Não tocam em store nem UI.
 */

export interface CreateTaskInput {
  title: string;
  projectId?: string;
  dueDate?: string;
  focusDate?: string;
  priority?: TaskPriority;
  reviewDate?: string;
}

export function buildTask(input: CreateTaskInput, now: string): Task {
  const title = cleanText(input.title);
  if (!title) throw new Error("A tarefa precisa de um título.");

  return {
    id: createId(),
    title,
    status: "todo",
    priority: input.priority ?? "normal",
    projectId: input.projectId || undefined,
    dueDate: validDateOrUndefined(input.dueDate),
    reviewDate: validDateOrUndefined(input.reviewDate),
    focusDate: validDateOrUndefined(input.focusDate),
    subtasks: [],
    updates: [],
    createdAt: now,
    updatedAt: now,
  };
}

function validDateOrUndefined(value: string | null | undefined): string | undefined {
  return isValidDateKey(value) ? value : undefined;
}

function buildUpdate(
  task: Task,
  fields: Omit<TaskUpdate, "id" | "taskId" | "createdAt">,
  now: string,
): TaskUpdate {
  return { id: createId(), taskId: task.id, createdAt: now, ...fields };
}

function transitionType(from: TaskStatus, to: TaskStatus): TaskUpdate["type"] {
  if (to === "completed" && from !== "completed") return "completed";
  if (from === "completed" && to !== "completed") return "reopened";
  return "status_change";
}

/**
 * Troca o status registrando o evento correspondente na timeline.
 * Concluir define `completedAt`; sair de Concluído o limpa (evento `reopened`).
 */
export function changeStatus(task: Task, status: TaskStatus, now: string): Task {
  if (task.status === status) return task;

  const update = buildUpdate(task, { type: transitionType(task.status, status), status }, now);

  return {
    ...task,
    status,
    completedAt: status === "completed" ? now : undefined,
    updatedAt: now,
    updates: [...task.updates, update],
  };
}

export function completeTask(task: Task, now: string): Task {
  return changeStatus(task, "completed", now);
}

export function reopenTask(task: Task, now: string): Task {
  return changeStatus(task, "todo", now);
}

export interface ProgressInput {
  status: TaskStatus;
  preset?: string;
  done?: string;
  waitingFor?: string;
  nextAction?: string;
  reviewDate?: string;
  note?: string;
}

function normalizeProgress(input: ProgressInput) {
  return {
    done: cleanText(input.done),
    waitingFor: cleanText(input.waitingFor),
    nextAction: cleanText(input.nextAction),
    reviewDate: validDateOrUndefined(input.reviewDate),
    note: cleanText(input.note),
  };
}

export function hasProgressChanges(task: Task, input: ProgressInput): boolean {
  const next = normalizeProgress(input);
  return (
    input.status !== task.status ||
    next.done !== undefined ||
    next.note !== undefined ||
    next.waitingFor !== task.waitingFor ||
    next.nextAction !== task.nextAction ||
    next.reviewDate !== task.reviewDate
  );
}

/**
 * Aplica uma atualização de andamento: os valores do formulário passam a ser o
 * estado atual da tarefa e um registro imutável é criado na timeline. O
 * registro guarda apenas o que mudou, para a timeline não repetir contexto.
 */
export function applyProgressUpdate(task: Task, input: ProgressInput, now: string): Task {
  const next = normalizeProgress(input);
  const changed = <K extends "waitingFor" | "nextAction" | "reviewDate">(key: K) =>
    next[key] !== task[key] ? next[key] : undefined;

  const type = transitionType(task.status, input.status);
  const update = buildUpdate(
    task,
    {
      type: type === "status_change" ? "progress" : type,
      preset: input.preset,
      status: input.status,
      done: next.done,
      waitingFor: changed("waitingFor"),
      nextAction: changed("nextAction"),
      reviewDate: changed("reviewDate"),
      note: next.note,
    },
    now,
  );

  const completedAt =
    input.status === "completed"
      ? task.status === "completed"
        ? task.completedAt
        : now
      : undefined;

  return {
    ...task,
    status: input.status,
    lastDone: next.done ?? task.lastDone,
    waitingFor: next.waitingFor,
    nextAction: next.nextAction,
    reviewDate: next.reviewDate,
    completedAt,
    updatedAt: now,
    updates: [...task.updates, update],
  };
}

/** `undefined` = não alterar; `null` = limpar o campo. */
export interface TaskPatch {
  title?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  projectId?: string | null;
  dueDate?: string | null;
  reviewDate?: string | null;
  focusDate?: string | null;
  lastDone?: string | null;
  waitingFor?: string | null;
  nextAction?: string | null;
  note?: string | null;
}

const TEXT_FIELDS = ["lastDone", "waitingFor", "nextAction", "note"] as const;
const DATE_FIELDS = ["dueDate", "reviewDate", "focusDate"] as const;

/** Edição direta de campos. Mudança de status passa por `changeStatus`. */
export function patchTask(task: Task, patch: TaskPatch, now: string): Task {
  const withStatus = patch.status ? changeStatus(task, patch.status, now) : task;
  const fields: Partial<Task> = {};

  if (patch.title !== undefined) {
    const title = cleanText(patch.title);
    if (title && title !== task.title) fields.title = title;
  }
  if (patch.priority && patch.priority !== task.priority) {
    fields.priority = patch.priority;
  }
  if (patch.projectId !== undefined) {
    const projectId = patch.projectId || undefined;
    if (projectId !== task.projectId) fields.projectId = projectId;
  }
  for (const key of TEXT_FIELDS) {
    if (patch[key] === undefined) continue;
    const value = cleanText(patch[key]);
    if (value !== task[key]) fields[key] = value;
  }
  for (const key of DATE_FIELDS) {
    if (patch[key] === undefined) continue;
    const value = validDateOrUndefined(patch[key]);
    if (value !== task[key]) fields[key] = value;
  }

  if (withStatus === task && Object.keys(fields).length === 0) return task;
  return { ...withStatus, ...fields, updatedAt: now };
}

export function setFocus(task: Task, focusDate: string | null, now: string): Task {
  return patchTask(task, { focusDate }, now);
}

export function archiveTask(task: Task, now: string): Task {
  return { ...task, archivedAt: now, updatedAt: now };
}

export function unarchiveTask(task: Task, now: string): Task {
  return { ...task, archivedAt: undefined, updatedAt: now };
}

function withSubtasks(task: Task, subtasks: Subtask[], now: string): Task {
  return { ...task, subtasks, updatedAt: now };
}

export function addSubtask(task: Task, title: string, now: string): Task {
  const clean = cleanText(title);
  if (!clean) return task;
  const subtask: Subtask = { id: createId(), title: clean, completed: false, createdAt: now };
  return withSubtasks(task, [...task.subtasks, subtask], now);
}

export function toggleSubtask(task: Task, subtaskId: string, now: string): Task {
  return withSubtasks(
    task,
    task.subtasks.map((subtask) =>
      subtask.id === subtaskId
        ? {
            ...subtask,
            completed: !subtask.completed,
            completedAt: subtask.completed ? undefined : now,
          }
        : subtask,
    ),
    now,
  );
}

export function renameSubtask(task: Task, subtaskId: string, title: string, now: string): Task {
  const clean = cleanText(title);
  const current = task.subtasks.find((subtask) => subtask.id === subtaskId);
  if (!clean || !current || current.title === clean) return task;
  return withSubtasks(
    task,
    task.subtasks.map((subtask) => (subtask.id === subtaskId ? { ...subtask, title: clean } : subtask)),
    now,
  );
}

export function removeSubtask(task: Task, subtaskId: string, now: string): Task {
  return withSubtasks(
    task,
    task.subtasks.filter((subtask) => subtask.id !== subtaskId),
    now,
  );
}

export function subtaskProgress(task: Task): { done: number; total: number; percent: number } {
  const total = task.subtasks.length;
  const done = task.subtasks.filter((subtask) => subtask.completed).length;
  return { done, total, percent: total === 0 ? 0 : Math.round((done / total) * 100) };
}
