"use client";

import { useState, type ReactNode } from "react";

import type { ReportDay } from "@/domain/dashboard-metrics";
import { formatShortDate, formatWeekdayShort, type DateKey } from "@/lib/dates";
import { cn } from "@/lib/utils/cn";

/*
 * Gráficos do painel, em HTML/SVG sem biblioteca, seguindo as regras da skill
 * dataviz: marcas finas, 2px de respiro entre elas, grade discreta, texto sempre
 * nas cores de texto e o valor legível sem depender de hover ou de cor.
 */

export function ProgressRing({ percent, size = 120, label }: { percent: number; size?: number; label: string }) {
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label} className="shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} className="stroke-line/70" />
      {percent > 0 && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - percent / 100)}
          className="stroke-primary transition-[stroke-dashoffset] duration-220"
        />
      )}
    </svg>
  );
}

function dayCounts(day: ReportDay): string {
  const completed = `${day.completed} ${day.completed === 1 ? "concluída" : "concluídas"}`;
  const created = `${day.created} ${day.created === 1 ? "criada" : "criadas"}`;
  return `${completed} · ${created}`;
}

function niceMax(value: number): number {
  if (value <= 4) return Math.max(value, 1);
  const step = value <= 10 ? 2 : value <= 25 ? 5 : 10;
  return Math.ceil(value / step) * step;
}

/** Colunas diárias de concluídas e criadas, numa mesma escala. */
export function DailyBars({ days, today }: { days: readonly ReportDay[]; today: DateKey }) {
  const [active, setActive] = useState<number | null>(null);
  const max = niceMax(Math.max(...days.map((day) => Math.max(day.completed, day.created))));
  const dense = days.length > 15;
  const labelEvery = days.length > 15 ? 7 : days.length > 7 ? 2 : 1;
  const activeDay = active === null ? null : days[active];

  return (
    <div>
      <div className="relative">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-40">
          {[max, max / 2, 0].map((tick) => (
            <div key={tick} className="absolute inset-x-0 flex -translate-y-1/2 items-center gap-2" style={{ top: `${100 - (tick / max) * 100}%` }}>
              <span className="w-4 text-right text-meta text-ink-muted tabular-nums">{Number.isInteger(tick) ? tick : ""}</span>
              <span className="h-px flex-1 bg-line/50" />
            </div>
          ))}
        </div>

        <div className="relative ml-6 flex h-40 items-stretch" onMouseLeave={() => setActive(null)}>
          {days.map((day, index) => (
            <div
              key={day.date}
              tabIndex={0}
              role="img"
              aria-label={`${formatShortDate(day.date, today)}: ${dayCounts(day)}`}
              onMouseEnter={() => setActive(index)}
              onFocus={() => setActive(index)}
              onBlur={() => setActive(null)}
              className={cn(
                "focus-ring flex min-w-0 flex-1 items-end justify-center gap-0.5 rounded-[4px] transition-colors duration-120",
                active === index && "bg-raised/50",
              )}
            >
              <Bar value={day.completed} max={max} className="bg-primary" dense={dense} />
              <Bar value={day.created} max={max} className="bg-ink-subtle/70" dense={dense} />
            </div>
          ))}

          {activeDay && active !== null && (
            <div
              role="status"
              className="pointer-events-none absolute -top-2 z-10 w-max -translate-x-1/2 rounded-control border border-line bg-raised px-3 py-2 text-meta shadow-float"
              style={{ left: `${Math.min(86, Math.max(14, ((active + 0.5) / days.length) * 100))}%` }}
            >
              <p className="font-medium text-ink">
                {formatWeekdayShort(activeDay.date)}, {formatShortDate(activeDay.date, today)}
              </p>
              <p className="mt-0.5 text-ink-muted">
                {dayCounts(activeDay)}
              </p>
            </div>
          )}
        </div>
      </div>

      <div aria-hidden="true" className="mt-1.5 ml-6 flex">
        {days.map((day, index) => (
          <span key={day.date} className="min-w-0 flex-1 text-center text-meta whitespace-nowrap text-ink-muted tabular-nums">
            {(days.length - 1 - index) % labelEvery === 0 ? formatShortDate(day.date, today).slice(0, 5) : ""}
          </span>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-meta text-ink-muted">
        <LegendSwatch className="bg-primary">Concluídas</LegendSwatch>
        <LegendSwatch className="bg-ink-subtle/70">Criadas</LegendSwatch>
      </div>
    </div>
  );
}

function Bar({ value, max, className, dense }: { value: number; max: number; className: string; dense: boolean }) {
  if (value === 0) return <span className={dense ? "w-[3px]" : "w-2.5"} />;
  return (
    <span
      className={cn("rounded-t-[3px] sm:rounded-t-[4px]", dense ? "w-[3px] sm:w-2" : "w-2.5 sm:w-4", className)}
      style={{ height: `${Math.max(4, (value / max) * 100)}%` }}
    />
  );
}

export function LegendSwatch({ className, color, children }: { className?: string; color?: string; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden="true" className={cn("size-2.5 rounded-[3px]", className)} style={color ? { backgroundColor: color } : undefined} />
      {children}
    </span>
  );
}

/** Barra horizontal rotulada: nome à esquerda, valor na ponta. */
export function LabeledBar({
  label,
  value,
  max,
  color,
  suffix,
}: {
  label: ReactNode;
  value: number;
  max: number;
  color: string;
  suffix?: string;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)] items-center gap-3 text-label sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)]">
      <span className="truncate text-ink-muted">{label}</span>
      <span className="flex min-w-0 items-center gap-2">
        {value > 0 && (
          <span className="h-3 min-w-1 rounded-r-[4px]" style={{ width: `${(value / Math.max(max, 1)) * 85}%`, backgroundColor: color }} />
        )}
        <span className="shrink-0 font-medium text-ink tabular-nums">
          {value}
          {suffix && <span className="font-normal text-ink-muted"> {suffix}</span>}
        </span>
      </span>
    </div>
  );
}

const WEEKDAY_LABELS = ["seg", "", "qua", "", "sex", "", ""];
const HEAT_STEPS = [0, 22, 42, 66, 100];

function heatStep(count: number, max: number): number {
  if (count === 0 || max === 0) return 0;
  return Math.min(HEAT_STEPS.length - 1, Math.ceil((count / max) * (HEAT_STEPS.length - 1)));
}

function heatColor(step: number): string | undefined {
  return step === 0 ? undefined : `color-mix(in srgb, var(--color-primary) ${HEAT_STEPS[step]}%, var(--color-surface))`;
}

/** Atividade por dia em colunas de semana (segunda a domingo). */
export function Heatmap({
  days,
  max,
  today,
}: {
  days: ReadonlyArray<{ date: DateKey; count: number }>;
  max: number;
  today: DateKey;
}) {
  return (
    <div>
      <div className="flex gap-2">
        <div aria-hidden="true" className="grid grid-rows-7 gap-0.5 text-[10px] leading-none text-ink-muted">
          {WEEKDAY_LABELS.map((label, index) => (
            <span key={index} className="flex h-3.5 items-center">
              {label}
            </span>
          ))}
        </div>
        <div className="grid grid-flow-col grid-rows-7 gap-0.5">
          {days.map((day) => (
            <span
              key={day.date}
              role="img"
              title={`${formatShortDate(day.date, today)}: ${day.count} ${day.count === 1 ? "atividade" : "atividades"}`}
              aria-label={`${formatShortDate(day.date, today)}: ${day.count} ${day.count === 1 ? "atividade" : "atividades"}`}
              className={cn("size-3.5 rounded-[3px]", day.count === 0 && "bg-line/35", day.date === today && "outline outline-1 outline-offset-1 outline-ink-muted")}
              style={{ backgroundColor: heatColor(heatStep(day.count, max)) }}
            />
          ))}
        </div>
      </div>
      <div aria-hidden="true" className="mt-2 flex items-center gap-1 text-[11px] text-ink-muted">
        Menos
        {HEAT_STEPS.map((_, step) => (
          <span key={step} className={cn("size-2.5 rounded-[2px]", step === 0 && "bg-line/35")} style={{ backgroundColor: heatColor(step) }} />
        ))}
        Mais
      </div>
    </div>
  );
}
