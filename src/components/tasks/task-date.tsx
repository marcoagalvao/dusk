import { CalendarClock, CalendarDays } from "lucide-react";

import type { Task } from "@/domain/task";
import { otherDate, relevantDate, type RelevantDate } from "@/domain/task-queries";
import { formatRelativeDay } from "@/lib/dates";
import { cn } from "@/lib/utils/cn";

/** Sempre com o nome da data: a linha pode mostrar prazo e lembrete ao mesmo tempo. */
export function describeDate(date: RelevantDate, today: string): string {
  const lower = formatRelativeDay(date.date, today).toLowerCase();
  if (date.kind === "due") return date.overdue ? `Venceu ${lower}` : `Prazo ${lower}`;
  return date.overdue ? `Lembrete desde ${lower}` : `Lembrete ${lower}`;
}

const TONE = {
  overdueDue: "text-status-blocked",
  review: "text-status-waiting",
  today: "text-ink",
  default: "text-ink-muted",
};

function DateLabel({ date, today, className }: { date: RelevantDate; today: string; className?: string }) {
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
    <span className={cn("inline-flex shrink-0 items-center gap-1 whitespace-nowrap", tone, className)}>
      <Icon aria-hidden="true" className="size-3.5" />
      {describeDate(date, today)}
    </span>
  );
}

/** Data mais relevante da tarefa (prazo ou lembrete), com ícone e cor por urgência. */
export function TaskDateLabel({ task, today, className }: { task: Task; today: string; className?: string }) {
  const date = relevantDate(task, today);
  return date && <DateLabel date={date} today={today} className={className} />;
}

/** A segunda data, quando a tarefa tem as duas. */
export function TaskOtherDateLabel({ task, today, className }: { task: Task; today: string; className?: string }) {
  const date = otherDate(task, today);
  return date && <DateLabel date={date} today={today} className={className} />;
}
