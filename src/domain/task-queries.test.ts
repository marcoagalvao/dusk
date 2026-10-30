import { describe, expect, it } from "vitest";

import type { Project } from "./project";
import type { Task } from "./task";
import {
  DEFAULT_TASK_FILTERS,
  NO_PROJECT,
  filterTasks,
  getAttentionTasks,
  getUpcomingReviews,
  groupByDate,
  matchesScope,
  projectStats,
  relevantDate,
  sortTasks,
} from "./task-queries";

const TODAY = "2026-10-02";
let seq = 0;

function task(overrides: Partial<Task> = {}): Task {
  seq += 1;
  return {
    id: `t${seq}`,
    title: `Tarefa ${seq}`,
    status: "todo",
    priority: "normal",
    subtasks: [],
    updates: [],
    createdAt: `2026-09-${String(seq).padStart(2, "0")}T10:00:00.000Z`,
    updatedAt: `2026-09-${String(seq).padStart(2, "0")}T10:00:00.000Z`,
    ...overrides,
  };
}

const project: Project = {
  id: "p1",
  name: "Integradas",
  color: "lavender",
  createdAt: "2026-09-01T10:00:00.000Z",
  updatedAt: "2026-09-01T10:00:00.000Z",
};
const projectsById = new Map([[project.id, project]]);

describe("getAttentionTasks", () => {
  it("inclui só as condições do PRD, na ordem definida", () => {
    const blocked = task({ status: "blocked" });
    const focusWaiting = task({ focusDate: TODAY, status: "waiting" });
    const dueToday = task({ dueDate: TODAY });
    const urgent = task({ priority: "urgent" });
    const review = task({ reviewDate: "2026-10-01" });
    const overdue = task({ dueDate: "2026-09-30" });
    const calm = task({ dueDate: "2026-10-20" });
    const focusOnly = task({ focusDate: TODAY });
    const completedOverdue = task({ dueDate: "2026-09-01", status: "completed" });
    const archivedUrgent = task({ priority: "urgent", archivedAt: "2026-10-01T00:00:00.000Z" });

    const result = getAttentionTasks(
      [calm, blocked, focusWaiting, dueToday, urgent, review, overdue, focusOnly, completedOverdue, archivedUrgent],
      TODAY,
    );

    expect(result.map((t) => t.id)).toEqual([
      overdue.id,
      review.id,
      urgent.id,
      dueToday.id,
      focusWaiting.id,
      blocked.id,
    ]);
  });
});

describe("getUpcomingReviews", () => {
  it("lista revisões vencidas, de hoje e da próxima semana, inclusive de concluídas, em ordem de data", () => {
    const later = task({ reviewDate: "2026-10-08" });
    const overdue = task({ reviewDate: "2026-09-30" });
    const todayReview = task({ reviewDate: TODAY });
    const tooFar = task({ reviewDate: "2026-10-20" });
    const completed = task({ reviewDate: "2026-10-06", status: "completed" });
    const archived = task({ reviewDate: TODAY, archivedAt: "2026-10-01T00:00:00.000Z" });
    const noReview = task();

    const result = getUpcomingReviews([later, overdue, todayReview, tooFar, completed, archived, noReview], TODAY);
    expect(result.map((t) => t.id)).toEqual([overdue.id, todayReview.id, completed.id, later.id]);
  });

  it("filtro 'Revisão vencida' inclui concluídas quando a situação é 'Todas'", () => {
    const done = task({ reviewDate: TODAY, status: "completed" });
    const open = task({ reviewDate: "2026-10-01" });
    const result = filterTasks([done, open], { ...DEFAULT_TASK_FILTERS, reviewDue: true, completion: "all" }, projectsById, TODAY);
    expect(result.map((t) => t.id)).toEqual([done.id, open.id]);
  });
});

describe("sortTasks (inteligente)", () => {
  it("atrasadas → review vencido → urgentes → hoje → futuro → sem prazo", () => {
    const none = task();
    const future = task({ dueDate: "2026-10-10" });
    const today = task({ dueDate: TODAY });
    const urgent = task({ priority: "urgent" });
    const review = task({ reviewDate: TODAY });
    const overdue = task({ dueDate: "2026-09-29" });

    const sorted = sortTasks([none, future, today, urgent, review, overdue], "smart", TODAY);
    expect(sorted.map((t) => t.id)).toEqual([overdue.id, review.id, urgent.id, today.id, future.id, none.id]);
  });

  it("desempata pelo updatedAt mais recente", () => {
    const older = task({ updatedAt: "2026-09-01T00:00:00.000Z" });
    const newer = task({ updatedAt: "2026-10-01T00:00:00.000Z" });
    expect(sortTasks([older, newer], "smart", TODAY)[0].id).toBe(newer.id);
  });

  it("concluídas aparecem da conclusão mais recente para a mais antiga", () => {
    const old = task({ status: "completed", completedAt: "2026-09-01T10:00:00.000Z", dueDate: "2026-08-01" });
    const recent = task({ status: "completed", completedAt: "2026-10-01T10:00:00.000Z" });
    expect(sortTasks([old, recent], "smart", TODAY).map((t) => t.id)).toEqual([recent.id, old.id]);
  });

  it("alfabética respeita acentos em pt-BR", () => {
    const sorted = sortTasks([task({ title: "Zebra" }), task({ title: "Ábaco" }), task({ title: "banana" })], "alpha", TODAY);
    expect(sorted.map((t) => t.title)).toEqual(["Ábaco", "banana", "Zebra"]);
  });
});

describe("filterTasks", () => {
  it("'Concluídas hoje' mostra só o que foi concluído hoje", () => {
    const doneToday = task({ status: "completed", completedAt: `${TODAY}T12:00:00` });
    const doneBefore = task({ status: "completed", completedAt: "2026-09-20T12:00:00" });
    const open = task();
    const result = filterTasks([doneToday, doneBefore, open], { ...DEFAULT_TASK_FILTERS, completion: "today" }, projectsById, TODAY);
    expect(result.map((item) => item.id)).toEqual([doneToday.id]);
  });

  const tasks = [
    task({ title: "Revisão do site", projectId: "p1", status: "waiting", waitingFor: "Pedro" }),
    task({ title: "Enviar proposta", priority: "high" }),
    task({ title: "Domínio", status: "completed", projectId: "p1" }),
    task({ title: "Arquivada", archivedAt: "2026-10-01T00:00:00.000Z" }),
  ];

  it("padrão mostra abertas e nunca arquivadas", () => {
    const result = filterTasks(tasks, DEFAULT_TASK_FILTERS, projectsById, TODAY);
    expect(result.map((t) => t.title)).toEqual(["Revisão do site", "Enviar proposta"]);
  });

  it("busca ignora acentos e cobre waitingFor e nome do projeto", () => {
    const search = (q: string) =>
      filterTasks(tasks, { ...DEFAULT_TASK_FILTERS, search: q }, projectsById, TODAY).map((t) => t.title);
    expect(search("revisao")).toEqual(["Revisão do site"]);
    expect(search("pedro")).toEqual(["Revisão do site"]);
    expect(search("integradas")).toEqual(["Revisão do site"]);
  });

  it("filtro de status tem precedência sobre abertas/concluídas", () => {
    const result = filterTasks(tasks, { ...DEFAULT_TASK_FILTERS, status: "completed" }, projectsById, TODAY);
    expect(result.map((t) => t.title)).toEqual(["Domínio"]);
  });

  it("filtra por projeto e por sem projeto", () => {
    const inProject = filterTasks(tasks, { ...DEFAULT_TASK_FILTERS, projectId: "p1", completion: "all" }, projectsById, TODAY);
    expect(inProject).toHaveLength(2);
    const noProject = filterTasks(tasks, { ...DEFAULT_TASK_FILTERS, projectId: NO_PROJECT }, projectsById, TODAY);
    expect(noProject.map((t) => t.title)).toEqual(["Enviar proposta"]);
  });
});

describe("escopos e agrupamento", () => {
  it("separa Hoje, Próximas e Sem data", () => {
    const focus = task({ focusDate: TODAY });
    const reviewToday = task({ reviewDate: TODAY });
    const future = task({ reviewDate: "2026-10-05" });
    const undated = task();
    const groups = groupByDate([focus, reviewToday, future, undated], TODAY);
    expect(groups.map((g) => [g.group, g.tasks.length])).toEqual([
      ["today", 2],
      ["upcoming", 1],
      ["undated", 1],
    ]);
  });

  it("foco expira no dia seguinte", () => {
    const yesterdayFocus = task({ focusDate: "2026-10-01" });
    expect(matchesScope(yesterdayFocus, "today", TODAY)).toBe(false);
  });

  it("atrasadas considera apenas prazo vencido de tarefas abertas", () => {
    expect(matchesScope(task({ dueDate: "2026-10-01" }), "overdue", TODAY)).toBe(true);
    expect(matchesScope(task({ dueDate: "2026-10-01", status: "completed" }), "overdue", TODAY)).toBe(false);
    expect(matchesScope(task({ reviewDate: "2026-10-01" }), "overdue", TODAY)).toBe(false);
  });
});

describe("relevantDate", () => {
  it("prefere a revisão quando ela chegou antes do prazo", () => {
    expect(relevantDate(task({ dueDate: "2026-10-10", reviewDate: TODAY }), TODAY)).toMatchObject({ kind: "review" });
    expect(relevantDate(task({ dueDate: "2026-10-10", reviewDate: "2026-10-05" }), TODAY)).toMatchObject({ kind: "due" });
    expect(relevantDate(task({ dueDate: "2026-09-30" }), TODAY)).toMatchObject({ kind: "due", overdue: true });
  });

  it("em concluídas mostra só a revisão, ignorando o prazo", () => {
    const done = { status: "completed" as const, dueDate: "2026-09-28" };
    expect(relevantDate(task({ ...done, reviewDate: "2026-10-06" }), TODAY)).toMatchObject({ kind: "review", overdue: false });
    expect(relevantDate(task(done), TODAY)).toBeNull();
  });
});

describe("projectStats", () => {
  it("conta abertas, concluídas e aguardando ignorando arquivadas", () => {
    const stats = projectStats(project, [
      task({ projectId: "p1" }),
      task({ projectId: "p1", status: "waiting" }),
      task({ projectId: "p1", status: "completed" }),
      task({ projectId: "p1", archivedAt: "2026-10-01T00:00:00.000Z" }),
      task(),
    ]);
    expect(stats).toMatchObject({ open: 2, completed: 1, waiting: 1, total: 3 });
  });
});
