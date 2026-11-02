import { beforeEach, describe, expect, it } from "vitest";

import type { Task } from "@/domain/task";

import { useAppStore } from "./app-store";

const store = () => useAppStore.getState();
const taskById = (id: string) => store().tasks.find((task) => task.id === id);

beforeEach(() => {
  useAppStore.setState({ tasks: [], projects: [] });
});

describe("concluir tarefa recorrente", () => {
  const create = (): Task => store().createTask({ title: "Relatório", recurrence: "weekly", dueDate: "2026-11-02" });

  it("cria a próxima e tira a repetição da concluída", () => {
    const task = create();
    const result = store().completeTask(task.id);

    expect(result?.next?.recurrence).toBe("weekly");
    expect(taskById(task.id)?.recurrence).toBeUndefined();
    expect(store().tasks).toHaveLength(2);
  });

  it("reabrir e concluir de novo não cria outra", () => {
    const task = create();
    store().completeTask(task.id);
    store().reopenTask(task.id);
    store().completeTask(task.id);
    expect(store().tasks).toHaveLength(2);
  });

  it("concluir pelo andamento também cria a próxima", () => {
    const task = create();
    const next = store().saveProgress(task.id, { status: "completed" });
    expect(next?.recurrence).toBe("weekly");
    expect(store().tasks).toHaveLength(2);
  });

  it("tarefa sem repetição não cria nada", () => {
    const task = store().createTask({ title: "Única" });
    expect(store().completeTask(task.id)?.next).toBeUndefined();
    expect(store().tasks).toHaveLength(1);
  });
});

describe("arquivar projeto", () => {
  const setup = () => {
    const project = store().createProject({ name: "Site", color: "sage" });
    const open = store().createTask({ title: "Aberta", projectId: project.id });
    const other = store().createTask({ title: "De outro projeto" });
    return { project, open, other };
  };

  it("por padrão mantém as tarefas ativas", () => {
    const { project, open } = setup();
    store().archiveProject(project.id);
    expect(taskById(open.id)?.archivedAt).toBeUndefined();
  });

  it("com as tarefas, arquiva só as do projeto e restaura juntas", () => {
    const { project, open, other } = setup();
    store().archiveProject(project.id, { withTasks: true });
    expect(taskById(open.id)?.archivedAt).toBeTruthy();
    expect(taskById(other.id)?.archivedAt).toBeUndefined();

    store().unarchiveProject(project.id);
    expect(taskById(open.id)?.archivedAt).toBeUndefined();
  });

  it("restaurar o projeto não traz tarefa arquivada antes, por conta própria", () => {
    const { project, open } = setup();
    useAppStore.setState({
      tasks: store().tasks.map((task) => (task.id === open.id ? { ...task, archivedAt: "2020-01-01T00:00:00.000Z" } : task)),
    });
    store().archiveProject(project.id, { withTasks: true });
    store().unarchiveProject(project.id);
    expect(taskById(open.id)?.archivedAt).toBe("2020-01-01T00:00:00.000Z");
  });
});
