import type { SCHEMA_VERSION } from "./app-data";
import type { Project } from "./project";
import type { AppSettings } from "./settings";
import type { Task } from "./task";

export const BACKUP_APP_ID = "dusk";

export interface DuskBackup {
  app: typeof BACKUP_APP_ID;
  schemaVersion: typeof SCHEMA_VERSION;
  exportedAt: string;
  tasks: Task[];
  projects: Project[];
  settings: AppSettings;
}

export interface BackupSummary {
  taskCount: number;
  projectCount: number;
  exportedAt: string;
}
