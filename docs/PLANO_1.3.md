# Plano da versão 1.3: fácil de entender e sem surpresas

Objetivo: o Dusk precisa ser óbvio de usar. Cada palavra diz uma coisa só, cada número bate com a lista que ele abre, e nenhum dado fica ativo depois de perder o sentido.

Documento histórico da entrega. O estado atual fica em [`FEATURES.md`](FEATURES.md).

## 1. Palavras

Um conceito, um nome, em toda a interface:

| Antes | Agora | O que significa |
| --- | --- | --- |
| Revisão, Revisar novamente, Revisar em, Para revisar, Revisão vencida | **Lembrete** | Dia em que o app te lembra de olhar a tarefa de novo |
| Registrar acompanhamento, Acompanhamento | **Resolver lembrete** | Anotar como foi e encerrar ou remarcar o lembrete de uma tarefa concluída |
| Próxima ação | **Próximo passo** | A próxima coisa a fazer na tarefa |
| Para fazer hoje | **Hoje** | Foco do dia, prazos até hoje e lembretes que chegaram |
| Também pedem atenção | **Outras que pedem atenção** | Urgentes ou bloqueadas, sem data para hoje |
| Inteligente | **Recomendada** | Ordem que coloca o mais importante primeiro |
| Kanban | **Quadro** | Visualização em colunas por status |
| Feitas hoje | **Concluídas hoje** | Tarefas concluídas hoje |
| Em revisão (atalho) | **Em análise** | Evita confusão com lembrete |
| Bloqueado, Concluído | **Bloqueada, Concluída** | O status concorda com "tarefa" |
| Onde está a urgência, Em que pé estão as abertas | **Prioridade e prazo, Situação das abertas** | Títulos diretos no painel |

Além disso: explicação curta em cada status, nos campos de data e nos blocos do painel, e uma tela "Como funciona" (`/help`).

## 2. Lógica

| # | Problema | Regra nova |
| --- | --- | --- |
| 1 | A ordem recomendada ignora Alta e Baixa | Prioridade desempata; sem prazo próximo, a prioridade vem antes da data |
| 2 | Concluir uma tarefa em espera continua cobrando | Sair de Aguardando ou Bloqueada, por qualquer caminho, encerra a espera e o lembrete. A pessoa fica no histórico |
| 3 | Concluir uma tarefa com lembrete próprio é silencioso | O lembrete continua, e o aviso de conclusão diz isso |
| 4 | "Ver todas" dos lembretes abre outra lista | Abre exatamente as tarefas contadas |
| 5 | "Há N dias" zera ao mudar qualquer campo | Conta desde a entrada em Aguardando |
| 6 | O foco de ontem some sem aviso | O painel oferece trazer para hoje ou dispensar |
| 7 | Arquivar projeto deixa as tarefas nas listas | O app pergunta. Arquivadas juntas voltam juntas |
| 8 | Reabrir sempre volta para A fazer | Volta para A fazer só se a tarefa nunca foi iniciada; senão, Em andamento |
| 9 | O número de Hoje não bate com as linhas | Número, linhas e "Ver todas" usam só tarefas abertas |
| 10 | Tarefa e subtarefas não conversam | Aviso ao concluir com subtarefas abertas e sugestão ao terminar todas |

## 3. Telas

- Painel: o que pede ação sobe (Aguardando, Lembretes e Projetos) e o relatório desce.
- Linha da tarefa: mostra prazo e lembrete ao mesmo tempo, sempre com o nome da data.
- Prioridade visível também em Aguardando resposta, Próximos lembretes e Arquivo.
- Criação rápida: mesmo campo de data do resto do app e botão "Criar e adicionar outra".
- Detalhe da tarefa: botão de editar à vista.

## 4. O que faltava

| Item | Como funciona |
| --- | --- |
| Tarefas recorrentes | Todo dia, dias úteis, toda semana ou todo mês. Ao concluir, a próxima nasce sozinha, e "Desfazer" a remove |
| Notificações reais | Web Push: resumo diário às 8h, mesmo com o app fechado. Ativado por aparelho em Configurações |
| Busca global | `Ctrl+K` ou botão Buscar: tarefas, projetos e atalhos de navegação |
| Ações em lote | Modo Selecionar na lista: concluir, prioridade, projeto, foco e arquivar, com desfazer |
| Mover card no celular | Menu "Mover para" em cada card do Quadro |

## 5. Ordem de execução

1. Regras de domínio com testes.
2. Store e ações, com desfazer.
3. Palavras.
4. Telas.
5. Recorrência, notificações, busca, lote e mover card.
6. Documentação.
7. Conferência: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build` e navegador em desktop e 375 px.

## 6. Passos manuais do dono do projeto

As migrations `0002` e `0003` precisam rodar **antes** do deploy: sem a coluna `recurrence`, o banco recusa as gravações de tarefas. Notificações exigem as variáveis novas na Vercel, descritas em [`SETUP.md`](SETUP.md).
