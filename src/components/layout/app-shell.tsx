"use client";

import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { QuickCreateDialog } from "@/components/tasks/quick-create-dialog";
import { Toaster } from "@/components/ui/toaster";
import { useHotkey } from "@/hooks/use-hotkey";
import { useReviewReminder } from "@/hooks/use-review-reminder";
import { useUiStore } from "@/store/ui-store";

import { MobileNav } from "./mobile-nav";
import { Sidebar } from "./sidebar";
import { StoreHydrator } from "./store-hydrator";

const TASK_DETAIL_PATH = /^\/tasks\/(?!today$|upcoming$|waiting$|overdue$)[^/]+$/;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hydrated = useUiStore((state) => state.hydrated);
  const openQuickCreate = useUiStore((state) => state.openQuickCreate);
  const setLastListPath = useUiStore((state) => state.setLastListPath);

  useHotkey("n", () => openQuickCreate());
  useReviewReminder();

  useEffect(() => {
    if (!TASK_DETAIL_PATH.test(pathname)) setLastListPath(pathname);
  }, [pathname, setLastListPath]);

  return (
    <>
      <StoreHydrator />
      <a
        href="#conteudo"
        className="focus-ring sr-only z-[70] rounded-control bg-primary px-3 py-2 text-compact font-medium text-on-primary focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Pular para o conteúdo
      </a>
      <div className="min-h-dvh lg:flex">
        <Sidebar className="hidden lg:flex" />
        <main id="conteudo" className="min-w-0 flex-1 pb-mobile-nav lg:pb-0">
          {hydrated ? children : <ShellPlaceholder />}
        </main>
      </div>
      <MobileNav className="lg:hidden" />
      <QuickCreateDialog />
      <Toaster />
    </>
  );
}

/** Mostrado por alguns milissegundos enquanto os dados locais carregam. */
function ShellPlaceholder() {
  return (
    <div aria-busy="true" aria-label="Carregando" className="mx-auto w-full max-w-5xl px-4 pt-5 sm:px-6 lg:px-10 lg:pt-9">
      <div className="h-8 w-48 animate-pulse rounded-control bg-surface" />
      <div className="mt-8 flex flex-col gap-2">
        {[0, 1, 2].map((row) => (
          <div key={row} className="h-14 animate-pulse rounded-card bg-surface/70" />
        ))}
      </div>
    </div>
  );
}
