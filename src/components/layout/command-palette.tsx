"use client";

import { ArrowRight, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { ProjectDot } from "@/components/ui/badges";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { StatusGlyph } from "@/components/ui/status-glyph";
import { searchTasks } from "@/domain/task-queries";
import { cn } from "@/lib/utils/cn";
import { normalizeForSearch } from "@/lib/utils/text";
import { useProjectMap, useProjects, useTasks } from "@/store/hooks";
import { useUiStore } from "@/store/ui-store";

import { COMMAND_NAV, TASK_VIEW_NAV } from "./navigation";

const TASK_RESULTS = 8;
const PROJECT_RESULTS = 4;

interface Item {
  id: string;
  group: string;
  label: string;
  hint?: string;
  icon: ReactNode;
  run: () => void;
}

/** Ctrl+K: procurar tarefas e projetos ou ir direto para qualquer tela. */
export function CommandPalette() {
  const open = useUiStore((state) => state.commandOpen);
  const setOpen = useUiStore((state) => state.setCommandOpen);

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        setOpen(!useUiStore.getState().commandOpen);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setOpen]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent placement="top" width="lg" hideClose>
        <div className="sr-only">
          <DialogHeader title="Buscar" description="Procure tarefas e projetos ou vá para uma tela." />
        </div>
        <PaletteBody onClose={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function PaletteBody({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const tasks = useTasks();
  const projects = useProjects();
  const projectsById = useProjectMap();
  const openQuickCreate = useUiStore((state) => state.openQuickCreate);
  const listId = useId();
  const listRef = useRef<HTMLUListElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const items = useMemo<Item[]>(() => {
    const go = (href: string) => () => router.push(href);
    const normalized = normalizeForSearch(query);

    const taskItems: Item[] = searchTasks(tasks, query, projectsById)
      .slice(0, TASK_RESULTS)
      .map((task) => ({
        id: `task-${task.id}`,
        group: "Tarefas",
        label: task.title,
        hint: task.projectId ? projectsById.get(task.projectId)?.name : undefined,
        icon: <StatusGlyph status={task.status} size={14} />,
        run: go(`/tasks/${task.id}`),
      }));

    const projectItems: Item[] = !normalized
      ? []
      : projects
          .filter((project) => normalizeForSearch(project.name).includes(normalized))
          .slice(0, PROJECT_RESULTS)
          .map((project) => ({
            id: `project-${project.id}`,
            group: "Projetos",
            label: project.name,
            hint: project.archivedAt ? "No arquivo" : undefined,
            icon: <ProjectDot project={project} />,
            run: go(`/projects/${project.id}`),
          }));

    const commands: Item[] = [
      {
        id: "new-task",
        group: "Ir para",
        label: "Nova tarefa",
        icon: <ArrowRight aria-hidden="true" className="size-3.5" />,
        run: () => openQuickCreate(),
      },
      ...[...TASK_VIEW_NAV, ...COMMAND_NAV].map((item) => ({
        id: item.href,
        group: "Ir para",
        label: item.label,
        icon: <item.icon aria-hidden="true" className="size-3.5" />,
        run: go(item.href),
      })),
    ].filter((item) => !normalized || normalizeForSearch(item.label).includes(normalized));

    return [...taskItems, ...projectItems, ...commands];
  }, [query, tasks, projects, projectsById, router, openQuickCreate]);

  const safeActive = Math.min(active, Math.max(items.length - 1, 0));

  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
  }, [safeActive]);

  const run = (item: Item) => {
    onClose();
    item.run();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (items.length === 0) return;
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActive((safeActive + step + items.length) % items.length);
    } else if (event.key === "Enter" && items[safeActive]) {
      event.preventDefault();
      run(items[safeActive]);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-subtle" />
        <input
          autoFocus
          role="combobox"
          aria-expanded
          aria-controls={listId}
          aria-activedescendant={items[safeActive] ? `${listId}-${items[safeActive].id}` : undefined}
          aria-label="Buscar tarefas, projetos e telas"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Buscar tarefas, projetos e telas"
          autoComplete="off"
          className="h-12 w-full rounded-control border border-line bg-canvas/60 pr-3.5 pl-10 text-emph text-ink transition-[border-color,box-shadow] duration-120 focus:border-primary focus:ring-3 focus:ring-primary/20 focus:outline-none"
        />
      </div>

      {items.length === 0 ? (
        <p className="px-1 py-6 text-center text-compact text-ink-muted">Nada encontrado.</p>
      ) : (
        <ul ref={listRef} id={listId} role="listbox" aria-label="Resultados" className="flex max-h-[50dvh] flex-col overflow-y-auto">
          {items.map((item, index) => (
            <li key={item.id} role="presentation">
              {(index === 0 || items[index - 1].group !== item.group) && (
                <p role="presentation" className="px-2.5 pt-2 pb-1 text-meta font-medium text-ink-subtle">
                  {item.group}
                </p>
              )}
              <button
                type="button"
                id={`${listId}-${item.id}`}
                role="option"
                aria-selected={index === safeActive}
                tabIndex={-1}
                onMouseMove={() => setActive(index)}
                onClick={() => run(item)}
                className={cn(
                  "flex min-h-10 w-full items-center gap-2.5 rounded-control px-2.5 py-1.5 text-left text-compact text-ink",
                  index === safeActive && "bg-raised",
                )}
              >
                <span className="grid size-4 shrink-0 place-items-center text-ink-muted">{item.icon}</span>
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {item.hint && <span className="max-w-32 shrink-0 truncate text-meta text-ink-subtle">{item.hint}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
