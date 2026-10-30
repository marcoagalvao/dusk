import Link from "next/link";

import { PRIORITY_COLOR } from "@/components/ui/tokens";
import type { UpcomingDay } from "@/domain/dashboard-metrics";
import { PRIORITY_LABELS, TASK_PRIORITIES } from "@/domain/task";
import { formatShortDate, formatWeekdayShort, parseDateKey, type DateKey } from "@/lib/dates";
import { cn } from "@/lib/utils/cn";

import { FilterLink } from "./filter-link";

const ITEMS_PER_DAY = 3;

function Marker({ kind, color }: { kind: "due" | "review"; color: string }) {
  return kind === "due" ? (
    <span aria-hidden="true" className="size-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
  ) : (
    <span aria-hidden="true" className="size-2 shrink-0 rounded-full border-[1.5px]" style={{ borderColor: color }} />
  );
}

/** Duas semanas a partir de hoje, com os títulos à vista. Sem nada, o dia só ocupa espaço no desktop. */
export function UpcomingCalendar({ days, today }: { days: readonly UpcomingDay[]; today: DateKey }) {
  return (
    <div>
      <ol className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
        {days.map((day) => {
          const isToday = day.date === today;
          const weekday = parseDateKey(day.date).getDay();
          const weekend = weekday === 0 || weekday === 6;
          const extra = day.items.length - ITEMS_PER_DAY;

          return (
            <li
              key={day.date}
              className={cn(
                "min-h-24 flex-col rounded-control border p-2",
                day.items.length === 0 ? "hidden md:flex" : "flex",
                isToday ? "border-primary/60 bg-primary/10" : "border-line/40",
                !isToday && (weekend ? "bg-canvas" : "bg-surface/50"),
              )}
            >
              <p className="flex items-baseline justify-between gap-1 text-meta">
                <span className={cn("font-medium", isToday ? "text-primary" : "text-ink-muted")}>
                  {isToday ? "Hoje" : formatWeekdayShort(day.date)}
                </span>
                <span className="text-ink-muted tabular-nums">{formatShortDate(day.date, today).slice(0, 5)}</span>
              </p>
              <ul className="mt-1.5 flex flex-col gap-1">
                {day.items.slice(0, ITEMS_PER_DAY).map(({ task, kind }) => (
                  <li key={`${task.id}-${kind}`}>
                    <Link
                      href={`/tasks/${task.id}`}
                      title={`${kind === "due" ? "Prazo" : "Revisão"}: ${task.title}`}
                      className="focus-ring flex items-start gap-1.5 rounded-[5px] text-meta text-ink transition-colors duration-120 hover:text-primary"
                    >
                      <span className="flex h-[1lh] items-center">
                        <Marker kind={kind} color={PRIORITY_COLOR[task.priority]} />
                      </span>
                      <span className="sr-only">{kind === "due" ? "Prazo:" : "Revisão:"}</span>
                      <span className="line-clamp-2 min-w-0">{task.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              {extra > 0 && (
                <FilterLink
                  filters={{
                    selection: {
                      label: `Prazos e revisões de ${isToday ? "hoje" : formatShortDate(day.date, today).slice(0, 5)}`,
                      taskIds: day.items.map(({ task }) => task.id),
                    },
                  }}
                  className="focus-ring mt-1 self-start rounded-[5px] text-meta text-ink-muted underline decoration-ink-subtle/60 underline-offset-2 transition-colors duration-120 hover:text-primary"
                >
                  +{extra} {extra === 1 ? "tarefa" : "tarefas"}
                </FilterLink>
              )}
            </li>
          );
        })}
      </ol>
      <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-meta text-ink-muted">
        <span className="inline-flex items-center gap-1.5">
          <Marker kind="due" color="var(--color-ink-muted)" />
          Prazo
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Marker kind="review" color="var(--color-ink-muted)" />
          Revisão
        </span>
        {TASK_PRIORITIES.map((priority) => (
          <span key={priority} className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="size-2 rounded-[2px]" style={{ backgroundColor: PRIORITY_COLOR[priority] }} />
            {PRIORITY_LABELS[priority]}
          </span>
        ))}
      </p>
    </div>
  );
}
