"use client";

import type { Project } from "@/domain/project";
import type { Task } from "@/domain/task";
import { DATE_GROUP_LABELS, groupByDate } from "@/domain/task-queries";

import { TaskRow } from "./task-row";

interface TaskListProps {
  tasks: readonly Task[];
  projectsById: ReadonlyMap<string, Project>;
  today: string;
  grouped?: boolean;
  showProject?: boolean;
  label?: string;
}

function Rows({ tasks, projectsById, today, showProject, label }: Omit<TaskListProps, "grouped">) {
  return (
    <ul aria-label={label} className="flex flex-col gap-px">
      {tasks.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          project={task.projectId ? projectsById.get(task.projectId) : undefined}
          today={today}
          showProject={showProject}
        />
      ))}
    </ul>
  );
}

/** Lista de tarefas, opcionalmente agrupada em Hoje / Próximas / Sem data (PRD §26). */
export function TaskList({ tasks, projectsById, today, grouped = false, showProject = true, label }: TaskListProps) {
  if (!grouped) {
    return <Rows tasks={tasks} projectsById={projectsById} today={today} showProject={showProject} label={label} />;
  }

  return (
    <div className="flex flex-col gap-7">
      {groupByDate(tasks, today).map(({ group, tasks: groupTasks }) => (
        <section key={group} aria-labelledby={`group-${group}`}>
          <h2 id={`group-${group}`} className="mb-1 flex items-baseline gap-2 pl-3 text-label font-semibold text-ink-muted">
            {DATE_GROUP_LABELS[group]}
            <span className="text-meta font-normal text-ink-subtle tabular-nums">{groupTasks.length}</span>
          </h2>
          <Rows
            tasks={groupTasks}
            projectsById={projectsById}
            today={today}
            showProject={showProject}
            label={DATE_GROUP_LABELS[group]}
          />
        </section>
      ))}
    </div>
  );
}
