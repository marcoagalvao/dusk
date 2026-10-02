export const TASK_STATUSES = [
  "todo",
  "in_progress",
  "waiting",
  "blocked",
  "completed",
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["urgent", "high", "normal", "low"] as const;

export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_UPDATE_TYPES = [
  "progress",
  "status_change",
  "completed",
  "reopened",
] as const;

export type TaskUpdateType = (typeof TASK_UPDATE_TYPES)[number];

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
}

export interface TaskUpdate {
  id: string;
  taskId: string;
  type: TaskUpdateType;
  preset?: string;
  status: TaskStatus;
  done?: string;
  waitingFor?: string;
  nextAction?: string;
  note?: string;
  reviewDate?: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId?: string;
  /** Data civil local `YYYY-MM-DD`. */
  dueDate?: string;
  /** Data civil local `YYYY-MM-DD`. */
  reviewDate?: string;
  /** Data civil local `YYYY-MM-DD`; a tarefa está no foco apenas nesse dia. */
  focusDate?: string;
  lastDone?: string;
  waitingFor?: string;
  nextAction?: string;
  note?: string;
  subtasks: Subtask[];
  updates: TaskUpdate[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  archivedAt?: string;
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "A fazer",
  in_progress: "Em andamento",
  waiting: "Aguardando",
  blocked: "Bloqueado",
  completed: "Concluído",
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  urgent: "Urgente",
  high: "Alta",
  normal: "Normal",
  low: "Baixa",
};

/** Menor valor = mais importante. */
export const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
};

/** Status em que a tarefa depende de algo externo e `waitingFor` faz sentido. */
export const STATUSES_WITH_WAITING: readonly TaskStatus[] = ["waiting", "blocked"];

/** Quantidade de tarefas no foco que a interface recomenda (sem bloqueio). */
export const FOCUS_SOFT_LIMIT = 5;
