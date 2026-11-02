"use client";

import { Plus, Sparkles, Sun } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";

import { loadSampleData } from "@/actions/data-actions";
import { PageContainer } from "@/components/layout/page";
import { ProjectRow } from "@/components/projects/projects-view";
import { TaskRow } from "@/components/tasks/task-row";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import {
  getTodayAgenda,
  priorityMatrix,
  statusBreakdown,
  todayPulse,
  upcomingDays,
} from "@/domain/dashboard-metrics";
import type { Project } from "@/domain/project";
import { FOCUS_SOFT_LIMIT, type Task } from "@/domain/task";
import {
  getStaleFocus,
  getUpcomingReviews,
  isArchived,
  isInFocus,
  isOpen,
  isTodayRelevant,
  recentProjects,
  REVIEW_HORIZON_DAYS,
  sortTasks,
} from "@/domain/task-queries";
import { useNow, useToday } from "@/hooks/use-clock";
import { cn } from "@/lib/utils/cn";
import { useProjectMap, useProjects, useSettings, useTasks } from "@/store/hooks";
import { useUiStore } from "@/store/ui-store";

import { FilterLink } from "./filter-link";
import { FocusPickerDialog } from "./focus-picker-dialog";
import { Greeting } from "./greeting";
import { PriorityMatrixGrid, StatusBar } from "./pending-map";
import { PeriodReportSection } from "./period-report-section";
import { ReviewItem } from "./review-item";
import { StaleFocusBanner } from "./stale-focus-banner";
import { Tile, TileHeading } from "./tile";
import { TodayHero } from "./today-hero";
import { UpcomingCalendar } from "./upcoming-calendar";
import { WaitingItem } from "./waiting-item";

const AGENDA_LIMIT = 7;
const ALSO_LIMIT = 3;
const WAITING_LIMIT = 5;
const REVIEWS_LIMIT = 5;
const RECENT_PROJECTS_LIMIT = 4;
const CALENDAR_DAYS = 14;

function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <ul className={cn("flex flex-col rounded-card border border-line/60 bg-surface/60 p-1", className)}>{children}</ul>;
}

/** Limpa os filtros ao abrir: a lista precisa mostrar o que este bloco está contando. */
function MoreLink({ href, label, selection }: { href?: string; label: string; selection?: { label: string; taskIds: string[] } }) {
  return (
    <FilterLink
      href={href}
      filters={selection ? { selection } : undefined}
      className="focus-ring rounded-[6px] text-label whitespace-nowrap text-ink-muted transition-colors duration-120 hover:text-ink"
    >
      {label}
    </FilterLink>
  );
}

function AgendaList({
  tasks,
  projectsById,
  today,
}: {
  tasks: readonly Task[];
  projectsById: ReadonlyMap<string, Project>;
  today: string;
}) {
  return (
    <ul className="-mx-1 flex flex-col gap-px">
      {tasks.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          project={task.projectId ? projectsById.get(task.projectId) : undefined}
          today={today}
          showNextAction={false}
        />
      ))}
    </ul>
  );
}

export function DashboardView() {
  const now = useNow();
  const today = useToday();
  const tasks = useTasks();
  const projects = useProjects();
  const projectsById = useProjectMap();
  const settings = useSettings();
  const openQuickCreate = useUiStore((state) => state.openQuickCreate);
  const [focusPickerOpen, setFocusPickerOpen] = useState(false);

  const view = useMemo(() => {
    const focusOpen = tasks.filter((task) => isInFocus(task, today) && isOpen(task)).length;
    const agenda = getTodayAgenda(tasks, today);
    return {
      pulse: todayPulse(tasks, today),
      // "Hoje" é o mesmo recorte do número, do herói e da vista /tasks/today: só abertas. O resto pede atenção sem ter data hoje.
      agendaToday: agenda.filter((task) => isOpen(task) && isTodayRelevant(task, today)),
      agendaAlso: agenda.filter((task) => isOpen(task) && !isTodayRelevant(task, today)),
      staleFocus: getStaleFocus(tasks, today),
      focusOpen,
      matrix: priorityMatrix(tasks, today),
      statuses: statusBreakdown(tasks),
      calendar: upcomingDays(tasks, today, CALENDAR_DAYS),
      waiting: sortTasks(
        tasks.filter((task) => isOpen(task) && task.status === "waiting"),
        "smart",
        today,
      ),
      reviews: getUpcomingReviews(tasks, today),
      recent: recentProjects(projects, tasks, RECENT_PROJECTS_LIMIT),
      hasData: tasks.some((task) => !isArchived(task)) || projects.some((project) => !project.archivedAt),
    };
  }, [tasks, projects, today]);

  if (!view.hasData) {
    return (
      <PageContainer>
        <Greeting now={now} name={settings.displayName} />
        <section className="max-w-xl">
          <h2 className="text-section font-semibold text-ink">O que precisa andar?</h2>
          <p className="mt-2 text-body text-ink-muted">
            Anote do jeito que você anotaria no bloco de notas. O Dusk organiza o resto: status, quem você está aguardando,
            o próximo passo e quando voltar a olhar.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button variant="primary" size="lg" onClick={() => openQuickCreate()}>
              <Plus aria-hidden="true" className="size-4" />
              Criar primeira tarefa
            </Button>
            <Button variant="ghost" size="lg" onClick={loadSampleData}>
              <Sparkles aria-hidden="true" className="size-4" />
              Ver com dados de exemplo
            </Button>
          </div>
          <p className="mt-4 hidden text-label text-ink-subtle lg:block">
            Dica: pressione <kbd className="font-mono text-ink-muted">N</kbd> em qualquer tela para criar uma tarefa.
          </p>
        </section>
      </PageContainer>
    );
  }

  return (
    <PageContainer width="dashboard">
      <Greeting now={now} name={settings.displayName} />

      <div className="flex flex-col gap-8 lg:gap-10">
        <div className="flex flex-col gap-2">
          <StaleFocusBanner tasks={view.staleFocus} today={today} />
          <div className="grid gap-2 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-stretch">
          <TodayHero pulse={view.pulse} />

          <Tile labelledBy="agenda-heading">
            <TileHeading
              id="agenda-heading"
              title="Hoje"
              hint="Seu foco, prazos até hoje e lembretes que chegaram."
              count={view.pulse.pending}
              action={
                <span className="flex items-center gap-2">
                  <MoreLink href="/tasks/today" label="Ver todas" />
                  <Button variant="ghost" size="sm" onClick={() => setFocusPickerOpen(true)}>
                    <Sun aria-hidden="true" className="size-4" />
                    <span className="hidden sm:inline">Escolher foco</span>
                    <span className="sm:hidden">Foco</span>
                  </Button>
                </span>
              }
            />
            {view.agendaToday.length === 0 ? (
              <EmptyState
                title="Nada pendente para hoje."
                description="Escolha algumas coisas que realmente precisam avançar."
                action={
                  <Button variant="secondary" size="sm" onClick={() => setFocusPickerOpen(true)}>
                    <Sun aria-hidden="true" className="size-4" />
                    Adicionar ao foco
                  </Button>
                }
              />
            ) : (
              <AgendaList tasks={view.agendaToday.slice(0, AGENDA_LIMIT)} projectsById={projectsById} today={today} />
            )}
            {view.agendaToday.length > AGENDA_LIMIT && (
              <p className="mt-2 pl-3 text-label text-ink-muted">
                Mostrando {AGENDA_LIMIT} de {view.agendaToday.length}. <MoreLink href="/tasks/today" label="Ver todas" />
              </p>
            )}
            {view.agendaAlso.length > 0 && (
              <div className="mt-4 border-t border-line/40 pt-3">
                <TileHeading
                  level="h3"
                  className="mb-1"
                  title="Outras que pedem atenção"
                  hint="Urgentes ou bloqueadas, sem data para hoje."
                  count={view.agendaAlso.length}
                  action={
                    view.agendaAlso.length > ALSO_LIMIT && (
                      <MoreLink label="Ver todas" selection={{ label: "Outras que pedem atenção", taskIds: view.agendaAlso.map((task) => task.id) }} />
                    )
                  }
                />
                <AgendaList tasks={view.agendaAlso.slice(0, ALSO_LIMIT)} projectsById={projectsById} today={today} />
              </div>
            )}
            {view.focusOpen > FOCUS_SOFT_LIMIT && (
              <p className="mt-2 pl-3 text-label text-status-waiting">
                {view.focusOpen} tarefas abertas no foco. Mais de {FOCUS_SOFT_LIMIT} costuma dispersar o dia.
              </p>
            )}
          </Tile>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3 lg:gap-x-6">
          <section aria-labelledby="waiting-heading">
            <TileHeading
              id="waiting-heading"
              title="Aguardando resposta"
              count={view.waiting.length}
              action={view.waiting.length > WAITING_LIMIT && <MoreLink href="/tasks/waiting" label="Ver todas" />}
            />
            {view.waiting.length === 0 ? (
              <EmptyState title="Nada aguardando resposta." description="Você está com o caminho livre por aqui." />
            ) : (
              <Panel>
                {view.waiting.slice(0, WAITING_LIMIT).map((task) => (
                  <WaitingItem
                    key={task.id}
                    task={task}
                    project={task.projectId ? projectsById.get(task.projectId) : undefined}
                    today={today}
                  />
                ))}
              </Panel>
            )}
          </section>

          <section aria-labelledby="reviews-heading">
            <TileHeading
              id="reviews-heading"
              title="Próximos lembretes"
              count={view.reviews.length}
              action={
                view.reviews.length > REVIEWS_LIMIT && (
                  <MoreLink label="Ver todos" selection={{ label: "Próximos lembretes", taskIds: view.reviews.map((task) => task.id) }} />
                )
              }
            />
            {view.reviews.length === 0 ? (
              <p className="pl-1 text-compact text-ink-muted">
                Nenhum lembrete nos próximos {REVIEW_HORIZON_DAYS} dias. Marque um lembrete numa tarefa para voltar a ela no dia
                certo.
              </p>
            ) : (
              <Panel>
                {view.reviews.slice(0, REVIEWS_LIMIT).map((task) => (
                  <ReviewItem
                    key={task.id}
                    task={task}
                    project={task.projectId ? projectsById.get(task.projectId) : undefined}
                    today={today}
                  />
                ))}
              </Panel>
            )}
          </section>

          <section aria-labelledby="projects-heading">
            <TileHeading id="projects-heading" title="Projetos recentes" action={<MoreLink href="/projects" label="Todos" />} />
            {view.recent.length === 0 ? (
              <p className="pl-1 text-compact text-ink-muted">
                Nenhum projeto ainda.{" "}
                <Link href="/projects" className="focus-ring rounded-[4px] text-primary hover:text-primary-hover">
                  Criar projeto
                </Link>
              </p>
            ) : (
              <ul className="-mx-1 flex flex-col gap-px">
                {view.recent.map(({ project, stats }) => (
                  <ProjectRow key={project.id} project={project} stats={stats} compact />
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="grid gap-2 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <Tile labelledBy="map-heading">
            <TileHeading
              id="map-heading"
              title="Prioridade e prazo"
              hint="Tarefas abertas por prioridade e prazo. Clique num número para ver quais são."
            />
            <PriorityMatrixGrid matrix={view.matrix} />
          </Tile>
          <Tile labelledBy="status-heading">
            <TileHeading id="status-heading" title="Situação das abertas" />
            <StatusBar counts={view.statuses} />
          </Tile>
        </div>

        <section aria-labelledby="calendar-heading">
          <TileHeading id="calendar-heading" title="Próximas duas semanas" action={<MoreLink href="/tasks/upcoming" label="Ver todas" />} />
          <UpcomingCalendar days={view.calendar} today={today} />
        </section>

        <PeriodReportSection tasks={tasks} projects={projects} today={today} />
      </div>

      <FocusPickerDialog open={focusPickerOpen} onOpenChange={setFocusPickerOpen} today={today} />
    </PageContainer>
  );
}
