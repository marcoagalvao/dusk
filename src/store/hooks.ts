"use client";

import { useMemo } from "react";

import type { Project } from "@/domain/project";

import { useAppStore } from "./app-store";

/*
 * Seletores retornam referências do store (estáveis); derivações ficam em
 * `useMemo` para não criar arrays novos a cada render do Zustand.
 */

export const useTasks = () => useAppStore((state) => state.tasks);
export const useProjects = () => useAppStore((state) => state.projects);
export const useSettings = () => useAppStore((state) => state.settings);

export const useTask = (id: string) => useAppStore((state) => state.tasks.find((task) => task.id === id));
export const useProject = (id: string | undefined) =>
  useAppStore((state) => (id ? state.projects.find((project) => project.id === id) : undefined));

export function useProjectMap(): ReadonlyMap<string, Project> {
  const projects = useProjects();
  return useMemo(() => new Map(projects.map((project) => [project.id, project])), [projects]);
}

const collator = new Intl.Collator("pt-BR", { sensitivity: "base" });

/** Projetos não arquivados em ordem alfabética (seletores de projeto). */
export function useActiveProjects(): Project[] {
  const projects = useProjects();
  return useMemo(
    () => projects.filter((project) => !project.archivedAt).sort((a, b) => collator.compare(a.name, b.name)),
    [projects],
  );
}
