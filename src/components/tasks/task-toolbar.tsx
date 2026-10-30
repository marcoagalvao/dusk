"use client";

import { ArrowUpDown, ListFilter, Search, X } from "lucide-react";
import { useId, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form-controls";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/menu";
import { SegmentedControl } from "@/components/ui/misc";
import { STATUS_COLOR, PRIORITY_COLOR } from "@/components/ui/tokens";
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  TASK_PRIORITIES,
  TASK_STATUSES,
  type TaskPriority,
  type TaskStatus,
} from "@/domain/task";
import {
  COMPLETION_FILTER_LABELS,
  DUE_FILTERS,
  DUE_FILTER_LABELS,
  NO_PROJECT,
  SORT_LABELS,
  TASK_SORTS,
  countActiveFilters,
  type CompletionFilter,
  type TaskFilters,
  type TaskSort,
} from "@/domain/task-queries";
import { cn } from "@/lib/utils/cn";
import { useActiveProjects, useProjectMap } from "@/store/hooks";
import { useUiStore } from "@/store/ui-store";

function Chip({
  active,
  onClick,
  children,
  color,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  color?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "focus-ring inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-label transition-colors duration-120",
        active ? "border-primary/60 bg-primary/12 text-ink" : "border-line text-ink-muted hover:border-ink-subtle hover:text-ink",
      )}
    >
      {color && <span aria-hidden="true" className="size-2 rounded-full" style={{ backgroundColor: color }} />}
      {children}
    </button>
  );
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={title} className="flex flex-col gap-2">
      <p className="text-meta font-medium text-ink-subtle">{title}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

interface TaskToolbarProps {
  /** No Kanban, status e abertas/concluídas são as próprias colunas. */
  hideStatusFilters?: boolean;
  hideSort?: boolean;
  trailing?: ReactNode;
}

export function TaskToolbar({ hideStatusFilters, hideSort, trailing }: TaskToolbarProps) {
  const searchId = useId();
  const projectSelectId = useId();
  const filters = useUiStore((state) => state.taskFilters);
  const setFilters = useUiStore((state) => state.setTaskFilters);
  const resetFilters = useUiStore((state) => state.resetTaskFilters);
  const sort = useUiStore((state) => state.taskSort);
  const setSort = useUiStore((state) => state.setTaskSort);
  const projects = useActiveProjects();
  const activeCount = countActiveFilters(filters);

  const toggle = <K extends "status" | "priority" | "due">(key: K, value: NonNullable<TaskFilters[K]>) =>
    setFilters({ [key]: filters[key] === value ? null : value } as Partial<TaskFilters>);

  return (
    <div className="mb-5 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <label htmlFor={searchId} className="sr-only">
            Buscar tarefas
          </label>
          <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-subtle" />
          <input
            id={searchId}
            type="search"
            value={filters.search}
            onChange={(event) => setFilters({ search: event.target.value })}
            onKeyDown={(event) => {
              if (event.key === "Escape" && filters.search) {
                event.stopPropagation();
                setFilters({ search: "" });
              }
            }}
            placeholder="Buscar por título, projeto, espera, próxima ação…"
            autoComplete="off"
            className="h-10 w-full rounded-control border border-line bg-surface pr-9 pl-9 text-emph text-ink transition-[border-color,box-shadow] duration-120 hover:border-ink-subtle/70 focus:border-primary focus:ring-3 focus:ring-primary/20 focus:outline-none sm:text-compact [&::-webkit-search-cancel-button]:hidden"
          />
          {filters.search && (
            <button
              type="button"
              aria-label="Limpar busca"
              onClick={() => setFilters({ search: "" })}
              className="focus-ring absolute top-1/2 right-1.5 grid size-7 -translate-y-1/2 place-items-center rounded-[7px] text-ink-subtle hover:text-ink"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="secondary" aria-label={`Filtros${activeCount ? ` (${activeCount} ativos)` : ""}`}>
              <ListFilter aria-hidden="true" className="size-4" />
              <span className="hidden sm:inline">Filtros</span>
              {activeCount > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-semibold text-on-primary">
                  {activeCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="flex w-[min(22rem,calc(100vw-1.5rem))] flex-col gap-4 p-4">
            {!hideStatusFilters && (
              <SegmentedControl<CompletionFilter>
                label="Situação"
                value={filters.completion}
                onChange={(completion) => setFilters({ completion })}
                options={(["open", "completed", "all"] as const).map((value) => ({
                  value,
                  label: COMPLETION_FILTER_LABELS[value],
                }))}
              />
            )}
            {!hideStatusFilters && (
              <FilterGroup title="Status">
                {TASK_STATUSES.map((status: TaskStatus) => (
                  <Chip key={status} active={filters.status === status} onClick={() => toggle("status", status)} color={STATUS_COLOR[status]}>
                    {STATUS_LABELS[status]}
                  </Chip>
                ))}
              </FilterGroup>
            )}
            <FilterGroup title="Prioridade">
              {TASK_PRIORITIES.map((priority: TaskPriority) => (
                <Chip
                  key={priority}
                  active={filters.priority === priority}
                  onClick={() => toggle("priority", priority)}
                  color={PRIORITY_COLOR[priority]}
                >
                  {PRIORITY_LABELS[priority]}
                </Chip>
              ))}
            </FilterGroup>
            <FilterGroup title="Prazo">
              {DUE_FILTERS.map((due) => (
                <Chip key={due} active={filters.due === due} onClick={() => toggle("due", due)}>
                  {DUE_FILTER_LABELS[due]}
                </Chip>
              ))}
            </FilterGroup>
            <FilterGroup title="Atenção">
              <Chip active={filters.focusToday} onClick={() => setFilters({ focusToday: !filters.focusToday })}>
                No foco de hoje
              </Chip>
              <Chip active={filters.reviewDue} onClick={() => setFilters({ reviewDue: !filters.reviewDue })}>
                Revisão vencida
              </Chip>
            </FilterGroup>
            <div className="flex flex-col gap-2">
              <label htmlFor={projectSelectId} className="text-meta font-medium text-ink-subtle">
                Projeto
              </label>
              <Select
                id={projectSelectId}
                value={filters.projectId ?? ""}
                onChange={(event) => setFilters({ projectId: event.target.value || null })}
              >
                <option value="">Todos os projetos</option>
                <option value={NO_PROJECT}>Sem projeto</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </Select>
            </div>
            {activeCount > 0 && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="self-start">
                Limpar filtros
              </Button>
            )}
          </PopoverContent>
        </Popover>

        {!hideSort && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" aria-label={`Ordenar: ${SORT_LABELS[sort]}`}>
                <ArrowUpDown aria-hidden="true" className="size-4" />
                <span className="hidden md:inline">{SORT_LABELS[sort]}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={sort} onValueChange={(value) => setSort(value as TaskSort)}>
                {TASK_SORTS.map((option) => (
                  <DropdownMenuRadioItem key={option} value={option}>
                    {SORT_LABELS[option]}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {trailing}
      </div>

      <ActiveFilterChips hideStatusFilters={hideStatusFilters} />
    </div>
  );
}

/** Filtros ativos visíveis e removíveis um a um. */
function ActiveFilterChips({ hideStatusFilters }: { hideStatusFilters?: boolean }) {
  const filters = useUiStore((state) => state.taskFilters);
  const setFilters = useUiStore((state) => state.setTaskFilters);
  const resetFilters = useUiStore((state) => state.resetTaskFilters);
  const projectsById = useProjectMap();

  const chips: Array<{ key: string; label: string; clear: Partial<TaskFilters> }> = [];
  if (filters.selection) chips.push({ key: "selection", label: filters.selection.label, clear: { selection: null } });
  if (!hideStatusFilters && filters.completion !== "open") {
    chips.push({ key: "completion", label: COMPLETION_FILTER_LABELS[filters.completion], clear: { completion: "open" } });
  }
  if (!hideStatusFilters && filters.status) {
    chips.push({ key: "status", label: STATUS_LABELS[filters.status], clear: { status: null } });
  }
  if (filters.priority) {
    chips.push({ key: "priority", label: `Prioridade ${PRIORITY_LABELS[filters.priority].toLowerCase()}`, clear: { priority: null } });
  }
  if (filters.due) chips.push({ key: "due", label: DUE_FILTER_LABELS[filters.due], clear: { due: null } });
  if (filters.focusToday) chips.push({ key: "focus", label: "No foco de hoje", clear: { focusToday: false } });
  if (filters.reviewDue) chips.push({ key: "review", label: "Revisão vencida", clear: { reviewDue: false } });
  if (filters.projectId) {
    const name = filters.projectId === NO_PROJECT ? "Sem projeto" : (projectsById.get(filters.projectId)?.name ?? "Projeto removido");
    chips.push({ key: "project", label: name, clear: { projectId: null } });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => setFilters(chip.clear)}
          aria-label={`Remover filtro ${chip.label}`}
          className="focus-ring inline-flex h-7 items-center gap-1 rounded-full bg-primary/12 pr-1.5 pl-2.5 text-label text-ink transition-colors duration-120 hover:bg-primary/20"
        >
          {chip.label}
          <X aria-hidden="true" className="size-3.5 text-ink-muted" />
        </button>
      ))}
      {chips.length > 1 && (
        <button type="button" onClick={resetFilters} className="focus-ring ml-1 h-7 rounded-[6px] px-1.5 text-label text-ink-subtle hover:text-ink">
          Limpar tudo
        </button>
      )}
    </div>
  );
}
