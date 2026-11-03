# Changelog

Todas as mudanças relevantes do Dusk, da mais recente para a mais antiga. Formato inspirado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).

Toda mudança entra aqui na mesma entrega, com a data. As regras estão em [`AGENTS.md`](AGENTS.md).

## [1.5.1] - 2026-11-03

### Corrigido
- O login e o fundo do app deixavam o computador pesado: animações em loop faziam a tela inteira ser redesenhada sem parar, e o painel do login desfocava o fundo a cada quadro. Com outro vídeo aberto em um segundo monitor, ele chegava a travar. Agora as animações acontecem só na abertura, a cena fica parada depois disso e o painel deixou de desfocar o fundo. Parado, o navegador passou de cerca de 100 quadros por segundo para praticamente nenhum, no login e no app.

## [1.5.0] - 2026-11-02

O app continua de onde a tela de login para: o sol acabou de se pôr.

### Alterado
- Fundo novo em todas as telas: as primeiras estrelas no alto e a luz do pôr do sol no pé da tela, com o topo do sol aparecendo na borda. O brilho muda devagar, e o fundo fica parado para quem pede menos movimento no sistema.
- Menu lateral translúcido, para o fundo aparecer também nele, e com a logo ao lado do nome.
- "Nova tarefa" no menu lateral e o botão + do celular ganharam o mesmo degradê do botão Entrar.

## [1.4.0] - 2026-11-02

Tela de login nova, com um entardecer animado nas cores do Dusk, e logo própria em todo o app.

### Alterado
- O login virou uma cena de pôr do sol, com o nome Dusk em silhueta sobre o horizonte. O degradê do céu muda devagar, as estrelas piscam e o sol se reflete na água. A tela funciona no computador e no celular, e fica parada para quem pede menos movimento no sistema.
- Ao clicar em Entrar, o sol desce e uma luz corre no horizonte até a resposta chegar. Se o login falhar, o sol volta, o painel treme de leve e a mensagem aparece com ícone.
- No celular, o campo de e-mail não recebe mais foco ao abrir a tela, para o teclado não cobrir a cena.

### Adicionado
- Logo nova, o sol sobre um sinal de concluído, na tela de login, na aba do navegador, no app instalado e nos avisos.

## [1.3.0] - 2026-11-02

Revisão de usabilidade: as regras ficaram previsíveis, as palavras ficaram iguais em todas as telas e o que faltava para o uso diário entrou. Requer a migration `0003_recurrence_and_push.sql` no Supabase antes do deploy: sem ela, o banco recusa as tarefas salvas pela nova versão.

### Adicionado
- Tarefas recorrentes: todo dia, dias úteis, toda semana ou todo mês. Ao concluir, a próxima é criada com o novo prazo, e o Desfazer desfaz as duas coisas.
- Avisos neste aparelho: um resumo pela manhã com atrasadas, prazos de hoje e lembretes, mesmo com o app fechado. Precisa das variáveis novas de `.env.example`.
- Busca global com `Ctrl+K` ou pelo botão Buscar: tarefas, projetos e telas.
- Selecionar várias tarefas na lista para concluir, mudar prioridade ou projeto, colocar no foco e arquivar, com Desfazer.
- "Mover para" nos cartões do quadro, no celular.
- "Criar e adicionar outra" na criação rápida, que também passou a usar os atalhos de data e a explicar Prazo e Lembrete.
- Página "Como funciona", que explica cada palavra do app.
- Aviso quando tarefas do foco de ontem ficaram por fazer, com "Trazer para hoje" e "Dispensar".
- Botão Editar visível na tarefa, e explicação de cada status na hora de escolher.

### Corrigido
- Sair de Aguardando ou Bloqueada encerra a pessoa e o lembrete dessa espera, e o histórico registra de quem você deixou de aguardar. Antes, um aviso antigo continuava aparecendo em tarefas já resolvidas.
- Concluir avisa quando há subtarefas abertas, quando a espera foi encerrada e quando um lembrete continua marcado.
- Reabrir volta para Em andamento quando a tarefa já tinha andado, em vez de sempre voltar para A fazer.
- Terminar a última subtarefa sugere concluir a tarefa, sem concluir sozinho.
- A ordem Recomendada coloca prazos próximos antes das tarefas sem data e respeita a prioridade dentro de cada grupo.
- Arquivar um projeto pergunta o que fazer com as tarefas. Restaurar traz de volta só as que foram arquivadas junto.
- O número de Hoje, a lista do painel e a tela Hoje mostram sempre as mesmas tarefas, e concluídas não entram mais nessa conta.
- "Ver todas" no painel abre exatamente as tarefas daquele bloco, sem filtros antigos escondendo itens.
- "Há quanto tempo aguardando" passou a contar desde o início da espera, não desde a última edição da tarefa.
- A linha da tarefa mostra prazo e lembrete quando ela tem os dois, cada um com seu nome.
- Campo Aguardando na edição só aparece quando o status pede, com o nome certo para Bloqueada.

### Alterado
- Vocabulário único: Lembrete no lugar de Revisão e Revisar novamente, Resolver lembrete no lugar de Registrar acompanhamento, Próximo passo no lugar de Próxima ação, Quadro no lugar de Kanban, Recomendada no lugar de Inteligente, Bloqueada e Concluída no feminino, como as demais.
- Painel reorganizado: primeiro o dia e o que espera por você; os gráficos e o relatório ficam no fim. Títulos mais diretos: Hoje, Outras que pedem atenção, Prioridade e prazo, Situação das abertas, Próximas duas semanas, Próximos lembretes.

### Conferido em produção
- Login, migrations e variáveis da Vercel funcionando, com a notificação do resumo diário entregue em um celular real.
- Novos cadastros bloqueados no Supabase pelo dono do projeto.

### Segurança
- Next.js atualizado de 16.3.8 para 16.4.3 e zod de 4.6.5 para 4.6.7, para corrigir falhas conhecidas nessas bibliotecas (GHSA-2464-fhr4-w9xw, GHSA-673q-mjm6-r5xr, GHSA-p3m5-59mp-jv5r e GHSA-mrhx-c7xc-m3w5). Nada muda no uso do app.

## [1.2.0] - 2026-11-02

### Adicionado
- Projetos com cor livre: além das 6 cores prontas, uma tela de escolha permite arrastar até a cor desejada ou digitar hex e RGB. Requer a migration `0002_project_custom_color.sql` no Supabase.

## [1.1.0] - 2026-10-30

### Adicionado
- Banco de dados: tarefas, projetos, subtarefas, histórico e configurações agora ficam no Supabase, com isolamento por usuário (RLS). Os dados sobrevivem à limpeza do navegador e aparecem em qualquer dispositivo.
- Login por e-mail e senha, conta nas Configurações e botão Sair.
- Fila local: alterações feitas sem conexão ficam guardadas no navegador e são enviadas depois. Um indicador mostra se está salvando, salvo ou sem conexão.
- Importação automática, uma vez por navegador, dos dados antigos do `localStorage`.
- Novo painel na visão geral: situação do dia em uma frase, percentual do dia, contadores clicáveis, "Para fazer hoje", mapa de urgência, barra de status e calendário de duas semanas.
- Relatórios de semana, quinzena e mês: concluídas, criadas, entrega no prazo, tempo até concluir, gráfico diário, concluídas por projeto, mapa de atividade, tempo em aberto e quem você está aguardando.
- Criação rápida com prioridade, revisão e foco de hoje, para o painel refletir a tarefa desde o início. A prioridade na tela da tarefa agora diz o que é e mostra que dá para clicar.
- Todo bloco do relatório abre as tarefas contadas: concluídas por projeto, tempo em aberto, quem você está aguardando e "+N tarefas" do calendário.
- Prioridade visível em todas as linhas e cards, com menu para mudar sem abrir a tarefa.
- Filtros de prazo "Depois de hoje, em até 7 dias" e "Daqui a mais de 7 dias" na lista de tarefas.
- Documentação reorganizada para consulta por IA: `AGENTS.md` como entrada, mais `docs/ARCHITECTURE.md`, `docs/DATA_MODEL.md`, `docs/FEATURES.md`, `docs/DASHBOARD.md` e `docs/SETUP.md`, além de regra para manter tudo em dia e teste que acusa versão, links e migrations fora de sincronia.

### Alterado
- A visão geral não tem mais as seções "Foco de hoje", "Precisa da sua atenção" e "Resumo" separadas: elas foram reunidas em "Para fazer hoje" e no resumo do dia.
- "Apagar todos os dados" e "Importar backup" agora também afetam o banco.
- Backup passa a ser uma cópia extra, não o único jeito de levar dados para outro dispositivo.

### Removido
- `docs/FEATURE_STATUS.md`, substituído por `docs/FEATURES.md`.
- `StoreHydrator`, substituído pelo hook `useStoreHydration`.

## [1.0.1] - 2026-10-02

Ajustes depois da primeira entrega, a partir do uso real.

### Adicionado
- Seção "Revisões" na visão geral com as revisões vencidas, de hoje e dos próximos 7 dias.
- Aviso ao abrir o app quando há tarefas para revisar hoje, com atalho para vê-las.
- Revisões de tarefas concluídas (acompanhamento pós-entrega) também aparecem na visão geral, no aviso e no filtro "Revisão vencida".
- "Registrar acompanhamento" em tarefas concluídas: anota como foi no histórico e encerra ou reagenda o lembrete, sem reabrir a tarefa.

### Alterado
- Ao criar uma tarefa, o app abre a tela da tarefa recém-criada.

### Corrigido
- Os números do resumo ("em andamento", "concluídas nesta semana") agora abrem a lista já filtrada, mesmo para quem usa o Kanban como padrão.
- Concluídas aparecem da conclusão mais recente para a mais antiga.
- Resumo legível no mobile.

## [1.0.0] - 2026-10-02

Primeira versão utilizável, cobrindo o escopo V1 do PRD.

### Adicionado
- Base Next.js + TypeScript + Tailwind com o tema Pastel Dusk (Geist / Geist Mono, paleta e tokens do PRD).
- Persistência local versionada (`dusk:v1`) com validação, migrations, preservação de dados ilegíveis e sincronização entre abas.
- Criação rápida de tarefas (tecla `N`, botão e `+` no mobile).
- Visão geral: saudação, foco de hoje, precisa da sua atenção, aguardando, resumo e projetos recentes.
- Lista de tarefas agrupada e vistas Hoje, Próximas, Aguardando e Atrasadas.
- Kanban com arrastar e soltar por mouse, toque e teclado.
- Busca instantânea, filtros em chips e ordenação inteligente.
- Detalhe da tarefa com próxima ação em destaque, aguardando, último avanço, subtarefas e histórico.
- Atualização de andamento estruturada com presets.
- Foco de hoje, conclusão em um clique com desfazer, reabrir, arquivar e excluir.
- Projetos com paleta fixa, tela agrupada por status e exclusão sem cascade.
- Arquivo de tarefas e projetos.
- Configurações: nome na saudação, visualização padrão, exportar/importar backup JSON, apagar todos os dados.
- Dados de exemplo opcionais na primeira abertura.
- Navegação desktop (sidebar recolhível) e mobile (barra inferior com `+` central).
