import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { describeDate } from "@/components/tasks/task-date";
import { CompactPriority, ProjectLabel } from "@/components/ui/badges";
import { STATUS_COLOR } from "@/components/ui/tokens";
import type { Project } from "@/domain/project";
import type { Task } from "@/domain/task";
import { waitingSince } from "@/domain/task-queries";
import { diffInDays, toDateKey } from "@/lib/dates";

function waitingDaysLabel(task: Task, today: string): string {
  const days = diffInDays(today, toDateKey(new Date(waitingSince(task))));
  if (days <= 0) return "desde hoje";
  return days === 1 ? "há 1 dia" : `há ${days} dias`;
}

/** Tarefa aguardando resposta: de quem, há quanto tempo e quando cobrar. */
export function WaitingItem({ task, project, today }: { task: Task; project?: Project; today: string }) {
  return (
    <li>
      <Link
        href={`/tasks/${task.id}`}
        className="focus-ring group relative flex flex-col gap-1 rounded-card px-4 py-3 pl-5 transition-colors duration-120 hover:bg-raised/70"
      >
        <span aria-hidden="true" className="absolute top-3.5 bottom-3.5 left-2 w-0.5 rounded-full" style={{ backgroundColor: STATUS_COLOR.waiting }} />
        <span className="min-w-0 text-body font-medium text-ink">{task.title}</span>

        <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-meta text-ink-muted">
          <span style={{ color: STATUS_COLOR.waiting }}>
            {task.waitingFor ?? "Sem pessoa definida"}
            <span className="text-ink-muted"> · {waitingDaysLabel(task, today)}</span>
          </span>
          <CompactPriority priority={task.priority} />
          {project && <ProjectLabel project={project} className="max-w-40" />}
          {task.reviewDate && (
            <span className={task.reviewDate <= today ? "text-status-waiting" : undefined}>
              {describeDate({ kind: "review", date: task.reviewDate, overdue: task.reviewDate < today }, today)}
            </span>
          )}
        </span>

        {task.nextAction && (
          <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-label text-ink-muted">
            <ArrowRight aria-hidden="true" className="size-3.5 shrink-0 text-primary" />
            <span className="sr-only">Próximo passo:</span>
            <span className="truncate">{task.nextAction}</span>
          </span>
        )}
      </Link>
    </li>
  );
}
