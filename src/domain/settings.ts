export const TASK_VIEWS = ["list", "kanban"] as const;

export type TaskView = (typeof TASK_VIEWS)[number];

export interface AppSettings {
  theme: "pastel-dusk";
  defaultTaskView: TaskView;
  sidebarCollapsed: boolean;
  /** Nome usado na saudação da Home. Opcional. */
  displayName?: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "pastel-dusk",
  defaultTaskView: "list",
  sidebarCollapsed: false,
};

export const DISPLAY_NAME_MAX_LENGTH = 40;
