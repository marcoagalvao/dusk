import { create } from "zustand";

import { DEFAULT_TASK_FILTERS, type TaskFilters, type TaskSort } from "@/domain/task-queries";
import { createId } from "@/lib/utils/id";

/**
 * Estado efêmero de interface (não persistido): toasts, criação rápida,
 * filtros/ordenação da sessão e flag de hidratação.
 */

export type ToastTone = "default" | "success" | "error";

export interface Toast {
  id: string;
  message: string;
  tone: ToastTone;
  duration: number;
  action?: { label: string; onAction: () => void };
}

export interface QuickCreateDefaults {
  projectId?: string;
}

interface UiStore {
  hydrated: boolean;
  setHydrated: () => void;

  toasts: Toast[];
  showToast: (toast: Omit<Toast, "id" | "tone" | "duration"> & Partial<Pick<Toast, "tone" | "duration">>) => string;
  dismissToast: (id: string) => void;

  quickCreate: { open: boolean; defaults: QuickCreateDefaults };
  openQuickCreate: (defaults?: QuickCreateDefaults) => void;
  closeQuickCreate: () => void;

  taskFilters: TaskFilters;
  setTaskFilters: (patch: Partial<TaskFilters>) => void;
  resetTaskFilters: () => void;

  taskSort: TaskSort;
  setTaskSort: (sort: TaskSort) => void;

  /** Última tela de lista visitada, destino do "voltar" no detalhe da tarefa. */
  lastListPath: string;
  setLastListPath: (path: string) => void;

  /** Dia em que o aviso de revisões já foi avaliado nesta sessão. */
  reviewReminderDate: string | null;
  markReviewReminder: (date: string) => void;
}

const MAX_VISIBLE_TOASTS = 3;
const DEFAULT_TOAST_DURATION = 3200;

export const useUiStore = create<UiStore>()((set) => ({
  hydrated: false,
  setHydrated: () => set({ hydrated: true }),

  toasts: [],
  showToast: (toast) => {
    const id = createId();
    const next: Toast = { tone: "default", duration: DEFAULT_TOAST_DURATION, ...toast, id };
    set((state) => ({ toasts: [...state.toasts, next].slice(-MAX_VISIBLE_TOASTS) }));
    return id;
  },
  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),

  quickCreate: { open: false, defaults: {} },
  openQuickCreate: (defaults = {}) => set({ quickCreate: { open: true, defaults } }),
  closeQuickCreate: () => set((state) => ({ quickCreate: { ...state.quickCreate, open: false } })),

  taskFilters: DEFAULT_TASK_FILTERS,
  setTaskFilters: (patch) => set((state) => ({ taskFilters: { ...state.taskFilters, ...patch } })),
  resetTaskFilters: () =>
    set((state) => ({ taskFilters: { ...DEFAULT_TASK_FILTERS, search: state.taskFilters.search } })),

  taskSort: "smart",
  setTaskSort: (taskSort) => set({ taskSort }),

  lastListPath: "/tasks",
  setLastListPath: (lastListPath) => set({ lastListPath }),

  reviewReminderDate: null,
  markReviewReminder: (reviewReminderDate) => set({ reviewReminderDate }),
}));

/** Atalhos para disparar toasts fora de componentes (store, handlers). */
export const toast = {
  show: (message: string, options?: Partial<Omit<Toast, "id" | "message">>) =>
    useUiStore.getState().showToast({ message, ...options }),
  success: (message: string, options?: Partial<Omit<Toast, "id" | "message" | "tone">>) =>
    useUiStore.getState().showToast({ message, tone: "success", ...options }),
  error: (message: string, options?: Partial<Omit<Toast, "id" | "message" | "tone">>) =>
    useUiStore.getState().showToast({ message, tone: "error", duration: 6000, ...options }),
  dismiss: (id: string) => useUiStore.getState().dismissToast(id),
};
