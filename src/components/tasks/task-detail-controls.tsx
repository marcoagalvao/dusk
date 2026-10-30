"use client";

import { CalendarClock, CalendarDays, ChevronDown, FolderOpen } from "lucide-react";
import { useId, useState, type ReactNode } from "react";

import { patchTask, setTaskStatus } from "@/actions/task-actions";
import { CompactPriority, PriorityBadge, ProjectLabel, StatusBadge } from "@/components/ui/badges";
import { DateField } from "@/components/ui/date-field";
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
import { StatusGlyph } from "@/components/ui/status-glyph";
import { ProjectDot } from "@/components/ui/badges";
import { PRIORITY_COLOR } from "@/components/ui/tokens";
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  TASK_PRIORITIES,
  TASK_STATUSES,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from "@/domain/task";
import { formatRelativeDay } from "@/lib/dates";
import { cn } from "@/lib/utils/cn";
import { useActiveProjects, useProject } from "@/store/hooks";

const CHIP_TRIGGER =
  "focus-ring inline-flex items-center gap-1 rounded-full transition-[filter,opacity] duration-120 hover:brightness-110 disabled:pointer-events-none";

interface StatusControlProps {
  task: Task;
  disabled?: boolean;
  /** Mudar para Aguardando abre o andamento para incentivar `waitingFor` e revisão (PRD §21). */
  onRequestWaiting: () => void;
}

export function StatusControl({ task, disabled, onRequestWaiting }: StatusControlProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={CHIP_TRIGGER} disabled={disabled} aria-label={`Status: ${STATUS_LABELS[task.status]}. Alterar status`}>
        <StatusBadge status={task.status} />
        {!disabled && <ChevronDown aria-hidden="true" className="size-3 text-ink-subtle" />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Status</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={task.status}
          onValueChange={(value) => {
            const status = value as TaskStatus;
            if (status === "waiting") onRequestWaiting();
            else setTaskStatus(task.id, status);
          }}
        >
          {TASK_STATUSES.map((status) => (
            <DropdownMenuRadioItem key={status} value={status}>
              <StatusGlyph status={status} size={14} />
              {STATUS_LABELS[status]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PriorityMenuContent({ task }: { task: Task }) {
  return (
    <DropdownMenuContent align="start">
      <DropdownMenuLabel>Prioridade</DropdownMenuLabel>
      <DropdownMenuRadioGroup
        value={task.priority}
        onValueChange={(value) =>
          patchTask(task.id, { priority: value as TaskPriority }, `Prioridade ${PRIORITY_LABELS[value as TaskPriority].toLowerCase()}`)
        }
      >
        {TASK_PRIORITIES.map((priority) => (
          <DropdownMenuRadioItem key={priority} value={priority}>
            <span aria-hidden="true" className="size-2 rounded-full" style={{ backgroundColor: PRIORITY_COLOR[priority] }} />
            {PRIORITY_LABELS[priority]}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  );
}

/** Versão de linha e card: muda a prioridade sem abrir a tarefa. Fica acima do link esticado da linha. */
export function CompactPriorityControl({ task, disabled }: { task: Task; disabled?: boolean }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        title={disabled ? undefined : "Alterar prioridade"}
        aria-label={`Prioridade: ${PRIORITY_LABELS[task.priority]}. Alterar prioridade de "${task.title}"`}
        className="focus-ring relative z-10 -mx-1 -my-1.5 inline-flex h-8 cursor-pointer items-center gap-0.5 rounded-[6px] px-1 transition-colors duration-120 hover:bg-raised disabled:pointer-events-none sm:-my-1 sm:h-7"
      >
        <CompactPriority priority={task.priority} />
        {!disabled && <ChevronDown aria-hidden="true" className="size-3 text-ink-subtle" />}
      </DropdownMenuTrigger>
      <PriorityMenuContent task={task} />
    </DropdownMenu>
  );
}

export function PriorityControl({ task, disabled }: { task: Task; disabled?: boolean }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={CHIP_TRIGGER} disabled={disabled} aria-label={`Prioridade: ${PRIORITY_LABELS[task.priority]}. Alterar prioridade`}>
        <span className="text-label text-ink-muted">Prioridade</span>
        <PriorityBadge priority={task.priority} />
        {!disabled && <ChevronDown aria-hidden="true" className="size-3 text-ink-subtle" />}
      </DropdownMenuTrigger>
      <PriorityMenuContent task={task} />
    </DropdownMenu>
  );
}

interface DateControlProps {
  task: Task;
  field: "dueDate" | "reviewDate";
  today: string;
  disabled?: boolean;
}

const DATE_CONTROL = {
  dueDate: { label: "Prazo", empty: "Definir prazo", icon: CalendarDays },
  reviewDate: { label: "Revisar", empty: "Revisar em…", icon: CalendarClock },
} as const;

/** Chip de data editável no lugar (prazo e revisão são independentes, PRD §14). */
export function DateControl({ task, field, today, disabled }: DateControlProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const value = task[field];
  const config = DATE_CONTROL[field];
  const isOpenTask = task.status !== "completed";
  // Prazo pede atenção quando vence (só em tarefa aberta); revisão, quando chega
  // o dia, mesmo em tarefa concluída (acompanhamento pós-entrega).
  const needsAttention =
    Boolean(value) && (field === "dueDate" ? isOpenTask && value! < today : value! <= today);
  const Icon = config.icon;

  const tone = !value
    ? "border border-dashed border-line text-ink-subtle"
    : needsAttention
      ? field === "dueDate"
        ? "bg-status-blocked/14 text-status-blocked"
        : "bg-status-waiting/14 text-status-waiting"
      : "bg-raised text-ink-muted";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        className={cn(CHIP_TRIGGER, "h-6 px-2.5 text-meta font-medium", tone)}
        aria-label={value ? `${config.label}: ${formatRelativeDay(value, today)}. Alterar` : config.empty}
      >
        <Icon aria-hidden="true" className="size-3" />
        {value ? `${config.label} ${formatRelativeDay(value, today).toLowerCase()}` : config.empty}
      </PopoverTrigger>
      <PopoverContent className="w-72">
        <label htmlFor={id} className="mb-2 block text-label font-medium text-ink-muted">
          {field === "dueDate" ? "Prazo" : "Revisar novamente"}
        </label>
        <DateField
          id={id}
          value={value ?? ""}
          today={today}
          shortcuts={field === "dueDate" ? "due" : "review"}
          // Sem toast: o chip atrás do popover já mostra a nova data.
          onChange={(next) => patchTask(task.id, { [field]: next || null }, "")}
        />
      </PopoverContent>
    </Popover>
  );
}

export function ProjectControl({ task, disabled }: { task: Task; disabled?: boolean }) {
  const project = useProject(task.projectId);
  const projects = useActiveProjects();

  let label: ReactNode = (
    <span className="inline-flex items-center gap-1.5 text-ink-subtle">
      <FolderOpen aria-hidden="true" className="size-3.5" />
      Sem projeto
    </span>
  );
  if (project) label = <ProjectLabel project={project} className="text-ink-muted" />;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        className="focus-ring inline-flex h-8 max-w-full items-center gap-1 rounded-[8px] px-1.5 text-label transition-colors duration-120 hover:bg-raised disabled:pointer-events-none"
        aria-label={project ? `Projeto: ${project.name}. Alterar projeto` : "Definir projeto"}
      >
        {label}
        <ChevronDown aria-hidden="true" className="size-3.5 text-ink-subtle" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-80 overflow-y-auto">
        <DropdownMenuLabel>Projeto</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={task.projectId ?? ""}
          onValueChange={(value) => patchTask(task.id, { projectId: value || null }, "Projeto atualizado")}
        >
          <DropdownMenuRadioItem value="">
            <FolderOpen />
            Sem projeto
          </DropdownMenuRadioItem>
          {projects.map((option) => (
            <DropdownMenuRadioItem key={option.id} value={option.id}>
              <ProjectDot project={option} />
              {option.name}
            </DropdownMenuRadioItem>
          ))}
          {project?.archivedAt && (
            <DropdownMenuRadioItem value={project.id}>
              <ProjectDot project={project} />
              {project.name} (arquivado)
            </DropdownMenuRadioItem>
          )}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
