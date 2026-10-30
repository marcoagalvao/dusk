"use client";

import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { LoginView } from "@/components/auth/login-view";
import { useAuthUser } from "@/components/auth/use-auth-user";
import { QuickCreateDialog } from "@/components/tasks/quick-create-dialog";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import { useHotkey } from "@/hooks/use-hotkey";
import { useStoreHydration } from "@/hooks/use-store-hydration";
import { useReviewReminder } from "@/hooks/use-review-reminder";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useUiStore } from "@/store/ui-store";

import { MobileNav } from "./mobile-nav";
import { Sidebar } from "./sidebar";


const TASK_DETAIL_PATH = /^\/tasks\/(?!today$|upcoming$|waiting$|overdue$)[^/]+$/;

/** Sem login válido nada do app é montado: nenhum dado é lido nem gravado. */
export function AppShell({ children }: { children: ReactNode }) {
  const user = useAuthUser();

  if (!isSupabaseConfigured()) return <ConfigMissing />;
  if (user === undefined) return <ShellPlaceholder />;
  if (user === null) {
    return (
      <>
        <LoginView />
        <Toaster />
      </>
    );
  }
  return <AuthenticatedShell userId={user.id}>{children}</AuthenticatedShell>;
}

function AuthenticatedShell({ userId, children }: { userId: string; children: ReactNode }) {
  const pathname = usePathname();
  const hydrated = useUiStore((state) => state.hydrated);
  const loadFailed = useUiStore((state) => state.loadFailed);
  const openQuickCreate = useUiStore((state) => state.openQuickCreate);
  const setLastListPath = useUiStore((state) => state.setLastListPath);
  const { retry } = useStoreHydration(userId);

  useHotkey("n", () => openQuickCreate());
  useReviewReminder();

  useEffect(() => {
    if (!TASK_DETAIL_PATH.test(pathname)) setLastListPath(pathname);
  }, [pathname, setLastListPath]);

  return (
    <>
      <a
        href="#conteudo"
        className="focus-ring sr-only z-[70] rounded-control bg-primary px-3 py-2 text-compact font-medium text-on-primary focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Pular para o conteúdo
      </a>
      <div className="min-h-dvh lg:flex">
        <Sidebar className="hidden lg:flex" />
        <main id="conteudo" className="min-w-0 flex-1 pb-mobile-nav lg:pb-0">
          {loadFailed ? <LoadFailed onRetry={retry} /> : hydrated ? children : <ShellPlaceholder />}
        </main>
      </div>
      <MobileNav className="lg:hidden" />
      <QuickCreateDialog />
      <Toaster />
    </>
  );
}

function LoadFailed({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="mx-auto w-full max-w-xl px-4 pt-10 sm:px-6 lg:pt-16">
      <h1 className="text-section font-semibold text-ink">Não foi possível carregar suas tarefas</h1>
      <p className="mt-2 text-body text-ink-muted">
        O banco de dados não respondeu e este navegador ainda não tem uma cópia dos dados. Nada foi perdido.
      </p>
      <Button variant="primary" className="mt-5" onClick={onRetry}>
        Tentar de novo
      </Button>
    </div>
  );
}

function ConfigMissing() {
  return (
    <main role="alert" className="mx-auto w-full max-w-xl px-4 pt-10 sm:px-6 lg:pt-16">
      <h1 className="text-section font-semibold text-ink">Banco de dados não configurado</h1>
      <p className="mt-2 text-body text-ink-muted">
        Defina <code className="font-mono text-compact">NEXT_PUBLIC_SUPABASE_URL</code> e{" "}
        <code className="font-mono text-compact">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> (veja{" "}
        <code className="font-mono text-compact">.env.example</code>) e gere o build de novo.
      </p>
    </main>
  );
}

/** Mostrado enquanto a sessão e os dados carregam. */
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
