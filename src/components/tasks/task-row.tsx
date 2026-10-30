"use client";

import { Archive, ArrowRight, ListChecks, Sun } from "lucide-react";
import Link from "next/link";
import { memo, useState } from "react";

import { toggleFocus } from "@/actions/task-actions";
import { ProjectLabel } from "@/components/ui/badges";
import { StatusGlyph } from "@/components/ui/status-glyph";
import { STATUS_COLOR } from "@/components/ui/tokens";
import type { Project } from "@/domain/project";
import { STATUS_LABELS, STATUSES_WITH_WAITING, type Task } from "@/domain/task";
import { isArchived, isInFocus } from "@/domain/task-queries";
import { subtaskProgress } from "@/domain/task-rules";
import { cn } from "@/lib/utils/cn";

import { TaskCheckbox } from "./task-checkbox";
import { CompactPriorityControl } from "./task-detail-controls";
import { TaskDateLabel } from "./task-date";

interface TaskRowProps {
  task: Task;
  project?: Project;
  today: string;
  showProject?: boolean;
  showNextAction?: boolean;
  /** Na própria seção de foco o selo "Foco" é redundante. */
  showFocusBadge?: boolean;
}

/**
 * Linha de tarefa para leitura rápida (PRD §26). A linha inteira abre o
 * detalhe (link esticado); checkbox, prioridade e foco ficam acima do link.
 */
export const TaskRow = memo(function TaskRow({
  task,
  project,
  today,
  showProject = true,
  showNextAction = true,
  showFocusBadge = true,
}: TaskRowProps) {
  const [completing, setCompleting] = useState(false);
  const completed = task.status === "completed";
  const archived = isArchived(task);
  const focused = isInFocus(task, today);
  const subtasks = subtaskProgress(task);
  const showWaiting = STATUSES_WITH_WAITING.includes(task.status) && task.waitingFor;

  return (
    <li
      className={cn(
        "group relative flex items-start gap-2 rounded-card py-2.5 pr-2 pl-1 transition-[background-color,opacity] duration-220 hover:bg-surface/80 sm:pr-3",
        completing && "opacity-55",
      )}
    >
      {archived ? (
        <span className="-my-2 grid size-10 shrink-0 place-items-center">
          <StatusGlyph status={task.status} size={18} />
        </span>
      ) : (
        <TaskCheckbox task={task} onCompletingChange={setCompleting} className="-my-2" />
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-3">
          <Link
            href={`/tasks/${task.id}`}
            className={cn(
              "focus-ring min-w-0 flex-1 rounded-[6px] text-body leading-snug font-medium after:absolute after:inset-0 after:rounded-card",
              completed || completing ? "text-ink-subtle line-through decoration-ink-subtle/60" : "text-ink",
            )}
          >
            {task.title}
          </Link>
          <span className="mt-0.5 hidden shrink-0 text-label sm:block">
            <TaskDateLabel task={task} today={today} />
          </span>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-meta">
          {showProject && project && <ProjectLabel project={project} className="max-w-40 text-ink-muted" />}
          <span className="inline-flex min-w-0 items-center gap-1" style={{ color: STATUS_COLOR[task.status] }}>
            {STATUS_LABELS[task.status]}
            {showWaiting && <span className="max-w-48 truncate text-ink-muted">· {task.waitingFor}</span>}
          </span>
          <CompactPriorityControl task={task} disabled={archived} />
          {archived && (
            <span className="inline-flex items-center gap-1 text-ink-muted">
              <Archive aria-hidden="true" className="size-3.5" />
              Arquivada
            </span>
          )}
          {subtasks.total > 0 && (
            <span className="inline-flex items-center gap-1 text-ink-subtle tabular-nums" title="Subtarefas concluídas">
              <ListChecks aria-hidden="true" className="size-3.5" />
              {subtasks.done}/{subtasks.total}
            </span>
          )}
          {focused && showFocusBadge && !completed && (
            <span className="inline-flex items-center gap-1 text-primary">
              <Sun aria-hidden="true" className="size-3.5" />
              Foco
            </span>
          )}
          <span className="sm:hidden">
            <TaskDateLabel task={task} today={today} />
          </span>
        </div>

        {showNextAction && task.nextAction && !completed && (
          <p className="mt-1 flex min-w-0 items-center gap-1.5 text-label text-ink-muted">
            <ArrowRight aria-hidden="true" className="size-3.5 shrink-0 text-primary" />
            <span className="sr-only">Próxima ação:</span>
            <span className="truncate">{task.nextAction}</span>
          </p>
        )}
      </div>

      {!completed && (
        <button
          type="button"
          onClick={() => toggleFocus(task, today)}
          aria-label={focused ? `Remover "${task.title}" do foco de hoje` : `Adicionar "${task.title}" ao foco de hoje`}
          aria-pressed={focused}
          title={focused ? "Remover do foco de hoje" : "Adicionar ao foco de hoje"}
          className={cn(
            "focus-ring relative z-10 hidden size-8 shrink-0 place-items-center rounded-[8px] transition-[opacity,color,background-color] duration-120 hover:bg-raised lg:grid",
            focused ? "text-primary" : "text-ink-subtle opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
          )}
        >
          <Sun aria-hidden="true" className="size-4" />
        </button>
      )}
    </li>
  );
});
