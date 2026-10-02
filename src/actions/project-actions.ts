import type { Project } from "@/domain/project";
import type { ProjectInput } from "@/domain/project-rules";
import { useAppStore } from "@/store/app-store";
import type { ProjectTaskStrategy } from "@/store/slices/projects-slice";
import { toast } from "@/store/ui-store";

const store = () => useAppStore.getState();

export function createProject(input: ProjectInput): Project {
  const project = store().createProject(input);
  toast.success("Projeto criado");
  return project;
}

export function updateProject(id: string, input: ProjectInput): void {
  store().updateProject(id, input);
  toast.success("Projeto atualizado");
}

export function archiveProject(id: string): void {
  store().archiveProject(id);
  toast.show("Projeto arquivado", {
    duration: 5000,
    action: { label: "Desfazer", onAction: () => store().unarchiveProject(id) },
  });
}

export function unarchiveProject(id: string): void {
  store().unarchiveProject(id);
  toast.success("Projeto restaurado");
}

export function deleteProject(id: string, strategy?: ProjectTaskStrategy): boolean {
  const deleted = store().deleteProject(id, strategy);
  if (deleted) toast.show("Projeto excluído");
  else toast.error("O projeto ainda tem tarefas. Escolha o que fazer com elas antes de excluir.");
  return deleted;
}
