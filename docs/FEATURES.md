# Funcionalidades

O que o Dusk faz hoje, por área, com as regras que não são óbvias. Pendências no fim.

## Conceitos

A interface usa sempre estas palavras, explicadas ao usuário em `/help` (Como funciona).

- **Prazo** (`dueDate`): quando precisa estar pronta.
- **Lembrete** (`reviewDate`): quando voltar a olhar, por exemplo para cobrar uma resposta. Também vale em tarefas concluídas, para verificar algo depois da entrega.
- **Foco de hoje** (`focusDate`): escolha do dia que expira sozinho. Mais de 5 tarefas gera um aviso, sem bloquear. O que ficou do dia anterior vira um aviso no painel, com Trazer para hoje e Dispensar.
- **Próximo passo** e **Aguardando** (`nextAction`, `waitingFor`): o contexto que o bloco de notas não guardava. Em tarefa bloqueada, o mesmo campo aparece como **Bloqueada por**.
- **Repetir** (`recurrence`): todo dia, dias úteis, toda semana ou todo mês. Ao concluir, nasce a próxima tarefa da série.
- **Status:** A fazer, Em andamento, Aguardando, Bloqueada e Concluída, com a explicação de cada um no menu e no diálogo de andamento.

## Conta e dados

- Login por e-mail e senha, sem cadastro na interface. Um usuário por conta, com dados isolados por RLS.
- A tela de login é uma cena de pôr do sol animada (`src/components/auth/login-view.css`). O sol desce enquanto o login é enviado e volta se falhar. Com "reduzir movimento" no sistema, a cena fica parada. O foco automático no e-mail só acontece com mouse ou trackpad, para o teclado do celular não cobrir a tela. A logo é `public/logo.png`. Os ícones são gerados a partir dela: `src/app/icon.png` (aba do navegador), `src/app/apple-icon.png` (iPhone) e `public/icon-192.png` e `public/icon-512.png` (app instalado e avisos). Ao trocar a logo, gere esses arquivos de novo.
- Dados no Supabase, disponíveis em qualquer dispositivo. Alterações sem conexão ficam numa fila e são enviadas depois.
- Indicador de sincronização (`SyncBadge`): salvando, salvo ou sem conexão.
- Na primeira entrada em cada navegador, os dados antigos do `localStorage` são levados para o banco, automaticamente e sem duplicar.
- Sair não apaga nada do banco e é cancelado se ainda houver alteração sem enviar ou se o Supabase não confirmar a saída.

## Visão geral (`/`)

Painel para entender o dia de relance. Blocos, métricas e regras em [`DASHBOARD.md`](DASHBOARD.md).

- Resumo do dia com frase de situação, percentual concluído e seis contadores clicáveis.
- "Hoje" e "Outras que pedem atenção". Quando a lista não cabe, mostra quantas faltam e "Ver todas".
- Aviso do foco anterior, quando sobrou tarefa de outro dia.
- Aguardando resposta, Próximos lembretes e Projetos recentes.
- "Prioridade e prazo" e "Situação das abertas".
- Calendário de 14 dias.
- Relatório de semana, quinzena ou mês, com comparação ao período anterior.
- Sem dados: convite para criar a primeira tarefa ou carregar dados de exemplo.

## Tarefas

- **Criação rápida:** tecla `N`, botão ou `+` no celular. Só o título é obrigatório. Projeto, prioridade (padrão Normal), prazo, lembrete, repetir e foco de hoje são opcionais. Criando a partir da vista Hoje, o foco já vem marcado. Enter cria e abre a tarefa; "Criar e adicionar outra" limpa o formulário e mantém o projeto. Escolher Repetir sem prazo usa hoje como primeiro prazo.
- **Detalhe** (`/tasks/[id]`): botão Editar visível, próximo passo em destaque, aguardando ou bloqueada por, último avanço, subtarefas, histórico e controles de status, prioridade, projeto, prazo, lembrete e repetir. O "voltar" retorna à última lista visitada.
- **Concluir em um clique** no glifo de status, com desfazer no toast. O toast conta o que aconteceu junto: subtarefas abertas, espera encerrada, lembrete que continua marcado e a data da próxima, se a tarefa repete.
- **Reabrir** registra evento no histórico e volta para Em andamento, ou para A fazer se a tarefa nunca tinha saído de lá.
- **Sair de Aguardando ou Bloqueada** encerra a pessoa e o lembrete da espera, registra de quem deixou de aguardar e oferece Desfazer.
- **Tarefa que repete:** concluir cria a próxima, com o prazo seguinte e as subtarefas desmarcadas. Prazo muito atrasado salta para a primeira data depois de hoje. Desfazer remove a próxima. A tarefa concluída deixa de repetir, então reabrir e concluir de novo não cria outra.
- **Arquivar e restaurar**, com desfazer. **Excluir** pede confirmação.
- **Subtarefas:** adicionar, marcar, renomear e remover, com progresso `3 / 5 · 60%`. Marcar a última sugere concluir a tarefa, sem concluir sozinho.

## Andamento e histórico

- O diálogo de andamento registra status, o que foi feito, aguardando quem, próximo passo, lembrete e observação. `Ctrl+Enter` salva.
- Atalhos: V1 concluída, Enviado ao cliente, Aguardando cliente, Ajustes solicitados, Em análise, Resposta recebida (limpa espera e lembrete) e Finalizado (conclui). Trocar o status à mão desmarca o atalho e aplica as mesmas regras de espera.
- O histórico é imutável e guarda só o que mudou. A observação do andamento fica só no histórico e não sobrescreve `note`.
- **Resolver lembrete:** quando o lembrete chega, ou em qualquer tarefa concluída que tenha um, anota como foi e encerra ou marca um novo, sem mudar o status. Concluída sem lembrete oferece "Anotar depois da entrega".
- **Aviso de lembrete:** toast ao abrir o app quando há lembretes que chegaram, uma vez por dia na sessão.
- **Avisos neste aparelho** (`/settings`): com o app fechado, um resumo pela manhã com atrasadas, prazos de hoje e lembretes. Não envia nada quando o dia está livre. No iPhone, exige adicionar o app à tela de início. Sair da conta desliga o aparelho.

## Listas (`/tasks`)

- **Lista:** agrupada em Hoje, Próximas e Sem data só na ordenação "Recomendada"; nas demais, lista plana. Mostra prazo e lembrete quando a tarefa tem os dois.
- **Selecionar:** marca várias tarefas da lista para concluir, mudar prioridade ou projeto, colocar no foco de hoje ou arquivar, com Desfazer. Só age sobre as tarefas visíveis; arquivadas ficam de fora.
- **Quadro:** cinco colunas, com arrastar por mouse, toque e teclado, e menu "Mover para" nos cartões em telas pequenas. Concluída mostra os últimos 7 dias. Soltar em Aguardando sem pessoa oferece registrar quem.
- **Prioridade:** as quatro aparecem em toda linha e todo card, com menu para mudar ali mesmo, sem abrir a tarefa.
- **Vistas:** Hoje, Próximas, Aguardando e Atrasadas.
- **Busca** instantânea, ignorando acentos, em título, projeto, último avanço, aguardando, próximo passo e observação.
- **Busca global** (`Ctrl+K` ou Buscar): tarefas não arquivadas, projetos, telas e Nova tarefa, com setas e Enter.
- **Filtros:** projeto, status, prioridade, prazo (atrasada, hoje, esta semana, em até 7 dias, mais de 7 dias, sem prazo), foco, lembrete chegou e situação (abertas, concluídas, concluídas hoje ou todas). Status específico tem precedência sobre Abertas/Concluídas.
- **Recorte do painel:** abrir um bloco do painel traz as tarefas contadas, com um filtro próprio que aparece como etiqueta removível. Concluídas arquivadas contadas pelo relatório aparecem marcadas como "Arquivada" e só podem ser abertas; no quadro elas ficam de fora.
- **Ordenação:** Recomendada (atrasadas, prazo de hoje, lembretes, urgentes, prazos em até 7 dias e o resto, com a prioridade decidindo dentro de cada grupo), Prazo, Prioridade, Mais recente, Mais antiga e Alfabética.

## Projetos

- Nome e cor são obrigatórios; descrição é opcional. A cor vem de uma paleta de 6, com a menos usada já sugerida, ou de uma tela de escolha livre: arrastar no quadrado e na faixa de matiz ou digitar hex e RGB.
- `/projects/[id]` agrupa tarefas por status e cria tarefas já associadas.
- Excluir projeto com tarefas nunca apaga as tarefas: o usuário escolhe arquivar, mover ou remover a associação.
- Arquivar projeto com tarefas pergunta se elas vão junto (padrão) ou continuam ativas. Restaurar traz de volta só as que foram arquivadas junto.

## Arquivo e configurações

- `/archive`: restaurar ou excluir tarefas e projetos arquivados.
- `/help`: Como funciona, o glossário de cada palavra do app.
- `/settings`: nome na saudação, visualização padrão, avisos neste aparelho, sincronização, conta e sair, exportar e importar backup JSON (com resumo antes de restaurar), apagar tudo digitando `APAGAR`, versões do app e do schema.
- Apagar tudo remove os dados também do banco.

## Navegação e atalhos

- Desktop: sidebar recolhível com Buscar, vistas, projetos e Como funciona. Celular: barra inferior com Início, Tarefas, `+`, Projetos e Mais, que traz Buscar e as demais telas.

| Tecla | Ação |
| --- | --- |
| `N` | Nova tarefa, fora de campos de texto |
| `Ctrl` + `K` | Abre a busca global |
| `Enter` | Confirma a criação rápida |
| `Ctrl` + `Enter` | Salva o andamento |
| `Esc` | Fecha diálogo ou menu, ou cancela a edição |
| `Espaço` no quadro | Pega e solta o card; setas trocam de coluna |

## Pendências conhecidas

| Item | Situação |
| --- | --- |
| Arraste por toque no quadro | Configurado, mas não testado em aparelho físico |
| Formato do seletor de data | Nativo: segue o idioma do navegador |

## Backlog

Ideias fora do escopo atual. Ideias do painel estão em [`DASHBOARD.md`](DASHBOARD.md).

- Pausar o tempo do toast de "Desfazer" com o ponteiro sobre ele.
- Tela para ver e recuperar `rejected` e cópias `recovery` sem importar backup.
- Agrupar a vista "Próximas" por dia.
- Edição inline do título no detalhe da tarefa.
- Funcionamento sem conexão como PWA, atalhos `F`, `E` e `C`, tema claro.
- Tela Hoje dizendo o motivo de cada tarefa estar ali, e escolha do horário do resumo diário.
- Atualização em tempo real com Supabase Realtime, no lugar da consulta a cada 60 s.
