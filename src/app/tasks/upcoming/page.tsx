import type { Metadata } from "next";

import { TasksView } from "@/components/tasks/tasks-view";

export const metadata: Metadata = { title: "Próximas" };

export default function UpcomingTasksPage() {
  return <TasksView scope="upcoming" />;
}
