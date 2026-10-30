"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  rectIntersection,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
  type KeyboardCoordinateGetter,
} from "@dnd-kit/core";
import { ArrowRight, GripVertical, Hourglass } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, type ReactNode, type SyntheticEvent } from "react";

import { setTaskStatus } from "@/actions/task-actions";
import { CompactPriority, ProjectLabel } from "@/components/ui/badges";
import { StatusGlyph } from "@/components/ui/status-glyph";
import { STATUS_COLOR } from "@/components/ui/tokens";
import type { Project } from "@/domain/project";
import { STATUS_LABELS, TASK_STATUSES, type Task, type TaskStatus } from "@/domain/task";
import { addDaysToKey, toDateKey } from "@/lib/dates";
import { cn } from "@/lib/utils/cn";
import { toast } from "@/store/ui-store";

import { ProgressUpdateDialog } from "./progress-update-dialog";
import { TaskDateLabel } from "./task-date";
import { CompactPriorityControl } from "./task-detail-controls";

/** A coluna Concluído mostra só o que terminou recentemente, para não crescer sem fim. */
export const KANBAN_COMPLETED_DAYS = 7;

interface KanbanBoardProps {
  tasks: readonly Task[];
  projectsById: ReadonlyMap<string, Project>;
  today: string;
}

const isStatus = (value: unknown): value is TaskStatus =>
  typeof value === "string" && (TASK_STATUSES as readonly string[]).includes(value);

/** Mouse: arraste direto. Fora do ponteiro (teclado), cai na interseção de retângulos. */
const collisionDetection: CollisionDetection = (args) => {
  const hits = pointerWithin(args);
  return hits.length > 0 ? hits : rectIntersection(args);
};

/** Setas ←/→ saltam de coluna em coluna durante o arraste por teclado. */
const columnCoordinates: KeyboardCoordinateGetter = (event, { context }) => {
  if (event.code !== "ArrowRight" && event.code !== "ArrowLeft") return undefined;
  event.preventDefault();
  const currentId = context.over?.id ?? (context.active?.data.current as { status?: TaskStatus } | undefined)?.status;
  const index = TASK_STATUSES.findIndex((status) => status === currentId);
  const nextIndex = Math.min(TASK_STATUSES.length - 1, Math.max(0, index + (event.code === "ArrowRight" ? 1 : -1)));
  const rect = context.droppableRects.get(TASK_STATUSES[nextIndex]);
  return rect ? { x: rect.left + rect.width / 2, y: rect.top + 40 } : undefined;
};

export function KanbanBoard({ tasks, projectsById, today }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [waitingTask, setWaitingTask] = useState<Task | null>(null);
  const justDraggedRef = useRef(false);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    // Atraso no toque para não confundir arraste com rolagem.
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: columnCoordinates }),
  );

  const columns = useMemo(() => {
    const recentLimit = addDaysToKey(today, -KANBAN_COMPLETED_DAYS);
    return TASK_STATUSES.map((status) => {
      let items = tasks.filter((task) => task.status === status);
      if (status === "completed") {
        items = items
          .filter((task) => task.completedAt && toDateKey(new Date(task.completedAt)) >= recentLimit)
          .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""));
      }
      return { status, tasks: items };
    });
  }, [tasks, today]);

  const taskById = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks]);
  const activeTask = activeId ? taskById.get(activeId) : undefined;

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(String(active.id));
    justDraggedRef.current = true;
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    // O clique que encerra o arraste não deve abrir a tarefa.
    setTimeout(() => (justDraggedRef.current = false), 0);

    const task = taskById.get(String(active.id));
    if (!task || !over || !isStatus(over.id) || over.id === task.status) return;

    // Em Aguardando sem `waitingFor`, um único toast já confirma e convida a registrar quem (PRD §21).
    const promptWaiting = over.id === "waiting" && !task.waitingFor;
    setTaskStatus(task.id, over.id, { silent: promptWaiting });
    if (promptWaiting) {
      toast.show("Movida para Aguardando.", {
        duration: 6000,
        action: { label: "Registrar quem", onAction: () => setWaitingTask(task) },
      });
    }
  };

  const announcements: Announcements = {
    onDragStart: ({ active }) => `Tarefa "${taskById.get(String(active.id))?.title}" selecionada. Use as setas para trocar de coluna.`,
    onDragOver: ({ over }) => (over && isStatus(over.id) ? `Sobre a coluna ${STATUS_LABELS[over.id]}.` : "Fora das colunas."),
    onDragEnd: ({ active, over }) =>
      over && isStatus(over.id)
        ? `Tarefa "${taskById.get(String(active.id))?.title}" movida para ${STATUS_LABELS[over.id]}.`
        : "Movimento cancelado.",
    onDragCancel: () => "Movimento cancelado.",
  };

  const hiddenCompleted = tasks.filter((task) => task.status === "completed").length - columns[4].tasks.length;

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => {
          setActiveId(null);
          justDraggedRef.current = false;
        }}
        accessibility={{
          announcements,
          screenReaderInstructions: {
            draggable:
              "Para mover uma tarefa, pressione Espaço ou Enter, use as setas para escolher a coluna e pressione Espaço ou Enter de novo. Esc cancela.",
          },
        }}
      >
        <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:snap-none lg:px-0">
          {columns.map((column) => (
            <KanbanColumn
              key={column.status}
              status={column.status}
              count={column.tasks.length}
              footer={
                column.status === "completed" && hiddenCompleted > 0 ? (
                  <p className="px-2 pt-1 text-meta text-ink-subtle">
                    Mais {hiddenCompleted} concluídas há mais de {KANBAN_COMPLETED_DAYS} dias estão na lista.
                  </p>
                ) : undefined
              }
            >
              {column.tasks.map((task) => (
                <KanbanCard
                  key={task.id}
                  task={task}
                  project={task.projectId ? projectsById.get(task.projectId) : undefined}
                  today={today}
                  justDraggedRef={justDraggedRef}
                />
              ))}
            </KanbanColumn>
          ))}
        </div>

        <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" }}>
          {activeTask && (
            <CardBody
              task={activeTask}
              project={activeTask.projectId ? projectsById.get(activeTask.projectId) : undefined}
              today={today}
              className="scale-[1.02] cursor-grabbing border-line bg-raised shadow-lift"
            />
          )}
        </DragOverlay>
      </DndContext>

      {waitingTask && (
        <ProgressUpdateDialog
          task={taskById.get(waitingTask.id) ?? waitingTask}
          open
          intent={{ status: "waiting", focus: "waitingFor" }}
          onOpenChange={(open) => !open && setWaitingTask(null)}
        />
      )}
    </>
  );
}

function KanbanColumn({
  status,
  count,
  children,
  footer,
}: {
  status: TaskStatus;
  count: number;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <section
      aria-label={`${STATUS_LABELS[status]}, ${count} ${count === 1 ? "tarefa" : "tarefas"}`}
      className="flex w-[82vw] max-w-[300px] shrink-0 snap-start flex-col sm:w-72 lg:w-auto lg:max-w-none lg:min-w-[200px] lg:flex-1"
    >
      <header className="mb-2 flex items-center gap-2 px-2">
        <StatusGlyph status={status} size={14} />
        <h2 className="text-label font-semibold text-ink">{STATUS_LABELS[status]}</h2>
        <span className="text-meta text-ink-subtle tabular-nums">{count}</span>
      </header>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-40 flex-1 flex-col gap-2 rounded-card border p-2 transition-colors duration-120",
          isOver ? "border-solid bg-surface" : "border-transparent bg-surface/40",
        )}
        style={isOver ? { borderColor: STATUS_COLOR[status] } : undefined}
      >
        {children}
        {count === 0 && (
          <p className="grid flex-1 place-items-center px-2 py-6 text-center text-meta text-ink-subtle">Solte uma tarefa aqui</p>
        )}
      </div>
      {footer}
    </section>
  );
}

interface CardBodyProps {
  task: Task;
  project?: Project;
  today: string;
  className?: string;
  /** No cartão real a prioridade é editável; na sombra do arraste, só leitura. */
  priority?: ReactNode;
}

function CardBody({ task, project, today, className, priority }: CardBodyProps) {
  const completed = task.status === "completed";
  return (
    <div className={cn("flex flex-col gap-1.5 rounded-[10px] border p-3 text-left", className)}>
      <span className={cn("text-compact font-medium leading-snug", completed ? "text-ink-subtle line-through" : "text-ink")}>
        {task.title}
      </span>
      {task.status === "waiting" && task.waitingFor && (
        <span className="flex items-start gap-1.5 text-meta text-status-waiting">
          <Hourglass aria-hidden="true" className="mt-0.5 size-3 shrink-0" />
          <span className="sr-only">Aguardando:</span>
          {task.waitingFor}
        </span>
      )}
      <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-meta text-ink-muted">
        {project && <ProjectLabel project={project} className="max-w-32" />}
        {priority ?? <CompactPriority priority={task.priority} />}
        {!completed && <TaskDateLabel task={task} today={today} />}
      </span>
      {task.nextAction && !completed && (
        <span className="flex min-w-0 items-center gap-1.5 text-meta text-ink-muted">
          <ArrowRight aria-hidden="true" className="size-3 shrink-0 text-primary" />
          <span className="truncate">{task.nextAction}</span>
        </span>
      )}
    </div>
  );
}

const stopPropagation = (event: SyntheticEvent) => event.stopPropagation();

function KanbanCard({
  task,
  project,
  today,
  justDraggedRef,
}: CardBodyProps & { justDraggedRef: React.RefObject<boolean> }) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id, data: { status: task.status } });

  return (
    <div
      ref={setNodeRef}
      className={cn("focus-ring group relative touch-manipulation rounded-[10px]", isDragging && "opacity-35")}
      onClick={() => {
        if (!justDraggedRef.current) router.push(`/tasks/${task.id}`);
      }}
      {...listeners}
      {...attributes}
      aria-roledescription="tarefa arrastável"
      aria-label={`${task.title}. ${STATUS_LABELS[task.status]}.`}
    >
      <CardBody
        task={task}
        project={project}
        today={today}
        className="cursor-grab border-line/70 bg-surface transition-colors duration-120 group-hover:border-line group-hover:bg-raised"
        priority={
          // O menu abre em portal, mas seus eventos ainda sobem pela árvore do React até o cartão.
          <span onClick={stopPropagation} onMouseDown={stopPropagation} onTouchStart={stopPropagation} onKeyDown={stopPropagation}>
            <CompactPriorityControl task={task} />
          </span>
        }
      />
      <GripVertical aria-hidden="true" className="absolute top-3 right-2 size-3.5 text-ink-subtle opacity-0 transition-opacity duration-120 group-hover:opacity-100" />
      <Link
        href={`/tasks/${task.id}`}
        onClick={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        onTouchStart={(event) => event.stopPropagation()}
        className="focus-ring absolute right-2 bottom-2 rounded-[6px] px-1.5 py-0.5 text-meta text-ink-subtle opacity-0 group-focus-within:opacity-100 focus-visible:opacity-100"
      >
        Abrir
      </Link>
    </div>
  );
}
