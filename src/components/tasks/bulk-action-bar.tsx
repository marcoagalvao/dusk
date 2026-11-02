"use client";

import { Archive, Check, FolderOpen, Sun, X } from "lucide-react";

import { archiveTasks, completeTasks, focusTasks, patchTasks } from "@/actions/task-actions";
import { ProjectDot } from "@/components/ui/badges";
import { Button, IconButton } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/menu";
import { PRIORITY_COLOR } from "@/components/ui/tokens";
import { PRIORITY_LABELS, TASK_PRIORITIES } from "@/domain/task";
import { pluralize } from "@/lib/utils/text";
import { useActiveProjects } from "@/store/hooks";

interface BulkActionBarProps {
  selectedIds: readonly string[];
  selectableCount: number;
  today: string;
  onSelectAll: () => void;
  onCancel: () => void;
  onDone: () => void;
}

/** Fica colada na base da tela durante a rolagem, acima da navegação do celular. */
export function BulkActionBar({ selectedIds, selectableCount, today, onSelectAll, onCancel, onDone }: BulkActionBarProps) {
  const projects = useActiveProjects();
  const count = selectedIds.length;
  const empty = count === 0;
  const countLabel = pluralize(count, "tarefa", "tarefas");

  const run = (action: () => void) => {
    action();
    onDone();
  };

  return (
    <div
      role="toolbar"
      aria-label="Ações para as tarefas selecionadas"
      className="sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 mt-4 flex flex-col gap-2 rounded-card border border-line bg-raised p-3 shadow-float lg:bottom-4"
    >
      <div className="flex items-center gap-3">
        <span aria-live="polite" className="text-compact font-medium text-ink">
          {pluralize(count, "selecionada", "selecionadas")}
        </span>
        {count < selectableCount && (
          <button type="button" onClick={onSelectAll} className="focus-ring rounded-[6px] text-label text-ink-muted underline underline-offset-2 hover:text-ink">
            Selecionar todas
          </button>
        )}
        <IconButton label="Cancelar seleção" icon={<X className="size-4" />} size="sm" onClick={onCancel} className="ml-auto" />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="primary" disabled={empty} onClick={() => run(() => completeTasks(selectedIds))}>
          <Check aria-hidden="true" className="size-4" />
          Concluir
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" disabled={empty}>
              Prioridade
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Prioridade</DropdownMenuLabel>
            {TASK_PRIORITIES.map((priority) => (
              <DropdownMenuItem
                key={priority}
                onSelect={() => run(() => patchTasks(selectedIds, { priority }, `${countLabel}: prioridade ${PRIORITY_LABELS[priority].toLowerCase()}.`))}
              >
                <span aria-hidden="true" className="size-2 rounded-full" style={{ backgroundColor: PRIORITY_COLOR[priority] }} />
                {PRIORITY_LABELS[priority]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" disabled={empty}>
              Projeto
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-80 overflow-y-auto">
            <DropdownMenuLabel>Mover para</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => run(() => patchTasks(selectedIds, { projectId: null }, `${countLabel} sem projeto.`))}>
              <FolderOpen />
              Sem projeto
            </DropdownMenuItem>
            {projects.map((project) => (
              <DropdownMenuItem key={project.id} onSelect={() => run(() => patchTasks(selectedIds, { projectId: project.id }, `${countLabel} em ${project.name}.`))}>
                <ProjectDot project={project} />
                {project.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button size="sm" disabled={empty} onClick={() => run(() => focusTasks(selectedIds, today))}>
          <Sun aria-hidden="true" className="size-4" />
          Foco de hoje
        </Button>
        <Button size="sm" disabled={empty} onClick={() => run(() => archiveTasks(selectedIds))}>
          <Archive aria-hidden="true" className="size-4" />
          Arquivar
        </Button>
      </div>
    </div>
  );
}
