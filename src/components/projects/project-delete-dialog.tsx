"use client";

import { useId, useState } from "react";

import { archiveProject, deleteProject } from "@/actions/project-actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Select } from "@/components/ui/form-controls";
import type { Project } from "@/domain/project";
import { countTasksOfProject } from "@/domain/task-queries";
import { cn } from "@/lib/utils/cn";
import { pluralize } from "@/lib/utils/text";
import { useProjects, useTasks } from "@/store/hooks";

type Choice = "archive" | "move" | "detach";

interface ProjectDeleteDialogProps {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

/**
 * Exclusão de projeto sem cascade (PRD §33): com tarefas associadas, o usuário
 * escolhe arquivar, mover as tarefas ou remover a associação antes de excluir.
 */
export function ProjectDeleteDialog({ project, open, onOpenChange, onDeleted }: ProjectDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent placement="bottom" width="md">
        <DialogHeader title={`Excluir "${project.name}"?`} />
        <DeleteForm project={project} onDone={() => onOpenChange(false)} onDeleted={onDeleted} />
      </DialogContent>
    </Dialog>
  );
}

function DeleteForm({ project, onDone, onDeleted }: { project: Project; onDone: () => void; onDeleted?: () => void }) {
  const tasks = useTasks();
  const projects = useProjects();
  const selectId = useId();
  const taskCount = countTasksOfProject(project.id, tasks);
  const targets = projects.filter((p) => p.id !== project.id && !p.archivedAt);
  const alreadyArchived = Boolean(project.archivedAt);
  const [choice, setChoice] = useState<Choice>(alreadyArchived ? "detach" : "archive");
  const [targetId, setTargetId] = useState(targets[0]?.id ?? "");

  const confirm = () => {
    if (taskCount > 0 && choice === "archive") {
      archiveProject(project.id);
      onDone();
      return;
    }
    const strategy =
      taskCount === 0
        ? undefined
        : choice === "move"
          ? ({ kind: "move", targetProjectId: targetId } as const)
          : ({ kind: "detach" } as const);
    onDeleted?.();
    if (deleteProject(project.id, strategy)) onDone();
  };

  if (taskCount === 0) {
    return (
      <>
        <p className="text-compact text-ink-muted">O projeto não tem tarefas. A exclusão é permanente.</p>
        <DialogFooter>
          <Button variant="ghost" onClick={onDone}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={confirm}>
            Excluir projeto
          </Button>
        </DialogFooter>
      </>
    );
  }

  const allOptions: Array<{ value: Choice; title: string; description: string; disabled?: boolean }> = [
    {
      value: "archive",
      title: "Arquivar o projeto",
      description: "Sai da navegação e do fluxo normal. Tarefas e histórico ficam guardados.",
    },
    {
      value: "move",
      title: "Mover as tarefas e excluir",
      description: targets.length ? "As tarefas passam para outro projeto." : "Não há outro projeto ativo para receber as tarefas.",
      disabled: targets.length === 0,
    },
    {
      value: "detach",
      title: "Remover a associação e excluir",
      description: "As tarefas continuam existindo, sem projeto.",
    },
  ];
  const options = alreadyArchived ? allOptions.filter((option) => option.value !== "archive") : allOptions;

  return (
    <>
      <p className="text-compact text-ink-muted">
        {pluralize(taskCount, "tarefa está associada", "tarefas estão associadas")} a este projeto. Escolha o que fazer com{" "}
        {taskCount === 1 ? "ela" : "elas"}:
      </p>
      <div role="radiogroup" aria-label="O que fazer com as tarefas" className="mt-4 flex flex-col gap-2">
        {options.map((option) => {
          const selected = choice === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={option.disabled}
              onClick={() => setChoice(option.value)}
              className={cn(
                "focus-ring flex items-start gap-3 rounded-card border px-3.5 py-3 text-left transition-colors duration-120 disabled:opacity-45",
                selected ? "border-primary/70 bg-primary/8" : "border-line hover:border-ink-subtle",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border",
                  selected ? "border-primary" : "border-ink-subtle",
                )}
              >
                {selected && <span className="size-2 rounded-full bg-primary" />}
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-compact font-medium text-ink">{option.title}</span>
                <span className="text-label text-ink-muted">{option.description}</span>
              </span>
            </button>
          );
        })}
      </div>

      {choice === "move" && targets.length > 0 && (
        <div className="mt-3 flex flex-col gap-1.5">
          <label htmlFor={selectId} className="text-label font-medium text-ink-muted">
            Mover para
          </label>
          <Select id={selectId} value={targetId} onChange={(event) => setTargetId(event.target.value)}>
            {targets.map((target) => (
              <option key={target.id} value={target.id}>
                {target.name}
              </option>
            ))}
          </Select>
        </div>
      )}

      <DialogFooter>
        <Button variant="ghost" onClick={onDone}>
          Cancelar
        </Button>
        <Button variant={choice === "archive" ? "primary" : "danger"} onClick={confirm} disabled={choice === "move" && !targetId}>
          {choice === "archive" ? "Arquivar projeto" : "Excluir projeto"}
        </Button>
      </DialogFooter>
    </>
  );
}
