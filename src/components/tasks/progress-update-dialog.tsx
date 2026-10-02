"use client";

import { useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";

import { saveProgress } from "@/actions/task-actions";
import { Button } from "@/components/ui/button";
import { DateField } from "@/components/ui/date-field";
import { Dialog, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/form-controls";
import { Kbd } from "@/components/ui/misc";
import {
  PROGRESS_PRESETS,
  applyPreset,
  type ProgressFocusField,
  type ProgressFormValues,
} from "@/domain/progress-presets";
import { STATUS_LABELS, STATUSES_WITH_WAITING, TASK_STATUSES, type Task, type TaskStatus } from "@/domain/task";
import { hasProgressChanges } from "@/domain/task-rules";
import { useToday } from "@/hooks/use-clock";
import { cn } from "@/lib/utils/cn";

export interface ProgressDialogIntent {
  status?: TaskStatus;
  focus?: ProgressFocusField;
}

interface ProgressUpdateDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Abertura contextual, ex.: "Marcar como aguardando" já seleciona o status e foca o campo. */
  intent?: ProgressDialogIntent;
}

export function ProgressUpdateDialog({ task, open, onOpenChange, intent }: ProgressUpdateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent placement="top" width="lg" onOpenAutoFocus={(event) => event.preventDefault()}>
        <DialogHeader title="Atualizar andamento" description={task.title} />
        <ProgressForm task={task} intent={intent} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function initialValues(task: Task, intent?: ProgressDialogIntent): ProgressFormValues {
  return {
    status: intent?.status ?? task.status,
    done: "",
    waitingFor: task.waitingFor ?? "",
    nextAction: task.nextAction ?? "",
    reviewDate: task.reviewDate ?? "",
    note: "",
  };
}

function ProgressForm({ task, intent, onDone }: { task: Task; intent?: ProgressDialogIntent; onDone: () => void }) {
  const today = useToday();
  const ids = {
    status: useId(),
    done: useId(),
    waitingFor: useId(),
    nextAction: useId(),
    reviewDate: useId(),
    note: useId(),
  };
  const [values, setValues] = useState(() => initialValues(task, intent));
  const submittedRef = useRef(false);

  const showWaiting = STATUSES_WITH_WAITING.includes(values.status);
  const isWaiting = values.status === "waiting";
  const canSave = hasProgressChanges(task, values);

  const set = <K extends keyof ProgressFormValues>(key: K, value: ProgressFormValues[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  const focusField = (field: ProgressFocusField | undefined) => {
    if (!field) return;
    // Espera o campo existir (ex.: "Aguardando" só aparece com o status certo).
    requestAnimationFrame(() => {
      const element = document.getElementById(ids[field]);
      if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) return;
      element.focus();
      if (element.type !== "date") element.select();
    });
  };

  const initialFocus: ProgressFocusField = intent?.focus ?? "done";

  const handleSubmit = (event?: FormEvent) => {
    event?.preventDefault();
    if (!canSave || submittedRef.current) return;
    submittedRef.current = true;
    saveProgress(task.id, {
      ...values,
      // Campo oculto mantém o valor atual em vez de apagá-lo silenciosamente.
      waitingFor: showWaiting ? values.waitingFor : task.waitingFor,
    });
    onDone();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) handleSubmit();
  };

  return (
    <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="flex flex-col gap-4">
      <div role="group" aria-label="Atalhos de atualização" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:flex-wrap sm:px-0">
        {PROGRESS_PRESETS.map((preset) => {
          const active = values.preset === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setValues((current) => applyPreset(current, preset));
                focusField(preset.focus);
              }}
              className={cn(
                "focus-ring h-8 shrink-0 rounded-full border px-3 text-label transition-colors duration-120",
                active
                  ? "border-primary/70 bg-primary/15 text-ink"
                  : "border-line text-ink-muted hover:border-ink-subtle hover:text-ink",
              )}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      <Field label="Status" htmlFor={ids.status}>
        <Select id={ids.status} value={values.status} onChange={(event) => set("status", event.target.value as TaskStatus)}>
          {TASK_STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="O que foi feito?" htmlFor={ids.done}>
        <Textarea
          id={ids.done}
          value={values.done}
          onChange={(event) => set("done", event.target.value)}
          placeholder={task.lastDone ? `Último avanço: ${task.lastDone}` : "Ex.: Primeira versão concluída."}
          rows={2}
          autoFocus={initialFocus === "done"}
        />
      </Field>

      {showWaiting && (
        <Field
          label={isWaiting ? "Aguardando" : "Bloqueado por"}
          htmlFor={ids.waitingFor}
          emphasized={isWaiting && !values.waitingFor}
          hint={isWaiting && !values.waitingFor ? "Quem ou o quê? Ajuda a saber quem cobrar depois." : undefined}
        >
          <Input
            id={ids.waitingFor}
            value={values.waitingFor}
            onChange={(event) => set("waitingFor", event.target.value)}
            placeholder={isWaiting ? "Ex.: Pedro enviar as informações" : "Ex.: Acesso ao servidor"}
            autoComplete="off"
            autoFocus={initialFocus === "waitingFor"}
          />
        </Field>
      )}

      <Field label="Próxima ação" htmlFor={ids.nextAction}>
        <Input
          id={ids.nextAction}
          value={values.nextAction}
          onChange={(event) => set("nextAction", event.target.value)}
          placeholder="Ex.: Aplicar conteúdo e preparar V2"
          autoComplete="off"
          autoFocus={initialFocus === "nextAction"}
        />
      </Field>

      <Field
        label="Revisar novamente"
        htmlFor={ids.reviewDate}
        emphasized={isWaiting && !values.reviewDate}
        hint={isWaiting && !values.reviewDate ? "Quando voltar a olhar se não houver resposta?" : undefined}
      >
        <DateField
          id={ids.reviewDate}
          value={values.reviewDate}
          onChange={(value) => set("reviewDate", value)}
          today={today}
          shortcuts="review"
          autoFocus={initialFocus === "reviewDate"}
        />
      </Field>

      <Field label="Observação adicional" htmlFor={ids.note} hint="Opcional. Fica registrada no histórico.">
        <Textarea
          id={ids.note}
          value={values.note}
          onChange={(event) => set("note", event.target.value)}
          rows={2}
        />
      </Field>

      <DialogFooter>
        <span className="mr-auto hidden items-center gap-1 text-meta text-ink-subtle sm:flex">
          <Kbd>Ctrl</Kbd>+<Kbd>Enter</Kbd> salva
        </span>
        <Button variant="ghost" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" disabled={!canSave}>
          Salvar atualização
        </Button>
      </DialogFooter>
    </form>
  );
}
