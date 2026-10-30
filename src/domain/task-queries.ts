import { addDaysToKey, toDateKey, type DateKey } from "@/lib/dates";
import { normalizeForSearch } from "@/lib/utils/text";

import type { Project } from "./project";
import { PRIORITY_WEIGHT, type Task, type TaskPriority, type TaskStatus } from "./task";

// ---------------------------------------------------------------------------
// Predicados
// ---------------------------------------------------------------------------

export const isArchived = (task: Task) => Boolean(task.archivedAt);
export const isCompleted = (task: Task) => task.status === "completed";
export const isOpen = (task: Task) => !isArchived(task) && !isCompleted(task);

export const isOverdue = (task: Task, today: DateKey) =>
  isOpen(task) && Boolean(task.dueDate) && task.dueDate! < today;

export const isDueToday = (task: Task, today: DateKey) => isOpen(task) && task.dueDate === today;

/** Revisão chegou (hoje ou antes) em qualquer tarefa não arquivada, inclusive concluída. */
export const isReviewReached = (task: Task, today: DateKey) =>
  !isArchived(task) && Boolean(task.reviewDate) && task.reviewDate! <= today;

/** Revisão chegou numa tarefa aberta: entra em "Precisa da sua atenção" e na ordenação. */
export const isReviewDue = (task: Task, today: DateKey) => isOpen(task) && isReviewReached(task, today);

export const isInFocus = (task: Task, today: DateKey) => !isArchived(task) && task.focusDate === today;

/** Prazo ou revisão no futuro. */
export const hasFutureDate = (task: Task, today: DateKey) =>
  (Boolean(task.dueDate) && task.dueDate! > today) || (Boolean(task.reviewDate) && task.reviewDate! > today);

// ---------------------------------------------------------------------------
// Precisa da sua atenção (PRD §10)
// ---------------------------------------------------------------------------

/**
 * Posição da tarefa na lista "Precisa da sua atenção", ou `null` se não entra.
 * Ordem: atrasadas, review vencido, urgentes, vencendo hoje, foco do dia com
 * pendência (aguardando), bloqueadas.
 */
export function attentionRank(task: Task, today: DateKey): number | null {
  if (!isOpen(task)) return null;
  if (isOverdue(task, today)) return 0;
  if (isReviewDue(task, today)) return 1;
  if (task.priority === "urgent") return 2;
  if (isDueToday(task, today)) return 3;
  if (isInFocus(task, today) && task.status === "waiting") return 4;
  if (task.status === "blocked") return 5;
  return null;
}

export function getAttentionTasks(tasks: readonly Task[], today: DateKey): Task[] {
  return tasks
    .map((task) => ({ task, rank: attentionRank(task, today) }))
    .filter((entry): entry is { task: Task; rank: number } => entry.rank !== null)
    .sort((a, b) => a.rank - b.rank || compareUpdatedDesc(a.task, b.task))
    .map((entry) => entry.task);
}

// ---------------------------------------------------------------------------
// Revisões (follow-up, PRD §14)
// ---------------------------------------------------------------------------

/** Janela de revisões futuras mostrada na Home. */
export const REVIEW_HORIZON_DAYS = 7;

/**
 * Revisões que já chegaram ou chegam dentro da janela, da mais antiga para a
 * mais distante. Inclui tarefas concluídas: a revisão pode ser um
 * acompanhamento depois da entrega (ex.: confirmar com o cliente).
 */
export function getUpcomingReviews(
  tasks: readonly Task[],
  today: DateKey,
  horizonDays: number = REVIEW_HORIZON_DAYS,
): Task[] {
  return tasks
    .filter((task) => isReviewReached(task, addDaysToKey(today, horizonDays)))
    .sort((a, b) => a.reviewDate!.localeCompare(b.reviewDate!) || compareUpdatedDesc(a, b));
}

export function getDueReviews(tasks: readonly Task[], today: DateKey): Task[] {
  return tasks.filter((task) => isReviewReached(task, today));
}

// ---------------------------------------------------------------------------
// Ordenação (PRD §30)
// ---------------------------------------------------------------------------

export const TASK_SORTS = ["smart", "due", "priority", "newest", "oldest", "alpha"] as const;
export type TaskSort = (typeof TASK_SORTS)[number];

export const SORT_LABELS: Record<TaskSort, string> = {
  smart: "Inteligente",
  due: "Prazo mais próximo",
  priority: "Prioridade",
  newest: "Mais recente",
  oldest: "Mais antiga",
  alpha: "Alfabética",
};

function compareUpdatedDesc(a: Task, b: Task): number {
  return b.updatedAt.localeCompare(a.updatedAt);
}

/** Atrasadas → review vencido → urgentes → prazo hoje → prazo futuro → sem prazo. */
export function smartRank(task: Task, today: DateKey): number {
  if (isOverdue(task, today)) return 0;
  if (isReviewDue(task, today)) return 1;
  if (task.priority === "urgent") return 2;
  if (task.dueDate === today) return 3;
  if (task.dueDate) return 4;
  return 5;
}

function compareDue(a: Task, b: Task): number {
  if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
  if (a.dueDate) return -1;
  if (b.dueDate) return 1;
  return 0;
}

const collator = new Intl.Collator("pt-BR", { sensitivity: "base", numeric: true });

export function sortTasks(tasks: readonly Task[], sort: TaskSort, today: DateKey): Task[] {
  const smart = (a: Task, b: Task) => {
    // Concluídas: a conclusão mais recente primeiro (prazo e urgência já não importam).
    if (isCompleted(a) && isCompleted(b)) return (b.completedAt ?? "").localeCompare(a.completedAt ?? "");
    return smartRank(a, today) - smartRank(b, today) || compareDue(a, b) || compareUpdatedDesc(a, b);
  };

  const comparators: Record<TaskSort, (a: Task, b: Task) => number> = {
    smart,
    due: (a, b) => compareDue(a, b) || compareUpdatedDesc(a, b),
    priority: (a, b) => PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority] || smart(a, b),
    newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
    oldest: (a, b) => a.createdAt.localeCompare(b.createdAt),
    alpha: (a, b) => collator.compare(a.title, b.title),
  };

  return [...tasks].sort(comparators[sort]);
}

// ---------------------------------------------------------------------------
// Escopos (rotas /tasks/*)
// ---------------------------------------------------------------------------

export const TASK_SCOPES = ["all", "today", "upcoming", "waiting", "overdue"] as const;
export type TaskScope = (typeof TASK_SCOPES)[number];

/** Hoje: foco do dia, prazo hoje/vencido ou revisão que chegou. */
export function isTodayRelevant(task: Task, today: DateKey): boolean {
  return (
    isInFocus(task, today) ||
    (Boolean(task.dueDate) && task.dueDate! <= today) ||
    (Boolean(task.reviewDate) && task.reviewDate! <= today)
  );
}

export function matchesScope(task: Task, scope: TaskScope, today: DateKey): boolean {
  switch (scope) {
    case "all":
      return true;
    case "today":
      return isOpen(task) && isTodayRelevant(task, today);
    case "upcoming":
      return isOpen(task) && !isTodayRelevant(task, today) && hasFutureDate(task, today);
    case "waiting":
      return isOpen(task) && task.status === "waiting";
    case "overdue":
      return isOverdue(task, today);
  }
}

/** Data futura mais próxima entre prazo e revisão. */
export function nearestFutureDate(task: Task, today: DateKey): DateKey | undefined {
  return [task.dueDate, task.reviewDate]
    .filter((date): date is DateKey => Boolean(date) && date! > today)
    .sort()[0];
}

/** Vista "Próximas": o que chega primeiro aparece primeiro. */
export function sortUpcoming(tasks: readonly Task[], today: DateKey): Task[] {
  return [...tasks].sort((a, b) => {
    const dateA = nearestFutureDate(a, today) ?? "9999-12-31";
    const dateB = nearestFutureDate(b, today) ?? "9999-12-31";
    return dateA.localeCompare(dateB) || compareUpdatedDesc(a, b);
  });
}

// ---------------------------------------------------------------------------
// Busca e filtros (PRD §28–29)
// ---------------------------------------------------------------------------

export function matchesSearch(task: Task, normalizedQuery: string, projectName?: string): boolean {
  if (!normalizedQuery) return true;
  const haystack = [task.title, projectName, task.lastDone, task.waitingFor, task.nextAction, task.note]
    .filter(Boolean)
    .join("\n");
  return normalizeForSearch(haystack).includes(normalizedQuery);
}

export const DUE_FILTERS = ["overdue", "today", "week", "soon", "later", "none"] as const;
export type DueFilter = (typeof DUE_FILTERS)[number];

export const DUE_FILTER_LABELS: Record<DueFilter, string> = {
  overdue: "Atrasadas",
  today: "Vence hoje",
  week: "Hoje e próximos 7 dias",
  soon: "Depois de hoje, em até 7 dias",
  later: "Daqui a mais de 7 dias",
  none: "Sem prazo",
};

export type CompletionFilter = "open" | "completed" | "today" | "all";

export const COMPLETION_FILTER_LABELS: Record<CompletionFilter, string> = {
  open: "Abertas",
  completed: "Concluídas",
  today: "Concluídas hoje",
  all: "Todas",
};

/** Valor especial do filtro de projeto para tarefas sem projeto. */
export const NO_PROJECT = "__none__";

export interface TaskFilters {
  search: string;
  projectId: string | null;
  status: TaskStatus | null;
  priority: TaskPriority | null;
  due: DueFilter | null;
  focusToday: boolean;
  reviewDue: boolean;
  completion: CompletionFilter;
}

export const DEFAULT_TASK_FILTERS: TaskFilters = {
  search: "",
  projectId: null,
  status: null,
  priority: null,
  due: null,
  focusToday: false,
  reviewDue: false,
  completion: "open",
};

/** Quantidade de filtros ativos, sem contar a busca textual. */
export function countActiveFilters(filters: TaskFilters): number {
  return [
    filters.projectId !== null,
    filters.status !== null,
    filters.priority !== null,
    filters.due !== null,
    filters.focusToday,
    filters.reviewDue,
    filters.completion !== DEFAULT_TASK_FILTERS.completion,
  ].filter(Boolean).length;
}

function matchesDueFilter(task: Task, due: DueFilter, today: DateKey): boolean {
  switch (due) {
    case "overdue":
      return isOverdue(task, today);
    case "today":
      return task.dueDate === today;
    case "week":
      return Boolean(task.dueDate) && task.dueDate! >= today && task.dueDate! <= addDaysToKey(today, 7);
    case "soon":
      return Boolean(task.dueDate) && task.dueDate! > today && task.dueDate! <= addDaysToKey(today, 7);
    case "later":
      return Boolean(task.dueDate) && task.dueDate! > addDaysToKey(today, 7);
    case "none":
      return !task.dueDate;
  }
}

/**
 * Filtra tarefas não arquivadas. Um filtro de status explícito tem precedência
 * sobre o filtro abertas/concluídas (escolher "Concluído" mostra concluídas).
 */
export function filterTasks(
  tasks: readonly Task[],
  filters: TaskFilters,
  projectsById: ReadonlyMap<string, Project>,
  today: DateKey,
): Task[] {
  const query = normalizeForSearch(filters.search);

  return tasks.filter((task) => {
    if (isArchived(task)) return false;

    if (filters.status) {
      if (task.status !== filters.status) return false;
    } else if (filters.completion === "open" && isCompleted(task)) {
      return false;
    } else if (filters.completion === "completed" && !isCompleted(task)) {
      return false;
    } else if (filters.completion === "today" && !(isCompleted(task) && task.completedAt && toDateKey(new Date(task.completedAt)) === today)) {
      return false;
    }

    if (filters.projectId === NO_PROJECT && task.projectId) return false;
    if (filters.projectId && filters.projectId !== NO_PROJECT && task.projectId !== filters.projectId) {
      return false;
    }
    if (filters.priority && task.priority !== filters.priority) return false;
    if (filters.due && !matchesDueFilter(task, filters.due, today)) return false;
    if (filters.focusToday && !isInFocus(task, today)) return false;
    if (filters.reviewDue && !isReviewReached(task, today)) return false;

    const projectName = task.projectId ? projectsById.get(task.projectId)?.name : undefined;
    return matchesSearch(task, query, projectName);
  });
}

// ---------------------------------------------------------------------------
// Agrupamento da lista (PRD §26)
// ---------------------------------------------------------------------------

export type DateGroup = "today" | "upcoming" | "undated" | "completed";

export const DATE_GROUP_LABELS: Record<DateGroup, string> = {
  today: "Hoje",
  upcoming: "Próximas",
  undated: "Sem data",
  completed: "Concluídas",
};

export function dateGroupOf(task: Task, today: DateKey): DateGroup {
  if (isCompleted(task)) return "completed";
  if (isTodayRelevant(task, today)) return "today";
  if (hasFutureDate(task, today)) return "upcoming";
  return "undated";
}

export function groupByDate(
  tasks: readonly Task[],
  today: DateKey,
): Array<{ group: DateGroup; tasks: Task[] }> {
  const order: DateGroup[] = ["today", "upcoming", "undated", "completed"];
  const buckets = new Map<DateGroup, Task[]>(order.map((group) => [group, []]));
  for (const task of tasks) buckets.get(dateGroupOf(task, today))!.push(task);
  return order
    .map((group) => ({ group, tasks: buckets.get(group)! }))
    .filter((entry) => entry.tasks.length > 0);
}

// ---------------------------------------------------------------------------
// Data relevante exibida na linha (prazo ou revisão)
// ---------------------------------------------------------------------------

export interface RelevantDate {
  kind: "due" | "review";
  date: DateKey;
  overdue: boolean;
}

/**
 * Prazo tem prioridade, exceto quando a revisão já chegou e o prazo ainda não:
 * nesse caso a revisão é a informação acionável. Em tarefas concluídas o prazo
 * deixa de importar e só a revisão (acompanhamento pós-entrega) é mostrada.
 */
export function relevantDate(task: Task, today: DateKey): RelevantDate | null {
  const review = task.reviewDate
    ? { kind: "review" as const, date: task.reviewDate, overdue: task.reviewDate < today }
    : null;

  if (isCompleted(task)) return review;

  const reviewDue = Boolean(task.reviewDate) && task.reviewDate! <= today;
  const dueReached = Boolean(task.dueDate) && task.dueDate! <= today;
  if (review && reviewDue && !dueReached) return review;
  if (task.dueDate) return { kind: "due", date: task.dueDate, overdue: task.dueDate < today };
  return review;
}

// ---------------------------------------------------------------------------
// Projetos
// ---------------------------------------------------------------------------

export interface ProjectStats {
  open: number;
  completed: number;
  waiting: number;
  total: number;
  lastActivity: string;
}

export function projectStats(project: Project, tasks: readonly Task[]): ProjectStats {
  const own = tasks.filter((task) => task.projectId === project.id && !isArchived(task));
  const lastActivity = own.reduce(
    (latest, task) => (task.updatedAt > latest ? task.updatedAt : latest),
    project.updatedAt,
  );
  return {
    open: own.filter((task) => !isCompleted(task)).length,
    completed: own.filter(isCompleted).length,
    waiting: own.filter((task) => task.status === "waiting").length,
    total: own.length,
    lastActivity,
  };
}

/** Projetos ativos ordenados pela atividade mais recente (projeto ou suas tarefas). */
export function recentProjects(
  projects: readonly Project[],
  tasks: readonly Task[],
  limit: number,
): Array<{ project: Project; stats: ProjectStats }> {
  return projects
    .filter((project) => !project.archivedAt)
    .map((project) => ({ project, stats: projectStats(project, tasks) }))
    .sort((a, b) => b.stats.lastActivity.localeCompare(a.stats.lastActivity))
    .slice(0, limit);
}

export function countTasksOfProject(projectId: string, tasks: readonly Task[]): number {
  return tasks.filter((task) => task.projectId === projectId).length;
}
