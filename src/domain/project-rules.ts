import { createId } from "@/lib/utils/id";
import { cleanText } from "@/lib/utils/text";

import { PROJECT_COLORS, PROJECT_NAME_MAX_LENGTH, type Project, type ProjectColor } from "./project";

export interface ProjectInput {
  name: string;
  color: ProjectColor;
  description?: string;
}

function cleanName(name: string): string {
  const clean = cleanText(name);
  if (!clean) throw new Error("O projeto precisa de um nome.");
  return clean.slice(0, PROJECT_NAME_MAX_LENGTH);
}

export function buildProject(input: ProjectInput, now: string): Project {
  return {
    id: createId(),
    name: cleanName(input.name),
    color: input.color,
    description: cleanText(input.description),
    createdAt: now,
    updatedAt: now,
  };
}

export function patchProject(project: Project, input: ProjectInput, now: string): Project {
  return {
    ...project,
    name: cleanName(input.name),
    color: input.color,
    description: cleanText(input.description),
    updatedAt: now,
  };
}

export function archiveProject(project: Project, now: string): Project {
  return { ...project, archivedAt: now, updatedAt: now };
}

export function unarchiveProject(project: Project, now: string): Project {
  return { ...project, archivedAt: undefined, updatedAt: now };
}

/** Sugere a cor menos usada entre os projetos ativos, para diferenciá-los. */
export function suggestProjectColor(projects: readonly Project[]): ProjectColor {
  const usage = new Map<ProjectColor, number>(PROJECT_COLORS.map((color) => [color, 0]));
  for (const project of projects) {
    if (!project.archivedAt) usage.set(project.color, (usage.get(project.color) ?? 0) + 1);
  }
  return PROJECT_COLORS.reduce((best, color) => (usage.get(color)! < usage.get(best)! ? color : best));
}
