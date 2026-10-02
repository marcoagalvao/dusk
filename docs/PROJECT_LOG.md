# Project Log — Dusk

Registro cronológico do desenvolvimento da V1, a partir de `PRD_Dusk_Task_Manager.md`.

## 2026-10-02 - Estrutura base

### Implementado
- Scaffold Next.js 16.3 (App Router, Turbopack) + React 19.2 + TypeScript strict + Tailwind CSS v4 + ESLint.
- Dependências do PRD: Zustand, date-fns, Lucide, dnd-kit, Radix UI (pacote unificado `radix-ui`).
- `zod` para validar dados não confiáveis e `vitest` para testes de domínio.
- Tokens do tema Pastel Dusk em `src/app/globals.css` (`@theme`): superfícies, texto, primária, status, prioridade, cores de projeto, escala tipográfica, raios, sombras discretas e animações 120/180/220 ms.
- Arquivos de acompanhamento em `docs/`.

### Decisões técnicas
- Scaffold criado no scratchpad e copiado para a pasta (o `create-next-app` não aceita diretório com arquivos).
- `@types/node` alinhado ao Node 24 local para resolver conflito de peer dependency com o Vitest 5.
- Documentação local do Next 16 (`node_modules/next/dist/docs`) consultada: `params` é Promise, `PageProps`/`LayoutProps` são helpers globais gerados por `next typegen`.

## 2026-10-02 - Domínio e persistência

### Implementado
- `src/domain`: tipos e constantes (`task`, `project`, `settings`, `app-data`, `backup`), regras puras (`task-rules`, `project-rules`), consultas (`task-queries`: atenção, ordenação inteligente, escopos, filtros, busca, agrupamento) e presets de andamento.
- `src/lib/persistence`: interface `AppPersistence`, `LocalStoragePersistence` (chave `dusk:v1`), schema zod tolerante, registro de migrations.
- `src/lib/backup`: criação, nome de arquivo e parse/validação de backup.
- Store único Zustand com slices `tasks`, `projects`, `settings`, `data`, persistido via adapter próprio sobre o `persist` middleware.
- 58 testes de domínio, datas, persistência e backup.

### Decisões técnicas
- O formato salvo é exatamente o `PersistedAppState` do PRD (não o envelope `{state, version}` do Zustand).
- Hidratação manual (`skipHydration`) depois da montagem, com placeholder curto, para evitar mismatch SSR.
- Sincronização entre abas via evento `storage` + `rehydrate()`; escrita ignorada quando o conteúdo não mudou.

### Problemas encontrados
- Conferido no código do `persist` (v5) que a hidratação usa o `set` interno e não grava de volta — sem ping-pong entre abas.

## 2026-10-02 - Fluxo de tarefas e andamento

### Implementado
- Layout: sidebar desktop recolhível, navegação inferior mobile com `+` central e sheet "Mais", header de página, skip link.
- Criação rápida (`N`, botão, `+` mobile) com título, projeto e prazo; Enter cria, Esc fecha, toast "Tarefa criada".
- Lista de tarefas com agrupamento Hoje / Próximas / Sem data, vistas Hoje, Próximas, Aguardando e Atrasadas.
- Busca, filtros em popover com chips ativos removíveis e ordenação.
- Detalhe da tarefa com a hierarquia do §16, controles inline de status, prioridade, projeto, prazo e revisão, ações contextuais e menu.
- Modal de andamento com presets, foco no campo esperado, Ctrl+Enter e timeline imutável.
- Subtarefas, foco de hoje, conclusão em um clique com animação e desfazer, reabrir, arquivar (com desfazer), excluir com confirmação.

### Alterado
- Sugestão de cor de projeto passou de aleatória para "cor menos usada" (determinística e mais útil).
- Foco de campos por preset passou a usar `id` em vez de refs (regra `react-hooks/refs` do React Compiler).

### Problemas encontrados
- O painel do navegador embutido fica sem desenhar quando a janela está oculta: animações congelam e cliques falham. Testes passaram a ser dirigidos por JavaScript (`element.click()`), com screenshots quando possível.
- Isso revelou um risco real: durante os 180 ms da animação de saída o formulário ainda está montado e um Enter repetido criaria a tarefa duas vezes. Corrigido com guarda de submit único em todos os formulários de diálogo.
- Flash de "Tarefa não encontrada" entre excluir e navegar de volta. Corrigido.

### Próximos passos
- Projetos (lista, detalhe agrupado por status, exclusão segura).

## 2026-10-02 - Projetos

### Implementado
- `/projects` com projetos ativos ordenados por atividade recente, contagens e progresso.
- `/projects/[id]` com tarefas agrupadas por status (Em andamento, Aguardando, Bloqueado, A fazer, Concluídas), criação de tarefa já associada, editar, arquivar e excluir.
- Formulário de projeto com paleta fixa de 6 cores; a cor sugerida é a menos usada.
- Exclusão sem cascade: com tarefas associadas, o usuário escolhe arquivar, mover as tarefas para outro projeto ou remover a associação.

### Validado
- Criar projeto → navega para ele → nova tarefa já vem com o projeto → sidebar mostra o projeto recente.
- Exclusão com tarefas oferece as três opções ("Mover" desabilitado sem outro projeto ativo); "remover associação" mantém as tarefas.

## 2026-10-02 - Dashboard

### Implementado
- Saudação com nome opcional, data longa e a "linha do dia" (único ornamento da interface).
- Foco de hoje (abertas e concluídas do dia), seletor de foco com limite sugerido de 5.
- "Precisa da sua atenção" com motivo explícito por tarefa (Venceu, Revisar, Urgente, Prazo hoje, No foco aguardando, Bloqueada).
- Aguardando, resumo numérico com links para as vistas e projetos recentes.
- Primeira abertura sem onboarding: CTA "Criar primeira tarefa" e dados de exemplo opcionais, gerados com as regras de domínio.

### Problemas encontrados
- Datas apareciam duplicadas nas linhas no mobile: `hidden sm:inline-flex` competia com o `inline-flex` base do componente (sem tailwind-merge, vence a ordem do CSS). Revisados todos os pontos com o mesmo padrão e documentada a regra no `cn`.

## 2026-10-02 - Kanban

### Implementado
- Alternância Lista/Kanban em `/tasks`, lembrada em `settings.defaultTaskView`.
- Cinco colunas; Concluído mostra o que terminou nos últimos 7 dias.
- dnd-kit com `MouseSensor` (6 px), `TouchSensor` (220 ms) e `KeyboardSensor` com setas saltando entre colunas, anúncios em pt-BR e `DragOverlay` elevado.
- Soltar em Aguardando sem `waitingFor` oferece "Registrar quem" (abre o andamento).

### Validado
- Arraste por teclado e por mouse; Concluído define `completedAt` + evento `completed`; sair de Concluído limpa e registra `reopened` com o novo status; estado persiste.

### Problemas encontrados
- A 5ª coluna ficava cortada a 1440 px; largura mínima reduzida para 200 px.

## 2026-10-02 - Arquivo, configurações e backup

### Implementado
- `/archive` com projetos e tarefas arquivados, restaurar e excluir.
- `/settings`: tema, nome da saudação, visualização padrão, exportar/importar backup, apagar tudo com "APAGAR", versão do app e do schema, aviso de armazenamento local.

### Validado
- Exportação capturada sem baixar arquivo: nome `dusk-backup-YYYY-MM-DD-HHmm.json`, campos do §38.
- Importação rejeita JSON inválido, outro app e versão futura; resumo antes de restaurar, com aviso de itens inválidos ignorados.
- Dados corrompidos no localStorage: cópia preservada em `dusk:v1:recovery:*` e aviso.

### Problemas encontrados
- Avisos e cópias de recuperação duplicados: o `rehydrate()` roda de novo (StrictMode em dev, evento `storage` em produção). O adapter passou a reportar cada conteúdo problemático uma única vez (com teste).

## 2026-10-02 - Revisão geral e refinamento

### Implementado
- Página 404 no estilo do app, ícone próprio (`app/icon.svg`), remoção dos assets padrão do scaffold.
- Rodapé de diálogo fixo no mobile para a ação principal nunca sair da tela.
- README completo.

### Revisão de código (skill `code-review`, esforço alto) — 10 achados, todos corrigidos
- Estado de "concluindo" nunca voltava ao normal: no foco de hoje (onde a concluída continua visível) e após "Desfazer", a linha ficava apagada e o checkbox não respondia.
- Apagar tudo em uma aba era desfeito pela outra aba na próxima alteração.
- Campo de nome nas configurações ficava desatualizado após importar backup e sobrescrevia o valor restaurado.
- Tarefas concluídas mostravam "Revisar desde…" em destaque.
- Rótulo do "voltar" no detalhe podia não corresponder ao destino.
- Criação rápida podia usar um projeto padrão oculto.
- Toast duplicado ao soltar em Aguardando; texto de datas reimplementado no dashboard; hex de cores de projeto duplicado e sem uso; Esc na edição de subtarefa podia salvar via blur.

### Validação final
- `npm run lint`, `npm run typecheck`, `npm test` (59 testes) e `npm run build` sem erros.
- Fluxos verificados no navegador em 1280–1440 px e 375 px.

### Limitações conhecidas
- Arraste por toque no Kanban não testado em aparelho físico (ver `FEATURE_STATUS.md`).
- O date picker é o nativo do navegador: o formato exibido segue o idioma do navegador/sistema.

## 2026-10-02 - Ajustes pós-entrega (feedback de uso)

### Problemas encontrados
- Clicar em "concluídas nesta semana" no resumo abria `/tasks` com o filtro padrão "Abertas", escondendo justamente as concluídas. O mesmo valia para "em andamento". Além disso, com o Kanban como visualização padrão, filtros de status e de situação não se aplicam.

### Alterado
- Cada linha do resumo aplica o filtro correspondente (limpando os demais e a busca) e abre `/tasks?view=list`. O parâmetro `view` força a visualização sem alterar a preferência salva; escolher a visualização à mão remove o parâmetro.
- Ordenação inteligente: concluídas aparecem da conclusão mais recente para a mais antiga.

### Implementado
- Seção "Revisões" na Home, com revisões vencidas, de hoje e dos próximos 7 dias de tarefas abertas (`getUpcomingReviews`, com teste).
- Aviso dentro do app quando há revisões para hoje ou atrasadas: aparece ao abrir o app e quando o dia vira com o app aberto, uma vez por dia na sessão. "Ver" abre a tarefa (se for uma) ou a lista filtrada por "Revisão vencida".
- Resumo em uma coluna no mobile (o rótulo "concluídas nesta semana" era cortado).

### Alterado (segundo retorno)
- Uma tarefa concluída com "Revisar terça" não aparecia na seção "Revisões": a regra inicial ignorava concluídas. Por decisão do usuário, revisões de concluídas passam a valer (acompanhamento pós-entrega): nova regra `isReviewReached` usada na seção, no aviso, no filtro "Revisão vencida" e no chip do detalhe; o item mostra "Concluída". "Precisa da sua atenção" segue só com tarefas abertas. O "Ver" do aviso abre a lista com situação "Todas".

### Implementado (terceiro retorno)
- O uso real foi esclarecido: concluir a entrega e marcar "revisar" para a semana seguinte, para perguntar ao cliente se está tudo ok. Faltava fechar o ciclo, já que a tarefa concluída só oferecia "Reabrir".
- Botão "Registrar acompanhamento" em tarefas concluídas e bloco "Acompanhamento" no detalhe (mostra quando revisar). O diálogo pede "Como foi?" e "Acompanhar de novo em" (vazio encerra o lembrete). O registro entra no histórico marcado como "Acompanhamento", vira o "Último avanço" e a tarefa continua concluída.
- Em tarefas concluídas sem próxima ação, a seção "Próxima ação" deixa de aparecer ("Nenhuma ação pendente" contradizia o acompanhamento).

### Alterado (quarto retorno)
- A criação rápida passou a abrir a tarefa recém-criada, a pedido do usuário. O toast "Tarefa criada" continua, e o "voltar" do detalhe retorna à tela onde a criação começou (Home, projeto ou lista).
