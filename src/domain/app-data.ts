import type { Project } from "./project";
import { DEFAULT_SETTINGS, type AppSettings } from "./settings";
import type { Task } from "./task";

/** Versão atual do formato salvo. Qualquer mudança exige migration explícita. */
export const SCHEMA_VERSION = 1;

export const APP_VERSION = "1.1.0";

export interface AppData {
  tasks: Task[];
  projects: Project[];
  settings: AppSettings;
}

export interface PersistedAppState extends AppData {
  schemaVersion: typeof SCHEMA_VERSION;
}

export function createEmptyAppData(): AppData {
  return { tasks: [], projects: [], settings: { ...DEFAULT_SETTINGS } };
}
