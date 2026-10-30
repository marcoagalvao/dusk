import { create } from "zustand";
import { persist } from "zustand/middleware";

import { SCHEMA_VERSION, type AppData } from "@/domain/app-data";
import { STORAGE_KEY } from "@/lib/persistence/local-storage-persistence";

import { appPersistence, createPersistStorage } from "./persistence";
import { createDataSlice } from "./slices/data-slice";
import { createProjectsSlice } from "./slices/projects-slice";
import { createSettingsSlice } from "./slices/settings-slice";
import { createTasksSlice } from "./slices/tasks-slice";
import type { AppStore } from "./types";

/**
 * Store único e persistido (PRD §44). A hidratação é manual (`skipHydration`):
 * os dados dependem do usuário logado e vêm do banco, então `useStoreHydration` a
 * dispara depois do login.
 */
export const useAppStore = create<AppStore>()(
  persist(
    (...args) => ({
      ...createTasksSlice(...args),
      ...createProjectsSlice(...args),
      ...createSettingsSlice(...args),
      ...createDataSlice(...args),
    }),
    {
      name: STORAGE_KEY,
      version: SCHEMA_VERSION,
      storage: createPersistStorage(appPersistence),
      partialize: (state): AppData => ({
        tasks: state.tasks,
        projects: state.projects,
        settings: state.settings,
      }),
      skipHydration: true,
    },
  ),
);

export function getAppData(): AppData {
  const { tasks, projects, settings } = useAppStore.getState();
  return { tasks, projects, settings };
}

/** Apaga tudo: o estado zerado vira DELETE no banco pelo fluxo normal de `save`. */
export function eraseAllData(): void {
  useAppStore.getState().resetData();
}
