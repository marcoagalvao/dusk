"use client";

import { useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";

import { saveProgress } from "@/actions/task-actions";
import { Button } from "@/components/ui/button";
import { DateField } from "@/components/ui/date-field";
import { Dialog, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Field, Textarea } from "@/components/ui/form-controls";
import { FOLLOW_UP_PRESET_ID } from "@/domain/progress-presets";
import type { Task } from "@/domain/task";
import { hasProgressChanges, type ProgressInput } from "@/domain/task-rules";
import { useToday } from "@/hooks/use-clock";
import { formatRelativeDay } from "@/lib/dates";

interface FollowUpDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Resolver o lembrete de uma tarefa concluída: registra no histórico como foi
 * (ex.: "cliente testou e está tudo ok") sem reabrir a tarefa. Por padrão
 * encerra o lembrete; preencher a data marca um novo.
 */
export function FollowUpDialog({ task, open, onOpenChange }: FollowUpDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent placement="top">
        <DialogHeader title={task.reviewDate ? "Resolver lembrete" : "Anotar depois da entrega"} description={task.title} />
        <FollowUpForm task={task} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function FollowUpForm({ task, onDone }: { task: Task; onDone: () => void }) {
  const today = useToday();
  const doneId = useId();
  const reviewId = useId();
  const [done, setDone] = useState("");
  const [reviewDate, setReviewDate] = useState("");
  const submittedRef = useRef(false);

  const input: ProgressInput = {
    status: task.status,
    preset: FOLLOW_UP_PRESET_ID,
    done,
    reviewDate,
    // Campos fora deste fluxo permanecem como estão.
    waitingFor: task.waitingFor,
    nextAction: task.nextAction,
  };
  const canSave = hasProgressChanges(task, input);

  const handleSubmit = (event?: FormEvent) => {
    event?.preventDefault();
    if (!canSave || submittedRef.current) return;
    submittedRef.current = true;
    saveProgress(task.id, input, reviewDate ? "Registrado. Novo lembrete marcado." : "Registrado");
    onDone();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) handleSubmit();
  };

  return (
    <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="flex flex-col gap-4">
      <Field label="Como foi?" htmlFor={doneId}>
        <Textarea
          id={doneId}
          value={done}
          onChange={(event) => setDone(event.target.value)}
          placeholder="Ex.: Cliente testou e está tudo ok."
          rows={3}
          autoFocus
        />
      </Field>

      <Field
        label="Lembrar de novo em"
        htmlFor={reviewId}
        hint={
          task.reviewDate && !reviewDate
            ? `Vazio encerra o lembrete de ${formatRelativeDay(task.reviewDate, today).toLowerCase()}.`
            : "Opcional, se precisar voltar a olhar."
        }
      >
        <DateField id={reviewId} value={reviewDate} onChange={setReviewDate} today={today} shortcuts="review" />
      </Field>

      <DialogFooter>
        <Button variant="ghost" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" disabled={!canSave}>
          Salvar
        </Button>
      </DialogFooter>
    </form>
  );
}
