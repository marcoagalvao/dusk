import { isCustomProjectColor, type PresetProjectColor, type ProjectColor } from "@/domain/project";
import type { TaskPriority, TaskStatus } from "@/domain/task";
import { normalizeHex } from "@/lib/utils/color";

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

export const PROJECT_COLOR: Record<PresetProjectColor, string> = {
  lavender: "var(--color-project-lavender)",
  periwinkle: "var(--color-project-periwinkle)",
  peach: "var(--color-project-peach)",
  rose: "var(--color-project-rose)",
  sage: "var(--color-project-sage)",
  sand: "var(--color-project-sand)",
};

/** Valor para `style`: o token, se for da paleta, ou a própria cor livre. */
export function projectColorValue(color: ProjectColor): string {
  return isCustomProjectColor(color) ? color : PROJECT_COLOR[color];
}

function tokenHex(token: string, fallback: string): string {
  return normalizeHex(getComputedStyle(document.documentElement).getPropertyValue(token)) ?? fallback;
}

/** Hex real da cor, para a tela de escolha partir dela. Só no navegador. */
export function projectColorHex(color: ProjectColor): string {
  return isCustomProjectColor(color) ? color : tokenHex(`--color-project-${color}`, "#c4b5fd");
}

export const surfaceHex = () => tokenHex("--color-surface", "#2d2b32");

/** Fundo translúcido derivado de uma cor de token (badges sutis, PRD §52). */
export function tint(color: string, percent = 14): string {
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`;
}
