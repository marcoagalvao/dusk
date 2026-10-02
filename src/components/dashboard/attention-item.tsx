import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { describeDate } from "@/components/tasks/task-date";
import { ProjectLabel } from "@/components/ui/badges";
import { STATUS_COLOR } from "@/components/ui/tokens";
import type { Project } from "@/domain/project";
import { STATUS_LABELS, STATUSES_WITH_WAITING, type Task } from "@/domain/task";
import { attentionRank, relevantDate } from "@/domain/task-queries";

type Tone = "alert" | "waiting" | "neutral";

const TONE_COLOR: Record<Tone, string> = {
  alert: "var(--color-status-blocked)",
  waiting: "var(--color-status-waiting)",
  neutral: "var(--color-primary)",
};

/** Por que a tarefa está pedindo atenção, na ordem do PRD §10. */
function attentionReason(task: Task, today: string): { label: string; tone: Tone; showsDate?: boolean } | null {
  switch (attentionRank(task, today)) {
    case 0:
      return { label: describeDate({ kind: "due", date: task.dueDate!, overdue: true }, today), tone: "alert", showsDate: true };
    case 1:
      return {
        label: describeDate({ kind: "review", date: task.reviewDate!, overdue: task.reviewDate! < today }, today),
        tone: "waiting",
        showsDate: true,
      };
    case 2:
      return { label: "Urgente", tone: "alert" };
    case 3:
      return { label: "Prazo hoje", tone: "neutral", showsDate: true };
    case 4:
      return { label: "No foco, aguardando", tone: "waiting" };
    case 5:
      return { label: "Bloqueada", tone: "alert" };
    default:
      return null;
  }
}

interface AttentionItemProps {
  task: Task;
  project?: Project;
  today: string;
  /** "attention" mostra o motivo; "waiting" destaca quem/quando (PRD §21). */
  variant: "attention" | "waiting";
}

export function AttentionItem({ task, project, today, variant }: AttentionItemProps) {
  const reason = variant === "attention" ? attentionReason(task, today) : null;
  const accent = reason ? TONE_COLOR[reason.tone] : STATUS_COLOR.waiting;
  const date = relevantDate(task, today);
  const showWaiting = STATUSES_WITH_WAITING.includes(task.status) && task.waitingFor;

  return (
    <li>
      <Link
        href={`/tasks/${task.id}`}
        className="focus-ring group relative flex flex-col gap-1 rounded-card px-4 py-3 pl-5 transition-colors duration-120 hover:bg-raised/70"
      >
        <span aria-hidden="true" className="absolute top-3.5 bottom-3.5 left-2 w-0.5 rounded-full" style={{ backgroundColor: accent }} />
        <span className="flex items-start justify-between gap-3">
          <span className="min-w-0 text-body font-medium text-ink">{task.title}</span>
          {reason && (
            <span className="shrink-0 pt-0.5 text-meta font-medium whitespace-nowrap" style={{ color: TONE_COLOR[reason.tone] }}>
              {reason.label}
            </span>
          )}
        </span>

        <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-meta text-ink-muted">
          {project && <ProjectLabel project={project} className="max-w-40" />}
          <span style={{ color: STATUS_COLOR[task.status] }}>
            {STATUS_LABELS[task.status]}
            {showWaiting && <span className="text-ink-muted"> · {task.waitingFor}</span>}
          </span>
          {variant === "waiting" && task.reviewDate && (
            <span className={task.reviewDate <= today ? "text-status-waiting" : undefined}>
              {describeDate({ kind: "review", date: task.reviewDate, overdue: task.reviewDate < today }, today)}
            </span>
          )}
          {variant === "attention" && date && !reason?.showsDate && (
            <span>{describeDate(date, today)}</span>
          )}
        </span>

        {task.nextAction && (
          <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-label text-ink-muted">
            <ArrowRight aria-hidden="true" className="size-3.5 shrink-0 text-primary" />
            <span className="sr-only">Próxima ação:</span>
            <span className="truncate">{task.nextAction}</span>
          </span>
        )}
      </Link>
    </li>
  );
}
