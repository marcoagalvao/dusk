"use client";

import { useId, useRef, useState, type FormEvent } from "react";

import { patchTask } from "@/actions/task-actions";
import { Button } from "@/components/ui/button";
import { DateField } from "@/components/ui/date-field";
import { Dialog, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/form-controls";
import { PRIORITY_LABELS, TASK_PRIORITIES, type Task, type TaskPriority } from "@/domain/task";
import { useToday } from "@/hooks/use-clock";
import { useActiveProjects, useProject } from "@/store/hooks";

import { TASK_TITLE_MAX_LENGTH } from "./quick-create-dialog";

interface TaskEditDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Edição direta de todos os campos. Status muda pelos controles do detalhe ou pelo andamento. */
export function TaskEditDialog({ task, open, onOpenChange }: TaskEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent placement="top" width="lg">
        <DialogHeader title="Editar tarefa" />
        <TaskEditForm task={task} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function TaskEditForm({ task, onDone }: { task: Task; onDone: () => void }) {
  const today = useToday();
  const activeProjects = useActiveProjects();
  const currentProject = useProject(task.projectId);
  const submittedRef = useRef(false);
  const id = useId();
  const [values, setValues] = useState({
    title: task.title,
    projectId: task.projectId ?? "",
    priority: task.priority,
    dueDate: task.dueDate ?? "",
    reviewDate: task.reviewDate ?? "",
    nextAction: task.nextAction ?? "",
    waitingFor: task.waitingFor ?? "",
    lastDone: task.lastDone ?? "",
    note: task.note ?? "",
  });

  // Um projeto arquivado continua selecionável para não perder a associação atual.
  const projectOptions =
    currentProject?.archivedAt ? [...activeProjects, currentProject] : activeProjects;

  const set = <K extends keyof typeof values>(key: K, value: (typeof values)[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  const canSave = values.title.trim().length > 0;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSave || submittedRef.current) return;
    submittedRef.current = true;
    patchTask(task.id, {
      title: values.title,
      projectId: values.projectId || null,
      priority: values.priority,
      dueDate: values.dueDate || null,
      reviewDate: values.reviewDate || null,
      nextAction: values.nextAction,
      waitingFor: values.waitingFor,
      lastDone: values.lastDone,
      note: values.note,
    });
    onDone();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field label="Título" htmlFor={`${id}-title`}>
        <Input
          id={`${id}-title`}
          value={values.title}
          onChange={(event) => set("title", event.target.value)}
          maxLength={TASK_TITLE_MAX_LENGTH}
          autoComplete="off"
          required
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Projeto" htmlFor={`${id}-project`}>
          <Select id={`${id}-project`} value={values.projectId} onChange={(event) => set("projectId", event.target.value)}>
            <option value="">Sem projeto</option>
            {projectOptions.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
                {project.archivedAt ? " (arquivado)" : ""}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Prioridade" htmlFor={`${id}-priority`}>
          <Select
            id={`${id}-priority`}
            value={values.priority}
            onChange={(event) => set("priority", event.target.value as TaskPriority)}
          >
            {TASK_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {PRIORITY_LABELS[priority]}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Prazo" htmlFor={`${id}-due`} hint="Quando precisa estar concluída.">
          <DateField id={`${id}-due`} value={values.dueDate} onChange={(value) => set("dueDate", value)} today={today} />
        </Field>
        <Field label="Revisar novamente" htmlFor={`${id}-review`} hint="Quando voltar a olhar.">
          <DateField
            id={`${id}-review`}
            value={values.reviewDate}
            onChange={(value) => set("reviewDate", value)}
            today={today}
            shortcuts="review"
          />
        </Field>
      </div>

      <Field label="Próxima ação" htmlFor={`${id}-next`}>
        <Input id={`${id}-next`} value={values.nextAction} onChange={(event) => set("nextAction", event.target.value)} autoComplete="off" />
      </Field>
      <Field label="Aguardando" htmlFor={`${id}-waiting`}>
        <Input id={`${id}-waiting`} value={values.waitingFor} onChange={(event) => set("waitingFor", event.target.value)} autoComplete="off" />
      </Field>
      <Field label="Último avanço" htmlFor={`${id}-done`}>
        <Input id={`${id}-done`} value={values.lastDone} onChange={(event) => set("lastDone", event.target.value)} autoComplete="off" />
      </Field>
      <Field label="Observação" htmlFor={`${id}-note`}>
        <Textarea id={`${id}-note`} value={values.note} onChange={(event) => set("note", event.target.value)} rows={3} />
      </Field>

      <DialogFooter>
        <Button variant="ghost" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" disabled={!canSave}>
          Salvar alterações
        </Button>
      </DialogFooter>
    </form>
  );
}
