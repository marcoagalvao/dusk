"use client";

import { Check, Plus, X } from "lucide-react";
import { useId, useRef, useState, type KeyboardEvent } from "react";

import { ProgressBar } from "@/components/ui/misc";
import type { Subtask, Task } from "@/domain/task";
import { subtaskProgress } from "@/domain/task-rules";
import { cn } from "@/lib/utils/cn";
import { useAppStore } from "@/store/app-store";

const SUBTASK_MAX_LENGTH = 160;

export function SubtaskList({ task }: { task: Task }) {
  const addSubtask = useAppStore((state) => state.addSubtask);
  const inputId = useId();
  const [draft, setDraft] = useState("");
  const progress = subtaskProgress(task);
  const readOnly = Boolean(task.archivedAt);

  const handleAdd = () => {
    if (!draft.trim()) return;
    addSubtask(task.id, draft);
    setDraft("");
  };

  return (
    <div className="flex flex-col gap-2">
      {progress.total > 0 && (
        <div className="flex items-center gap-3">
          <ProgressBar percent={progress.percent} className="flex-1" />
          <span className="text-meta text-ink-muted tabular-nums">
            {progress.done} / {progress.total} · {progress.percent}%
          </span>
        </div>
      )}

      {task.subtasks.length > 0 && (
        <ul className="flex flex-col">
          {task.subtasks.map((subtask) => (
            <SubtaskItem key={subtask.id} taskId={task.id} subtask={subtask} readOnly={readOnly} />
          ))}
        </ul>
      )}

      {!readOnly && (
        <div className="flex items-center gap-2 rounded-control pl-2.5 focus-within:bg-surface">
          <Plus aria-hidden="true" className="size-4 shrink-0 text-ink-subtle" />
          <label htmlFor={inputId} className="sr-only">
            Nova subtarefa
          </label>
          <input
            id={inputId}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleAdd();
              }
            }}
            placeholder="Adicionar subtarefa"
            maxLength={SUBTASK_MAX_LENGTH}
            enterKeyHint="enter"
            className="h-10 min-w-0 flex-1 bg-transparent text-emph text-ink focus:outline-none sm:text-compact"
          />
          {draft.trim() && (
            <button
              type="button"
              onClick={handleAdd}
              className="focus-ring h-8 shrink-0 rounded-[8px] px-2.5 text-label font-medium text-primary hover:bg-raised"
            >
              Adicionar
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function SubtaskItem({ taskId, subtask, readOnly }: { taskId: string; subtask: Subtask; readOnly: boolean }) {
  const toggleSubtask = useAppStore((state) => state.toggleSubtask);
  const renameSubtask = useAppStore((state) => state.renameSubtask);
  const removeSubtask = useAppStore((state) => state.removeSubtask);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(subtask.title);
  // Esc cancela; um blur disparado ao desmontar o campo não deve salvar o rascunho.
  const cancelledRef = useRef(false);

  const startEditing = () => {
    cancelledRef.current = false;
    setDraft(subtask.title);
    setEditing(true);
  };

  const commit = () => {
    if (!cancelledRef.current) renameSubtask(taskId, subtask.id, draft);
    setEditing(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") commit();
    if (event.key === "Escape") {
      event.stopPropagation();
      cancelledRef.current = true;
      setEditing(false);
    }
  };

  return (
    <li className="group flex min-h-10 items-center gap-2.5 rounded-control px-1.5 hover:bg-surface/70">
      <button
        type="button"
        role="checkbox"
        aria-checked={subtask.completed}
        aria-label={`${subtask.completed ? "Desmarcar" : "Concluir"} "${subtask.title}"`}
        disabled={readOnly}
        onClick={() => toggleSubtask(taskId, subtask.id)}
        className={cn(
          "focus-ring grid size-[18px] shrink-0 place-items-center rounded-[5px] border transition-colors duration-120",
          subtask.completed ? "border-status-completed bg-status-completed text-canvas" : "border-ink-subtle hover:border-ink-muted",
        )}
      >
        {subtask.completed && <Check aria-hidden="true" className="size-3.5" strokeWidth={2.5} />}
      </button>

      {editing ? (
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          aria-label="Editar subtarefa"
          maxLength={SUBTASK_MAX_LENGTH}
          autoFocus
          className="h-8 min-w-0 flex-1 rounded-[6px] bg-raised px-2 text-emph text-ink focus:outline-none sm:text-compact"
        />
      ) : (
        <button
          type="button"
          disabled={readOnly}
          onClick={startEditing}
          title="Clique para editar"
          className={cn(
            "focus-ring min-w-0 flex-1 cursor-text rounded-[6px] py-1.5 text-left text-compact disabled:cursor-default",
            subtask.completed ? "text-ink-subtle line-through" : "text-ink",
          )}
        >
          {subtask.title}
        </button>
      )}

      {!readOnly && !editing && (
        <button
          type="button"
          aria-label={`Remover "${subtask.title}"`}
          onClick={() => removeSubtask(taskId, subtask.id)}
          className="focus-ring grid size-8 shrink-0 place-items-center rounded-[8px] text-ink-subtle opacity-0 transition-opacity duration-120 group-hover:opacity-100 hover:bg-raised hover:text-ink focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
        >
          <X className="size-4" />
        </button>
      )}
    </li>
  );
}
