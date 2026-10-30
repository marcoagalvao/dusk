import { Flag } from "lucide-react";

import { LegendSwatch } from "@/components/dashboard/charts";
import { PRIORITY_COLOR } from "@/components/ui/tokens";
import { DUE_BUCKETS, type DueBucket, type OpenStatus, type PriorityMatrix } from "@/domain/dashboard-metrics";
import { PRIORITY_LABELS, STATUS_LABELS, TASK_PRIORITIES } from "@/domain/task";
import type { DueFilter } from "@/domain/task-queries";

import { FilterLink } from "./filter-link";

const BUCKET_LABELS: Record<DueBucket, string> = {
  overdue: "Atrasada",
  today: "Hoje",
  soon: "Até 7 dias",
  later: "Depois",
  none: "Sem prazo",
};

const STATUS_ORDER: readonly OpenStatus[] = ["todo", "waiting", "in_progress", "blocked"];

const CHART_STATUS_COLOR: Record<OpenStatus, string> = {
  todo: "var(--color-chart-todo)",
  waiting: "var(--color-chart-waiting)",
  in_progress: "var(--color-chart-progress)",
  blocked: "var(--color-chart-blocked)",
};

function cellBackground(bucket: DueBucket, count: number, max: number): string | undefined {
  if (count === 0) return undefined;
  const base = bucket === "overdue" ? "var(--color-chart-blocked)" : "var(--color-primary)";
  return `color-mix(in srgb, ${base} ${Math.round(18 + (count / max) * 50)}%, transparent)`;
}

/** Cruzamento prioridade × prazo: quanto mais forte e mais à esquerda, mais urgente. */
export function PriorityMatrixGrid({ matrix }: { matrix: PriorityMatrix }) {
  const max = Math.max(1, ...TASK_PRIORITIES.flatMap((priority) => DUE_BUCKETS.map((bucket) => matrix[priority][bucket])));

  return (
    <div>
      <table className="w-full table-fixed border-separate border-spacing-1">
        <thead>
          <tr>
            <th scope="col" className="w-[4.5rem]">
              <span className="sr-only">Prioridade</span>
            </th>
            {DUE_BUCKETS.map((bucket) => (
              <th key={bucket} scope="col" className="pb-1 text-center text-[11px] leading-tight font-normal text-ink-muted sm:text-meta">
                {BUCKET_LABELS[bucket]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TASK_PRIORITIES.map((priority) => (
            <tr key={priority}>
              <th scope="row" className="pr-1 text-left text-label font-normal text-ink-muted">
                <span className="inline-flex items-center gap-1.5">
                  <Flag aria-hidden="true" className="size-3 shrink-0" style={{ color: PRIORITY_COLOR[priority] }} />
                  {PRIORITY_LABELS[priority]}
                </span>
              </th>
              {DUE_BUCKETS.map((bucket) => {
                const count = matrix[priority][bucket];
                return (
                  <td key={bucket} className="p-0">
                    {count === 0 ? (
                      <span className="flex h-10 items-center justify-center rounded-[8px] bg-line/15 text-label text-ink-subtle/50" aria-label="Nenhuma">
                        –
                      </span>
                    ) : (
                      <FilterLink
                        filters={{ priority, due: bucket as DueFilter }}
                        aria-label={`${count} com prioridade ${PRIORITY_LABELS[priority]}, prazo ${BUCKET_LABELS[bucket]}`}
                        className="focus-ring flex h-10 items-center justify-center rounded-[8px] text-compact font-semibold text-ink transition-[filter] duration-120 hover:brightness-125"
                        style={{ backgroundColor: cellBackground(bucket, count, max) }}
                      >
                        {count}
                      </FilterLink>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-meta text-ink-muted">
        <LegendSwatch color="var(--color-chart-blocked)">Prazo vencido</LegendSwatch>
        <LegendSwatch color="var(--color-primary)">No prazo</LegendSwatch>
        <span>Cor mais forte, mais tarefas</span>
      </p>
    </div>
  );
}

/** Abertas por status: tamanho na barra e número na legenda. */
export function StatusBar({ counts }: { counts: Record<OpenStatus, number> }) {
  const total = STATUS_ORDER.reduce((sum, status) => sum + counts[status], 0);
  if (total === 0) return <p className="text-compact text-ink-muted">Nenhuma tarefa aberta.</p>;

  return (
    <div>
      <div className="flex h-4 gap-0.5" role="img" aria-label={STATUS_ORDER.map((status) => `${counts[status]} ${STATUS_LABELS[status]}`).join(", ")}>
        {STATUS_ORDER.filter((status) => counts[status] > 0).map((status) => (
          <FilterLink
            key={status}
            filters={{ status }}
            tabIndex={-1}
            aria-hidden="true"
            title={`${STATUS_LABELS[status]}: ${counts[status]}`}
            className="min-w-1.5 rounded-[3px] transition-[filter] duration-120 hover:brightness-125"
            style={{ flexGrow: counts[status], flexBasis: 0, backgroundColor: CHART_STATUS_COLOR[status] }}
          />
        ))}
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1">
        {STATUS_ORDER.map((status) => (
          <li key={status}>
            <FilterLink filters={{ status }} className="focus-ring flex items-center justify-between gap-2 rounded-[6px] py-0.5 text-label text-ink-muted hover:text-ink">
              <LegendSwatch color={CHART_STATUS_COLOR[status]}>{STATUS_LABELS[status]}</LegendSwatch>
              <span className="font-semibold text-ink tabular-nums">{counts[status]}</span>
            </FilterLink>
          </li>
        ))}
      </ul>
    </div>
  );
}
