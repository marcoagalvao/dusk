"use client";

import { Search, Sun } from "lucide-react";
import { useId, useMemo, useState } from "react";

import { toggleFocus } from "@/actions/task-actions";
import { ProjectLabel } from "@/components/ui/badges";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { StatusGlyph } from "@/components/ui/status-glyph";
import { FOCUS_SOFT_LIMIT } from "@/domain/task";
import { isInFocus, isOpen, matchesSearch, sortTasks } from "@/domain/task-queries";
import { cn } from "@/lib/utils/cn";
import { normalizeForSearch } from "@/lib/utils/text";
import { useProjectMap, useTasks } from "@/store/hooks";

interface FocusPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  today: string;
}

/** Escolha rápida das tarefas do dia, com limite sugerido de 5 (sem bloqueio, PRD §22). */
export function FocusPickerDialog({ open, onOpenChange, today }: FocusPickerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent placement="top" width="lg">
        <DialogHeader title="Foco de hoje" description="Escolha o que realmente precisa avançar hoje." />
        <FocusPicker today={today} />
        <DialogFooter>
          <Button variant="primary" onClick={() => onOpenChange(false)}>
            Concluir seleção
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FocusPicker({ today }: { today: string }) {
  const tasks = useTasks();
  const projectsById = useProjectMap();
  const searchId = useId();
  const [query, setQuery] = useState("");

  const focusCount = tasks.filter((task) => isOpen(task) && isInFocus(task, today)).length;
  const candidates = useMemo(() => {
    const normalized = normalizeForSearch(query);
    const open = tasks.filter(
      (task) =>
        isOpen(task) && matchesSearch(task, normalized, task.projectId ? projectsById.get(task.projectId)?.name : undefined),
    );
    return sortTasks(open, "smart", today);
  }, [tasks, query, projectsById, today]);

  return (
    <div className="flex min-h-0 flex-col gap-3">
      <p className={cn("text-label", focusCount > FOCUS_SOFT_LIMIT ? "text-status-waiting" : "text-ink-muted")}>
        {focusCount} no foco
        {focusCount > FOCUS_SOFT_LIMIT ? ` · mais que ${FOCUS_SOFT_LIMIT} costuma dispersar` : ` · até ${FOCUS_SOFT_LIMIT} é o ideal`}
      </p>
      <div className="relative">
        <label htmlFor={searchId} className="sr-only">
          Buscar tarefas
        </label>
        <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-subtle" />
        <input
          id={searchId}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar tarefa"
          autoComplete="off"
          className="h-10 w-full rounded-control border border-line bg-canvas/50 pr-3 pl-9 text-emph text-ink focus:border-primary focus:ring-3 focus:ring-primary/20 focus:outline-none sm:text-compact"
        />
      </div>

      {candidates.length === 0 ? (
        <p className="py-6 text-center text-compact text-ink-muted">
          {query ? "Nenhuma tarefa aberta encontrada." : "Nenhuma tarefa aberta. Crie uma tarefa primeiro."}
        </p>
      ) : (
        <ul className="-mx-1 flex max-h-[50dvh] flex-col overflow-y-auto">
          {candidates.map((task) => {
            const selected = isInFocus(task, today);
            const project = task.projectId ? projectsById.get(task.projectId) : undefined;
            return (
              <li key={task.id}>
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleFocus(task, today, { silent: true })}
                  className={cn(
                    "focus-ring flex w-full items-center gap-3 rounded-control px-3 py-2.5 text-left transition-colors duration-120",
                    selected ? "bg-primary/10" : "hover:bg-raised/70",
                  )}
                >
                  <StatusGlyph status={task.status} size={16} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-compact text-ink">{task.title}</span>
                    {project && <ProjectLabel project={project} className="text-meta text-ink-subtle" />}
                  </span>
                  <Sun aria-hidden="true" className={cn("size-4 shrink-0", selected ? "text-primary" : "text-ink-subtle/50")} />
                  <span className="sr-only">{selected ? "No foco" : "Fora do foco"}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
