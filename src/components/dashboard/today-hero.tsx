import { Ban, Check, CircleCheck, Clock3, Flag, RotateCcw, Sun, TriangleAlert, type LucideIcon } from "lucide-react";

import type { TodayPulse } from "@/domain/dashboard-metrics";
import type { TaskFilters } from "@/domain/task-queries";
import { cn } from "@/lib/utils/cn";

import { ProgressRing } from "./charts";
import { FilterLink } from "./filter-link";
import { Tile } from "./tile";

/** A primeira coisa lida no painel: como está o dia, numa frase. */
function headline(pulse: TodayPulse): { text: string; tone: "alert" | "calm"; icon: LucideIcon } {
  if (pulse.overdue > 0) {
    return {
      text: pulse.overdue === 1 ? "1 tarefa atrasada precisa de você" : `${pulse.overdue} tarefas atrasadas precisam de você`,
      tone: "alert",
      icon: TriangleAlert,
    };
  }
  if (pulse.urgent > 0) {
    return {
      text: pulse.urgent === 1 ? "1 tarefa urgente na fila" : `${pulse.urgent} tarefas urgentes na fila`,
      tone: "alert",
      icon: Flag,
    };
  }
  if (pulse.pending === 0 && pulse.doneToday > 0) return { text: "Tudo de hoje está feito", tone: "calm", icon: CircleCheck };
  if (pulse.pending === 0) return { text: "Nada marcado para hoje", tone: "calm", icon: Sun };
  return { text: "Nada atrasado. Dia sob controle", tone: "calm", icon: CircleCheck };
}

interface AlertDefinition {
  key: keyof Pick<TodayPulse, "overdue" | "urgent" | "blocked" | "waiting" | "reviewsDue" | "doneToday">;
  label: string;
  icon: LucideIcon;
  critical?: boolean;
  href?: string;
  filters?: Partial<TaskFilters>;
}

const ALERTS: readonly AlertDefinition[] = [
  { key: "overdue", label: "Atrasadas", icon: TriangleAlert, critical: true, href: "/tasks/overdue" },
  { key: "urgent", label: "Urgentes", icon: Flag, critical: true, filters: { priority: "urgent" } },
  { key: "blocked", label: "Bloqueadas", icon: Ban, critical: true, filters: { status: "blocked" } },
  { key: "waiting", label: "Aguardando", icon: Clock3, href: "/tasks/waiting" },
  { key: "reviewsDue", label: "Para revisar", icon: RotateCcw, filters: { reviewDue: true, completion: "all" } },
  { key: "doneToday", label: "Feitas hoje", icon: Check, filters: { completion: "today" } },
];

/** O número do dia e os alertas: o que dá para entender sem ler nada mais. */
export function TodayHero({ pulse }: { pulse: TodayPulse }) {
  const summary = headline(pulse);
  const SummaryIcon = summary.icon;

  return (
    <Tile labelledBy="today-hero-heading" className="flex h-full flex-col">
      <h2
        id="today-hero-heading"
        className="flex items-start gap-2 text-emph font-semibold text-balance text-ink"
      >
        <SummaryIcon
          aria-hidden="true"
          className={cn("mt-1 size-4 shrink-0", summary.tone === "alert" ? "text-status-blocked" : "text-status-completed")}
        />
        {summary.text}
      </h2>

      <div className="mt-4 flex items-center gap-5">
        <div className="relative">
          <ProgressRing percent={pulse.percent} label={`${pulse.percent}% do dia concluído`} />
          <span aria-hidden="true" className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-section font-semibold text-ink">{pulse.percent}%</span>
            <span className="text-meta text-ink-muted">do dia</span>
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-display font-semibold tracking-[-0.03em] text-ink">{pulse.pending}</p>
          <p className="mt-1 text-compact text-ink-muted">{pulse.pending === 1 ? "tarefa para hoje" : "tarefas para hoje"}</p>
        </div>
      </div>

      <ul className="mt-4 grid flex-1 auto-rows-fr grid-cols-3 gap-1.5">
        {ALERTS.map(({ key, label, icon: Icon, critical, href, filters }) => {
          const value = pulse[key];
          const hot = critical && value > 0;
          return (
            <li key={key}>
              <FilterLink
                href={href}
                filters={filters}
                className={cn(
                  "focus-ring flex h-full flex-col justify-center gap-1 rounded-control px-3 py-2.5 transition-colors duration-120",
                  hot ? "bg-status-blocked/15 hover:bg-status-blocked/25" : "bg-raised/50 hover:bg-raised",
                )}
              >
                <span className="flex items-center justify-between gap-1">
                  {/* Zerado fica apagado para o olho ir direto ao que importa. */}
                  <span className={cn("text-hero font-semibold tracking-[-0.02em]", value === 0 ? "text-ink-subtle" : "text-ink")}>{value}</span>
                  <Icon aria-hidden="true" className={cn("size-3.5", hot ? "text-status-blocked" : "text-ink-subtle")} />
                </span>
                <span className={cn("truncate text-label", value === 0 ? "text-ink-subtle" : "text-ink-muted")}>{label}</span>
              </FilterLink>
            </li>
          );
        })}
      </ul>
    </Tile>
  );
}
