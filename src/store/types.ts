import type { StateCreator } from "zustand";

import type { DataSlice } from "./slices/data-slice";
import type { ProjectsSlice } from "./slices/projects-slice";
import type { SettingsSlice } from "./slices/settings-slice";
import type { TasksSlice } from "./slices/tasks-slice";

export type AppStore = TasksSlice & ProjectsSlice & SettingsSlice & DataSlice;

export type AppSliceCreator<Slice> = StateCreator<AppStore, [["zustand/persist", unknown]], [], Slice>;
