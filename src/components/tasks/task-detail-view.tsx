"use client";

import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  ArrowRight,
  Check,
  Ellipsis,
  Hourglass,
  MessageSquareText,
  Pencil,
  Play,
  RotateCcw,
  Sun,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

import {
  archiveTask,
  completeTask,
  deleteTask,
  reopenTask,
  setTaskStatus,
  toggleFocus,
  unarchiveTask,
} from "@/actions/task-actions";
import { PageContainer } from "@/components/layout/page";
import { Button, ButtonLink, IconButton } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/menu";
import { EmptyState } from "@/components/ui/misc";
import { STATUSES_WITH_WAITING, type Task } from "@/domain/task";
import { isInFocus } from "@/domain/task-queries";
import { useToday } from "@/hooks/use-clock";
import { formatDateTime } from "@/lib/dates";
import { cn } from "@/lib/utils/cn";
import { useProjectMap, useTask } from "@/store/hooks";
import { useUiStore } from "@/store/ui-store";

import { FollowUpDialog } from "./follow-up-dialog";
import { ProgressUpdateDialog, type ProgressDialogIntent } from "./progress-update-dialog";
import { SubtaskList } from "./subtask-list";
import { DateControl, PriorityControl, ProjectControl, StatusControl } from "./task-detail-controls";
import { describeDate } from "./task-date";
import { TaskEditDialog } from "./task-edit-dialog";
import { TaskTimeline } from "./task-timeline";

const LIST_LABELS: Record<string, string> = {
  "/": "Visão geral",
  "/tasks": "Tarefas",
  "/tasks/today": "Hoje",
  "/tasks/upcoming": "Próximas",
  "/tasks/waiting": "Aguardando",
  "/tasks/overdue": "Atrasadas",
  "/projects": "Projetos",
  "/archive": "Arquivo",
};

function useBackTarget(): { href: string; label: string } {
  const lastListPath = useUiStore((state) => state.lastListPath);
  const projectsById = useProjectMap();
  const projectMatch = lastListPath.match(/^\/projects\/([^/]+)$/);
  if (projectMatch) {
    return { href: lastListPath, label: projectsById.get(projectMatch[1])?.name ?? "Projeto" };
  }
  return LIST_LABELS[lastListPath]
    ? { href: lastListPath, label: LIST_LABELS[lastListPath] }
    : { href: "/tasks", label: "Tarefas" };
}

function DetailSection({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("flex flex-col gap-2", className)}>
      <h2 className="text-label font-semibold text-ink-muted">{title}</h2>
      {children}
    </section>
  );
}

export function TaskDetailView({ taskId }: { taskId: string }) {
  const task = useTask(taskId);
  const back = useBackTarget();
  // Evita mostrar "não encontrada" entre a exclusão e a navegação de volta.
  const [deleted, setDeleted] = useState(false);

  if (deleted) return null;
  if (!task) {
    return (
      <PageContainer width="narrow">
        <EmptyState
          title="Tarefa não encontrada."
          description="Ela pode ter sido excluída ou o link está incorreto."
          action={<ButtonLink href="/tasks" variant="secondary" size="sm">Ver tarefas</ButtonLink>}
        />
      </PageContainer>
    );
  }

  return <TaskDetail task={task} back={back} onDeleted={() => setDeleted(true)} />;
}

function TaskDetail({
  task,
  back,
  onDeleted,
}: {
  task: Task;
  back: { href: string; label: string };
  onDeleted: () => void;
}) {
  const router = useRouter();
  const today = useToday();
  const [progressOpen, setProgressOpen] = useState(false);
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [progressIntent, setProgressIntent] = useState<ProgressDialogIntent>({});
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const archived = Boolean(task.archivedAt);
  const completed = task.status === "completed";
  const focused = isInFocus(task, today);
  const progressCount = task.updates.filter((update) => update.type === "progress").length;
  const showWaiting = STATUSES_WITH_WAITING.includes(task.status) && Boolean(task.waitingFor);
  const openProgress = (intent: ProgressDialogIntent = {}) => {
    setProgressIntent(intent);
    setProgressOpen(true);
  };
  const markWaiting = () => openProgress({ status: "waiting", focus: "waitingFor" });

  return (
    <PageContainer width="narrow">
      <div className="mb-4 flex items-center justify-between gap-2">
        <Link
          href={back.href}
          className="focus-ring -ml-1 inline-flex h-8 min-w-0 items-center gap-1.5 rounded-[8px] px-1 text-label text-ink-muted transition-colors duration-120 hover:text-ink"
        >
          <ArrowLeft aria-hidden="true" className="size-4 shrink-0" />
          <span className="truncate">{back.label}</span>
        </Link>
        <div className="flex items-center gap-1">
          {!completed && !archived && (
            <IconButton
              label={focused ? "Remover do foco de hoje" : "Adicionar ao foco de hoje"}
              aria-pressed={focused}
              icon={<Sun className="size-4" />}
              onClick={() => toggleFocus(task, today)}
              className="aria-pressed:text-primary aria-pressed:hover:text-primary"
            />
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <IconButton label="Mais ações" icon={<Ellipsis className="size-4" />} />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {!archived && (
                <DropdownMenuItem onSelect={() => setEditOpen(true)}>
                  <Pencil />
                  Editar
                </DropdownMenuItem>
              )}
              {archived ? (
                <DropdownMenuItem onSelect={() => unarchiveTask(task.id)}>
                  <ArchiveRestore />
                  Restaurar do arquivo
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onSelect={() => archiveTask(task.id)}>
                  <Archive />
                  Arquivar
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem tone="danger" onSelect={() => setDeleteOpen(true)}>
                <Trash2 />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {archived && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-surface px-4 py-3 text-compact text-ink-muted">
          <span>Arquivada em {formatDateTime(task.archivedAt!)}. Fora das listas e do painel.</span>
          <Button size="sm" variant="secondary" onClick={() => unarchiveTask(task.id)}>
            <ArchiveRestore aria-hidden="true" className="size-4" />
            Restaurar
          </Button>
        </div>
      )}

      <header className="flex flex-col gap-3">
        <div className="-ml-1.5">
          <ProjectControl task={task} disabled={archived} />
        </div>
        <h1
          className={cn(
            "text-page font-semibold tracking-tight text-balance break-words",
            completed ? "text-ink-muted line-through decoration-ink-subtle/50" : "text-ink",
          )}
        >
          {task.title}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <StatusControl task={task} disabled={archived} onRequestWaiting={markWaiting} />
          <PriorityControl task={task} disabled={archived} />
          <DateControl task={task} field="dueDate" today={today} disabled={archived} />
          <DateControl task={task} field="reviewDate" today={today} disabled={archived} />
        </div>
      </header>

      {!archived && (
        <div className="mt-5 flex flex-wrap gap-2">
          {completed ? (
            <>
              <Button variant={task.reviewDate ? "primary" : "secondary"} onClick={() => setFollowUpOpen(true)}>
                <MessageSquareText aria-hidden="true" className="size-4" />
                Registrar acompanhamento
              </Button>
              <Button onClick={() => reopenTask(task.id)}>
                <RotateCcw aria-hidden="true" className="size-4" />
                Reabrir
              </Button>
            </>
          ) : (
            <>
              <Button variant="primary" onClick={() => openProgress()}>
                Atualizar andamento
              </Button>
              {task.status === "todo" && (
                <Button onClick={() => setTaskStatus(task.id, "in_progress")}>
                  <Play aria-hidden="true" className="size-4" />
                  Iniciar
                </Button>
              )}
              {task.status === "blocked" && (
                <Button onClick={() => setTaskStatus(task.id, "in_progress")}>
                  <Play aria-hidden="true" className="size-4" />
                  Retomar
                </Button>
              )}
              {task.status !== "waiting" && (
                <Button onClick={markWaiting}>
                  <Hourglass aria-hidden="true" className="size-4" />
                  Aguardando
                </Button>
              )}
              <Button onClick={() => completeTask(task.id)}>
                <Check aria-hidden="true" className="size-4" />
                Concluir
              </Button>
            </>
          )}
        </div>
      )}

      <div className="mt-8 flex flex-col gap-7">
        {completed && task.reviewDate && (
          <DetailSection title="Acompanhamento">
            <button
              type="button"
              disabled={archived}
              onClick={() => setFollowUpOpen(true)}
              className={cn(
                "focus-ring flex flex-col items-start gap-1 rounded-card border-l-2 px-4 py-3 text-left transition-colors duration-120 enabled:hover:brightness-110 disabled:cursor-default",
                task.reviewDate <= today ? "border-status-waiting bg-status-waiting/10" : "border-primary bg-primary/8",
              )}
            >
              <span className="text-emph text-ink">
                {describeDate({ kind: "review", date: task.reviewDate, overdue: task.reviewDate < today }, today)}
              </span>
              <span className="text-label text-ink-muted">
                A entrega está concluída. Quando falar com o responsável, registre como foi aqui.
              </span>
            </button>
          </DetailSection>
        )}

        {/* Concluída sem próxima ação: nada a mostrar (o acompanhamento, se houver, fica acima). */}
        {(task.nextAction || !completed) && (
          <DetailSection title="Próxima ação">
            {task.nextAction ? (
              <p className="flex items-start gap-2.5 rounded-card border-l-2 border-primary bg-primary/8 px-4 py-3 text-emph text-ink">
                <ArrowRight aria-hidden="true" className="mt-1 size-4 shrink-0 text-primary" />
                <span className="break-words">{task.nextAction}</span>
              </p>
            ) : (
              <button
                type="button"
                disabled={archived}
                onClick={() => openProgress({ focus: "nextAction" })}
                className="focus-ring flex items-center gap-2.5 rounded-card border border-dashed border-line px-4 py-3 text-left text-compact text-ink-subtle transition-colors duration-120 enabled:hover:border-primary/50 enabled:hover:text-ink disabled:cursor-default"
              >
                <ArrowRight aria-hidden="true" className="size-4 shrink-0" />
                Qual é o próximo passo?
              </button>
            )}
          </DetailSection>
        )}

        {showWaiting && (
          <DetailSection title="Aguardando">
            <div className="rounded-card border-l-2 border-status-waiting bg-status-waiting/8 px-4 py-3">
              <p className="text-body text-ink">{task.waitingFor}</p>
              {task.reviewDate && (
                <p className="mt-1 text-label text-status-waiting">
                  {describeDate({ kind: "review", date: task.reviewDate, overdue: task.reviewDate < today }, today)}
                </p>
              )}
            </div>
          </DetailSection>
        )}

        {task.lastDone && (
          <DetailSection title="Último avanço">
            <p className="text-body break-words text-ink">{task.lastDone}</p>
          </DetailSection>
        )}

        {task.note && (
          <DetailSection title="Observação">
            <p className="text-compact break-words whitespace-pre-line text-ink-muted">{task.note}</p>
          </DetailSection>
        )}

        <DetailSection title="Subtarefas">
          <SubtaskList task={task} />
        </DetailSection>

        <DetailSection title="Histórico">
          <TaskTimeline task={task} />
        </DetailSection>
      </div>

      <ProgressUpdateDialog task={task} open={progressOpen} intent={progressIntent} onOpenChange={setProgressOpen} />
      <FollowUpDialog task={task} open={followUpOpen} onOpenChange={setFollowUpOpen} />
      <TaskEditDialog task={task} open={editOpen} onOpenChange={setEditOpen} />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Excluir tarefa?"
        description={
          progressCount > 0
            ? `"${task.title}" tem ${progressCount} ${progressCount === 1 ? "atualização" : "atualizações"} no histórico. A exclusão é permanente; se só quer tirá-la do caminho, arquive.`
            : `"${task.title}" será excluída permanentemente.`
        }
        confirmLabel="Excluir"
        onConfirm={() => {
          onDeleted();
          deleteTask(task.id);
          router.push(back.href);
        }}
      />
    </PageContainer>
  );
}
