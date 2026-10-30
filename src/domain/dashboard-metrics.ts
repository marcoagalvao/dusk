import { addDaysToKey, diffInDays, startOfWeekKey, toDateKey, type DateKey } from "@/lib/dates";
import { normalizeForSearch } from "@/lib/utils/text";

import type { Project, ProjectColor } from "./project";
import { PRIORITY_WEIGHT, type Task, type TaskPriority, type TaskStatus } from "./task";
import {
  attentionRank,
  isArchived,
  isCompleted,
  isInFocus,
  isOpen,
  isOverdue,
  isReviewReached,
  isTodayRelevant,
} from "./task-queries";

/*
 * Números da visão geral. Tudo puro e calculado a partir das tarefas em memória,
 * sem nada guardado à parte: o painel não pode divergir da lista.
 */

const dayOf = (iso: string): DateKey => toDateKey(new Date(iso));

// ---------------------------------------------------------------------------
// Hoje
// ---------------------------------------------------------------------------

export interface TodayPulse {
  /** Abertas que pedem algo hoje: foco, prazo até hoje ou revisão que chegou. */
  pending: number;
  doneToday: number;
  /** Quanto do dia já foi feito (0–100). */
  percent: number;
  overdue: number;
  urgent: number;
  blocked: number;
  waiting: number;
  reviewsDue: number;
}

export function todayPulse(tasks: readonly Task[], today: DateKey): TodayPulse {
  const open = tasks.filter(isOpen);
  const pending = open.filter((task) => isTodayRelevant(task, today)).length;
  const doneToday = tasks.filter(
    (task) => !isArchived(task) && isCompleted(task) && task.completedAt && dayOf(task.completedAt) === today,
  ).length;
  const total = pending + doneToday;

  return {
    pending,
    doneToday,
    percent: total === 0 ? 0 : Math.round((doneToday / total) * 100),
    overdue: open.filter((task) => isOverdue(task, today)).length,
    urgent: open.filter((task) => task.priority === "urgent").length,
    blocked: open.filter((task) => task.status === "blocked").length,
    waiting: open.filter((task) => task.status === "waiting").length,
    reviewsDue: tasks.filter((task) => isReviewReached(task, today)).length,
  };
}

const AGENDA_FOCUS_RANK = 6;

/** Foco de hoje + "Precisa da sua atenção" numa lista só, das mais críticas às concluídas no foco. */
export function getTodayAgenda(tasks: readonly Task[], today: DateKey): Task[] {
  const ranked = tasks.flatMap((task) => {
    const rank = attentionRank(task, today);
    if (rank !== null) return [{ task, rank }];
    if (isInFocus(task, today)) return [{ task, rank: isCompleted(task) ? AGENDA_FOCUS_RANK + 1 : AGENDA_FOCUS_RANK }];
    return [];
  });

  return ranked
    .sort(
      (a, b) =>
        a.rank - b.rank ||
        PRIORITY_WEIGHT[a.task.priority] - PRIORITY_WEIGHT[b.task.priority] ||
        b.task.updatedAt.localeCompare(a.task.updatedAt),
    )
    .map((entry) => entry.task);
}

// ---------------------------------------------------------------------------
// Mapa de pendências
// ---------------------------------------------------------------------------

export const DUE_BUCKETS = ["overdue", "today", "soon", "later", "none"] as const;
export type DueBucket = (typeof DUE_BUCKETS)[number];

export const SOON_DAYS = 7;

export type PriorityMatrix = Record<TaskPriority, Record<DueBucket, number>>;

function dueBucketOf(task: Task, today: DateKey): DueBucket {
  if (!task.dueDate) return "none";
  if (task.dueDate < today) return "overdue";
  if (task.dueDate === today) return "today";
  return task.dueDate <= addDaysToKey(today, SOON_DAYS) ? "soon" : "later";
}

export function priorityMatrix(tasks: readonly Task[], today: DateKey): PriorityMatrix {
  const emptyRow = (): Record<DueBucket, number> => ({ overdue: 0, today: 0, soon: 0, later: 0, none: 0 });
  const matrix: PriorityMatrix = { urgent: emptyRow(), high: emptyRow(), normal: emptyRow(), low: emptyRow() };
  for (const task of tasks.filter(isOpen)) matrix[task.priority][dueBucketOf(task, today)] += 1;
  return matrix;
}

export type OpenStatus = Exclude<TaskStatus, "completed">;

export function statusBreakdown(tasks: readonly Task[]): Record<OpenStatus, number> {
  const counts: Record<OpenStatus, number> = { todo: 0, in_progress: 0, waiting: 0, blocked: 0 };
  for (const task of tasks.filter(isOpen)) counts[task.status as OpenStatus] += 1;
  return counts;
}

// ---------------------------------------------------------------------------
// Próximos dias
// ---------------------------------------------------------------------------

export interface UpcomingItem {
  task: Task;
  kind: "due" | "review";
}

export interface UpcomingDay {
  date: DateKey;
  items: UpcomingItem[];
}

export function upcomingDays(tasks: readonly Task[], today: DateKey, count: number): UpcomingDay[] {
  const days: UpcomingDay[] = Array.from({ length: count }, (_, index) => ({ date: addDaysToKey(today, index), items: [] }));
  const byDate = new Map(days.map((day) => [day.date, day]));

  for (const task of tasks) {
    if (isArchived(task)) continue;
    if (isOpen(task) && task.dueDate) byDate.get(task.dueDate)?.items.push({ task, kind: "due" });
    // Prazo e revisão no mesmo dia: o prazo já traz a tarefa, não precisa aparecer duas vezes.
    const alreadyListed = isOpen(task) && task.dueDate === task.reviewDate;
    if (task.reviewDate && !alreadyListed) byDate.get(task.reviewDate)?.items.push({ task, kind: "review" });
  }

  for (const day of days) {
    day.items.sort(
      (a, b) =>
        Number(b.kind === "due") - Number(a.kind === "due") ||
        PRIORITY_WEIGHT[a.task.priority] - PRIORITY_WEIGHT[b.task.priority],
    );
  }
  return days;
}

// ---------------------------------------------------------------------------
// Relatório por período
// ---------------------------------------------------------------------------

export const REPORT_PERIODS = [7, 15, 30] as const;
export type ReportPeriod = (typeof REPORT_PERIODS)[number];

const PROJECT_ROWS_LIMIT = 5;

export interface ReportDay {
  date: DateKey;
  completed: number;
  created: number;
}

export interface ReportProjectRow {
  id: string;
  name: string;
  /** Ausente em "Sem projeto" e "Outros", que usam cor neutra. */
  color?: ProjectColor;
  completed: number;
  taskIds: string[];
}

export interface PeriodReport {
  completed: number;
  previousCompleted: number;
  created: number;
  previousCreated: number;
  /** % das entregas com prazo feitas até o prazo; `null` se nenhuma tinha prazo. */
  onTimePercent: number | null;
  previousOnTimePercent: number | null;
  /** Dias, em média, entre criar e concluir; `null` sem entregas. */
  avgCycleDays: number | null;
  days: ReportDay[];
  byProject: ReportProjectRow[];
}

function onTimePercent(completed: readonly Task[]): number | null {
  const withDue = completed.filter((task) => task.dueDate);
  if (withDue.length === 0) return null;
  const onTime = withDue.filter((task) => dayOf(task.completedAt!) <= task.dueDate!).length;
  return Math.round((onTime / withDue.length) * 100);
}

function groupByProject(completed: readonly Task[], projects: readonly Project[]): ReportProjectRow[] {
  const projectsById = new Map(projects.map((project) => [project.id, project]));
  const rows = new Map<string, ReportProjectRow>();

  for (const task of completed) {
    const project = task.projectId ? projectsById.get(task.projectId) : undefined;
    const id = project?.id ?? "__none__";
    const row = rows.get(id) ?? { id, name: project?.name ?? "Sem projeto", color: project?.color, completed: 0, taskIds: [] };
    row.completed += 1;
    row.taskIds.push(task.id);
    rows.set(id, row);
  }

  const sorted = [...rows.values()].sort((a, b) => b.completed - a.completed);
  if (sorted.length <= PROJECT_ROWS_LIMIT) return sorted;

  const rest = sorted.slice(PROJECT_ROWS_LIMIT);
  const others = rest.reduce((sum, row) => sum + row.completed, 0);
  return [...sorted.slice(0, PROJECT_ROWS_LIMIT), { id: "__others__", name: "Outros", completed: others, taskIds: rest.flatMap((row) => row.taskIds) }];
}

/**
 * Janela móvel terminando hoje, comparada à janela anterior de mesmo tamanho.
 * Arquivar não apaga a entrega: concluídas arquivadas continuam contando.
 */
export function periodReport(
  tasks: readonly Task[],
  projects: readonly Project[],
  today: DateKey,
  period: number,
): PeriodReport {
  const start = addDaysToKey(today, -(period - 1));
  const previousStart = addDaysToKey(start, -period);
  const inRange = (date: DateKey, from: DateKey, to: DateKey) => date >= from && date <= to;
  const beforeStart = addDaysToKey(start, -1);

  const completedTasks = tasks.filter((task) => isCompleted(task) && task.completedAt);
  const completed = completedTasks.filter((task) => inRange(dayOf(task.completedAt!), start, today));
  const previous = completedTasks.filter((task) => inRange(dayOf(task.completedAt!), previousStart, beforeStart));

  const days: ReportDay[] = Array.from({ length: period }, (_, index) => ({
    date: addDaysToKey(start, index),
    completed: 0,
    created: 0,
  }));
  const byDate = new Map(days.map((day) => [day.date, day]));
  for (const task of completed) byDate.get(dayOf(task.completedAt!))!.completed += 1;

  let created = 0;
  let previousCreated = 0;
  for (const task of tasks) {
    const day = dayOf(task.createdAt);
    if (inRange(day, start, today)) {
      created += 1;
      byDate.get(day)!.created += 1;
    } else if (inRange(day, previousStart, beforeStart)) {
      previousCreated += 1;
    }
  }

  const cycle = completed.map((task) => Math.max(0, diffInDays(dayOf(task.completedAt!), dayOf(task.createdAt))));

  return {
    completed: completed.length,
    previousCompleted: previous.length,
    created,
    previousCreated,
    onTimePercent: onTimePercent(completed),
    previousOnTimePercent: onTimePercent(previous),
    avgCycleDays: cycle.length === 0 ? null : Math.round((cycle.reduce((sum, days) => sum + days, 0) / cycle.length) * 10) / 10,
    days,
    byProject: groupByProject(completed, projects),
  };
}

// ---------------------------------------------------------------------------
// Saúde da fila
// ---------------------------------------------------------------------------

export interface AgingBucket {
  label: string;
  count: number;
  taskIds: string[];
}

const AGING_LIMITS: ReadonlyArray<{ label: string; upTo: number }> = [
  { label: "até 3 dias", upTo: 3 },
  { label: "4 a 7 dias", upTo: 7 },
  { label: "8 a 14 dias", upTo: 14 },
  { label: "15 a 30 dias", upTo: 30 },
  { label: "mais de 30 dias", upTo: Number.POSITIVE_INFINITY },
];

/** Há quanto tempo as tarefas abertas existem: fila parada aparece aqui. */
export function agingBuckets(tasks: readonly Task[], today: DateKey): AgingBucket[] {
  const buckets: AgingBucket[] = AGING_LIMITS.map(({ label }) => ({ label, count: 0, taskIds: [] }));
  for (const task of tasks.filter(isOpen)) {
    const age = diffInDays(today, dayOf(task.createdAt));
    const bucket = buckets[AGING_LIMITS.findIndex(({ upTo }) => age <= upTo)];
    bucket.count += 1;
    bucket.taskIds.push(task.id);
  }
  return buckets;
}

export interface HeatmapDay {
  date: DateKey;
  count: number;
}

export interface ActivityHeatmap {
  /** De segunda a domingo, semana a semana; a última semana termina hoje. */
  days: HeatmapDay[];
  max: number;
}

export function activityHeatmap(tasks: readonly Task[], today: DateKey, weeks: number): ActivityHeatmap {
  const start = addDaysToKey(startOfWeekKey(today), -7 * (weeks - 1));
  const counts = new Map<DateKey, number>();
  const add = (iso: string) => {
    const day = dayOf(iso);
    counts.set(day, (counts.get(day) ?? 0) + 1);
  };

  for (const task of tasks) {
    add(task.createdAt);
    if (task.completedAt) add(task.completedAt);
    for (const update of task.updates) add(update.createdAt);
  }

  const total = diffInDays(today, start) + 1;
  const days = Array.from({ length: total }, (_, index) => {
    const date = addDaysToKey(start, index);
    return { date, count: counts.get(date) ?? 0 };
  });
  return { days, max: Math.max(0, ...days.map((day) => day.count)) };
}

export interface WaitingPerson {
  name: string;
  count: number;
  /** Dias desde a atualização mais antiga entre as tarefas aguardando essa pessoa. */
  oldestDays: number;
  taskIds: string[];
}

export function waitingByPerson(tasks: readonly Task[], today: DateKey): WaitingPerson[] {
  const people = new Map<string, WaitingPerson>();

  for (const task of tasks) {
    if (!isOpen(task) || task.status !== "waiting" || !task.waitingFor) continue;
    const key = normalizeForSearch(task.waitingFor);
    const days = diffInDays(today, dayOf(task.updatedAt));
    const person = people.get(key);
    if (person) {
      person.count += 1;
      person.oldestDays = Math.max(person.oldestDays, days);
      person.taskIds.push(task.id);
    } else {
      people.set(key, { name: task.waitingFor, count: 1, oldestDays: days, taskIds: [task.id] });
    }
  }

  return [...people.values()].sort((a, b) => b.count - a.count || b.oldestDays - a.oldestDays);
}

/** Dias seguidos com pelo menos uma entrega; hoje ainda sem entrega não quebra a sequência. */
export function completionStreak(tasks: readonly Task[], today: DateKey): number {
  const days = new Set(tasks.filter((task) => task.completedAt).map((task) => dayOf(task.completedAt!)));
  let cursor = days.has(today) ? today : addDaysToKey(today, -1);
  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor = addDaysToKey(cursor, -1);
  }
  return streak;
}
