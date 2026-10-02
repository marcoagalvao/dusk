"use client";

import { ArchiveRestore, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { unarchiveProject } from "@/actions/project-actions";
import { deleteTask, unarchiveTask } from "@/actions/task-actions";
import { PageContainer, PageHeader } from "@/components/layout/page";
import { ProjectDeleteDialog } from "@/components/projects/project-delete-dialog";
import { ProjectLabel } from "@/components/ui/badges";
import { IconButton } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { EmptyState, SectionHeading } from "@/components/ui/misc";
import { StatusGlyph } from "@/components/ui/status-glyph";
import type { Project } from "@/domain/project";
import type { Task } from "@/domain/task";
import { countTasksOfProject } from "@/domain/task-queries";
import { formatDateTime } from "@/lib/dates";
import { pluralize } from "@/lib/utils/text";
import { useProjectMap, useProjects, useTasks } from "@/store/hooks";

const byArchivedDesc = (a: { archivedAt?: string }, b: { archivedAt?: string }) =>
  (b.archivedAt ?? "").localeCompare(a.archivedAt ?? "");

export function ArchiveView() {
  const tasks = useTasks();
  const projects = useProjects();
  const projectsById = useProjectMap();
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const archivedTasks = useMemo(() => tasks.filter((task) => task.archivedAt).sort(byArchivedDesc), [tasks]);
  const archivedProjects = useMemo(() => projects.filter((project) => project.archivedAt).sort(byArchivedDesc), [projects]);
  const isEmpty = archivedTasks.length === 0 && archivedProjects.length === 0;

  return (
    <PageContainer>
      <PageHeader title="Arquivo" description="Itens fora do fluxo normal. Restaure quando precisar de novo." />

      {isEmpty ? (
        <EmptyState
          title="Nada no arquivo."
          description="Tarefas e projetos arquivados ficam guardados aqui, com todo o histórico, sem aparecer nas listas."
        />
      ) : (
        <div className="flex flex-col gap-9">
          {archivedProjects.length > 0 && (
            <section aria-labelledby="archived-projects">
              <SectionHeading id="archived-projects" title="Projetos" count={archivedProjects.length} />
              <ul className="flex flex-col gap-px">
                {archivedProjects.map((project) => (
                  <li key={project.id} className="flex items-center gap-3 rounded-card py-2 pr-2 pl-3 hover:bg-surface/70">
                    <Link
                      href={`/projects/${project.id}`}
                      className="focus-ring flex min-w-0 flex-1 flex-col gap-0.5 rounded-[6px]"
                    >
                      <ProjectLabel project={project} className="text-body font-medium text-ink" />
                      <span className="text-meta text-ink-subtle">
                        {pluralize(countTasksOfProject(project.id, tasks), "tarefa", "tarefas")} · arquivado em{" "}
                        {formatDateTime(project.archivedAt!)}
                      </span>
                    </Link>
                    <IconButton
                      label={`Restaurar "${project.name}"`}
                      icon={<ArchiveRestore className="size-4" />}
                      onClick={() => unarchiveProject(project.id)}
                    />
                    <IconButton
                      label={`Excluir "${project.name}"`}
                      icon={<Trash2 className="size-4" />}
                      onClick={() => setProjectToDelete(project)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {archivedTasks.length > 0 && (
            <section aria-labelledby="archived-tasks">
              <SectionHeading id="archived-tasks" title="Tarefas" count={archivedTasks.length} />
              <ul className="flex flex-col gap-px">
                {archivedTasks.map((task) => {
                  const project = task.projectId ? projectsById.get(task.projectId) : undefined;
                  return (
                    <li key={task.id} className="flex items-center gap-3 rounded-card py-2 pr-2 pl-3 hover:bg-surface/70">
                      <StatusGlyph status={task.status} size={16} />
                      <Link href={`/tasks/${task.id}`} className="focus-ring flex min-w-0 flex-1 flex-col gap-0.5 rounded-[6px]">
                        <span className="truncate text-body text-ink">{task.title}</span>
                        <span className="flex flex-wrap items-center gap-x-3 text-meta text-ink-subtle">
                          {project && <ProjectLabel project={project} className="max-w-40" />}
                          <span>Arquivada em {formatDateTime(task.archivedAt!)}</span>
                        </span>
                      </Link>
                      <IconButton
                        label={`Restaurar "${task.title}"`}
                        icon={<ArchiveRestore className="size-4" />}
                        onClick={() => unarchiveTask(task.id)}
                      />
                      <IconButton
                        label={`Excluir "${task.title}"`}
                        icon={<Trash2 className="size-4" />}
                        onClick={() => setTaskToDelete(task)}
                      />
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>
      )}

      <ConfirmDialog
        open={taskToDelete !== null}
        onOpenChange={(open) => !open && setTaskToDelete(null)}
        title="Excluir tarefa?"
        description={taskToDelete ? `"${taskToDelete.title}" e seu histórico serão excluídos permanentemente.` : undefined}
        confirmLabel="Excluir"
        onConfirm={() => taskToDelete && deleteTask(taskToDelete.id)}
      />
      {projectToDelete && (
        <ProjectDeleteDialog
          project={projectToDelete}
          open
          onOpenChange={(open) => !open && setProjectToDelete(null)}
        />
      )}
    </PageContainer>
  );
}
