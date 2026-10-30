"use client";

import { ArrowDown, ArrowUp, Flame, Minus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";

import { SegmentedControl } from "@/components/ui/misc";
import { PROJECT_COLOR } from "@/components/ui/tokens";
import {
  activityHeatmap,
  agingBuckets,
  completionStreak,
  periodReport,
  REPORT_PERIODS,
  waitingByPerson,
  type ReportPeriod,
} from "@/domain/dashboard-metrics";
import type { Project } from "@/domain/project";
import type { Task } from "@/domain/task";
import { cn } from "@/lib/utils/cn";

import { DailyBars, Heatmap, LabeledBar } from "./charts";
import { Tile, TileHeading } from "./tile";

const HEATMAP_WEEKS = 12;
const WAITING_PEOPLE_LIMIT = 5;
const NEUTRAL_BAR = "var(--color-ink-subtle)";

/** Tempo parado é ordenado: quanto mais velha a faixa, mais forte o tom. */
const AGING_TONES = [25, 40, 60, 80, 100].map((percent) => `color-mix(in srgb, var(--color-chart-blocked) ${percent}%, var(--color-line))`);

const PERIOD_LABELS: Record<ReportPeriod, string> = { 7: "Semana", 15: "Quinzena", 30: "Mês" };
const PERIOD_TITLES: Record<ReportPeriod, string> = { 7: "Como foi sua semana", 15: "Como foi sua quinzena", 30: "Como foi seu mês" };

/** Comparação por extenso: seta e frase, sem sigla para decifrar. */
function Delta({ current, previous, period, higherIsBetter = true, points = false }: {
  current: number | null;
  previous: number | null;
  period: ReportPeriod;
  higherIsBetter?: boolean;
  /** A diferença é em pontos percentuais. */
  points?: boolean;
}) {
  if (current === null || previous === null) return <p className="mt-1 text-meta text-ink-muted">sem dados do período anterior</p>;
  const delta = current - previous;
  const amount = Math.abs(delta);
  const good = delta !== 0 && delta > 0 === higherIsBetter;
  const Icon = delta > 0 ? ArrowUp : delta < 0 ? ArrowDown : Minus;

  return (
    <p className="mt-1 flex items-start gap-1 text-meta text-ink-muted">
      <Icon aria-hidden="true" className={cn("mt-0.5 size-3 shrink-0", good ? "text-status-completed" : delta === 0 ? "text-ink-subtle" : "text-status-blocked")} />
      <span>
        {delta === 0
          ? `igual aos ${period} dias anteriores`
          : `${amount}${points ? (amount === 1 ? " ponto" : " pontos") : ""} a ${delta > 0 ? "mais" : "menos"} que nos ${period} dias anteriores`}
      </span>
    </p>
  );
}

function StatTile({ label, value, hint, children }: { label: string; value: string; hint?: string; children?: ReactNode }) {
  return (
    <div className="rounded-control bg-raised/40 px-4 py-3">
      <p className="text-label text-ink-muted">{label}</p>
      <p className="mt-1 text-hero font-semibold tracking-[-0.02em] text-ink">{value}</p>
      {hint && <p className="mt-1 text-meta text-ink-muted">{hint}</p>}
      {children}
    </div>
  );
}

function ChartBlock({ title, description, children, className }: { title: string; description?: string; children: ReactNode; className?: string }) {
  return (
    <Tile className={className}>
      <TileHeading level="h3" title={title} hint={description} className="mb-4" />
      {children}
    </Tile>
  );
}

export function PeriodReportSection({ tasks, projects, today }: { tasks: readonly Task[]; projects: readonly Project[]; today: string }) {
  const [period, setPeriod] = useState<ReportPeriod>(7);

  const report = useMemo(() => periodReport(tasks, projects, today, period), [tasks, projects, today, period]);
  const health = useMemo(
    () => ({
      aging: agingBuckets(tasks, today),
      heatmap: activityHeatmap(tasks, today, HEATMAP_WEEKS),
      people: waitingByPerson(tasks, today).slice(0, WAITING_PEOPLE_LIMIT),
      streak: completionStreak(tasks, today),
    }),
    [tasks, today],
  );

  const quiet = report.completed === 0 && report.created === 0;
  const projectMax = Math.max(...report.byProject.map((row) => row.completed), 1);
  const agingMax = Math.max(...health.aging.map((bucket) => bucket.count), 1);

  return (
    <section aria-labelledby="report-heading">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="report-heading" className="text-section font-semibold tracking-tight text-ink">
            {PERIOD_TITLES[period]}
          </h2>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-label text-ink-muted">
            Últimos {period} dias, comparados aos {period} anteriores
            {health.streak > 1 && (
              <span className="inline-flex items-center gap-1">
                <Flame aria-hidden="true" className="size-3.5 text-status-waiting" />
                {health.streak} dias seguidos com entrega
              </span>
            )}
          </p>
        </div>
        <SegmentedControl<`${ReportPeriod}`>
          label="Período do relatório"
          value={`${period}`}
          onChange={(value) => setPeriod(Number(value) as ReportPeriod)}
          options={REPORT_PERIODS.map((value) => ({ value: `${value}` as const, label: PERIOD_LABELS[value] }))}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <StatTile label="Tarefas concluídas" value={`${report.completed}`}>
          <Delta current={report.completed} previous={report.previousCompleted} period={period} />
        </StatTile>
        <StatTile label="Tarefas criadas" value={`${report.created}`}>
          <Delta current={report.created} previous={report.previousCreated} period={period} higherIsBetter={false} />
        </StatTile>
        <StatTile label="Entregues no prazo" value={report.onTimePercent === null ? "–" : `${report.onTimePercent}%`}>
          <Delta current={report.onTimePercent} previous={report.previousOnTimePercent} period={period} points />
        </StatTile>
        <StatTile
          label="Tempo até concluir"
          value={report.avgCycleDays === null ? "–" : `${report.avgCycleDays.toLocaleString("pt-BR")} ${report.avgCycleDays === 1 ? "dia" : "dias"}`}
          hint="em média, de criar a concluir"
        />
      </div>

      <div className="mt-2 grid gap-2 lg:grid-cols-3">
        <ChartBlock title="Concluídas e criadas por dia" description="Barra cinza maior que a lilás: entrou mais do que saiu." className="lg:col-span-2">
          {quiet ? (
            <p className="text-compact text-ink-muted">Nenhuma atividade nos últimos {period} dias.</p>
          ) : (
            <DailyBars days={report.days} today={today} />
          )}
        </ChartBlock>

        <ChartBlock title="Concluídas por projeto">
          {report.byProject.length === 0 ? (
            <p className="text-compact text-ink-muted">Nenhuma entrega no período.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {report.byProject.map((row) => (
                <LabeledBar
                  key={row.id}
                  label={row.name}
                  value={row.completed}
                  max={projectMax}
                  color={row.color ? PROJECT_COLOR[row.color] : NEUTRAL_BAR}
                />
              ))}
            </div>
          )}
        </ChartBlock>

        <ChartBlock title="Seus dias de atividade" description={`Cada quadrado é um dia das últimas ${HEATMAP_WEEKS} semanas. Mais claro, mais movimento.`}>
          <Heatmap days={health.heatmap.days} max={health.heatmap.max} today={today} />
        </ChartBlock>

        <ChartBlock title="Há quanto tempo estão abertas" description="Barras nas últimas linhas são tarefas esquecidas.">
          <div className="flex flex-col gap-2.5">
            {health.aging.map((bucket, index) => (
              <LabeledBar key={bucket.label} label={bucket.label} value={bucket.count} max={agingMax} color={AGING_TONES[index]} />
            ))}
          </div>
        </ChartBlock>

        <ChartBlock title="Aguardando resposta de quem" description="Quem tem mais tarefas suas paradas.">
          {health.people.length === 0 ? (
            <p className="text-compact text-ink-muted">Ninguém com resposta pendente.</p>
          ) : (
            <ul className="flex flex-col">
              {health.people.map((person) => (
                <li key={person.name}>
                  <Link
                    href="/tasks/waiting"
                    className="focus-ring -mx-2 flex items-center justify-between gap-3 rounded-[8px] px-2 py-1.5 text-label transition-colors duration-120 hover:bg-raised/60"
                  >
                    <span className="min-w-0 truncate font-medium text-ink">{person.name}</span>
                    <span className="shrink-0 text-ink-muted">
                      {person.count} {person.count === 1 ? "tarefa" : "tarefas"}
                      {person.oldestDays > 0 && <span> · há {person.oldestDays} {person.oldestDays === 1 ? "dia" : "dias"}</span>}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </ChartBlock>
      </div>
    </section>
  );
}
