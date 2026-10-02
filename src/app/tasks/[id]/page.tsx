import type { Metadata } from "next";

import { TaskDetailView } from "@/components/tasks/task-detail-view";

export const metadata: Metadata = { title: "Tarefa" };

export default async function TaskPage({ params }: PageProps<"/tasks/[id]">) {
  const { id } = await params;
  return <TaskDetailView taskId={id} />;
}
