"use client";

import {
  Archive,
  House,
  ListTodo,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Settings,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, type ReactNode } from "react";

import { ProjectDot } from "@/components/ui/badges";
import { IconButton } from "@/components/ui/button";
import { Kbd } from "@/components/ui/misc";
import { matchesScope, recentProjects } from "@/domain/task-queries";
import { useToday } from "@/hooks/use-clock";
import { cn } from "@/lib/utils/cn";
import { useAppStore } from "@/store/app-store";
import { useProjects, useSettings, useTasks } from "@/store/hooks";
import { useUiStore } from "@/store/ui-store";

import { SIDEBAR_PROJECT_LIMIT, TASK_VIEW_NAV, isActivePath } from "./navigation";
import { ProjectFormDialog } from "../projects/project-form-dialog";

interface NavLinkProps {
  href: string;
  label: string;
  icon?: LucideIcon;
  leading?: ReactNode;
  active: boolean;
  collapsed: boolean;
  count?: number;
  countTone?: "default" | "alert";
  nested?: boolean;
}

function NavLink({ href, label, icon: Icon, leading, active, collapsed, count, countTone = "default", nested }: NavLinkProps) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      title={collapsed ? label : undefined}
      className={cn(
        "focus-ring group relative flex h-9 items-center gap-2.5 rounded-control text-compact transition-colors duration-120",
        collapsed ? "justify-center px-0" : nested ? "pr-2.5 pl-8" : "px-2.5",
        active ? "bg-raised text-ink" : "text-ink-muted hover:bg-raised/60 hover:text-ink",
      )}
    >
      {active && !collapsed && <span aria-hidden="true" className="absolute top-2 bottom-2 left-0 w-0.5 rounded-full bg-primary" />}
      {Icon && <Icon aria-hidden="true" className={cn("size-4 shrink-0", active ? "text-primary" : "text-ink-subtle group-hover:text-ink-muted")} />}
      {leading}
      {collapsed ? <span className="sr-only">{label}</span> : <span className="min-w-0 flex-1 truncate">{label}</span>}
      {!collapsed && count !== undefined && count > 0 && (
        <span className={cn("text-meta tabular-nums", countTone === "alert" ? "text-status-blocked" : "text-ink-subtle")}>
          {count}
        </span>
      )}
    </Link>
  );
}

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const today = useToday();
  const tasks = useTasks();
  const projects = useProjects();
  const { sidebarCollapsed: collapsed } = useSettings();
  const updateSettings = useAppStore((state) => state.updateSettings);
  const openQuickCreate = useUiStore((state) => state.openQuickCreate);
  const hydrated = useUiStore((state) => state.hydrated);

  const counts = useMemo(() => {
    const result: Record<string, number> = {};
    for (const item of TASK_VIEW_NAV) {
      result[item.scope] = tasks.filter((task) => matchesScope(task, item.scope, today)).length;
    }
    return result;
  }, [tasks, today]);

  const recent = useMemo(() => recentProjects(projects, tasks, SIDEBAR_PROJECT_LIMIT), [projects, tasks]);
  const activeProjectCount = projects.filter((project) => !project.archivedAt).length;

  return (
    <aside
      aria-label="Navegação principal"
      className={cn(
        "sticky top-0 h-dvh shrink-0 flex-col border-r border-line/70 bg-surface transition-[width] duration-220",
        collapsed ? "w-16" : "w-[248px]",
        className,
      )}
    >
      <div className={cn("flex h-16 items-center", collapsed ? "justify-center" : "justify-between pr-2 pl-5")}>
        {!collapsed && (
          <Link href="/" className="focus-ring rounded-[6px] text-[19px] font-semibold tracking-[-0.03em] text-ink">
            Dusk
          </Link>
        )}
        <IconButton
          label={collapsed ? "Expandir menu" : "Recolher menu"}
          icon={collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          size="sm"
          onClick={() => updateSettings({ sidebarCollapsed: !collapsed })}
        />
      </div>

      <div className={cn("pb-3", collapsed ? "px-3" : "px-3")}>
        <button
          type="button"
          onClick={() => openQuickCreate()}
          title={collapsed ? "Nova tarefa (N)" : undefined}
          className={cn(
            "focus-ring flex h-10 w-full items-center gap-2 rounded-control bg-primary font-medium text-on-primary transition-colors duration-120 hover:bg-primary-hover",
            collapsed ? "justify-center" : "px-3 text-compact",
          )}
        >
          <Plus aria-hidden="true" className="size-4" />
          {collapsed ? <span className="sr-only">Nova tarefa</span> : <span className="flex-1 text-left">Nova tarefa</span>}
          {!collapsed && <Kbd className="text-on-primary/80">N</Kbd>}
        </button>
      </div>

      <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-3 pb-3">
        <NavLink href="/" label="Visão geral" icon={House} active={pathname === "/"} collapsed={collapsed} />
        <NavLink
          href="/tasks"
          label="Tarefas"
          icon={ListTodo}
          active={pathname === "/tasks"}
          collapsed={collapsed}
        />
        {!collapsed &&
          TASK_VIEW_NAV.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              active={isActivePath(pathname, item.href, true)}
              collapsed={collapsed}
              count={hydrated ? counts[item.scope] : undefined}
              countTone={item.scope === "overdue" ? "alert" : "default"}
              nested
            />
          ))}

        <div className={cn("mt-4 mb-1 flex items-center justify-between", collapsed ? "justify-center" : "pr-1 pl-2.5")}>
          {!collapsed ? (
            <Link
              href="/projects"
              className={cn(
                "focus-ring rounded-[6px] text-meta font-medium transition-colors duration-120 hover:text-ink",
                pathname === "/projects" ? "text-ink" : "text-ink-subtle",
              )}
            >
              Projetos
            </Link>
          ) : (
            <span aria-hidden="true" className="h-px w-6 bg-line" />
          )}
          {!collapsed && hydrated && (
            <ProjectFormDialog
              trigger={<IconButton label="Novo projeto" icon={<Plus className="size-3.5" />} size="sm" />}
            />
          )}
        </div>

        {collapsed && (
          <NavLink href="/projects" label="Projetos" leading={<ProjectsMark />} active={pathname === "/projects"} collapsed />
        )}

        {recent.map(({ project, stats }) => (
          <NavLink
            key={project.id}
            href={`/projects/${project.id}`}
            label={project.name}
            leading={<ProjectDot project={project} />}
            active={isActivePath(pathname, `/projects/${project.id}`)}
            collapsed={collapsed}
            count={stats.open}
          />
        ))}

        {!collapsed && hydrated && activeProjectCount > recent.length && (
          <Link href="/projects" className="focus-ring rounded-[6px] px-2.5 py-1.5 text-label text-ink-subtle hover:text-ink">
            Ver todos os projetos
          </Link>
        )}
        {!collapsed && hydrated && activeProjectCount === 0 && (
          <ProjectFormDialog
            trigger={
              <button
                type="button"
                className="focus-ring flex h-9 items-center gap-2.5 rounded-control px-2.5 text-compact text-ink-subtle transition-colors duration-120 hover:bg-raised/60 hover:text-ink"
              >
                <Plus aria-hidden="true" className="size-4" />
                Novo projeto
              </button>
            }
          />
        )}

        <div className="mt-4">
          <NavLink href="/archive" label="Arquivo" icon={Archive} active={pathname === "/archive"} collapsed={collapsed} />
        </div>
      </nav>

      <div className="border-t border-line/70 px-3 py-3">
        <NavLink href="/settings" label="Configurações" icon={Settings} active={pathname === "/settings"} collapsed={collapsed} />
      </div>
    </aside>
  );
}

function ProjectsMark() {
  return (
    <span aria-hidden="true" className="grid grid-cols-2 gap-0.5">
      <ProjectDot project={{ color: "lavender" }} size={5} />
      <ProjectDot project={{ color: "peach" }} size={5} />
      <ProjectDot project={{ color: "sage" }} size={5} />
      <ProjectDot project={{ color: "periwinkle" }} size={5} />
    </span>
  );
}
