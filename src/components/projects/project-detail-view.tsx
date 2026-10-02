"use client";

import { Archive, ArchiveRestore, Ellipsis, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { archiveProject, unarchiveProject } from "@/actions/project-actions";
import { PageContainer, PageHeader } from "@/components/layout/page";
import { TaskList } from "@/components/tasks/task-list";
import { Button, ButtonLink, IconButton } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/menu";
import { EmptyState } from "@/components/ui/misc";
import { StatusGlyph } from "@/components/ui/status-glyph";
import { PROJECT_COLOR } from "@/components/ui/tokens";
import type { Project } from "@/domain/project";
import { STATUS_LABELS, type Task, type TaskStatus } from "@/domain/task";
import { isArchived, projectStats, sortTasks } from "@/domain/task-queries";
import { useToday } from "@/hooks/use-clock";
import { useProject, useProjectMap, useTasks } from "@/store/hooks";
import { useUiStore } from "@/store/ui-store";

import { ProjectDeleteDialog } from "./project-delete-dialog";
import { ProjectFormDialog } from "./project-form-dialog";
import { ProjectSummaryLine } from "./projects-view";

/** Ordem de leitura da tela de projeto (PRD §23): o que está andando primeiro. */
const STATUS_SECTIONS: TaskStatus[] = ["in_progress", "waiting", "blocked", "todo", "completed"];
const COMPLETED_PREVIEW = 5;

export function ProjectDetailView({ projectId }: { projectId: string }) {
  const project = useProject(projectId);
  const [deleted, setDeleted] = useState(false);

  if (deleted) return null;
  if (!project) {
    return (
      <PageContainer>
        <EmptyState
          title="Projeto não encontrado."
          description="Ele pode ter sido excluído ou o link está incorreto."
          action={<ButtonLink href="/projects" variant="secondary" size="sm">Ver projetos</ButtonLink>}
        />
      </PageContainer>
    );
  }
  return <ProjectDetail project={project} onDeleted={() => setDeleted(true)} />;
}

function ProjectDetail({ project, onDeleted }: { project: Project; onDeleted: () => void }) {
  const router = useRouter();
  const today = useToday();
  const tasks = useTasks();
  const projectsById = useProjectMap();
  const openQuickCreate = useUiStore((state) => state.openQuickCreate);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [showAllCompleted, setShowAllCompleted] = useState(false);
  const archived = Boolean(project.archivedAt);

  const stats = useMemo(() => projectStats(project, tasks), [project, tasks]);
  const sections = useMemo(() => {
    const own = tasks.filter((task) => task.projectId === project.id && !isArchived(task));
    return STATUS_SECTIONS.map((status) => {
      const inStatus = own.filter((task) => task.status === status);
      const sorted: Task[] =
        status === "completed"
          ? [...inStatus].sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""))
          : sortTasks(inStatus, "smart", today);
      return { status, tasks: sorted };
    }).filter((section) => section.tasks.length > 0);
  }, [tasks, project.id, today]);

  return (
    <PageContainer>
      <PageHeader
        back={{ href: archived ? "/archive" : "/projects", label: archived ? "Arquivo" : "Projetos" }}
        title={
          <span className="flex items-center gap-3">
            <span aria-hidden="true" className="size-3 shrink-0 rounded-full" style={{ backgroundColor: PROJECT_COLOR[project.color] }} />
            <span className="min-w-0 break-words">{project.name}</span>
          </span>
        }
        description={
          <span className="flex flex-col gap-1">
            {project.description && <span className="text-ink-muted">{project.description}</span>}
            <span className="text-label">
              <ProjectSummaryLine stats={stats} />
            </span>
          </span>
        }
        actions={
          <>
            {!archived && (
              <Button variant="primary" onClick={() => openQuickCreate({ projectId: project.id })}>
                <Plus aria-hidden="true" className="size-4" />
                Nova tarefa
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <IconButton label="Ações do projeto" icon={<Ellipsis className="size-4" />} variant="secondary" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onSelect={() => setEditOpen(true)}>
                  <Pencil />
                  Editar projeto
                </DropdownMenuItem>
                {archived ? (
                  <DropdownMenuItem onSelect={() => unarchiveProject(project.id)}>
                    <ArchiveRestore />
                    Restaurar do arquivo
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onSelect={() => {
                      archiveProject(project.id);
                      router.push("/projects");
                    }}
                  >
                    <Archive />
                    Arquivar projeto
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem tone="danger" onSelect={() => setDeleteOpen(true)}>
                  <Trash2 />
                  Excluir projeto
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />

      {archived && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-surface px-4 py-3 text-compact text-ink-muted">
          <span>Projeto arquivado. Ele não aparece na navegação nem na criação de tarefas.</span>
          <Button size="sm" variant="secondary" onClick={() => unarchiveProject(project.id)}>
            <ArchiveRestore aria-hidden="true" className="size-4" />
            Restaurar
          </Button>
        </div>
      )}

      {sections.length === 0 ? (
        <EmptyState
          title="Nenhuma tarefa neste projeto."
          description="Tarefas criadas aqui já entram associadas ao projeto."
          action={
            !archived ? (
              <Button variant="secondary" size="sm" onClick={() => openQuickCreate({ projectId: project.id })}>
                <Plus aria-hidden="true" className="size-4" />
                Criar tarefa
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="flex flex-col gap-7">
          {sections.map(({ status, tasks: sectionTasks }) => {
            const isCompleted = status === "completed";
            const visible = isCompleted && !showAllCompleted ? sectionTasks.slice(0, COMPLETED_PREVIEW) : sectionTasks;
            const label = isCompleted ? "Concluídas" : STATUS_LABELS[status];
            return (
              <section key={status} aria-labelledby={`status-${status}`}>
                <h2 id={`status-${status}`} className="mb-1 flex items-center gap-2 pl-3 text-label font-semibold text-ink-muted">
                  <StatusGlyph status={status} size={13} />
                  {label}
                  <span className="text-meta font-normal text-ink-subtle tabular-nums">{sectionTasks.length}</span>
                </h2>
                <TaskList tasks={visible} projectsById={projectsById} today={today} showProject={false} label={label} />
                {isCompleted && sectionTasks.length > COMPLETED_PREVIEW && (
                  <button
                    type="button"
                    onClick={() => setShowAllCompleted((value) => !value)}
                    className="focus-ring mt-2 ml-3 rounded-[6px] text-label font-medium text-primary hover:text-primary-hover"
                  >
                    {showAllCompleted ? "Mostrar menos" : `Mostrar todas as ${sectionTasks.length} concluídas`}
                  </button>
                )}
              </section>
            );
          })}
        </div>
      )}

      <ProjectFormDialog project={project} open={editOpen} onOpenChange={setEditOpen} />
      <ProjectDeleteDialog
        project={project}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={() => {
          onDeleted();
          router.push("/projects");
        }}
      />
    </PageContainer>
  );
}
