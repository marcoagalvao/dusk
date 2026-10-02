import { createEmptyAppData, type AppData } from "@/domain/app-data";

import type { AppSliceCreator } from "../types";

export interface DataSlice {
  /** Substitui todos os dados (restauração de backup, dados de exemplo). */
  replaceData: (data: AppData) => void;
  /** Volta ao estado inicial vazio. */
  resetData: () => void;
}

export const createDataSlice: AppSliceCreator<DataSlice> = (set) => ({
  replaceData: (data) => set({ tasks: data.tasks, projects: data.projects, settings: data.settings }),
  resetData: () => set(createEmptyAppData()),
});
