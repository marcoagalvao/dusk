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

import { AttentionItem } from "./attention-item";
import { FocusPickerDialog } from "./focus-picker-dialog";
import { Greeting } from "./greeting";
import { PriorityMatrixGrid, StatusBar } from "./pending-map";
import { PeriodReportSection } from "./period-report-section";
import { ReviewItem } from "./review-item";
import { Tile, TileHeading } from "./tile";
import { TodayHero } from "./today-hero";
import { UpcomingCalendar } from "./upcoming-calendar";

const AGENDA_LIMIT = 7;
const ALSO_LIMIT = 3;
const WAITING_LIMIT = 5;
const REVIEWS_LIMIT = 5;
const RECENT_PROJECTS_LIMIT = 4;
const CALENDAR_DAYS = 14;

function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <ul className={cn("flex flex-col rounded-card border border-line/60 bg-surface/60 p-1", className)}>{children}</ul>;
}

function MoreLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="focus-ring rounded-[6px] text-label whitespace-nowrap text-ink-muted transition-colors duration-120 hover:text-ink">
      {label}
    </Link>
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
      // "Hoje" é o mesmo recorte do herói e da vista /tasks/today; o resto pede atenção sem ter data hoje.
      agendaToday: agenda.filter((task) => isTodayRelevant(task, today)),
      agendaAlso: agenda.filter((task) => !isTodayRelevant(task, today)),
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
        <div className="grid gap-2 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-stretch">
          <TodayHero pulse={view.pulse} />

          <Tile labelledBy="agenda-heading">
            <TileHeading
              id="agenda-heading"
              title="Para fazer hoje"
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
            {view.agendaAlso.length > 0 && (
              <div className="mt-4 border-t border-line/40 pt-3">
                <h3 className="mb-1 flex items-baseline gap-2 text-label font-semibold text-ink-muted">
                  Também pedem atenção
                  <span className="text-meta font-normal text-ink-subtle">{view.agendaAlso.length}</span>
                </h3>
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

        <div className="grid gap-2 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <Tile labelledBy="map-heading">
            <TileHeading
              id="map-heading"
              title="Onde está a urgência"
              hint="Tarefas abertas por prioridade e prazo. Clique num número para ver quais são."
            />
            <PriorityMatrixGrid matrix={view.matrix} />
          </Tile>
          <Tile labelledBy="status-heading">
            <TileHeading id="status-heading" title="Em que pé estão as abertas" />
            <StatusBar counts={view.statuses} />
          </Tile>
        </div>

        <section aria-labelledby="calendar-heading">
          <TileHeading id="calendar-heading" title="O que vem nas próximas duas semanas" action={<MoreLink href="/tasks/upcoming" label="Ver todas" />} />
          <UpcomingCalendar days={view.calendar} today={today} />
        </section>

        <PeriodReportSection tasks={tasks} projects={projects} today={today} />

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
                  <AttentionItem
                    key={task.id}
                    task={task}
                    project={task.projectId ? projectsById.get(task.projectId) : undefined}
                    today={today}
                    variant="waiting"
                  />
                ))}
              </Panel>
            )}
          </section>

          <section aria-labelledby="reviews-heading">
            <TileHeading
              id="reviews-heading"
              title="Para revisar em breve"
              count={view.reviews.length}
              action={view.reviews.length > REVIEWS_LIMIT && <MoreLink href="/tasks/upcoming" label="Ver todas" />}
            />
            {view.reviews.length === 0 ? (
              <p className="pl-1 text-compact text-ink-muted">
                Nenhuma revisão nos próximos {REVIEW_HORIZON_DAYS} dias. Use “Revisar novamente” numa tarefa para ser lembrado
                de voltar a ela.
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
      </div>

      <FocusPickerDialog open={focusPickerOpen} onOpenChange={setFocusPickerOpen} today={today} />
    </PageContainer>
  );
}
