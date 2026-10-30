# Changelog

Todas as mudanças relevantes do Dusk, da mais recente para a mais antiga. Formato inspirado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).

Toda mudança entra aqui na mesma entrega, com a data. As regras estão em [`AGENTS.md`](AGENTS.md).

## [1.1.0] - 2026-10-30

### Adicionado
- Banco de dados: tarefas, projetos, subtarefas, histórico e configurações agora ficam no Supabase, com isolamento por usuário (RLS). Os dados sobrevivem à limpeza do navegador e aparecem em qualquer dispositivo.
- Login por e-mail e senha, conta nas Configurações e botão Sair.
- Fila local: alterações feitas sem conexão ficam guardadas no navegador e são enviadas depois. Um indicador mostra se está salvando, salvo ou sem conexão.
- Importação automática, uma vez por navegador, dos dados antigos do `localStorage`.
- Novo painel na visão geral: situação do dia em uma frase, percentual do dia, contadores clicáveis, "Para fazer hoje", mapa de urgência, barra de status e calendário de duas semanas.
- Relatórios de semana, quinzena e mês: concluídas, criadas, entrega no prazo, tempo até concluir, gráfico diário, concluídas por projeto, mapa de atividade, tempo em aberto e quem você está aguardando.
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
