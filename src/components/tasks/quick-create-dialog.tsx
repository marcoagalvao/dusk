"use client";

import { CornerDownLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useId, useRef, useState, type FormEvent } from "react";

import { createTask } from "@/actions/task-actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/form-controls";
import { PRIORITY_LABELS, TASK_PRIORITIES, type TaskPriority } from "@/domain/task";
import { useToday } from "@/hooks/use-clock";
import { useActiveProjects } from "@/store/hooks";
import { useUiStore, type QuickCreateDefaults } from "@/store/ui-store";

export const TASK_TITLE_MAX_LENGTH = 200;

/** Criação rápida (PRD §15): só o título é obrigatório; Enter cria, Esc fecha. O resto é opcional e já alimenta o painel. */
export function QuickCreateDialog() {
  const { open, defaults } = useUiStore((state) => state.quickCreate);
  const close = useUiStore((state) => state.closeQuickCreate);
  const titleRef = useRef<HTMLInputElement>(null);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent
        placement="top"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          titleRef.current?.focus();
        }}
      >
        <DialogHeader title="Nova tarefa" />
        <QuickCreateForm defaults={defaults} titleRef={titleRef} onDone={close} />
      </DialogContent>
    </Dialog>
  );
}

function QuickCreateForm({
  defaults,
  titleRef,
  onDone,
}: {
  defaults: QuickCreateDefaults;
  titleRef: React.RefObject<HTMLInputElement | null>;
  onDone: () => void;
}) {
  const router = useRouter();
  const titleId = useId();
  const projectId = useId();
  const dueId = useId();
  const priorityId = useId();
  const reviewId = useId();
  const pathname = usePathname();
  const today = useToday();
  const projects = useActiveProjects();
  const [title, setTitle] = useState("");
  // Só aceita o projeto sugerido se ele estiver entre as opções visíveis.
  const [project, setProject] = useState(() =>
    defaults.projectId && projects.some((p) => p.id === defaults.projectId) ? defaults.projectId : "",
  );
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("normal");
  const [reviewDate, setReviewDate] = useState("");
  // Quem cria a partir da vista Hoje espera ver a tarefa lá.
  const [inFocus, setInFocus] = useState(pathname === "/tasks/today");
  const canCreate = title.trim().length > 0;
  // O conteúdo continua montado durante a animação de saída; isso impede que
  // um Enter repetido nesse intervalo crie a tarefa duas vezes.
  const submittedRef = useRef(false);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (submittedRef.current) return;
    if (!canCreate) {
      titleRef.current?.focus();
      return;
    }
    submittedRef.current = true;
    titleRef.current?.blur();
    const task = createTask({
      title,
      projectId: project || undefined,
      priority,
      dueDate: dueDate || undefined,
      reviewDate: reviewDate || undefined,
      focusDate: inFocus ? today : undefined,
    });
    onDone();
    // Abre a tarefa recém-criada para completar o contexto; o "voltar" do
    // detalhe leva de volta à tela onde a criação começou.
    router.push(`/tasks/${task.id}`);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label htmlFor={titleId} className="sr-only">
        Título da tarefa
      </label>
      <input
        ref={titleRef}
        id={titleId}
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="O que precisa ser feito?"
        maxLength={TASK_TITLE_MAX_LENGTH}
        autoComplete="off"
        enterKeyHint="done"
        className="h-12 w-full rounded-control border border-line bg-canvas/60 px-3.5 text-emph text-ink transition-[border-color,box-shadow] duration-120 focus:border-primary focus:ring-3 focus:ring-primary/20 focus:outline-none"
      />

      <div className="grid grid-cols-2 gap-3">
        <Field label="Projeto" htmlFor={projectId}>
          <Select id={projectId} value={project} onChange={(event) => setProject(event.target.value)}>
            <option value="">Sem projeto</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Prioridade" htmlFor={priorityId}>
          <Select id={priorityId} value={priority} onChange={(event) => setPriority(event.target.value as TaskPriority)}>
            {TASK_PRIORITIES.map((value) => (
              <option key={value} value={value}>
                {PRIORITY_LABELS[value]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Prazo" htmlFor={dueId}>
          <Input id={dueId} type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
        </Field>
        <Field label="Revisar em" htmlFor={reviewId}>
          <Input id={reviewId} type="date" value={reviewDate} onChange={(event) => setReviewDate(event.target.value)} />
        </Field>
      </div>

      <label className="flex min-h-6 cursor-pointer items-center gap-2 text-compact text-ink-muted">
        <input
          type="checkbox"
          checked={inFocus}
          onChange={(event) => setInFocus(event.target.checked)}
          className="size-4 accent-primary"
        />
        Colocar no foco de hoje
      </label>

      <DialogFooter>
        <Button variant="ghost" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" disabled={!canCreate}>
          Criar
          <CornerDownLeft aria-hidden="true" className="size-3.5 opacity-70" />
        </Button>
      </DialogFooter>
    </form>
  );
}
