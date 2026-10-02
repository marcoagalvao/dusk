import { createEmptyAppData, type AppData } from "@/domain/app-data";
import type { Project } from "@/domain/project";
import { buildProject } from "@/domain/project-rules";
import type { Task } from "@/domain/task";
import {
  addSubtask,
  applyProgressUpdate,
  buildTask,
  changeStatus,
  patchTask,
  toggleSubtask,
  type ProgressInput,
  type TaskPatch,
} from "@/domain/task-rules";
import { addDaysToKey } from "@/lib/dates";

/**
 * Dados de exemplo opcionais (PRD §73): só carregados se o usuário escolher.
 * Gerados com as próprias regras de domínio, com datas relativas a hoje.
 */
export function createSampleData(today: string, now: Date = new Date()): AppData {
  const at = (hoursAgo: number) => new Date(now.getTime() - hoursAgo * 3_600_000).toISOString();
  const day = (offset: number) => addDaysToKey(today, offset);
  const data = createEmptyAppData();

  const project = (name: string, color: Project["color"], description?: string): Project => {
    const created = buildProject({ name, color, description }, at(24 * 20));
    data.projects.push(created);
    return created;
  };

  const integradas = project("Integradas", "lavender", "Site institucional e materiais digitais");
  const enber = project("Enber", "peach", "Landing page e ajustes de produto");
  const kleron = project("Kleron", "sage");
  const pessoal = project("Pessoal", "periwinkle");

  interface Step {
    hoursAgo: number;
    progress?: ProgressInput;
    patch?: TaskPatch;
    status?: Task["status"];
  }

  const task = (title: string, projectId: string | undefined, createdHoursAgo: number, steps: Step[] = [], subtasks: Array<[string, boolean]> = []) => {
    let current = buildTask({ title, projectId }, at(createdHoursAgo));
    for (const [subtitle, done] of subtasks) {
      current = addSubtask(current, subtitle, at(createdHoursAgo - 1));
      if (done) current = toggleSubtask(current, current.subtasks.at(-1)!.id, at(createdHoursAgo - 2));
    }
    for (const step of steps) {
      if (step.patch) current = patchTask(current, step.patch, at(step.hoursAgo));
      if (step.status) current = changeStatus(current, step.status, at(step.hoursAgo));
      if (step.progress) current = applyProgressUpdate(current, step.progress, at(step.hoursAgo));
    }
    data.tasks.push(current);
    return current;
  };

  task(
    "Site institucional da Integradas",
    integradas.id,
    24 * 9,
    [
      { hoursAgo: 24 * 6, progress: { status: "in_progress", done: "Estrutura inicial concluída." } },
      {
        hoursAgo: 26,
        progress: {
          status: "waiting",
          preset: "sent-to-client",
          done: "V1 pronta.",
          waitingFor: "Pedro enviar as informações solicitadas",
          nextAction: "Aplicar o conteúdo recebido e preparar a V2",
          reviewDate: today,
        },
      },
      { hoursAgo: 25, patch: { focusDate: today, dueDate: day(8) } },
    ],
    [
      ["Estrutura", true],
      ["Home", true],
      ["Graduação", true],
      ["Revisão mobile", false],
      ["Analytics", false],
    ],
  );

  task("Aprovação da página de cursos", integradas.id, 24 * 5, [
    {
      hoursAgo: 24 * 3,
      progress: {
        status: "waiting",
        preset: "waiting-client",
        waitingFor: "Diretoria aprovar o texto",
        reviewDate: day(3),
      },
    },
  ]);

  task("Revisar SEO das páginas internas", integradas.id, 24 * 4, [{ hoursAgo: 24 * 4, patch: { priority: "low" } }]);

  task("Ajustar responsivo da landing", enber.id, 24 * 3, [
    { hoursAgo: 30, status: "in_progress" },
    {
      hoursAgo: 5,
      progress: {
        status: "in_progress",
        preset: "changes-requested",
        done: "Ajustes solicitados pelo cliente.",
        nextAction: "Revisar breakpoints do formulário",
      },
      patch: { dueDate: day(1), focusDate: today, priority: "high" },
    },
  ]);

  task("Corrigir envio do formulário de contato", enber.id, 24 * 2, [
    { hoursAgo: 24 * 2, patch: { priority: "urgent", dueDate: day(-1) } },
    { hoursAgo: 20, progress: { status: "blocked", waitingFor: "Acesso ao servidor de e-mail", nextAction: "Testar com SMTP de homologação" } },
  ]);

  task("Enviar proposta comercial", kleron.id, 24 * 2, [
    { hoursAgo: 3, patch: { focusDate: today, dueDate: today, nextAction: "Revisar valores e enviar por e-mail" } },
  ]);

  task("Formulário Ozemar", kleron.id, 24 * 6, [
    {
      hoursAgo: 24 * 4,
      progress: { status: "waiting", waitingFor: "Ozemar preencher o formulário", reviewDate: day(-1) },
    },
  ]);

  task("Reunião com Pedro", integradas.id, 24 * 7, [{ hoursAgo: 24 * 2, status: "completed" }]);
  task("Resolver domínio brasilformado.com", undefined, 24 * 8, [{ hoursAgo: 24 * 1, status: "completed" }]);
  task("Migração da hospedagem", integradas.id, 24 * 12, [
    { hoursAgo: 24 * 3, progress: { status: "completed", preset: "finished", done: "DNS apontado e SSL ativo." } },
  ]);

  task("Renovar documentação do carro", pessoal.id, 24 * 1, [{ hoursAgo: 24, patch: { dueDate: day(12) } }]);
  task("Organizar fotos da viagem", pessoal.id, 24 * 10);

  return data;
}
