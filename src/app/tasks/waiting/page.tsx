import type { Metadata } from "next";

import { TasksView } from "@/components/tasks/tasks-view";

export const metadata: Metadata = { title: "Aguardando" };

export default function WaitingTasksPage() {
  return <TasksView scope="waiting" />;
}
