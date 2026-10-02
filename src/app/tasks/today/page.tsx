import type { Metadata } from "next";

import { TasksView } from "@/components/tasks/tasks-view";

export const metadata: Metadata = { title: "Hoje" };

export default function TodayTasksPage() {
  return <TasksView scope="today" />;
}
