import type { Project } from "@/domain/project";
import * as rules from "@/domain/project-rules";
import { nowIso } from "@/lib/dates";

import type { AppSliceCreator } from "../types";

/**
 * O que fazer com as tarefas de um projeto que será excluído. Não existe
 * cascade delete: sem estratégia, a exclusão é recusada.
 */
export type ProjectTaskStrategy = { kind: "detach" } | { kind: "move"; targetProjectId: string };

export interface ProjectsSlice {
  projects: Project[];
  createProject: (input: rules.ProjectInput) => Project;
  updateProject: (id: string, input: rules.ProjectInput) => void;
  archiveProject: (id: string) => void;
  unarchiveProject: (id: string) => void;
  /** Devolve `false` quando há tarefas associadas e nenhuma estratégia foi informada. */
  deleteProject: (id: string, strategy?: ProjectTaskStrategy) => boolean;
}

export const createProjectsSlice: AppSliceCreator<ProjectsSlice> = (set, get) => {
  const updateProject = (id: string, update: (project: Project, now: string) => Project) =>
    set((state) => {
      const now = nowIso();
      return {
        projects: state.projects.map((project) => (project.id === id ? update(project, now) : project)),
      };
    });

  return {
    projects: [],

    createProject: (input) => {
      const project = rules.buildProject(input, nowIso());
      set((state) => ({ projects: [...state.projects, project] }));
      return project;
    },

    updateProject: (id, input) => updateProject(id, (project, now) => rules.patchProject(project, input, now)),

    archiveProject: (id) => updateProject(id, rules.archiveProject),

    unarchiveProject: (id) => updateProject(id, rules.unarchiveProject),

    deleteProject: (id, strategy) => {
      const { tasks, projects } = get();
      const hasTasks = tasks.some((task) => task.projectId === id);
      if (hasTasks && !strategy) return false;
      if (strategy?.kind === "move" && !projects.some((p) => p.id === strategy.targetProjectId && p.id !== id)) {
        return false;
      }

      const now = nowIso();
      const targetProjectId = strategy?.kind === "move" ? strategy.targetProjectId : undefined;

      set((state) => ({
        projects: state.projects.filter((project) => project.id !== id),
        tasks: hasTasks
          ? state.tasks.map((task) =>
              task.projectId === id ? { ...task, projectId: targetProjectId, updatedAt: now } : task,
            )
          : state.tasks,
      }));
      return true;
    },
  };
};
