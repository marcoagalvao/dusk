import { FOCUS_SOFT_LIMIT, STATUS_LABELS, STATUSES_WITH_WAITING, type Task, type TaskStatus } from "@/domain/task";
import { isInFocus } from "@/domain/task-queries";
import { leavesWaiting, subtaskProgress, type CreateTaskInput, type ProgressInput, type TaskPatch } from "@/domain/task-rules";
import { formatRelativeDay, todayKey } from "@/lib/dates";
import { pluralize } from "@/lib/utils/text";
import { useAppStore } from "@/store/app-store";
import { toast } from "@/store/ui-store";

/**
 * Ações de tarefa usadas pela UI: chamam o store e dão o feedback visual
 * correspondente (toasts, desfazer). Componentes não falam com o store para
 * mutações diretamente, assim o comportamento fica igual em todas as telas.
 */

const store = () => useAppStore.getState();

const UNDO_DURATION = 5000;
const EXPLAINED_UNDO_DURATION = 8000;

const findTask = (id: string) => store().tasks.find((task) => task.id === id);

/** Volta as tarefas ao estado anterior e remove as ocorrências que a conclusão criou. */
function undoAction(snapshots: readonly Task[], created: readonly Task[] = []) {
  return {
    label: "Desfazer",
    onAction: () => {
      for (const snapshot of snapshots) store().restoreTask(snapshot);
      for (const task of created) store().deleteTask(task.id);
    },
  };
}

export function createTask(input: CreateTaskInput): Task {
  const task = store().createTask(input);
  toast.success("Tarefa criada");
  return task;
}

function nextOccurrenceMessage(next: Task): string {
  return `A próxima fica para ${formatRelativeDay(next.dueDate!).toLowerCase()}.`;
}

/** Conta o que aconteceu além de concluir: nada muda sem aviso. */
function completionMessage(previous: Task, next?: Task): string {
  const parts = ["Tarefa concluída."];
  const { done, total } = subtaskProgress(previous);
  if (done < total) parts.push(`${pluralize(total - done, "subtarefa ficou aberta", "subtarefas ficaram abertas")}.`);
  if (STATUSES_WITH_WAITING.includes(previous.status) && (previous.waitingFor || previous.reviewDate)) parts.push("A espera foi encerrada.");
  else if (previous.reviewDate) parts.push("O lembrete continua marcado.");
  if (next) parts.push(nextOccurrenceMessage(next));
  return parts.join(" ");
}

export function completeTask(id: string): void {
  const result = store().completeTask(id);
  if (!result) return;
  const message = completionMessage(result.previous, result.next);
  toast.show(message, {
    tone: "success",
    duration: message === "Tarefa concluída." ? UNDO_DURATION : EXPLAINED_UNDO_DURATION,
    action: undoAction([result.previous], result.next ? [result.next] : []),
  });
}

export function reopenTask(id: string): void {
  store().reopenTask(id);
  const status = findTask(id)?.status;
  toast.show(status ? `Tarefa reaberta: ${STATUS_LABELS[status]}` : "Tarefa reaberta");
}

export function setTaskStatus(id: string, status: TaskStatus, { silent = false } = {}): void {
  const task = findTask(id);
  if (!task || task.status === status) return;
  if (status === "completed") {
    completeTask(id);
    return;
  }
  store().setTaskStatus(id, status);
  if (leavesWaiting(task.status, status) && (task.waitingFor || task.reviewDate)) {
    toast.show(`Status: ${STATUS_LABELS[status]}. A espera foi encerrada.`, { duration: EXPLAINED_UNDO_DURATION, action: undoAction([task]) });
    return;
  }
  if (!silent) toast.show(`Status: ${STATUS_LABELS[status]}`);
}

export function patchTask(id: string, patch: TaskPatch, message = "Alterações salvas"): void {
  store().patchTask(id, patch);
  if (message) toast.success(message);
}

export function saveProgress(id: string, input: ProgressInput, message?: string): void {
  const wasCompleted = findTask(id)?.status === "completed";
  const next = store().saveProgress(id, input);
  const text = message ?? (input.status === "completed" && !wasCompleted ? "Atualização salva. Tarefa concluída." : "Atualização salva");
  toast.success(next ? `${text} ${nextOccurrenceMessage(next)}` : text);
}

/** Marca ou desmarca a subtarefa. Terminar a última sugere concluir a tarefa, sem concluir sozinho. */
export function toggleSubtask(taskId: string, subtaskId: string): void {
  store().toggleSubtask(taskId, subtaskId);
  const task = findTask(taskId);
  if (!task || task.status === "completed") return;
  const { done, total } = subtaskProgress(task);
  const justChecked = task.subtasks.find((subtask) => subtask.id === subtaskId)?.completed;
  if (justChecked && done === total) {
    toast.show("Todas as subtarefas foram feitas.", {
      duration: EXPLAINED_UNDO_DURATION,
      action: { label: "Concluir tarefa", onAction: () => completeTask(taskId) },
    });
  }
}

/** `silent` evita toasts em telas onde o próprio controle já mostra o resultado (seletor de foco). */
export function toggleFocus(task: Task, today: string = todayKey(), { silent = false } = {}): void {
  if (isInFocus(task, today)) {
    store().setFocus(task.id, null);
    if (!silent) toast.show("Removida do foco de hoje");
    return;
  }

  const focusCount = countOpenFocus(today);
  store().setFocus(task.id, today);
  if (silent) return;
  toast.success(
    focusCount >= FOCUS_SOFT_LIMIT
      ? `No foco de hoje. Já são ${focusCount + 1} tarefas: tente manter o dia enxuto.`
      : "Adicionada ao foco de hoje",
  );
}

export function countOpenFocus(today: string = todayKey()): number {
  return store().tasks.filter((t) => isInFocus(t, today) && t.status !== "completed").length;
}

export function archiveTask(id: string): void {
  store().archiveTask(id);
  toast.show("Tarefa arquivada", {
    duration: UNDO_DURATION,
    action: { label: "Desfazer", onAction: () => store().unarchiveTask(id) },
  });
}

export function unarchiveTask(id: string): void {
  store().unarchiveTask(id);
  toast.success("Tarefa restaurada");
}

export function deleteTask(id: string): void {
  store().deleteTask(id);
  toast.show("Tarefa excluída");
}

// ---------------------------------------------------------------------------
// Várias tarefas de uma vez
// ---------------------------------------------------------------------------

const snapshotsOf = (ids: readonly string[]) => store().tasks.filter((task) => ids.includes(task.id));

function applyToMany(ids: readonly string[], message: string, apply: (id: string) => void): void {
  const snapshots = snapshotsOf(ids);
  for (const id of ids) apply(id);
  toast.show(message, { duration: EXPLAINED_UNDO_DURATION, action: undoAction(snapshots) });
}

const openIds = (ids: readonly string[]) => snapshotsOf(ids).filter((task) => task.status !== "completed").map((task) => task.id);

export function completeTasks(ids: readonly string[]): void {
  const open = openIds(ids);
  if (open.length === 0) return;
  const snapshots = snapshotsOf(open);
  const created: Task[] = [];
  for (const id of open) {
    const next = store().completeTask(id)?.next;
    if (next) created.push(next);
  }
  toast.show(`${pluralize(open.length, "tarefa concluída", "tarefas concluídas")}.`, {
    tone: "success",
    duration: EXPLAINED_UNDO_DURATION,
    action: undoAction(snapshots, created),
  });
}

export function patchTasks(ids: readonly string[], patch: TaskPatch, message: string): void {
  applyToMany(ids, message, (id) => store().patchTask(id, patch));
}

export function focusTasks(ids: readonly string[], today: string = todayKey()): void {
  const open = openIds(ids);
  if (open.length === 0) return;
  applyToMany(open, `${pluralize(open.length, "tarefa no", "tarefas no")} foco de hoje.`, (id) => store().setFocus(id, today));
}

export function clearFocus(ids: readonly string[]): void {
  applyToMany(ids, "Foco anterior dispensado.", (id) => store().setFocus(id, null));
}

export function archiveTasks(ids: readonly string[]): void {
  applyToMany(ids, `${pluralize(ids.length, "tarefa arquivada", "tarefas arquivadas")}.`, (id) => store().archiveTask(id));
}
