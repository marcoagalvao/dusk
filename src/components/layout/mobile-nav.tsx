"use client";

import { Archive, ChevronRight, Ellipsis, FolderKanban, House, ListTodo, Plus, Settings, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { matchesScope } from "@/domain/task-queries";
import { useToday } from "@/hooks/use-clock";
import { cn } from "@/lib/utils/cn";
import { useTasks } from "@/store/hooks";
import { useUiStore } from "@/store/ui-store";

import { TASK_VIEW_NAV, isActivePath } from "./navigation";

function TabLink({ href, label, icon: Icon, active }: { href: string; label: string; icon: LucideIcon; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "focus-ring flex h-full flex-1 flex-col items-center justify-center gap-1 rounded-control text-[11px] font-medium transition-colors duration-120",
        active ? "text-primary" : "text-ink-subtle active:text-ink",
      )}
    >
      <Icon aria-hidden="true" className="size-5" />
      {label}
    </Link>
  );
}

export function MobileNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const openQuickCreate = useUiStore((state) => state.openQuickCreate);
  const [moreOpen, setMoreOpen] = useState(false);

  const moreActive =
    TASK_VIEW_NAV.some((item) => isActivePath(pathname, item.href, true)) ||
    pathname === "/archive" ||
    pathname === "/settings";

  return (
    <>
      <nav
        aria-label="Navegação principal"
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 border-t border-line/70 bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md",
          className,
        )}
      >
        <div className="mx-auto flex h-16 max-w-lg items-stretch px-2">
          <TabLink href="/" label="Início" icon={House} active={pathname === "/"} />
          <TabLink
            href="/tasks"
            label="Tarefas"
            icon={ListTodo}
            active={pathname === "/tasks" || /^\/tasks\/(?!today|upcoming|waiting|overdue)/.test(pathname)}
          />
          <div className="flex flex-1 items-center justify-center">
            <button
              type="button"
              aria-label="Nova tarefa"
              onClick={() => openQuickCreate()}
              className="focus-ring grid size-12 place-items-center rounded-full bg-primary text-on-primary shadow-float transition-transform duration-120 active:scale-95"
            >
              <Plus aria-hidden="true" className="size-6" />
            </button>
          </div>
          <TabLink href="/projects" label="Projetos" icon={FolderKanban} active={isActivePath(pathname, "/projects")} />
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-haspopup="dialog"
            className={cn(
              "focus-ring flex h-full flex-1 flex-col items-center justify-center gap-1 rounded-control text-[11px] font-medium transition-colors duration-120",
              moreActive ? "text-primary" : "text-ink-subtle",
            )}
          >
            <Ellipsis aria-hidden="true" className="size-5" />
            Mais
          </button>
        </div>
      </nav>

      <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
        <DialogContent placement="bottom" width="sm">
          <DialogHeader title="Mais" />
          <MoreMenu pathname={pathname} onNavigate={() => setMoreOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}

function MoreMenu({ pathname, onNavigate }: { pathname: string; onNavigate: () => void }) {
  const tasks = useTasks();
  const today = useToday();
  const counts = useMemo(
    () => Object.fromEntries(TASK_VIEW_NAV.map((item) => [item.scope, tasks.filter((t) => matchesScope(t, item.scope, today)).length])),
    [tasks, today],
  );

  const rows: Array<{ href: string; label: string; icon: LucideIcon; count?: number; alert?: boolean }> = [
    ...TASK_VIEW_NAV.map((item) => ({
      href: item.href,
      label: item.label,
      icon: item.icon,
      count: counts[item.scope],
      alert: item.scope === "overdue",
    })),
    { href: "/archive", label: "Arquivo", icon: Archive },
    { href: "/settings", label: "Configurações", icon: Settings },
  ];

  return (
    <ul className="-mx-1 flex flex-col">
      {rows.map((row, index) => (
        <li key={row.href} className={cn(index === TASK_VIEW_NAV.length && "mt-2 border-t border-line/60 pt-2")}>
          <Link
            href={row.href}
            onClick={onNavigate}
            aria-current={pathname === row.href ? "page" : undefined}
            className={cn(
              "focus-ring flex h-12 items-center gap-3 rounded-control px-3 text-body transition-colors duration-120 active:bg-raised",
              pathname === row.href ? "bg-raised text-ink" : "text-ink",
            )}
          >
            <row.icon aria-hidden="true" className="size-5 text-ink-subtle" />
            <span className="flex-1">{row.label}</span>
            {row.count !== undefined && row.count > 0 && (
              <span className={cn("text-compact tabular-nums", row.alert ? "text-status-blocked" : "text-ink-subtle")}>
                {row.count}
              </span>
            )}
            <ChevronRight aria-hidden="true" className="size-4 text-ink-subtle" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
