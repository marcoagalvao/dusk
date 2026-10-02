import { ArrowRight, Hourglass } from "lucide-react";
import Link from "next/link";

import { ProjectLabel } from "@/components/ui/badges";
import { StatusGlyph } from "@/components/ui/status-glyph";
import type { Project } from "@/domain/project";
import type { Task } from "@/domain/task";
import { formatRelativeDay } from "@/lib/dates";
import { cn } from "@/lib/utils/cn";

/** Quando revisar, em poucas palavras: "Hoje", "Desde ontem", "Segunda", "09/10". */
function reviewDayLabel(reviewDate: string, today: string): string {
  const relative = formatRelativeDay(reviewDate, today);
  return reviewDate < today ? `Desde ${relative.toLowerCase()}` : relative;
}

/** Item da agenda de revisões: o dia vem primeiro, porque é o que define a ação. */
export function ReviewItem({ task, project, today }: { task: Task; project?: Project; today: string }) {
  const reviewDate = task.reviewDate!;
  const due = reviewDate <= today;

  return (
    <li>
      <Link
        href={`/tasks/${task.id}`}
        className="focus-ring flex items-start gap-3 rounded-card px-3 py-2.5 transition-colors duration-120 hover:bg-raised/70"
      >
        <span
          className={cn(
            "w-[4.75rem] shrink-0 pt-0.5 text-meta font-medium",
            due ? "text-status-waiting" : "text-ink-muted",
          )}
        >
          <span className="sr-only">Revisar:</span>
          {reviewDayLabel(reviewDate, today)}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className={cn("text-compact font-medium", due ? "text-ink" : "text-ink-muted")}>{task.title}</span>
          {task.status === "completed" ? (
            <span className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-0.5 text-meta text-ink-muted">
              <span className="inline-flex items-center gap-1.5 text-status-completed">
                <StatusGlyph status="completed" size={12} />
                Concluída
              </span>
              {project && <ProjectLabel project={project} className="max-w-40" />}
            </span>
          ) : task.status === "waiting" && task.waitingFor ? (
            <span className="flex min-w-0 items-center gap-1.5 text-meta text-ink-muted">
              <Hourglass aria-hidden="true" className="size-3 shrink-0 text-status-waiting" />
              <span className="sr-only">Aguardando:</span>
              <span className="truncate">{task.waitingFor}</span>
            </span>
          ) : task.nextAction ? (
            <span className="flex min-w-0 items-center gap-1.5 text-meta text-ink-muted">
              <ArrowRight aria-hidden="true" className="size-3 shrink-0 text-primary" />
              <span className="sr-only">Próxima ação:</span>
              <span className="truncate">{task.nextAction}</span>
            </span>
          ) : (
            project && <ProjectLabel project={project} className="text-meta text-ink-subtle" />
          )}
        </span>
      </Link>
    </li>
  );
}
