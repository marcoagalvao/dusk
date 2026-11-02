import { describe, expect, it } from "vitest";

import { buildNextOccurrence, nextOccurrence } from "./recurrence";
import type { Task } from "./task";
import { addSubtask, buildTask, toggleSubtask } from "./task-rules";

const NOW = "2026-11-02T12:00:00.000Z";
const TODAY = "2026-11-02"; // segunda-feira

function recurring(overrides: Partial<Task> = {}): Task {
  return { ...buildTask({ title: "Enviar relatório" }, NOW), recurrence: "weekly", dueDate: TODAY, ...overrides };
}

describe("nextOccurrence", () => {
  it("avança um dia, uma semana ou um mês", () => {
    expect(nextOccurrence("daily", "2026-11-02")).toBe("2026-11-03");
    expect(nextOccurrence("weekly", "2026-11-02")).toBe("2026-11-09");
    expect(nextOccurrence("monthly", "2026-11-02")).toBe("2026-12-02");
  });

  it("em dias úteis, sexta vai para segunda", () => {
    expect(nextOccurrence("weekdays", "2026-11-06")).toBe("2026-11-09");
    expect(nextOccurrence("weekdays", "2026-11-02")).toBe("2026-11-03");
  });

  it("no fim do mês curto, usa o último dia", () => {
    expect(nextOccurrence("monthly", "2027-01-31")).toBe("2027-02-28");
  });
});

describe("buildNextOccurrence", () => {
  it("cria uma tarefa nova, aberta, com a próxima data e a mesma repetição", () => {
    const next = buildNextOccurrence(recurring({ priority: "high", projectId: "p1", nextAction: "Conferir números" }), NOW, TODAY);
    expect(next.id).not.toBe(recurring().id);
    expect(next).toMatchObject({
      title: "Enviar relatório",
      status: "todo",
      priority: "high",
      projectId: "p1",
      nextAction: "Conferir números",
      recurrence: "weekly",
      dueDate: "2026-11-09",
      updates: [],
    });
    expect(next.completedAt).toBeUndefined();
    expect(next.focusDate).toBeUndefined();
  });

  it("não acumula: um prazo muito atrasado salta para a próxima data depois de hoje", () => {
    expect(buildNextOccurrence(recurring({ dueDate: "2026-10-01" }), NOW, TODAY).dueDate).toBe("2026-11-05");
  });

  it("sem prazo, conta a partir de hoje", () => {
    expect(buildNextOccurrence(recurring({ dueDate: undefined }), NOW, TODAY).dueDate).toBe("2026-11-09");
  });

  it("reinicia as subtarefas", () => {
    let task = addSubtask(recurring(), "Coletar dados", NOW);
    task = toggleSubtask(task, task.subtasks[0].id, NOW);
    const next = buildNextOccurrence(task, NOW, TODAY);
    expect(next.subtasks).toHaveLength(1);
    expect(next.subtasks[0].title).toBe("Coletar dados");
    expect(next.subtasks[0].completed).toBe(false);
    expect(next.subtasks[0].id).not.toBe(task.subtasks[0].id);
  });

  it("mantém a distância entre lembrete e prazo", () => {
    const next = buildNextOccurrence(recurring({ dueDate: "2026-11-05", reviewDate: "2026-11-03" }), NOW, TODAY);
    expect(next.dueDate).toBe("2026-11-12");
    expect(next.reviewDate).toBe("2026-11-10");
  });

  it("sem espera: a nova ocorrência não herda de quem a anterior dependia", () => {
    const next = buildNextOccurrence(recurring({ status: "waiting", waitingFor: "Ana", lastDone: "Enviei" }), NOW, TODAY);
    expect(next.waitingFor).toBeUndefined();
    expect(next.lastDone).toBeUndefined();
  });
});
