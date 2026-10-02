import type { Metadata } from "next";

import { TasksView } from "@/components/tasks/tasks-view";
import { TASK_VIEWS, type TaskView } from "@/domain/settings";

export const metadata: Metadata = { title: "Tarefas" };

/** `?view=list|kanban` força a visualização sem alterar a preferência salva (ex.: links do resumo). */
export default async function TasksPage({ searchParams }: PageProps<"/tasks">) {
  const { view } = await searchParams;
  const viewOverride = TASK_VIEWS.find((option) => option === view) as TaskView | undefined;
  return <TasksView scope="all" viewOverride={viewOverride} />;
}
