"use client";

import { useState } from "react";

import { STATUS_COLOR } from "@/components/ui/tokens";
import { FOLLOW_UP_PRESET_ID } from "@/domain/progress-presets";
import { STATUS_LABELS, type Task, type TaskStatus, type TaskUpdate } from "@/domain/task";
import { formatFullDate, formatTimelineStamp } from "@/lib/dates";

const INITIAL_VISIBLE = 12;

function EntryBody({ update, previousStatus }: { update: TaskUpdate; previousStatus: TaskStatus }) {
  const statusChanged = update.status !== previousStatus;
  const isFollowUp = update.preset === FOLLOW_UP_PRESET_ID;
  const lines: Array<{ key: string; text: string; tone?: "waiting" | "muted" }> = [];

  if (update.type === "completed") lines.push({ key: "type", text: "Tarefa concluída." });
  if (update.type === "reopened") {
    lines.push({
      key: "type",
      text: update.status === "todo" ? "Tarefa reaberta." : `Tarefa reaberta em ${STATUS_LABELS[update.status]}.`,
    });
  }
  if (update.type === "status_change") {
    lines.push({ key: "type", text: `Status alterado para ${STATUS_LABELS[update.status]}.` });
  }
  if (update.done) lines.push({ key: "done", text: update.done });
  if (update.waitingFor) lines.push({ key: "waiting", text: `Aguardando: ${update.waitingFor}`, tone: "waiting" });
  if (update.nextAction) lines.push({ key: "next", text: `Próxima ação: ${update.nextAction}` });
  if (update.reviewDate) {
    const label = isFollowUp ? "Novo acompanhamento em" : "Revisar em";
    lines.push({ key: "review", text: `${label} ${formatFullDate(update.reviewDate)}`, tone: "muted" });
  }
  if (update.note) lines.push({ key: "note", text: update.note, tone: "muted" });

  const showStatusTag = update.type === "progress" && statusChanged;
  if (lines.length === 0 && !showStatusTag) {
    lines.push({ key: "empty", text: isFollowUp ? "Acompanhamento feito." : "Andamento registrado.", tone: "muted" });
  }

  return (
    <div className="flex flex-col gap-0.5 text-compact">
      {isFollowUp && <span className="text-meta font-medium text-primary">Acompanhamento</span>}
      {showStatusTag && (
        <span className="text-meta font-medium" style={{ color: STATUS_COLOR[update.status] }}>
          → {STATUS_LABELS[update.status]}
        </span>
      )}
      {lines.map((line) => (
        <p
          key={line.key}
          className={
            line.tone === "waiting" ? "text-status-waiting" : line.tone === "muted" ? "text-ink-muted" : "text-ink"
          }
        >
          {line.text}
        </p>
      ))}
    </div>
  );
}

/** Histórico imutável, do mais recente para o mais antigo (PRD §19). */
export function TaskTimeline({ task }: { task: Task }) {
  const [expanded, setExpanded] = useState(false);
  const chronological = task.updates;
  const newestFirst = [...chronological].reverse();
  const visible = expanded ? newestFirst : newestFirst.slice(0, INITIAL_VISIBLE);
  const hiddenCount = newestFirst.length - visible.length;

  const previousStatusOf = (update: TaskUpdate): TaskStatus => {
    const index = chronological.indexOf(update);
    return index > 0 ? chronological[index - 1].status : "todo";
  };

  return (
    <div>
      <ol className="relative flex flex-col gap-5 border-l border-line/80 pl-5">
        {visible.map((update) => (
          <li key={update.id} className="relative">
            <span
              aria-hidden="true"
              className="absolute top-1.5 -left-[25px] size-2 rounded-full ring-4 ring-canvas"
              style={{ backgroundColor: STATUS_COLOR[update.status] }}
            />
            <time dateTime={update.createdAt} className="mb-1 block font-mono text-meta text-ink-subtle">
              {formatTimelineStamp(update.createdAt)}
            </time>
            <EntryBody update={update} previousStatus={previousStatusOf(update)} />
          </li>
        ))}
        {hiddenCount === 0 && (
          <li className="relative">
            <span aria-hidden="true" className="absolute top-1.5 -left-[25px] size-2 rounded-full bg-line ring-4 ring-canvas" />
            <time dateTime={task.createdAt} className="mb-1 block font-mono text-meta text-ink-subtle">
              {formatTimelineStamp(task.createdAt)}
            </time>
            <p className="text-compact text-ink-muted">Tarefa criada.</p>
          </li>
        )}
      </ol>
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="focus-ring mt-4 ml-5 rounded-[6px] text-label font-medium text-primary hover:text-primary-hover"
        >
          Mostrar mais {hiddenCount} {hiddenCount === 1 ? "registro" : "registros"}
        </button>
      )}
    </div>
  );
}
