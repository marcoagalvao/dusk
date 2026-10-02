import type { Task, TaskStatus } from "@/domain/task";
import * as rules from "@/domain/task-rules";
import { nowIso } from "@/lib/dates";

import type { AppSliceCreator } from "../types";

export interface TasksSlice {
  tasks: Task[];
  createTask: (input: rules.CreateTaskInput) => Task;
  patchTask: (id: string, patch: rules.TaskPatch) => void;
  setTaskStatus: (id: string, status: TaskStatus) => void;
  /** Conclui e devolve a versão anterior da tarefa, usada pelo "Desfazer". */
  completeTask: (id: string) => Task | undefined;
  reopenTask: (id: string) => void;
  /** Recoloca uma versão anterior da tarefa (desfazer). */
  restoreTask: (snapshot: Task) => void;
  saveProgress: (id: string, input: rules.ProgressInput) => void;
  setFocus: (id: string, focusDate: string | null) => void;
  archiveTask: (id: string) => void;
  unarchiveTask: (id: string) => void;
  deleteTask: (id: string) => void;
  addSubtask: (taskId: string, title: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  renameSubtask: (taskId: string, subtaskId: string, title: string) => void;
  removeSubtask: (taskId: string, subtaskId: string) => void;
}

/** Aplica `update` à tarefa `id`, preservando a referência quando nada muda. */
function mapTask(tasks: Task[], id: string, update: (task: Task) => Task): Task[] {
  let changed = false;
  const next = tasks.map((task) => {
    if (task.id !== id) return task;
    const updated = update(task);
    if (updated !== task) changed = true;
    return updated;
  });
  return changed ? next : tasks;
}

export const createTasksSlice: AppSliceCreator<TasksSlice> = (set, get) => {
  const updateTask = (id: string, update: (task: Task, now: string) => Task) =>
    set((state) => {
      const now = nowIso();
      const tasks = mapTask(state.tasks, id, (task) => update(task, now));
      return tasks === state.tasks ? state : { tasks };
    });

  return {
    tasks: [],

    createTask: (input) => {
      const task = rules.buildTask(input, nowIso());
      set((state) => ({ tasks: [...state.tasks, task] }));
      return task;
    },

    patchTask: (id, patch) => updateTask(id, (task, now) => rules.patchTask(task, patch, now)),

    setTaskStatus: (id, status) => updateTask(id, (task, now) => rules.changeStatus(task, status, now)),

    completeTask: (id) => {
      const previous = get().tasks.find((task) => task.id === id);
      if (!previous || previous.status === "completed") return undefined;
      updateTask(id, rules.completeTask);
      return previous;
    },

    reopenTask: (id) => updateTask(id, rules.reopenTask),

    restoreTask: (snapshot) =>
      set((state) => ({
        tasks: state.tasks.some((task) => task.id === snapshot.id)
          ? state.tasks.map((task) => (task.id === snapshot.id ? snapshot : task))
          : [...state.tasks, snapshot],
      })),

    saveProgress: (id, input) => updateTask(id, (task, now) => rules.applyProgressUpdate(task, input, now)),

    setFocus: (id, focusDate) => updateTask(id, (task, now) => rules.setFocus(task, focusDate, now)),

    archiveTask: (id) => updateTask(id, rules.archiveTask),

    unarchiveTask: (id) => updateTask(id, rules.unarchiveTask),

    deleteTask: (id) => set((state) => ({ tasks: state.tasks.filter((task) => task.id !== id) })),

    addSubtask: (taskId, title) => updateTask(taskId, (task, now) => rules.addSubtask(task, title, now)),

    toggleSubtask: (taskId, subtaskId) =>
      updateTask(taskId, (task, now) => rules.toggleSubtask(task, subtaskId, now)),

    renameSubtask: (taskId, subtaskId, title) =>
      updateTask(taskId, (task, now) => rules.renameSubtask(task, subtaskId, title, now)),

    removeSubtask: (taskId, subtaskId) =>
      updateTask(taskId, (task, now) => rules.removeSubtask(task, subtaskId, now)),
  };
};
