# Funcionalidades

O que o Dusk faz hoje, por área, com as regras que não são óbvias. Pendências no fim.

## Conceitos

- **Prazo** (`dueDate`): quando precisa estar pronto.
- **Revisão** (`reviewDate`): quando voltar a olhar, por exemplo para cobrar uma resposta. Também vale em tarefas concluídas, como acompanhamento depois da entrega.
- **Foco de hoje** (`focusDate`): escolha do dia que expira sozinho. Mais de 5 tarefas gera um aviso, sem bloquear.
- **Próxima ação** e **Aguardando** (`nextAction`, `waitingFor`): o contexto que o bloco de notas não guardava.

## Conta e dados

- Login por e-mail e senha, sem cadastro na interface. Um usuário por conta, com dados isolados por RLS.
- Dados no Supabase, disponíveis em qualquer dispositivo. Alterações sem conexão ficam numa fila e são enviadas depois.
- Indicador de sincronização (`SyncBadge`): salvando, salvo ou sem conexão.
- Na primeira entrada em cada navegador, os dados antigos do `localStorage` são levados para o banco, automaticamente e sem duplicar.
- Sair não apaga nada do banco e é cancelado se ainda houver alteração sem enviar ou se o Supabase não confirmar a saída.

## Visão geral (`/`)

Painel para entender o dia de relance. Blocos, métricas e regras em [`DASHBOARD.md`](DASHBOARD.md).

- Resumo do dia com frase de situação, percentual concluído e seis contadores clicáveis.
- "Para fazer hoje" e "Também pedem atenção".
- "Onde está a urgência" (prioridade × prazo) e "Em que pé estão as abertas" (status).
- Calendário de 14 dias.
- Relatório de semana, quinzena ou mês, com comparação ao período anterior.
- Aguardando resposta, Para revisar em breve e Projetos recentes.
- Sem dados: convite para criar a primeira tarefa ou carregar dados de exemplo.

## Tarefas

- **Criação rápida:** tecla `N`, botão ou `+` no celular. Só o título é obrigatório. Projeto, prioridade (padrão Normal), prazo, revisão e foco de hoje são opcionais. Criando a partir da vista Hoje, o foco já vem marcado. Enter cria, e o app abre a tarefa criada.
- **Detalhe** (`/tasks/[id]`): próxima ação em destaque, aguardando, último avanço, subtarefas, histórico e controles de status, prioridade, projeto, prazo e revisão. O "voltar" retorna à última lista visitada.
- **Concluir em um clique** no glifo de status, com desfazer no toast. Reabrir registra evento no histórico.
- **Arquivar e restaurar**, com desfazer. **Excluir** pede confirmação.
- **Subtarefas:** adicionar, marcar, renomear e remover, com progresso `3 / 5 · 60%`.

## Andamento e histórico

- O diálogo de andamento registra status, o que foi feito, aguardando quem, próxima ação, revisão e observação. `Ctrl+Enter` salva.
- Atalhos: V1 concluída, Enviado ao cliente, Aguardando cliente, Ajustes solicitados, Em revisão, Resposta recebida (limpa espera e revisão) e Finalizado (conclui).
- O histórico é imutável e guarda só o que mudou. A observação do andamento fica só no histórico e não sobrescreve `note`.
- **Registrar acompanhamento**, em tarefas concluídas: anota como foi e encerra ou reagenda o lembrete, sem reabrir.
- **Aviso de revisão:** toast ao abrir o app quando há revisões vencidas ou de hoje, uma vez por dia na sessão.

## Listas (`/tasks`)

- **Lista:** agrupada em Hoje, Próximas e Sem data só na ordenação "Inteligente"; nas demais, lista plana.
- **Kanban:** cinco colunas, com arrastar por mouse, toque e teclado. Concluído mostra os últimos 7 dias. Soltar em Aguardando sem pessoa oferece registrar quem.
- **Vistas:** Hoje, Próximas, Aguardando e Atrasadas.
- **Busca** instantânea, ignorando acentos, em título, projeto, último avanço, aguardando, próxima ação e observação.
- **Filtros:** projeto, status, prioridade, prazo (atrasada, hoje, esta semana, em até 7 dias, mais de 7 dias, sem prazo), foco, revisão vencida e situação (abertas, concluídas, concluídas hoje ou todas). Status específico tem precedência sobre Abertas/Concluídas.
- **Ordenação:** Inteligente, Prazo, Prioridade, Mais recente, Mais antiga e Alfabética.

## Projetos

- Nome e cor (paleta fixa de 6) são obrigatórios; descrição é opcional. A cor sugerida é a menos usada.
- `/projects/[id]` agrupa tarefas por status e cria tarefas já associadas.
- Excluir projeto com tarefas nunca apaga as tarefas: o usuário escolhe arquivar, mover ou remover a associação.

## Arquivo e configurações

- `/archive`: restaurar ou excluir tarefas e projetos arquivados.
- `/settings`: nome na saudação, visualização padrão, sincronização, conta e sair, exportar e importar backup JSON (com resumo antes de restaurar), apagar tudo digitando `APAGAR`, versões do app e do schema.
- Apagar tudo remove os dados também do banco.

## Navegação e atalhos

- Desktop: sidebar recolhível com vistas e projetos. Celular: barra inferior com Início, Tarefas, `+`, Projetos e Mais.

| Tecla | Ação |
| --- | --- |
| `N` | Nova tarefa, fora de campos de texto |
| `Enter` | Confirma a criação rápida |
| `Ctrl` + `Enter` | Salva o andamento |
| `Esc` | Fecha diálogo ou menu, ou cancela a edição |
| `Espaço` no Kanban | Pega e solta o card; setas trocam de coluna |

## Pendências conhecidas

| Item | Situação |
| --- | --- |
| Login real em produção | Testado contra servidor simulado local. O banco real foi testado só nas regras de RLS, até o usuário criar a conta |
| Variáveis de ambiente na Vercel | A configurar pelo dono do projeto (ver `SETUP.md`) |
| Bloquear novos cadastros no Supabase | Recomendado, a ser feito pelo dono do projeto (ver `SETUP.md`) |
| Arraste por toque no Kanban | Configurado, mas não testado em aparelho físico |
| Formato do seletor de data | Nativo: segue o idioma do navegador |
| Blocos do relatório sem clique | "Concluídas por projeto" e "Há quanto tempo estão abertas" não abrem lista. "Aguardando resposta de quem" abre todas as aguardando, não só as da pessoa. "+N tarefas" no calendário não é link |
| Prioridade nas listas | Normal e Baixa não aparecem nas linhas nem nos cards, e mudar a prioridade exige abrir a tarefa |

## Backlog

Ideias fora do escopo atual. Ideias do painel estão em [`DASHBOARD.md`](DASHBOARD.md).

- Pausar o tempo do toast de "Desfazer" com o ponteiro sobre ele.
- Tela para ver e recuperar `rejected` e cópias `recovery` sem importar backup.
- Menu "Mover para" no card do Kanban mobile.
- Agrupar a vista "Próximas" por dia.
- Edição inline do título no detalhe da tarefa.
- PWA, Command Palette (`Ctrl+K`), atalhos `F`, `E` e `C`, tema claro.
- Atualização em tempo real com Supabase Realtime, no lugar da consulta a cada 60 s.
