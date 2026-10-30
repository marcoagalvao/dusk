import { describe, expect, it } from "vitest";

import { applyPreset, findPreset, type ProgressFormValues } from "./progress-presets";
import type { Task } from "./task";
import {
  addSubtask,
  applyProgressUpdate,
  buildTask,
  changeStatus,
  completeTask,
  hasProgressChanges,
  patchTask,
  removeSubtask,
  renameSubtask,
  reopenTask,
  subtaskProgress,
  toggleSubtask,
} from "./task-rules";

const T0 = "2026-10-02T12:00:00.000Z";
const T1 = "2026-10-02T13:00:00.000Z";

function makeTask(overrides: Partial<Task> = {}): Task {
  return { ...buildTask({ title: "Site Integradas" }, T0), ...overrides };
}

describe("buildTask", () => {
  it("cria tarefa só com título, status A fazer e prioridade Normal", () => {
    const task = buildTask({ title: "  Enviar proposta  " }, T0);
    expect(task.title).toBe("Enviar proposta");
    expect(task.status).toBe("todo");
    expect(task.priority).toBe("normal");
    expect(task.subtasks).toEqual([]);
    expect(task.updates).toEqual([]);
    expect(task.createdAt).toBe(T0);
    expect(task.updatedAt).toBe(T0);
  });

  it("rejeita título vazio", () => {
    expect(() => buildTask({ title: "   " }, T0)).toThrow();
  });

  it("ignora datas inválidas", () => {
    const task = buildTask({ title: "x", dueDate: "2026-13-40" }, T0);
    expect(task.dueDate).toBeUndefined();
  });
});

describe("changeStatus", () => {
  it("concluir define completedAt e registra evento completed", () => {
    const done = completeTask(makeTask(), T1);
    expect(done.status).toBe("completed");
    expect(done.completedAt).toBe(T1);
    expect(done.updates.at(-1)).toMatchObject({ type: "completed", status: "completed", createdAt: T1 });
  });

  it("reabrir volta para A fazer, limpa completedAt e registra reopened", () => {
    const reopened = reopenTask(completeTask(makeTask(), T0), T1);
    expect(reopened.status).toBe("todo");
    expect(reopened.completedAt).toBeUndefined();
    expect(reopened.updates.at(-1)).toMatchObject({ type: "reopened", status: "todo" });
  });

  it("sair de Concluído para outra coluna registra reopened com o novo status", () => {
    const moved = changeStatus(completeTask(makeTask(), T0), "waiting", T1);
    expect(moved.updates.at(-1)).toMatchObject({ type: "reopened", status: "waiting" });
    expect(moved.completedAt).toBeUndefined();
  });

  it("troca comum registra status_change", () => {
    const started = changeStatus(makeTask(), "in_progress", T1);
    expect(started.updates.at(-1)).toMatchObject({ type: "status_change", status: "in_progress" });
  });

  it("mesmo status não altera a tarefa", () => {
    const task = makeTask();
    expect(changeStatus(task, "todo", T1)).toBe(task);
  });
});

describe("applyProgressUpdate", () => {
  it("atualiza campos atuais, status e cria item na timeline", () => {
    const task = applyProgressUpdate(
      makeTask(),
      {
        status: "waiting",
        preset: "sent-to-client",
        done: "V1 pronta.",
        waitingFor: "Pedro enviar as informações",
        nextAction: "Aplicar conteúdo e preparar V2",
        reviewDate: "2026-10-05",
      },
      T1,
    );

    expect(task).toMatchObject({
      status: "waiting",
      lastDone: "V1 pronta.",
      waitingFor: "Pedro enviar as informações",
      nextAction: "Aplicar conteúdo e preparar V2",
      reviewDate: "2026-10-05",
      updatedAt: T1,
    });
    expect(task.updates).toHaveLength(1);
    expect(task.updates[0]).toMatchObject({
      type: "progress",
      preset: "sent-to-client",
      done: "V1 pronta.",
      waitingFor: "Pedro enviar as informações",
    });
  });

  it("timeline registra apenas o contexto que mudou", () => {
    const first = applyProgressUpdate(makeTask(), { status: "in_progress", nextAction: "Publicar" }, T0);
    const second = applyProgressUpdate(first, { status: "in_progress", done: "Revisado", nextAction: "Publicar" }, T1);
    expect(second.updates[1].nextAction).toBeUndefined();
    expect(second.updates[1].done).toBe("Revisado");
    expect(second.updates).toHaveLength(2);
  });

  it("mantém lastDone anterior quando nada novo foi feito", () => {
    const first = applyProgressUpdate(makeTask(), { status: "in_progress", done: "Estrutura" }, T0);
    const second = applyProgressUpdate(first, { status: "waiting", waitingFor: "Pedro" }, T1);
    expect(second.lastDone).toBe("Estrutura");
  });

  it("Finalizado conclui a tarefa", () => {
    const task = applyProgressUpdate(makeTask(), { status: "completed", preset: "finished" }, T1);
    expect(task.status).toBe("completed");
    expect(task.completedAt).toBe(T1);
    expect(task.updates[0].type).toBe("completed");
  });

  it("acompanhamento pós-entrega mantém a tarefa concluída e encerra a revisão", () => {
    const done = { ...completeTask(makeTask(), T0), reviewDate: "2026-10-06" };
    const followed = applyProgressUpdate(
      done,
      { status: "completed", preset: "follow-up", done: "Cliente testou e está tudo ok.", reviewDate: "" },
      T1,
    );
    expect(followed.status).toBe("completed");
    expect(followed.completedAt).toBe(T0);
    expect(followed.reviewDate).toBeUndefined();
    expect(followed.updates.at(-1)).toMatchObject({ type: "progress", preset: "follow-up", done: "Cliente testou e está tudo ok." });
  });

  it("hasProgressChanges detecta formulário sem alterações", () => {
    const task = makeTask({ nextAction: "Publicar" });
    expect(hasProgressChanges(task, { status: "todo", nextAction: "Publicar" })).toBe(false);
    expect(hasProgressChanges(task, { status: "todo", nextAction: "Publicar", note: "x" })).toBe(true);
    expect(hasProgressChanges(task, { status: "waiting", nextAction: "Publicar" })).toBe(true);
  });
});

describe("presets", () => {
  const base: ProgressFormValues = {
    status: "waiting",
    done: "",
    waitingFor: "Pedro",
    nextAction: "Publicar",
    reviewDate: "2026-10-05",
    note: "",
  };

  it("Resposta recebida limpa espera e revisão", () => {
    const values = applyPreset(base, findPreset("response-received")!);
    expect(values).toMatchObject({
      status: "in_progress",
      done: "Resposta recebida.",
      waitingFor: "",
      reviewDate: "",
      nextAction: "Publicar",
      preset: "response-received",
    });
  });

  it("Enviado ao cliente pré-preenche espera", () => {
    const values = applyPreset({ ...base, waitingFor: "" }, findPreset("sent-to-client")!);
    expect(values.status).toBe("waiting");
    expect(values.waitingFor).toBe("Retorno do cliente.");
    expect(values.done).toBe("Material enviado ao cliente.");
  });
});

describe("patchTask", () => {
  it("altera campos e limpa com null", () => {
    const task = makeTask({ dueDate: "2026-10-10", note: "antiga" });
    const patched = patchTask(task, { title: "Novo", priority: "urgent", dueDate: null, note: "" }, T1);
    expect(patched).toMatchObject({ title: "Novo", priority: "urgent", updatedAt: T1 });
    expect(patched.dueDate).toBeUndefined();
    expect(patched.note).toBeUndefined();
  });

  it("não altera a tarefa quando nada muda", () => {
    const task = makeTask();
    expect(patchTask(task, { title: task.title, priority: "normal" }, T1)).toBe(task);
  });

  it("mudança de status pela edição gera evento", () => {
    const patched = patchTask(makeTask(), { status: "completed" }, T1);
    expect(patched.completedAt).toBe(T1);
    expect(patched.updates.at(-1)?.type).toBe("completed");
  });
});

describe("subtarefas", () => {
  it("adiciona, conclui, renomeia, remove e calcula progresso", () => {
    let task = addSubtask(makeTask(), "Estrutura", T0);
    task = addSubtask(task, "Home", T0);
    task = addSubtask(task, "   ", T0);
    expect(task.subtasks).toHaveLength(2);

    const [first, second] = task.subtasks;
    task = toggleSubtask(task, first.id, T1);
    expect(task.subtasks[0]).toMatchObject({ completed: true, completedAt: T1 });
    expect(subtaskProgress(task)).toEqual({ done: 1, total: 2, percent: 50 });

    task = renameSubtask(task, second.id, "Página inicial", T1);
    expect(task.subtasks[1].title).toBe("Página inicial");

    task = toggleSubtask(task, first.id, T1);
    expect(task.subtasks[0].completedAt).toBeUndefined();

    task = removeSubtask(task, first.id, T1);
    expect(task.subtasks.map((s) => s.title)).toEqual(["Página inicial"]);
  });
});

describe("buildTask na criação", () => {
  const NOW = "2026-10-01T10:00:00.000Z";

  it("sem escolha, a prioridade é normal e não há revisão", () => {
    const task = buildTask({ title: "Sem extras" }, NOW);
    expect(task.priority).toBe("normal");
    expect(task.reviewDate).toBeUndefined();
  });

  it("guarda a prioridade e a revisão escolhidas", () => {
    const task = buildTask({ title: "Com extras", priority: "urgent", reviewDate: "2026-10-05" }, NOW);
    expect(task.priority).toBe("urgent");
    expect(task.reviewDate).toBe("2026-10-05");
  });
});
