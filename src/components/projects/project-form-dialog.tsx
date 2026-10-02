"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent, type ReactNode } from "react";

import { createProject, updateProject } from "@/actions/project-actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTrigger } from "@/components/ui/dialog";
import { Field, Input, Textarea } from "@/components/ui/form-controls";
import { PROJECT_COLOR } from "@/components/ui/tokens";
import {
  PROJECT_COLORS,
  PROJECT_COLOR_LABELS,
  PROJECT_NAME_MAX_LENGTH,
  type Project,
  type ProjectColor,
} from "@/domain/project";
import { suggestProjectColor } from "@/domain/project-rules";
import { cn } from "@/lib/utils/cn";
import { useProjects } from "@/store/hooks";

interface ProjectFormDialogProps {
  project?: Project;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Após criar, navega para a página do projeto. */
  navigateOnCreate?: boolean;
}

export function ProjectFormDialog({ project, trigger, open, onOpenChange, navigateOnCreate }: ProjectFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent placement="top">
        <DialogHeader title={project ? "Editar projeto" : "Novo projeto"} />
        <ProjectForm project={project} onDone={() => setOpen(false)} navigateOnCreate={navigateOnCreate} />
      </DialogContent>
    </Dialog>
  );
}

function ProjectForm({
  project,
  onDone,
  navigateOnCreate,
}: {
  project?: Project;
  onDone: () => void;
  navigateOnCreate?: boolean;
}) {
  const router = useRouter();
  const nameId = useId();
  const descriptionId = useId();
  const [name, setName] = useState(project?.name ?? "");
  const projects = useProjects();
  const [color, setColor] = useState<ProjectColor>(() => project?.color ?? suggestProjectColor(projects));
  const [description, setDescription] = useState(project?.description ?? "");
  const canSave = name.trim().length > 0;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSave) return;
    const input = { name, color, description };
    if (project) {
      updateProject(project.id, input);
    } else {
      const created = createProject(input);
      if (navigateOnCreate) router.push(`/projects/${created.id}`);
    }
    onDone();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field label="Nome" htmlFor={nameId}>
        <Input
          id={nameId}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ex.: Integradas"
          maxLength={PROJECT_NAME_MAX_LENGTH}
          autoComplete="off"
          autoFocus
          required
        />
      </Field>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-label font-medium text-ink-muted">Cor</legend>
        <div role="radiogroup" aria-label="Cor do projeto" className="flex flex-wrap gap-2">
          {PROJECT_COLORS.map((option) => {
            const selected = option === color;
            return (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={PROJECT_COLOR_LABELS[option]}
                title={PROJECT_COLOR_LABELS[option]}
                onClick={() => setColor(option)}
                className={cn(
                  "focus-ring grid size-10 place-items-center rounded-full border-2 transition-[border-color,transform] duration-120 hover:scale-105",
                  selected ? "border-ink" : "border-transparent",
                )}
              >
                <span className="grid size-7 place-items-center rounded-full" style={{ backgroundColor: PROJECT_COLOR[option] }}>
                  {selected && <Check aria-hidden="true" className="size-4 text-canvas" />}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <Field label="Descrição" htmlFor={descriptionId} hint="Opcional.">
        <Textarea
          id={descriptionId}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Do que se trata este projeto?"
          rows={2}
          maxLength={280}
        />
      </Field>

      <DialogFooter>
        <Button variant="ghost" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" disabled={!canSave}>
          {project ? "Salvar projeto" : "Criar projeto"}
        </Button>
      </DialogFooter>
    </form>
  );
}
