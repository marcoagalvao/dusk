import type { TaskStatus } from "./task";
import { leavesWaiting } from "./task-rules";

export type ProgressTextField = "done" | "waitingFor" | "nextAction";
export type ProgressFocusField = ProgressTextField | "reviewDate";

export interface ProgressPreset {
  id: string;
  label: string;
  status: TaskStatus;
  /** Textos pré-preenchidos (sempre editáveis antes de salvar). */
  fill?: Partial<Record<ProgressTextField, string>>;
  /** Campos esvaziados ao aplicar o preset. */
  clear?: ReadonlyArray<"waitingFor" | "reviewDate">;
  /** Campo que recebe o foco depois de aplicar o preset. */
  focus?: ProgressFocusField;
}

export const PROGRESS_PRESETS: readonly ProgressPreset[] = [
  {
    id: "v1-done",
    label: "V1 concluída",
    status: "in_progress",
    fill: { done: "Primeira versão concluída." },
    focus: "nextAction",
  },
  {
    id: "sent-to-client",
    label: "Enviado ao cliente",
    status: "waiting",
    fill: { done: "Material enviado ao cliente.", waitingFor: "Retorno do cliente." },
    focus: "reviewDate",
  },
  {
    id: "waiting-client",
    label: "Aguardando cliente",
    status: "waiting",
    focus: "waitingFor",
  },
  {
    id: "changes-requested",
    label: "Ajustes solicitados",
    status: "in_progress",
    fill: { done: "Ajustes solicitados pelo cliente." },
    focus: "nextAction",
  },
  {
    id: "in-review",
    label: "Em análise",
    status: "in_progress",
    fill: { done: "Versão em análise." },
  },
  {
    id: "response-received",
    label: "Resposta recebida",
    status: "in_progress",
    fill: { done: "Resposta recebida." },
    clear: ["waitingFor", "reviewDate"],
    focus: "nextAction",
  },
  {
    id: "finished",
    label: "Finalizado",
    status: "completed",
  },
];

/**
 * Marca no histórico um lembrete resolvido depois da entrega (tarefa concluída
 * com lembrete, ex.: "perguntar ao cliente se está tudo ok"). Não é um preset do
 * modal de andamento; é registrado pelo diálogo de resolver lembrete.
 */
export const FOLLOW_UP_PRESET_ID = "follow-up";

export function findPreset(id: string | undefined): ProgressPreset | undefined {
  return id ? PROGRESS_PRESETS.find((preset) => preset.id === id) : undefined;
}

export interface ProgressFormValues {
  status: TaskStatus;
  preset?: string;
  done: string;
  waitingFor: string;
  nextAction: string;
  reviewDate: string;
  note: string;
}

/** Sair da espera limpa a data na hora: o que está na tela é o que será salvo, e dá para escolher outra. */
export function changeFormStatus(values: ProgressFormValues, status: TaskStatus): ProgressFormValues {
  return { ...values, status, reviewDate: leavesWaiting(values.status, status) ? "" : values.reviewDate };
}

export function applyPreset(values: ProgressFormValues, preset: ProgressPreset): ProgressFormValues {
  const next: ProgressFormValues = { ...changeFormStatus(values, preset.status), ...preset.fill, preset: preset.id };
  for (const field of preset.clear ?? []) next[field] = "";
  return next;
}
