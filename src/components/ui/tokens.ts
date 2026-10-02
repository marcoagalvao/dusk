import type { ProjectColor } from "@/domain/project";
import type { TaskPriority, TaskStatus } from "@/domain/task";

/** Referências aos tokens de cor do tema para uso em `style` e SVG. */

export const STATUS_COLOR: Record<TaskStatus, string> = {
  todo: "var(--color-status-todo)",
  in_progress: "var(--color-status-progress)",
  waiting: "var(--color-status-waiting)",
  blocked: "var(--color-status-blocked)",
  completed: "var(--color-status-completed)",
};

export const PRIORITY_COLOR: Record<TaskPriority, string> = {
  urgent: "var(--color-priority-urgent)",
  high: "var(--color-priority-high)",
  normal: "var(--color-priority-normal)",
  low: "var(--color-priority-low)",
};

export const PROJECT_COLOR: Record<ProjectColor, string> = {
  lavender: "var(--color-project-lavender)",
  periwinkle: "var(--color-project-periwinkle)",
  peach: "var(--color-project-peach)",
  rose: "var(--color-project-rose)",
  sage: "var(--color-project-sage)",
  sand: "var(--color-project-sand)",
};

/** Fundo translúcido derivado de uma cor de token (badges sutis, PRD §52). */
export function tint(color: string, percent = 14): string {
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`;
}
