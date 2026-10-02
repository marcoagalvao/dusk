import type { Metadata } from "next";

import { TasksView } from "@/components/tasks/tasks-view";

export const metadata: Metadata = { title: "Atrasadas" };

export default function OverdueTasksPage() {
  return <TasksView scope="overdue" />;
}
