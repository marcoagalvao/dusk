"use client";

import { Columns3, LayoutList, Plus } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

import { PageContainer, PageHeader } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { EmptyState, SegmentedControl } from "@/components/ui/misc";
import type { TaskView } from "@/domain/settings";
import {
  countActiveFilters,
  filterTasks,
  isArchived,
  matchesScope,
  sortTasks,
  sortUpcoming,
  type TaskFilters,
  type TaskScope,
} from "@/domain/task-queries";
import { useToday } from "@/hooks/use-clock";
import { pluralize } from "@/lib/utils/text";
import { useAppStore } from "@/store/app-store";
import { useProjectMap, useSettings, useTasks } from "@/store/hooks";
import { useUiStore } from "@/store/ui-store";

import { TaskList } from "./task-list";
import { TaskToolbar } from "./task-toolbar";

const KanbanBoard = dynamic(() => import("./kanban-board").then((mod) => mod.KanbanBoard), {
  loading: () => <div className="h-96 animate-pulse rounded-card bg-surface/60" />,
});

const SCOPES: Record<TaskScope, { title: string; emptyTitle: string; emptyDescription: string }> = {
  all: {
    title: "Tarefas",
    emptyTitle: "Nenhuma tarefa ainda.",
    emptyDescription: "Anote a primeira coisa que precisa andar. Só o título já basta.",
  },
  today: {
    title: "Hoje",
    emptyTitle: "Nada marcado para hoje.",
    emptyDescription: "Aqui aparecem o foco do dia, prazos de hoje ou vencidos e revisões que chegaram.",
  },
  upcoming: {
    title: "Próximas",
    emptyTitle: "Nada agendado para os próximos dias.",
    emptyDescription: "Tarefas com prazo ou revisão no futuro aparecem aqui, da mais próxima para a mais distante.",
  },
  waiting: {
    title: "Aguardando",
    emptyTitle: "Nada aguardando resposta.",
    emptyDescription: "Você está com o caminho livre por aqui.",
  },
  overdue: {
    title: "Atrasadas",
    emptyTitle: "Nenhuma tarefa atrasada.",
    emptyDescription: "Todos os prazos estão em dia.",
  },
};

const VIEW_OPTIONS = [
  { value: "list", label: "Lista", icon: <LayoutList aria-hidden="true" className="size-4" /> },
  { value: "kanban", label: "Kanban", icon: <Columns3 aria-hidden="true" className="size-4" /> },
] as const;

export function TasksView({ scope, viewOverride }: { scope: TaskScope; viewOverride?: TaskView }) {
  const router = useRouter();
  const today = useToday();
  const tasks = useTasks();
  const projectsById = useProjectMap();
  const settings = useSettings();
  const updateSettings = useAppStore((state) => state.updateSettings);
  const filters = useUiStore((state) => state.taskFilters);
  const sort = useUiStore((state) => state.taskSort);
  const resetFilters = useUiStore((state) => state.resetTaskFilters);
  const setFilters = useUiStore((state) => state.setTaskFilters);
  const openQuickCreate = useUiStore((state) => state.openQuickCreate);

  const config = SCOPES[scope];
  const view: TaskView = scope === "all" ? (viewOverride ?? settings.defaultTaskView) : "list";

  const visible = useMemo(() => {
    const scoped = tasks.filter((task) => matchesScope(task, scope, today));
    const effectiveFilters: TaskFilters =
      view === "kanban" ? { ...filters, status: null, completion: "all" } : filters;
    // Arquivadas só vêm de um recorte do painel e, somente leitura, não entram no quadro.
    const filtered = filterTasks(scoped, effectiveFilters, projectsById, today).filter((task) => view !== "kanban" || !isArchived(task));
    return scope === "upcoming" && sort === "smart" ? sortUpcoming(filtered, today) : sortTasks(filtered, sort, today);
  }, [tasks, scope, today, view, filters, projectsById, sort]);

  const hasAnyTask = tasks.some((task) => !isArchived(task));
  const isFiltering = countActiveFilters(filters) > 0 || filters.search.trim().length > 0;

  return (
    <PageContainer width={view === "kanban" ? "wide" : "default"}>
      <PageHeader
        title={config.title}
        description={hasAnyTask ? pluralize(visible.length, "tarefa", "tarefas") : undefined}
        actions={
          <>
            {scope === "all" && (
              <SegmentedControl<TaskView>
                label="Visualização"
                value={view}
                options={VIEW_OPTIONS}
                onChange={(defaultTaskView) => {
                  updateSettings({ defaultTaskView });
                  // Escolher a visualização à mão descarta o ?view= da URL.
                  if (viewOverride) router.replace("/tasks");
                }}
              />
            )}
            <div className="hidden lg:block">
              <Button variant="primary" onClick={() => openQuickCreate()}>
                <Plus aria-hidden="true" className="size-4" />
                Nova tarefa
              </Button>
            </div>
          </>
        }
      />

      {hasAnyTask && <TaskToolbar hideStatusFilters={view === "kanban"} hideSort={view === "kanban"} />}

      {!hasAnyTask ? (
        <EmptyState
          title={SCOPES.all.emptyTitle}
          description={SCOPES.all.emptyDescription}
          action={
            <Button variant="primary" onClick={() => openQuickCreate()}>
              <Plus aria-hidden="true" className="size-4" />
              Criar primeira tarefa
            </Button>
          }
        />
      ) : view === "kanban" ? (
        <KanbanBoard tasks={visible} projectsById={projectsById} today={today} />
      ) : visible.length === 0 ? (
        isFiltering ? (
          <EmptyState
            title="Nenhuma tarefa encontrada."
            description="Ajuste a busca ou os filtros para ver mais resultados."
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  resetFilters();
                  setFilters({ search: "" });
                }}
              >
                Limpar busca e filtros
              </Button>
            }
          />
        ) : (
          <EmptyState title={config.emptyTitle} description={config.emptyDescription} />
        )
      ) : (
        <TaskList
          tasks={visible}
          projectsById={projectsById}
          today={today}
          grouped={scope === "all" && sort === "smart"}
          label={config.title}
        />
      )}
    </PageContainer>
  );
}
