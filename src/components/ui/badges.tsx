import { Flag } from "lucide-react";

import type { Project } from "@/domain/project";
import { PRIORITY_LABELS, STATUS_LABELS, type TaskPriority, type TaskStatus } from "@/domain/task";
import { cn } from "@/lib/utils/cn";

import { StatusGlyph } from "./status-glyph";
import { PRIORITY_COLOR, PROJECT_COLOR, STATUS_COLOR, tint } from "./tokens";

const PILL = "inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-meta font-medium";

export function StatusBadge({ status, className }: { status: TaskStatus; className?: string }) {
  return (
    <span
      className={cn(PILL, className)}
      style={{ color: STATUS_COLOR[status], backgroundColor: tint(STATUS_COLOR[status]) }}
    >
      <StatusGlyph status={status} size={12} />
      {STATUS_LABELS[status]}
    </span>
  );
}

export function PriorityBadge({ priority, className }: { priority: TaskPriority; className?: string }) {
  return (
    <span
      className={cn(PILL, className)}
      style={{ color: PRIORITY_COLOR[priority], backgroundColor: tint(PRIORITY_COLOR[priority], 12) }}
    >
      <Flag className="size-3" aria-hidden="true" />
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

/** Mostra prioridade só quando ela importa numa lista compacta (Alta/Urgente, PRD §53). */
export function CompactPriority({ priority }: { priority: TaskPriority }) {
  if (priority !== "urgent" && priority !== "high") return null;
  return (
    <span className="inline-flex items-center gap-1 font-medium" style={{ color: PRIORITY_COLOR[priority] }}>
      <Flag className="size-3" aria-hidden="true" />
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

export function ProjectDot({ project, size = 8 }: { project: Pick<Project, "color">; size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="inline-block shrink-0 rounded-full"
      style={{ width: size, height: size, backgroundColor: PROJECT_COLOR[project.color] }}
    />
  );
}

export function ProjectLabel({ project, className }: { project: Pick<Project, "color" | "name">; className?: string }) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-1.5", className)}>
      <ProjectDot project={project} />
      <span className="truncate">{project.name}</span>
    </span>
  );
}
