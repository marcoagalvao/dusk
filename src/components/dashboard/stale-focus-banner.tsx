"use client";

import { Sun } from "lucide-react";
import Link from "next/link";

import { clearFocus, focusTasks } from "@/actions/task-actions";
import { Button } from "@/components/ui/button";
import type { Task } from "@/domain/task";

const TITLES_SHOWN = 3;

/** O foco vale um dia. O que ficou por fazer não some em silêncio: o usuário decide. */
export function StaleFocusBanner({ tasks, today }: { tasks: readonly Task[]; today: string }) {
  if (tasks.length === 0) return null;

  const ids = tasks.map((task) => task.id);
  const extra = tasks.length - TITLES_SHOWN;

  return (
    <section
      aria-labelledby="stale-focus-heading"
      className="flex flex-col gap-3 rounded-card border border-primary/30 bg-primary/8 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0">
        <h2 id="stale-focus-heading" className="flex items-center gap-2 text-compact font-semibold text-ink">
          <Sun aria-hidden="true" className="size-4 shrink-0 text-primary" />
          {tasks.length === 1 ? "1 tarefa do foco anterior ficou por fazer" : `${tasks.length} tarefas do foco anterior ficaram por fazer`}
        </h2>
        <p className="mt-1 text-label text-ink-muted">
          {tasks.slice(0, TITLES_SHOWN).map((task, index) => (
            <span key={task.id}>
              {index > 0 && ", "}
              <Link href={`/tasks/${task.id}`} className="focus-ring rounded-[4px] underline decoration-ink-subtle/60 underline-offset-2 hover:text-ink">
                {task.title}
              </Link>
            </span>
          ))}
          {extra > 0 && ` e mais ${extra}`}
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button size="sm" variant="primary" onClick={() => focusTasks(ids, today)}>
          Trazer para hoje
        </Button>
        <Button size="sm" variant="ghost" onClick={() => clearFocus(ids)}>
          Dispensar
        </Button>
      </div>
    </section>
  );
}
