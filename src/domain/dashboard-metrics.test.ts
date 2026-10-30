import { describe, expect, it } from "vitest";

import type { Project } from "./project";
import type { Task } from "./task";
import {
  activityHeatmap,
  agingBuckets,
  completionStreak,
  getTodayAgenda,
  periodReport,
  priorityMatrix,
  statusBreakdown,
  todayPulse,
  upcomingDays,
  waitingByPerson,
} from "./dashboard-metrics";

const TODAY = "2026-10-30";

/** Meio-dia local, para o dia civil não depender do fuso em que o teste roda. */
const at = (dateKey: string) => new Date(`${dateKey}T12:00:00`).toISOString();

function task(id: string, patch: Partial<Task> = {}): Task {
  return {
    id,
    title: id,
    status: "todo",
    priority: "normal",
    subtasks: [],
    updates: [],
    createdAt: at("2026-10-01"),
    updatedAt: at("2026-10-01"),
    ...patch,
  };
}

function done(id: string, completedOn: string, patch: Partial<Task> = {}): Task {
  return task(id, { status: "completed", completedAt: at(completedOn), ...patch });
}

const project: Project = { id: "p1", name: "Integradas", color: "sage", createdAt: at("2026-10-01"), updatedAt: at("2026-10-01") };

describe("todayPulse", () => {
  it("conta o que falta hoje e o que já foi feito", () => {
    const pulse = todayPulse(
      [
        task("atrasada", { dueDate: "2026-10-20" }),
        task("hoje", { dueDate: TODAY }),
        task("foco", { focusDate: TODAY }),
        task("futura", { dueDate: "2026-11-20" }),
        done("feita-hoje", TODAY),
        done("feita-ontem", "2026-10-29"),
      ],
      TODAY,
    );
    expect(pulse.pending).toBe(3);
    expect(pulse.doneToday).toBe(1);
    expect(pulse.percent).toBe(25);
  });

  it("separa os alertas", () => {
    const pulse = todayPulse(
      [
        task("a", { dueDate: "2026-10-20" }),
        task("b", { priority: "urgent" }),
        task("c", { status: "blocked" }),
        task("d", { status: "waiting" }),
        task("e", { reviewDate: TODAY }),
      ],
      TODAY,
    );
    expect(pulse).toMatchObject({ overdue: 1, urgent: 1, blocked: 1, waiting: 1, reviewsDue: 1 });
  });

  it("ignora arquivadas", () => {
    expect(todayPulse([task("a", { dueDate: TODAY, archivedAt: at(TODAY) })], TODAY).pending).toBe(0);
  });

  it("sem nada para hoje, o percentual é zero e não NaN", () => {
    expect(todayPulse([], TODAY).percent).toBe(0);
  });
});

describe("getTodayAgenda", () => {
  it("une foco e atenção, sem repetir, com as mais críticas primeiro", () => {
    const agenda = getTodayAgenda(
      [
        task("foco", { focusDate: TODAY }),
        task("hoje-e-foco", { dueDate: TODAY, focusDate: TODAY }),
        task("atrasada", { dueDate: "2026-10-20" }),
        task("fora", { dueDate: "2026-11-20" }),
      ],
      TODAY,
    );
    expect(agenda.map((item) => item.id)).toEqual(["atrasada", "hoje-e-foco", "foco"]);
  });

  it("mostra por último as concluídas que estavam no foco", () => {
    const agenda = getTodayAgenda([done("feita", TODAY, { focusDate: TODAY }), task("aberta", { focusDate: TODAY })], TODAY);
    expect(agenda.map((item) => item.id)).toEqual(["aberta", "feita"]);
  });
});

describe("priorityMatrix", () => {
  it("cruza prioridade e prazo só com tarefas abertas", () => {
    const matrix = priorityMatrix(
      [
        task("a", { priority: "urgent", dueDate: "2026-10-20" }),
        task("b", { priority: "urgent", dueDate: "2026-10-21" }),
        task("c", { priority: "high", dueDate: TODAY }),
        task("d", { priority: "normal", dueDate: "2026-11-02" }),
        task("e", { priority: "low", dueDate: "2026-12-30" }),
        task("f", { priority: "low" }),
        done("g", TODAY, { priority: "urgent", dueDate: "2026-10-20" }),
      ],
      TODAY,
    );
    expect(matrix.urgent.overdue).toBe(2);
    expect(matrix.high.today).toBe(1);
    expect(matrix.normal.soon).toBe(1);
    expect(matrix.low.later).toBe(1);
    expect(matrix.low.none).toBe(1);
  });

  it("o limite de 7 dias entra em 'em breve' e o 8º dia em 'depois'", () => {
    const matrix = priorityMatrix([task("a", { dueDate: "2026-11-06" }), task("b", { dueDate: "2026-11-07" })], TODAY);
    expect(matrix.normal.soon).toBe(1);
    expect(matrix.normal.later).toBe(1);
  });
});

describe("statusBreakdown", () => {
  it("conta tarefas abertas por status", () => {
    const counts = statusBreakdown([task("a"), task("b", { status: "waiting" }), task("c", { status: "waiting" }), done("d", TODAY)]);
    expect(counts).toEqual({ todo: 1, in_progress: 0, waiting: 2, blocked: 0 });
  });
});

describe("upcomingDays", () => {
  it("gera os dias a partir de hoje com prazos e revisões", () => {
    const days = upcomingDays(
      [task("a", { dueDate: TODAY }), task("b", { reviewDate: "2026-10-31" }), task("c", { dueDate: "2026-10-31", reviewDate: "2026-10-31" })],
      TODAY,
      14,
    );
    expect(days).toHaveLength(14);
    expect(days[0]).toMatchObject({ date: TODAY });
    expect(days[0].items.map((item) => item.task.id)).toEqual(["a"]);
    expect(days[1].items.map((item) => [item.task.id, item.kind])).toEqual([
      ["c", "due"],
      ["b", "review"],
    ]);
  });

  it("coloca as mais prioritárias primeiro e ignora concluídas sem revisão", () => {
    const days = upcomingDays(
      [task("normal", { dueDate: TODAY }), task("urgente", { dueDate: TODAY, priority: "urgent" }), done("feita", TODAY, { dueDate: TODAY })],
      TODAY,
      1,
    );
    expect(days[0].items.map((item) => item.task.id)).toEqual(["urgente", "normal"]);
  });
});

describe("periodReport", () => {
  it("compara a janela atual com a anterior de mesmo tamanho", () => {
    const report = periodReport(
      [
        done("a", TODAY, { createdAt: at(TODAY) }),
        done("b", "2026-10-24", { createdAt: at("2026-10-24") }),
        done("anterior", "2026-10-20"),
        done("fora", "2026-10-10"),
      ],
      [],
      TODAY,
      7,
    );
    expect(report.completed).toBe(2);
    expect(report.previousCompleted).toBe(1);
    expect(report.created).toBe(2);
    expect(report.days).toHaveLength(7);
    expect(report.days[6]).toMatchObject({ date: TODAY, completed: 1, created: 1 });
  });

  it("calcula a taxa de entrega no prazo só com quem tinha prazo", () => {
    const report = periodReport(
      [
        done("no-prazo", "2026-10-28", { dueDate: "2026-10-29" }),
        done("no-dia", "2026-10-28", { dueDate: "2026-10-28" }),
        done("tarde", "2026-10-28", { dueDate: "2026-10-27" }),
        done("sem-prazo", "2026-10-28"),
      ],
      [],
      TODAY,
      7,
    );
    expect(report.onTimePercent).toBe(67);
  });

  it("sem entregas com prazo, a taxa é nula, não zero", () => {
    expect(periodReport([done("a", TODAY)], [], TODAY, 7).onTimePercent).toBeNull();
  });

  it("calcula o ciclo médio em dias", () => {
    const report = periodReport(
      [done("a", "2026-10-28", { createdAt: at("2026-10-24") }), done("b", "2026-10-28", { createdAt: at("2026-10-26") })],
      [],
      TODAY,
      7,
    );
    expect(report.avgCycleDays).toBe(3);
  });

  it("agrupa concluídas por projeto, com as sem projeto à parte", () => {
    const report = periodReport(
      [done("a", TODAY, { projectId: "p1" }), done("b", TODAY, { projectId: "p1" }), done("c", TODAY)],
      [project],
      TODAY,
      7,
    );
    expect(report.byProject.map((row) => [row.name, row.completed])).toEqual([
      ["Integradas", 2],
      ["Sem projeto", 1],
    ]);
  });

  it("arquivar não apaga a entrega do relatório", () => {
    expect(periodReport([done("a", TODAY, { archivedAt: at(TODAY) })], [], TODAY, 7).completed).toBe(1);
  });
});

describe("agingBuckets", () => {
  it("distribui as tarefas abertas pela idade", () => {
    const buckets = agingBuckets(
      [
        task("nova", { createdAt: at("2026-10-29") }),
        task("semana", { createdAt: at("2026-10-24") }),
        task("velha", { createdAt: at("2026-08-01") }),
        done("feita", TODAY, { createdAt: at("2026-08-01") }),
      ],
      TODAY,
    );
    expect(buckets.map((bucket) => bucket.count)).toEqual([1, 1, 0, 0, 1]);
  });
});

describe("activityHeatmap", () => {
  it("soma criações, conclusões e atualizações por dia", () => {
    const heatmap = activityHeatmap(
      [
        done("a", TODAY, {
          createdAt: at(TODAY),
          updates: [{ id: "u", taskId: "a", type: "progress", status: "todo", createdAt: at("2026-10-29") }],
        }),
      ],
      TODAY,
      2,
    );
    const byDate = new Map(heatmap.days.map((day) => [day.date, day.count]));
    expect(byDate.get(TODAY)).toBe(2);
    expect(byDate.get("2026-10-29")).toBe(1);
    expect(heatmap.max).toBe(2);
  });

  it("começa numa segunda-feira e termina hoje", () => {
    const { days } = activityHeatmap([], TODAY, 2);
    expect(days[0].date).toBe("2026-10-19");
    expect(days.at(-1)?.date).toBe(TODAY);
  });
});

describe("waitingByPerson", () => {
  it("agrupa ignorando maiúsculas e acentos, com quem deve mais primeiro", () => {
    const people = waitingByPerson(
      [
        task("a", { status: "waiting", waitingFor: "José", updatedAt: at("2026-10-20") }),
        task("b", { status: "waiting", waitingFor: "jose", updatedAt: at("2026-10-28") }),
        task("c", { status: "waiting", waitingFor: "Ana" }),
        task("d", { status: "todo", waitingFor: "Ana" }),
        task("e", { status: "waiting" }),
      ],
      TODAY,
    );
    expect(people[0]).toMatchObject({ name: "José", count: 2, oldestDays: 10 });
    expect(people.map((person) => person.count)).toEqual([2, 1]);
  });
});

describe("completionStreak", () => {
  it("conta dias seguidos com entrega até hoje", () => {
    expect(completionStreak([done("a", TODAY), done("b", "2026-10-29"), done("c", "2026-10-27")], TODAY)).toBe(2);
  });

  it("não zera antes do fim do dia: vale a sequência até ontem", () => {
    expect(completionStreak([done("a", "2026-10-29"), done("b", "2026-10-28")], TODAY)).toBe(2);
  });

  it("é zero quando a última entrega é mais antiga que ontem", () => {
    expect(completionStreak([done("a", "2026-10-27")], TODAY)).toBe(0);
  });
});
