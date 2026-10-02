import type { TaskStatus } from "@/domain/task";
import { cn } from "@/lib/utils/cn";

import { STATUS_COLOR } from "./tokens";

interface StatusGlyphProps {
  status: TaskStatus;
  size?: number;
  className?: string;
  /** Mostra a prévia do check (hover sobre o botão de concluir). */
  previewCheck?: boolean;
  /** Desenha o check com animação (momento da conclusão). */
  animateCheck?: boolean;
}

/**
 * Cada status tem uma forma própria, não só uma cor (PRD §61):
 * A fazer = anel · Em andamento = meio preenchido · Aguardando = anel tracejado
 * Bloqueado = anel cortado · Concluído = disco com check.
 */
export function StatusGlyph({ status, size = 18, className, previewCheck, animateCheck }: StatusGlyphProps) {
  const color = STATUS_COLOR[status];
  const showCheck = status === "completed" || animateCheck;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
      className={cn("shrink-0", className)}
      style={{ color: showCheck ? STATUS_COLOR.completed : color }}
    >
      {showCheck ? (
        <>
          <circle cx="9" cy="9" r="8" fill="currentColor" />
          <path
            d="M5.5 9.2 7.8 11.4 12.5 6.6"
            stroke="var(--color-canvas)"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="16"
            className={animateCheck ? "animate-check" : undefined}
            style={animateCheck ? { strokeDashoffset: 16 } : undefined}
          />
        </>
      ) : (
        <>
          <circle
            cx="9"
            cy="9"
            r="7.25"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray={status === "waiting" ? "2.6 2.2" : undefined}
          />
          {status === "in_progress" && <path d="M9 4a5 5 0 0 1 0 10Z" fill="currentColor" />}
          {status === "blocked" && (
            <path d="M5.6 12.4 12.4 5.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          )}
          {previewCheck && (
            <path
              d="M5.8 9.2 7.9 11.2 12.2 6.8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.7"
            />
          )}
        </>
      )}
    </svg>
  );
}
