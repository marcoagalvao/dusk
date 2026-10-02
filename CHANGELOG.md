# Changelog

Todas as mudanças relevantes do Dusk. Formato inspirado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).

## [Não lançado]

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
