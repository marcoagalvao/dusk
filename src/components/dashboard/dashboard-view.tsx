"use client";

import { Plus, Sparkles, Sun, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";

import { loadSampleData } from "@/actions/data-actions";
import { PageContainer } from "@/components/layout/page";
import { ProjectRow } from "@/components/projects/projects-view";
import { TaskRow } from "@/components/tasks/task-row";
import { Button } from "@/components/ui/button";
import { EmptyState, SectionHeading } from "@/components/ui/misc";
import { StatusGlyph } from "@/components/ui/status-glyph";
import { FOCUS_SOFT_LIMIT, type TaskStatus } from "@/domain/task";
import {
  DEFAULT_TASK_FILTERS,
  getAttentionTasks,
  getUpcomingReviews,
  isArchived,
  isInFocus,
  isOpen,
  isOverdue,
  recentProjects,
  REVIEW_HORIZON_DAYS,
  sortTasks,
  type TaskFilters,
} from "@/domain/task-queries";
import { useNow, useToday } from "@/hooks/use-clock";
import { startOfWeekKey, toDateKey } from "@/lib/dates";
import { cn } from "@/lib/utils/cn";
import { useProjectMap, useProjects, useSettings, useTasks } from "@/store/hooks";
import { useUiStore } from "@/store/ui-store";

import { AttentionItem } from "./attention-item";
import { FocusPickerDialog } from "./focus-picker-dialog";
import { Greeting } from "./greeting";
import { ReviewItem } from "./review-item";

const ATTENTION_LIMIT = 6;
const WAITING_LIMIT = 5;
const REVIEWS_LIMIT = 6;
const RECENT_PROJECTS_LIMIT = 4;

function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <ul className={cn("flex flex-col rounded-card border border-line/60 bg-surface/60 p-1", className)}>{children}</ul>;
}

function MoreLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="focus-ring rounded-[6px] text-label text-ink-subtle transition-colors duration-120 hover:text-ink">
      {label}
    </Link>
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
    const weekStart = startOfWeekKey(today);
    const focus = tasks.filter((task) => isInFocus(task, today));
    const waiting = sortTasks(
      tasks.filter((task) => isOpen(task) && task.status === "waiting"),
      "smart",
      today,
    );
    const countStatus = (status: TaskStatus) => tasks.filter((task) => isOpen(task) && task.status === status).length;
    return {
      focusOpen: sortTasks(focus.filter(isOpen), "smart", today),
      focusDone: focus.filter((task) => task.status === "completed"),
      attention: getAttentionTasks(tasks, today),
      waiting,
      reviews: getUpcomingReviews(tasks, today),
      summary: {
        inProgress: countStatus("in_progress"),
        waiting: waiting.length,
        overdue: tasks.filter((task) => isOverdue(task, today)).length,
        completedThisWeek: tasks.filter(
          (task) =>
            !isArchived(task) &&
            task.status === "completed" &&
            task.completedAt &&
            toDateKey(new Date(task.completedAt)) >= weekStart,
        ).length,
      },
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

  const focusTotal = view.focusOpen.length + view.focusDone.length;
  const focusOverLimit = view.focusOpen.length > FOCUS_SOFT_LIMIT;

  return (
    <PageContainer>
      <Greeting now={now} name={settings.displayName} />

      <div className="grid gap-9 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:items-start lg:gap-x-10">
        <section aria-labelledby="focus-heading" className="lg:col-start-1 lg:row-start-1">
          <SectionHeading
            id="focus-heading"
            title="Foco de hoje"
            count={focusTotal}
            action={
              focusTotal > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setFocusPickerOpen(true)}>
                  <Sun aria-hidden="true" className="size-4" />
                  Escolher
                </Button>
              )
            }
          />
          {focusTotal === 0 ? (
            <EmptyState
              title="Nenhuma tarefa no foco de hoje."
              description="Escolha algumas coisas que realmente precisam avançar."
              action={
                <Button variant="secondary" size="sm" onClick={() => setFocusPickerOpen(true)}>
                  <Sun aria-hidden="true" className="size-4" />
                  Adicionar ao foco
                </Button>
              }
            />
          ) : (
            <>
              <ul className="flex flex-col gap-px">
                {[...view.focusOpen, ...view.focusDone].map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    project={task.projectId ? projectsById.get(task.projectId) : undefined}
                    today={today}
                    showFocusBadge={false}
                  />
                ))}
              </ul>
              {focusOverLimit && (
                <p className="mt-2 pl-3 text-label text-status-waiting">
                  {view.focusOpen.length} tarefas abertas no foco. Mais de {FOCUS_SOFT_LIMIT} costuma dispersar o dia.
                </p>
              )}
            </>
          )}
        </section>

        <section aria-labelledby="attention-heading" className="lg:col-start-1 lg:row-span-4 lg:row-start-2">
          <SectionHeading
            id="attention-heading"
            title="Precisa da sua atenção"
            count={view.attention.length}
            action={view.attention.length > ATTENTION_LIMIT && <MoreLink href="/tasks/today" label="Ver todas" />}
          />
          {view.attention.length === 0 ? (
            <EmptyState title="Tudo certo por aqui." description="Nenhuma tarefa precisa da sua atenção agora." />
          ) : (
            <Panel>
              {view.attention.slice(0, ATTENTION_LIMIT).map((task) => (
                <AttentionItem
                  key={task.id}
                  task={task}
                  project={task.projectId ? projectsById.get(task.projectId) : undefined}
                  today={today}
                  variant="attention"
                />
              ))}
            </Panel>
          )}
        </section>

        <section aria-labelledby="waiting-heading" className="lg:col-start-2 lg:row-start-2">
          <SectionHeading
            id="waiting-heading"
            title="Aguardando"
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

        <section aria-labelledby="summary-heading" className="lg:col-start-2 lg:row-start-1">
          <SectionHeading id="summary-heading" title="Resumo" />
          <ul className="grid grid-cols-1 gap-x-4 gap-y-1 text-compact sm:grid-cols-2 lg:grid-cols-1">
            <SummaryLine
              href="/tasks?view=list"
              filters={{ status: "in_progress" }}
              icon={<StatusGlyph status="in_progress" size={14} />}
              value={view.summary.inProgress}
              label="em andamento"
            />
            <SummaryLine href="/tasks/waiting" icon={<StatusGlyph status="waiting" size={14} />} value={view.summary.waiting} label="aguardando" />
            <SummaryLine
              href="/tasks/overdue"
              icon={<TriangleAlert aria-hidden="true" className="size-3.5 text-status-blocked" />}
              value={view.summary.overdue}
              label={view.summary.overdue === 1 ? "atrasada" : "atrasadas"}
              alert={view.summary.overdue > 0}
            />
            <SummaryLine
              href="/tasks?view=list"
              filters={{ completion: "completed" }}
              icon={<StatusGlyph status="completed" size={14} />}
              value={view.summary.completedThisWeek}
              label={view.summary.completedThisWeek === 1 ? "concluída nesta semana" : "concluídas nesta semana"}
            />
          </ul>
        </section>

        <section aria-labelledby="reviews-heading" className="lg:col-start-2 lg:row-start-3">
          <SectionHeading
            id="reviews-heading"
            title="Revisões"
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

        <section aria-labelledby="projects-heading" className="lg:col-start-2 lg:row-start-4">
          <SectionHeading id="projects-heading" title="Projetos recentes" action={<MoreLink href="/projects" label="Todos" />} />
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

      <FocusPickerDialog open={focusPickerOpen} onOpenChange={setFocusPickerOpen} today={today} />
    </PageContainer>
  );
}

/**
 * Cada número do resumo abre a lista já filtrada pelo que ele conta. Os demais
 * filtros e a busca são limpos para a lista corresponder ao número clicado.
 */
function SummaryLine({
  href,
  filters = {},
  icon,
  value,
  label,
  alert,
}: {
  href: string;
  filters?: Partial<TaskFilters>;
  icon: ReactNode;
  value: number;
  label: string;
  alert?: boolean;
}) {
  const setTaskFilters = useUiStore((state) => state.setTaskFilters);

  return (
    <li>
      <Link
        href={href}
        onClick={() => setTaskFilters({ ...DEFAULT_TASK_FILTERS, ...filters })}
        className="focus-ring flex h-9 items-center gap-2.5 rounded-control px-2 transition-colors duration-120 hover:bg-surface"
      >
        {icon}
        <span className={cn("font-semibold tabular-nums", alert ? "text-status-blocked" : "text-ink")}>{value}</span>
        <span className="truncate text-ink-muted">{label}</span>
      </Link>
    </li>
  );
}
