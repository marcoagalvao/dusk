import type { ReactNode } from "react";

import { PageContainer, PageHeader } from "@/components/layout/page";
import { StatusGlyph } from "@/components/ui/status-glyph";
import { RECURRENCE_LABELS, STATUS_DESCRIPTIONS, STATUS_LABELS, TASK_RECURRENCES, TASK_STATUSES } from "@/domain/task";

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h2 id={id} className="text-section font-semibold text-ink">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Term({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-3 sm:flex-row sm:gap-4">
      <dt className="shrink-0 text-compact font-medium text-ink sm:w-40">{name}</dt>
      <dd className="text-compact text-ink-muted">{children}</dd>
    </div>
  );
}

/** Glossário: o significado de cada palavra que o app usa. */
export function HelpView() {
  return (
    <PageContainer width="narrow">
      <PageHeader title="Como funciona" description="O que cada palavra quer dizer no Dusk." />

      <div className="flex flex-col gap-10">
        <Section id="help-dates" title="O que organiza o seu dia">
          <dl className="flex flex-col divide-y divide-line/60 border-y border-line/60">
            <Term name="Prazo">Quando a tarefa precisa estar pronta. Depois dessa data, ela aparece em Atrasadas.</Term>
            <Term name="Lembrete">
              Quando voltar a olhar a tarefa, mesmo sem prazo. Serve também para verificar algo depois de concluir. No dia marcado, ela aparece em Hoje até você resolver o lembrete.
            </Term>
            <Term name="Foco de hoje">O que você escolhe fazer hoje. Vale só para o dia. O que ficar por fazer aparece no dia seguinte para você trazer de volta ou dispensar.</Term>
            <Term name="Hoje">Junta o foco do dia, os prazos até hoje e os lembretes que chegaram.</Term>
            <Term name="Próximas">Tarefas com prazo ou lembrete nos próximos dias.</Term>
          </dl>
        </Section>

        <Section id="help-status" title="Status: em que pé a tarefa está">
          <ul className="flex flex-col divide-y divide-line/60 border-y border-line/60">
            {TASK_STATUSES.map((status) => (
              <li key={status} className="flex items-start gap-3 py-3">
                <span className="mt-0.5">
                  <StatusGlyph status={status} size={16} />
                </span>
                <span className="text-compact">
                  <span className="font-medium text-ink">{STATUS_LABELS[status]}: </span>
                  <span className="text-ink-muted">{STATUS_DESCRIPTIONS[status]}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="text-label text-ink-muted">Quando uma tarefa deixa de estar Aguardando ou Bloqueada, a pessoa e o lembrete dessa espera são encerrados, e o histórico guarda o que aconteceu.</p>
        </Section>

        <Section id="help-task" title="Dentro de uma tarefa">
          <dl className="flex flex-col divide-y divide-line/60 border-y border-line/60">
            <Term name="Próximo passo">A próxima coisa a fazer para a tarefa andar.</Term>
            <Term name="Atualizar andamento">Anota o que foi feito e o que vem depois. Tudo fica no histórico da tarefa.</Term>
            <Term name="Subtarefas">Partes menores da tarefa. Terminar todas não conclui a tarefa sozinho: o app pergunta.</Term>
            <Term name="Repetir">
              Ao concluir, a próxima tarefa é criada sozinha com o novo prazo. As opções são {TASK_RECURRENCES.map((rule) => RECURRENCE_LABELS[rule].toLowerCase()).join(", ")}.
            </Term>
            <Term name="Prioridade">O quanto a tarefa importa. Na ordem Recomendada, atrasadas e urgentes vêm primeiro.</Term>
          </dl>
        </Section>

        <Section id="help-more" title="Outras telas e recursos">
          <dl className="flex flex-col divide-y divide-line/60 border-y border-line/60">
            <Term name="Quadro">Mostra as tarefas em colunas por status. Arraste os cartões ou, no celular, use Mover para.</Term>
            <Term name="Selecionar">Na lista, marca várias tarefas para concluir, arquivar ou mudar de uma vez.</Term>
            <Term name="Arquivo">Guarda o que saiu do caminho, com o histórico. Dá para restaurar. Excluir, ao contrário, é definitivo.</Term>
            <Term name="Buscar">Encontra tarefas e projetos e abre qualquer tela. No computador, o atalho é Ctrl+K.</Term>
            <Term name="Avisos">Em Configurações, ligue para receber um resumo pela manhã neste aparelho, com o app fechado.</Term>
          </dl>
        </Section>
      </div>
    </PageContainer>
  );
}
