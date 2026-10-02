# Feature Status — Dusk V1

Checklist vivo baseado em `PRD_Dusk_Task_Manager.md`.

Legenda: `[ ]` não iniciado · `[~]` em andamento · `[x]` concluído · `[!]` possui problema ou pendência

## Base e infraestrutura

- [x] Projeto Next.js + TypeScript + Tailwind
- [x] Tokens do tema Pastel Dusk centralizados (§50–57, §79)
- [x] Tipografia Geist / Geist Mono (§54–55)
- [x] Rotas previstas no PRD (§9)
- [x] Testes de domínio (Vitest)

## Domínio e persistência

- [x] Tipos `Task`, `Subtask`, `TaskUpdate`, `Project`, `AppSettings` (§11, §19, §23, §25, §74)
- [x] IDs com `crypto.randomUUID()` (§45)
- [x] Datas civis `YYYY-MM-DD` em fuso local + ISO para timestamps (§46)
- [x] Store único Zustand com slices (tasks, projects, settings) (§44)
- [x] Persist middleware sobre adapter `AppPersistence` (§40, §42)
- [x] `LocalStoragePersistence` na chave `dusk:v1` (§40)
- [x] Estado persistido versionado (`schemaVersion`) (§43)
- [x] Mecanismo de migrations explícitas (§43)
- [x] Validação/sanitização de dados lidos do localStorage
- [x] Preservação de dados corrompidos antes de descartar
- [x] Hidratação sem mismatch SSR
- [x] Sincronização entre abas do mesmo navegador

## Tarefas (§11–16, §68)

- [x] Criar tarefa apenas com título (status `todo`, prioridade `normal`)
- [x] Criação rápida em modal compacto (título, projeto, prazo) (§15)
- [x] Atalho `N` para nova tarefa fora de campos de texto (§15, §36)
- [x] Enter cria / Esc fecha (§15)
- [x] Toast `Tarefa criada` (§15)
- [x] Editar título e campos de contexto
- [x] Alterar status
- [x] Alterar prioridade
- [x] Definir projeto
- [x] Definir prazo (`dueDate`)
- [x] Definir revisar novamente (`reviewDate`)
- [x] Concluir em um clique com animação ○ → ✓ (§31)
- [x] Desfazer conclusão via toast (§31)
- [x] Reabrir tarefa (§12)
- [x] Arquivar / restaurar tarefa (§32)
- [x] Excluir tarefa com confirmação curta (§33)
- [x] Detalhe da tarefa com hierarquia do PRD (§16)
- [x] Ações do detalhe: Iniciar, Atualizar andamento, Aguardando, Concluir, Reabrir, Editar, Arquivar, Excluir (§16)
- [x] Dados sobrevivem a refresh

## Andamento e histórico (§17–21, §69)

- [x] Modal de atualização de andamento estruturado (§17)
- [x] Presets: V1 concluída, Enviado ao cliente, Aguardando cliente, Ajustes solicitados, Em revisão, Resposta recebida, Finalizado (§18)
- [x] Presets pré-preenchem e focam o campo esperado (§18)
- [x] Textos pré-preenchidos editáveis (§18)
- [x] Salvar atualiza campos atuais, status e `updatedAt` (§17)
- [x] Salvar cria item imutável na timeline (§19)
- [x] Resposta recebida limpa espera e review (§18)
- [x] Finalizado conclui a tarefa (§18)
- [x] Timeline do mais recente para o mais antigo (§19)
- [x] Eventos `status_change`, `completed`, `reopened` (§19, §27)
- [x] `nextAction` com destaque visual (§20)
- [x] Incentivo a `waitingFor` + `reviewDate` ao marcar Aguardando (§21)

## Subtarefas (§25)

- [x] Adicionar subtarefa
- [x] Marcar/desmarcar subtarefa
- [x] Renomear subtarefa
- [x] Remover subtarefa
- [x] Progresso `3 / 5 · 60%`

## Foco de hoje (§22)

- [x] `focusDate` com expiração natural no dia seguinte
- [x] Adicionar / remover do foco
- [x] Incentivo visual a no máximo 5 tarefas (sem bloqueio)
- [x] Seletor para adicionar tarefas ao foco a partir do estado vazio

## Projetos (§23–24, §33)

- [x] Criar projeto (nome + cor obrigatórios, descrição opcional)
- [x] Paleta fixa de 6 cores (§24)
- [x] Editar projeto
- [x] Arquivar / restaurar projeto
- [x] Tela de projetos (lista completa)
- [x] Tela do projeto com tarefas agrupadas por status (§23)
- [x] Exclusão bloqueada quando há tarefas: arquivar, mover tarefas, remover associação (§33)

## Lista, busca, filtros e ordenação (§26, §28–30)

- [x] Lista padrão em `/tasks` agrupada em Hoje / Próximas / Sem data (§26)
- [x] Linha mostra conclusão, título, projeto, status, data relevante, prioridade alta/urgente (§26)
- [x] Vistas Hoje, Próximas, Aguardando, Atrasadas (§8–9)
- [x] Busca textual instantânea (título, projeto, último avanço, aguardando, próxima ação, observação) (§28)
- [x] Filtros em chips/popover: projeto, status, prioridade, prazo, foco, review vencido, abertas/concluídas (§29)
- [x] Ordenação: Inteligente, Prazo, Prioridade, Mais recente, Mais antiga, Alfabética (§30)

## Kanban (§27, §71)

- [x] Alternância Lista / Kanban em `/tasks` (§27)
- [x] Cinco colunas por status
- [!] Drag-and-drop com dnd-kit (mouse e touch) — mouse e teclado validados no navegador; toque configurado (`TouchSensor` com atraso de 220 ms para não conflitar com a rolagem horizontal), mas ainda não testado em aparelho físico.
- [x] Mover card altera status imediatamente
- [x] Concluído define `completedAt` e cria evento; sair limpa e cria `reopened`
- [x] Card elevado durante o arraste (§35)
- [x] Alternativa acessível via teclado (§61)
- [x] Estado persiste após reload

## Dashboard (§10, §70)

- [x] Saudação e data (§10)
- [x] Foco de hoje
- [x] Precisa da sua atenção (regras e ordenação do §10)
- [x] Aguardando
- [x] Resumo compacto numérico
- [x] Projetos recentes
- [x] Resumo abre a lista já filtrada (em andamento, concluídas) — ajuste pós-entrega
- [x] Seção "Revisões": vencidas, de hoje e dos próximos 7 dias — ajuste pós-entrega
- [x] Aviso no app quando chega o dia de revisar (uma vez por dia, com atalho "Ver") — ajuste pós-entrega
- [x] Revisões de tarefas concluídas também entram na seção, no aviso e no filtro — ajuste pós-entrega
- [x] "Registrar acompanhamento" em tarefas concluídas: registra como foi no histórico e encerra ou reagenda o lembrete — ajuste pós-entrega
- [x] Abrir tarefa clicando no card
- [x] Seções vazias compactas
- [x] Primeira abertura: CTA `Criar primeira tarefa` + exemplos opcionais (§73)

## Arquivo (§32)

- [x] `/archive` com tarefas e projetos arquivados
- [x] Restaurar itens arquivados
- [x] Excluir permanentemente a partir do arquivo

## Configurações e backup (§37–39, §72)

- [x] Aparência: tema fixo Pastel Dusk
- [x] Visualização padrão de tarefas (lista/kanban)
- [x] Exportar backup `dusk-backup-YYYY-MM-DD-HHmm.json` (§38)
- [x] Importar backup com validação (app, schemaVersion, estrutura) (§38)
- [x] Resumo antes de restaurar + confirmação (§38)
- [x] Rejeitar JSON inválido e backup de outro app (§72)
- [x] Apagar todos os dados com confirmação `APAGAR` (§39)
- [x] Sobre: versão do app, versão do schema, aviso de armazenamento local (§37)

## Navegação e layout (§8, §59–60)

- [x] Sidebar desktop fixa (240–260px) com vistas e projetos recentes
- [x] Sidebar recolhível (`sidebarCollapsed`) (§74)
- [x] Navegação inferior mobile: Início, Tarefas, +, Projetos, Mais (§8)
- [x] Header de página limpo com ações à direita (§59)

## Feedback, acessibilidade e qualidade (§34–36, §61–62)

- [x] Toasts para criar, salvar, concluir, restaurar, exportar, importar, erros (§35)
- [x] Durações de animação 120/180/220 ms (§35)
- [x] Respeito a `prefers-reduced-motion`
- [x] Estados vazios humanos (§34)
- [x] Foco visível e navegação por teclado em modais (§61)
- [x] Status não comunicado só por cor (§61)
- [x] Botões icon-only com `aria-label` (§61)
- [x] Responsividade revisada em todos os fluxos (§60)
- [x] Lint, typecheck e build sem erros

## Notas de escopo

- Itens que o PRD coloca em V1.1/V2 não foram implementados: PWA, Command Palette (`Ctrl+K`), atalhos `F`/`E`/`C`, sincronização/Supabase, tema claro.
- Adição mínima ao modelo: `displayName` opcional em `AppSettings` para a saudação "Boa tarde, Marco." do §10 (ver `TECHNICAL_DECISIONS.md`).

## Backlog / ideias futuras

_Itens fora do escopo da V1 identificados durante o desenvolvimento. Não implementados._

- Pausar o tempo do toast de "Desfazer" enquanto o ponteiro estiver sobre ele.
- Tela para listar e restaurar as cópias de recuperação (`dusk:v1:recovery:*`) sem precisar importar backup.
- Lembrete leve para exportar backup (ex.: "último backup há 14 dias"), já que os dados vivem só no navegador.
- Mover card para outra coluna pelo próprio card no Kanban mobile (menu "Mover para"), como alternativa ao arraste por toque.
- Agrupar a vista "Próximas" por dia ("Amanhã", "Sábado, 4 out").
- Edição inline do título no detalhe da tarefa (hoje é pelo diálogo "Editar").
