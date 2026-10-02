"use client";

import { useState } from "react";

import { completeTask, reopenTask } from "@/actions/task-actions";
import { StatusGlyph } from "@/components/ui/status-glyph";
import { STATUS_LABELS, type Task } from "@/domain/task";
import { cn } from "@/lib/utils/cn";

/** Tempo da animação ○ → ✓ antes de a tarefa sair das listas ativas. */
const COMPLETE_ANIMATION_MS = 420;

interface TaskCheckboxProps {
  task: Task;
  onCompletingChange?: (completing: boolean) => void;
  size?: "md" | "lg";
  className?: string;
}

/**
 * Glifo de status que também conclui a tarefa em um clique (PRD §31).
 * A conclusão é registrada depois da animação; o timer não é cancelado ao
 * desmontar para a ação nunca se perder se o usuário navegar no meio dela
 * (setState em componente desmontado é ignorado pelo React).
 */
export function TaskCheckbox({ task, onCompletingChange, size = "md", className }: TaskCheckboxProps) {
  const [completing, setCompleting] = useState(false);
  const [hovered, setHovered] = useState(false);
  const completed = task.status === "completed";

  const handleClick = () => {
    if (completing) return;
    if (completed) {
      reopenTask(task.id);
      return;
    }
    setCompleting(true);
    onCompletingChange?.(true);
    setTimeout(() => {
      completeTask(task.id);
      // A linha pode continuar montada (foco de hoje, filtro "Todas", desfazer):
      // o estado transitório precisa voltar ao normal.
      setCompleting(false);
      onCompletingChange?.(false);
    }, COMPLETE_ANIMATION_MS);
  };

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={completed || completing}
      aria-label={completed ? `Reabrir "${task.title}"` : `Concluir "${task.title}"`}
      title={completed ? "Reabrir" : `${STATUS_LABELS[task.status]} · clique para concluir`}
      onClick={handleClick}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      className={cn(
        "focus-ring relative z-10 grid shrink-0 place-items-center rounded-full transition-transform duration-120 active:scale-90",
        size === "lg" ? "size-11" : "size-10",
        className,
      )}
    >
      <StatusGlyph
        status={task.status}
        size={size === "lg" ? 22 : 18}
        animateCheck={completing}
        previewCheck={hovered && !completed && !completing}
      />
    </button>
  );
}
