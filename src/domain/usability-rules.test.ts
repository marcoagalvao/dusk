import { describe, expect, it } from "vitest";

import { dailyDigest } from "./daily-digest";
import { waitingByPerson } from "./dashboard-metrics";
import { applyPreset, changeFormStatus, findPreset, type ProgressFormValues } from "./progress-presets";
import type { Project } from "./project";
import type { Task } from "./task";
import { getStaleFocus, otherDate, searchTasks, sortTasks, waitingSince } from "./task-queries";
import { applyProgressUpdate, buildTask, changeStatus, completeTask, hasProgressChanges, patchTask, reopenTask } from "./task-rules";

const TODAY = "2026-11-02";
const at = (dateKey: string) => new Date(`${dateKey}T12:00:00`).toISOString();
const NOW = at(TODAY);

function task(id: string, overrides: Partial<Task> = {}): Task {
  return { ...buildTask({ title: id }, at("2026-10-01")), id, ...overrides };
}

const ids = (tasks: readonly Task[]) => tasks.map((item) => item.id);

describe("ordem recomendada", () => {
  it("sem prazo, a prioridade decide, mesmo que a Baixa tenha sido alterada por último", () => {
    const list = [
      task("baixa", { priority: "low", updatedAt: at("2026-10-20") }),
      task("normal", { updatedAt: at("2026-10-10") }),
      task("alta", { priority: "high", updatedAt: at("2026-10-01") }),
    ];
    expect(ids(sortTasks(list, "smart", TODAY))).toEqual(["alta", "normal", "baixa"]);
  });

  it("no mesmo prazo, a prioridade desempata", () => {
    const list = [task("baixa", { priority: "low", dueDate: "2026-11-04" }), task("alta", { priority: "high", dueDate: "2026-11-04" })];
    expect(ids(sortTasks(list, "smart", TODAY))).toEqual(["alta", "baixa"]);
  });

  it("prazo em até 7 dias vem antes; prazo distante não passa na frente da Alta sem prazo", () => {
    const list = [
      task("baixa-longe", { priority: "low", dueDate: "2027-02-01" }),
      task("alta-sem-prazo", { priority: "high" }),
      task("normal-perto", { dueDate: "2026-11-05" }),
    ];
    expect(ids(sortTasks(list, "smart", TODAY))).toEqual(["normal-perto", "alta-sem-prazo", "baixa-longe"]);
  });
});

describe("sair da espera", () => {
  const waiting = () => task("a", { status: "waiting", waitingFor: "Ana", reviewDate: "2026-11-01" });

  it("concluir encerra a espera e o lembrete, e a pessoa fica no histórico", () => {
    const done = completeTask(waiting(), NOW);
    expect(done.waitingFor).toBeUndefined();
    expect(done.reviewDate).toBeUndefined();
    expect(done.updates.at(-1)?.note).toContain("Ana");
  });

  it("voltar a trabalhar também encerra", () => {
    const moved = changeStatus(waiting(), "in_progress", NOW);
    expect(moved.waitingFor).toBeUndefined();
    expect(moved.reviewDate).toBeUndefined();
  });

  it("entre Aguardando e Bloqueada nada se perde", () => {
    const moved = changeStatus(waiting(), "blocked", NOW);
    expect(moved.waitingFor).toBe("Ana");
    expect(moved.reviewDate).toBe("2026-11-01");
  });

  it("tarefa sem espera mantém o lembrete ao concluir", () => {
    const done = completeTask(task("a", { status: "in_progress", reviewDate: "2026-11-10" }), NOW);
    expect(done.reviewDate).toBe("2026-11-10");
  });

  it("o andamento não guarda a pessoa fora de Aguardando ou Bloqueada", () => {
    const input = { status: "in_progress" as const, waitingFor: "Ana" };
    expect(applyProgressUpdate(waiting(), input, NOW).waitingFor).toBeUndefined();
  });

  it("o formulário limpa a data ao sair da espera, e o usuário pode escolher outra", () => {
    const values: ProgressFormValues = { status: "waiting", done: "", waitingFor: "Ana", nextAction: "", reviewDate: "2026-11-01", note: "" };
    expect(changeFormStatus(values, "in_progress").reviewDate).toBe("");
    expect(changeFormStatus(values, "blocked").reviewDate).toBe("2026-11-01");
    expect(applyPreset(values, findPreset("finished")!).reviewDate).toBe("");
  });

  it("tarefa antiga concluída com pessoa guardada não trava o formulário de lembrete", () => {
    const legacy = task("a", { status: "completed", completedAt: NOW, waitingFor: "Ana" });
    expect(hasProgressChanges(legacy, { status: "completed", waitingFor: "Ana" })).toBe(true);
  });
});

describe("reabrir", () => {
  const reopened = (first: Task) => reopenTask(completeTask(first, NOW), NOW).status;

  it("nunca iniciada volta para A fazer", () => {
    expect(reopened(task("a"))).toBe("todo");
  });

  it("iniciada volta para Em andamento", () => {
    expect(reopened(changeStatus(task("a"), "in_progress", NOW))).toBe("in_progress");
  });

  it("em espera volta para Em andamento, porque a espera já foi encerrada", () => {
    expect(reopened(changeStatus(task("a"), "waiting", NOW))).toBe("in_progress");
  });
});

describe("tempo de espera", () => {
  it("conta desde a entrada em Aguardando, mesmo com outras edições depois", () => {
    const entered = changeStatus(task("a", { waitingFor: "Ana" }), "waiting", at("2026-10-01"));
    const edited = patchTask(entered, { priority: "high" }, at(TODAY));
    expect(waitingSince(edited)).toBe(at("2026-10-01"));
    expect(waitingByPerson([edited], TODAY)[0].oldestDays).toBe(32);
  });

  it("um novo registro enquanto aguarda não reinicia a contagem", () => {
    const entered = changeStatus(task("a", { waitingFor: "Ana" }), "waiting", at("2026-10-01"));
    const updated = applyProgressUpdate(entered, { status: "waiting", waitingFor: "Ana", done: "Cobrei" }, at("2026-10-20"));
    expect(waitingSince(updated)).toBe(at("2026-10-01"));
  });

  it("voltar a aguardar reinicia", () => {
    let current = changeStatus(task("a"), "waiting", at("2026-10-01"));
    current = changeStatus(current, "in_progress", at("2026-10-05"));
    current = changeStatus(current, "waiting", at("2026-10-20"));
    expect(waitingSince(current)).toBe(at("2026-10-20"));
  });
});

describe("foco de dias anteriores", () => {
  it("traz só tarefas abertas do foco da última semana", () => {
    const list = [
      task("ontem", { focusDate: "2026-11-01" }),
      task("hoje", { focusDate: TODAY }),
      task("feita", { focusDate: "2026-11-01", status: "completed", completedAt: NOW }),
      task("antiga", { focusDate: "2026-10-01" }),
    ];
    expect(ids(getStaleFocus(list, TODAY))).toEqual(["ontem"]);
  });
});

describe("segunda data da linha", () => {
  it("mostra a data que a linha ainda não mostrou", () => {
    expect(otherDate(task("a", { dueDate: "2026-11-05", reviewDate: "2026-11-03" }), TODAY)).toMatchObject({ kind: "review", date: "2026-11-03" });
    expect(otherDate(task("a", { dueDate: "2026-11-05", reviewDate: "2026-11-01" }), TODAY)).toMatchObject({ kind: "due", date: "2026-11-05" });
  });

  it("não repete quando só há uma data ou a tarefa está concluída", () => {
    expect(otherDate(task("a", { dueDate: "2026-11-05" }), TODAY)).toBeNull();
    expect(otherDate(task("a", { dueDate: "2026-11-05", reviewDate: "2026-11-03", status: "completed", completedAt: NOW }), TODAY)).toBeNull();
  });
});

describe("busca global", () => {
  const projects = new Map<string, Project>([["p", { id: "p", name: "Integradas", color: "sage", createdAt: NOW, updatedAt: NOW }]]);

  it("título que começa com o termo vem primeiro; concluídas ficam depois das abertas", () => {
    const list = [
      task("c", { title: "Enviar proposta", status: "completed", completedAt: NOW }),
      task("b", { title: "Revisar a proposta" }),
      task("a", { title: "Proposta comercial" }),
    ];
    expect(ids(searchTasks(list, "proposta", projects))).toEqual(["a", "b", "c"]);
  });

  it("ignora acentos, encontra pelo projeto e deixa arquivadas de fora", () => {
    const list = [task("a", { title: "Reunião" }), task("b", { projectId: "p" }), task("c", { title: "Reunião", archivedAt: NOW })];
    expect(ids(searchTasks(list, "reuniao", projects))).toEqual(["a"]);
    expect(ids(searchTasks(list, "integradas", projects))).toEqual(["b"]);
  });

  it("sem termo não lista nada", () => {
    expect(searchTasks([task("a")], "  ", projects)).toEqual([]);
  });
});

describe("resumo diário das notificações", () => {
  it("conta atrasadas, prazos de hoje e lembretes que chegaram", () => {
    const digest = dailyDigest(
      [
        { status: "todo", dueDate: "2026-11-01" },
        { status: "waiting", dueDate: TODAY },
        { status: "completed", reviewDate: TODAY },
        { status: "todo", dueDate: "2026-11-09" },
        { status: "completed", dueDate: "2026-10-01" },
      ],
      TODAY,
    );
    expect(digest).toEqual({ title: "3 tarefas pedem atenção hoje", body: "1 atrasada · 1 com prazo hoje · 1 lembrete" });
  });

  it("não conta a mesma tarefa duas vezes", () => {
    const digest = dailyDigest([{ status: "todo", dueDate: "2026-11-01", reviewDate: TODAY }], TODAY);
    expect(digest).toEqual({ title: "1 tarefa pede atenção hoje", body: "1 atrasada" });
  });

  it("sem nada pendente não envia nada", () => {
    expect(dailyDigest([{ status: "todo", dueDate: "2026-11-09" }], TODAY)).toBeNull();
  });
});
