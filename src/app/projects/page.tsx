import type { Metadata } from "next";

import { ProjectsView } from "@/components/projects/projects-view";

export const metadata: Metadata = { title: "Projetos" };

export default function ProjectsPage() {
  return <ProjectsView />;
}
