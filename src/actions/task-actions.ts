import { FOCUS_SOFT_LIMIT, STATUS_LABELS, type Task, type TaskStatus } from "@/domain/task";
import { isInFocus } from "@/domain/task-queries";
import type { CreateTaskInput, ProgressInput, TaskPatch } from "@/domain/task-rules";
import { todayKey } from "@/lib/dates";
import { useAppStore } from "@/store/app-store";
import { toast } from "@/store/ui-store";

/**
 * Ações de tarefa usadas pela UI: chamam o store e dão o feedback visual
 * correspondente (toasts, desfazer). Componentes não falam com o store para
 * mutações diretamente, assim o comportamento fica igual em todas as telas.
 */

const store = () => useAppStore.getState();

const UNDO_DURATION = 5000;

export function createTask(input: CreateTaskInput): Task {
  const task = store().createTask(input);
  toast.success("Tarefa criada");
  return task;
}

export function completeTask(id: string): void {
  const previous = store().completeTask(id);
  if (!previous) return;
  toast.show("Tarefa concluída.", {
    tone: "success",
    duration: UNDO_DURATION,
    action: {
      label: "Desfazer",
      onAction: () => store().restoreTask(previous),
    },
  });
}

export function reopenTask(id: string): void {
  store().reopenTask(id);
  toast.show("Tarefa reaberta");
}

export function setTaskStatus(id: string, status: TaskStatus, { silent = false } = {}): void {
  const task = store().tasks.find((t) => t.id === id);
  if (!task || task.status === status) return;
  if (status === "completed") {
    completeTask(id);
    return;
  }
  store().setTaskStatus(id, status);
  if (!silent) toast.show(`Status: ${STATUS_LABELS[status]}`);
}

export function patchTask(id: string, patch: TaskPatch, message = "Alterações salvas"): void {
  store().patchTask(id, patch);
  if (message) toast.success(message);
}

export function saveProgress(id: string, input: ProgressInput, message?: string): void {
  const wasCompleted = store().tasks.find((t) => t.id === id)?.status === "completed";
  store().saveProgress(id, input);
  toast.success(
    message ?? (input.status === "completed" && !wasCompleted ? "Atualização salva. Tarefa concluída." : "Atualização salva"),
  );
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
