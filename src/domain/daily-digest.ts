import type { DateKey } from "@/lib/dates";

import type { Task } from "./task";

/** O que o resumo diário precisa de cada tarefa não arquivada. */
export type DigestTask = Pick<Task, "status" | "dueDate" | "reviewDate">;

export interface DailyDigest {
  title: string;
  body: string;
}

const countLabel = (count: number, one: string, many: string) => (count === 1 ? `1 ${one}` : `${count} ${many}`);

/**
 * Texto da notificação da manhã, ou `null` quando não há nada a avisar. Cada
 * tarefa conta uma vez, pelo motivo mais grave.
 */
export function dailyDigest(tasks: readonly DigestTask[], today: DateKey): DailyDigest | null {
  let overdue = 0;
  let dueToday = 0;
  let reminders = 0;

  for (const task of tasks) {
    const open = task.status !== "completed";
    if (open && task.dueDate && task.dueDate < today) overdue += 1;
    else if (open && task.dueDate === today) dueToday += 1;
    else if (task.reviewDate && task.reviewDate <= today) reminders += 1;
  }

  const total = overdue + dueToday + reminders;
  if (total === 0) return null;

  const parts = [
    overdue > 0 && countLabel(overdue, "atrasada", "atrasadas"),
    dueToday > 0 && countLabel(dueToday, "com prazo hoje", "com prazo hoje"),
    reminders > 0 && countLabel(reminders, "lembrete", "lembretes"),
  ].filter(Boolean);

  return {
    title: total === 1 ? "1 tarefa pede atenção hoje" : `${total} tarefas pedem atenção hoje`,
    body: parts.join(" · "),
  };
}
