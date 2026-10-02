export const PROJECT_COLORS = [
  "lavender",
  "periwinkle",
  "peach",
  "rose",
  "sage",
  "sand",
] as const;

export type ProjectColor = (typeof PROJECT_COLORS)[number];

export interface Project {
  id: string;
  name: string;
  color: ProjectColor;
  description?: string;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/** Nomes da paleta fixa (PRD §24). Os valores de cor vivem nos tokens do tema (globals.css). */
export const PROJECT_COLOR_LABELS: Record<ProjectColor, string> = {
  lavender: "Lavanda",
  periwinkle: "Periwinkle",
  peach: "Pêssego",
  rose: "Rosa",
  sage: "Sálvia",
  sand: "Areia",
};

export const PROJECT_NAME_MAX_LENGTH = 60;
