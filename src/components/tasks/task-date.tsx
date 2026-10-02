import { CalendarClock, CalendarDays } from "lucide-react";

import type { Task } from "@/domain/task";
import { relevantDate, type RelevantDate } from "@/domain/task-queries";
import { formatRelativeDay } from "@/lib/dates";
import { cn } from "@/lib/utils/cn";

export function describeDate(date: RelevantDate, today: string): string {
  const relative = formatRelativeDay(date.date, today);
  const lower = relative.toLowerCase();
  if (date.kind === "due") {
    return date.overdue ? `Venceu ${lower}` : relative;
  }
  return date.overdue ? `Revisar desde ${lower}` : `Revisar ${lower}`;
}

const TONE = {
  overdueDue: "text-status-blocked",
  review: "text-status-waiting",
  today: "text-ink",
  default: "text-ink-muted",
};

/** Data mais relevante da tarefa (prazo ou revisão), com ícone e cor por urgência. */
export function TaskDateLabel({ task, today, className }: { task: Task; today: string; className?: string }) {
  const date = relevantDate(task, today);
  if (!date) return null;

  const isToday = date.date === today;
  const tone =
    date.kind === "due"
      ? date.overdue
        ? TONE.overdueDue
        : isToday
          ? TONE.today
          : TONE.default
      : date.overdue || isToday
        ? TONE.review
        : TONE.default;
  const Icon = date.kind === "due" ? CalendarDays : CalendarClock;

  return (
    <span
      className={cn("inline-flex shrink-0 items-center gap-1 whitespace-nowrap", tone, className)}
      title={date.kind === "due" ? "Prazo" : "Revisar novamente"}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      <span className="sr-only">{date.kind === "due" ? "Prazo:" : "Revisão:"}</span>
      {describeDate(date, today)}
    </span>
  );
}
