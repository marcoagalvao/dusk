import type { Metadata } from "next";

import { ProjectDetailView } from "@/components/projects/project-detail-view";

export const metadata: Metadata = { title: "Projeto" };

export default async function ProjectPage({ params }: PageProps<"/projects/[id]">) {
  const { id } = await params;
  return <ProjectDetailView projectId={id} />;
}
