import { CalendarDays, Hourglass, Sun, TriangleAlert, type LucideIcon } from "lucide-react";

import type { TaskScope } from "@/domain/task-queries";

export interface TaskViewNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  scope: Exclude<TaskScope, "all">;
}

export const TASK_VIEW_NAV: readonly TaskViewNavItem[] = [
  { href: "/tasks/today", label: "Hoje", icon: Sun, scope: "today" },
  { href: "/tasks/upcoming", label: "Próximas", icon: CalendarDays, scope: "upcoming" },
  { href: "/tasks/waiting", label: "Aguardando", icon: Hourglass, scope: "waiting" },
  { href: "/tasks/overdue", label: "Atrasadas", icon: TriangleAlert, scope: "overdue" },
];

/** Quantos projetos recentes aparecem na sidebar (lista completa em /projects). */
export const SIDEBAR_PROJECT_LIMIT = 5;

export function isActivePath(pathname: string, href: string, exact = false): boolean {
  if (href === "/") return pathname === "/";
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}
