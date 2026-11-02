import { addDaysToKey, addMonthsToKey, diffInDays, parseDateKey, type DateKey } from "@/lib/dates";
import { createId } from "@/lib/utils/id";

import type { Task, TaskRecurrence } from "./task";

/** A data seguinte da repetição, sempre depois de `from`. */
export function nextOccurrence(rule: TaskRecurrence, from: DateKey): DateKey {
  switch (rule) {
    case "daily":
      return addDaysToKey(from, 1);
    case "weekly":
      return addDaysToKey(from, 7);
    case "monthly":
      return addMonthsToKey(from, 1);
    case "weekdays": {
      const weekday = parseDateKey(from).getDay();
      return addDaysToKey(from, weekday === 5 ? 3 : weekday === 6 ? 2 : 1);
    }
  }
}

/**
 * A próxima tarefa da série, nascida ao concluir `task`. Um prazo muito atrasado
 * salta para a primeira data depois de hoje, em vez de acumular tarefas vencidas.
 * O lembrete mantém a mesma distância do prazo.
 */
export function buildNextOccurrence(task: Task, now: string, today: DateKey): Task {
  const rule = task.recurrence ?? "weekly";
  let dueDate = nextOccurrence(rule, task.dueDate ?? today);
  while (dueDate <= today) dueDate = nextOccurrence(rule, dueDate);

  const reviewDate = task.dueDate && task.reviewDate ? addDaysToKey(dueDate, diffInDays(task.reviewDate, task.dueDate)) : undefined;

  return {
    id: createId(),
    title: task.title,
    status: "todo",
    priority: task.priority,
    projectId: task.projectId,
    dueDate,
    reviewDate,
    nextAction: task.nextAction,
    note: task.note,
    recurrence: task.recurrence,
    subtasks: task.subtasks.map((subtask) => ({ id: createId(), title: subtask.title, completed: false, createdAt: now })),
    updates: [],
    createdAt: now,
    updatedAt: now,
  };
}
