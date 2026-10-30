"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

import { DEFAULT_TASK_FILTERS, type TaskFilters } from "@/domain/task-queries";
import { useUiStore } from "@/store/ui-store";

/**
 * Link do painel que abre a lista já filtrada pelo que está sendo contado. Os
 * demais filtros e a busca são limpos para a lista corresponder ao número clicado.
 */
export function FilterLink({
  filters,
  href = "/tasks?view=list",
  ...props
}: { filters?: Partial<TaskFilters>; href?: string } & Omit<ComponentProps<typeof Link>, "href">) {
  const setTaskFilters = useUiStore((state) => state.setTaskFilters);
  return <Link href={href} onClick={() => setTaskFilters({ ...DEFAULT_TASK_FILTERS, ...filters })} {...props} />;
}
