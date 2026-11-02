export const PROJECT_COLORS = [
  "lavender",
  "periwinkle",
  "peach",
  "rose",
  "sage",
  "sand",
] as const;

export type PresetProjectColor = (typeof PROJECT_COLORS)[number];

/** Uma cor da paleta ou uma cor livre em `#rrggbb` minúsculo. */
export type ProjectColor = PresetProjectColor | `#${string}`;

export const isCustomProjectColor = (color: string): color is `#${string}` => /^#[0-9a-f]{6}$/.test(color);

export const isProjectColor = (color: string): color is ProjectColor =>
  isCustomProjectColor(color) || (PROJECT_COLORS as readonly string[]).includes(color);

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
export const PROJECT_COLOR_LABELS: Record<PresetProjectColor, string> = {
  lavender: "Lavanda",
  periwinkle: "Periwinkle",
  peach: "Pêssego",
  rose: "Rosa",
  sage: "Sálvia",
  sand: "Areia",
};

export const PROJECT_NAME_MAX_LENGTH = 60;
