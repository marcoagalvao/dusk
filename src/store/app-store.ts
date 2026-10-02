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
 * Store único e persistido (PRD §44). A hidratação é manual (`skipHydration`)
 * para que o HTML do servidor e o primeiro render do cliente coincidam; ela é
 * disparada por `StoreHydrator` após a montagem.
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

/** Apaga tudo: estado em memória e armazenamento local. */
export function eraseAllData(): void {
  useAppStore.getState().resetData();
  useAppStore.persist.clearStorage();
}
