"use client";

import { formatLongDate, greetingFor } from "@/lib/dates";

const DAY_START_HOUR = 6;
const DAY_END_HOUR = 24;

/** Fração do dia útil (06h–24h) já percorrida. */
function dayProgress(now: Date): number {
  const hours = now.getHours() + now.getMinutes() / 60;
  return Math.min(1, Math.max(0, (hours - DAY_START_HOUR) / (DAY_END_HOUR - DAY_START_HOUR)));
}

/**
 * Linha do dia: um horizonte que vai da manhã (periwinkle) ao crepúsculo
 * (pêssego/rosa), com um ponto marcando a hora atual. É o único ornamento
 * da interface e reforça o nome do produto.
 */
function DayLine({ now }: { now: Date }) {
  const progress = dayProgress(now);
  return (
    <div aria-hidden="true" className="relative mt-5 h-3 w-full max-w-md">
      <div
        className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 opacity-35"
        style={{
          background:
            "linear-gradient(90deg, var(--color-status-progress), var(--color-primary) 45%, var(--color-status-waiting) 75%, var(--color-status-blocked))",
        }}
      />
      <div
        className="absolute top-1/2 left-0 h-0.5 -translate-y-1/2 rounded-full"
        style={{
          width: `${progress * 100}%`,
          background:
            "linear-gradient(90deg, var(--color-status-progress), var(--color-primary) 60%, var(--color-status-waiting))",
          backgroundSize: progress > 0 ? `${100 / progress}% 100%` : undefined,
        }}
      />
      <div
        className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink ring-4 ring-canvas"
        style={{ left: `${progress * 100}%` }}
      />
    </div>
  );
}

export function Greeting({ now, name }: { now: Date; name?: string }) {
  return (
    <header className="mb-8 lg:mb-10">
      <h1 className="text-hero font-semibold tracking-[-0.02em] text-ink">
        {greetingFor(now)}
        {name ? `, ${name}.` : "."}
      </h1>
      <p className="mt-1 text-body text-ink-muted">{formatLongDate(now)}</p>
      <DayLine now={now} />
    </header>
  );
}
