"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { PageContainer, PageHeader } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { EmptyState, ProgressBar } from "@/components/ui/misc";
import { PROJECT_COLOR } from "@/components/ui/tokens";
import type { Project } from "@/domain/project";
import { recentProjects, type ProjectStats } from "@/domain/task-queries";
import { cn } from "@/lib/utils/cn";
import { pluralize } from "@/lib/utils/text";
import { useProjects, useTasks } from "@/store/hooks";

import { ProjectFormDialog } from "./project-form-dialog";

export function ProjectSummaryLine({ stats }: { stats: ProjectStats }) {
  if (stats.total === 0) return <span className="text-ink-subtle">Sem tarefas ainda</span>;
  return (
    <span className="flex flex-wrap gap-x-3 gap-y-0.5">
      <span>{pluralize(stats.open, "aberta", "abertas")}</span>
      {stats.waiting > 0 && <span className="text-status-waiting">{stats.waiting} aguardando</span>}
      {stats.completed > 0 && <span className="text-ink-subtle">{pluralize(stats.completed, "concluída", "concluídas")}</span>}
    </span>
  );
}

export function ProjectRow({ project, stats, compact }: { project: Project; stats: ProjectStats; compact?: boolean }) {
  const percent = stats.total === 0 ? 0 : Math.round((stats.completed / stats.total) * 100);
  return (
    <li>
      <Link
        href={`/projects/${project.id}`}
        className={cn(
          "focus-ring group relative flex items-center gap-4 rounded-card pr-4 pl-5 transition-colors duration-120 hover:bg-surface",
          compact ? "py-2.5" : "py-3.5",
        )}
      >
        <span
          aria-hidden="true"
          className="absolute top-3 bottom-3 left-1.5 w-1 rounded-full"
          style={{ backgroundColor: PROJECT_COLOR[project.color] }}
        />
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="truncate text-body font-medium text-ink">{project.name}</span>
          {!compact && project.description && <span className="truncate text-label text-ink-muted">{project.description}</span>}
          <span className="text-meta text-ink-muted">
            <ProjectSummaryLine stats={stats} />
          </span>
        </span>
        {!compact && stats.total > 0 && (
          <span className="hidden w-28 shrink-0 flex-col items-end gap-1.5 sm:flex">
            <span className="text-meta text-ink-subtle tabular-nums">{percent}%</span>
            <ProgressBar percent={percent} className="w-full" color={PROJECT_COLOR[project.color]} />
          </span>
        )}
      </Link>
    </li>
  );
}

export function ProjectsView() {
  const projects = useProjects();
  const tasks = useTasks();
  const active = useMemo(() => recentProjects(projects, tasks, Number.POSITIVE_INFINITY), [projects, tasks]);
  const archivedCount = projects.filter((project) => project.archivedAt).length;

  return (
    <PageContainer>
      <PageHeader
        title="Projetos"
        description={
          active.length > 0
            ? `${pluralize(active.length, "projeto ativo", "projetos ativos")}${archivedCount ? ` · ${archivedCount} no arquivo` : ""}`
            : undefined
        }
        actions={
          <ProjectFormDialog
            navigateOnCreate
            trigger={
              <Button variant="primary">
                <Plus aria-hidden="true" className="size-4" />
                Novo projeto
              </Button>
            }
          />
        }
      />

      {active.length === 0 ? (
        <EmptyState
          title="Nenhum projeto ativo."
          description="Projetos agrupam tarefas relacionadas, como um cliente ou uma área da sua vida. São opcionais."
          action={
            archivedCount > 0 ? (
              <Link href="/archive" className="focus-ring rounded-[6px] text-label font-medium text-primary hover:text-primary-hover">
                Ver projetos arquivados
              </Link>
            ) : undefined
          }
        />
      ) : (
        <ul aria-label="Projetos ativos" className="flex flex-col gap-px">
          {active.map(({ project, stats }) => (
            <ProjectRow key={project.id} project={project} stats={stats} />
          ))}
        </ul>
      )}
    </PageContainer>
  );
}
