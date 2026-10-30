# Modelo de dados

Existem três representações do mesmo dado. `src/lib/persistence/rows.ts` converte entre elas.

| Forma | Onde | Uso |
| --- | --- | --- |
| `AppData` / `PersistedAppState` | `src/domain/` | Tudo no app. Camel case, com subtarefas e histórico dentro da tarefa |
| `RowSet` | `rows.ts` | Linhas por tabela e por id, em snake case, para calcular diferenças |
| Tabelas | Supabase | Fonte da verdade |

## Domínio

Definido em `src/domain/task.ts`, `project.ts`, `settings.ts` e `app-data.ts`.

**Task**

| Campo | Tipo | Notas |
| --- | --- | --- |
| `id` | string | Gerado no cliente por `createId()` |
| `title` | string | Obrigatório |
| `status` | `todo`, `in_progress`, `waiting`, `blocked`, `completed` | A fazer, Em andamento, Aguardando, Bloqueado, Concluído |
| `priority` | `urgent`, `high`, `normal`, `low` | Urgente, Alta, Normal, Baixa |
| `projectId` | string opcional | |
| `dueDate` | `YYYY-MM-DD` opcional | Prazo: quando precisa estar pronto |
| `reviewDate` | `YYYY-MM-DD` opcional | Revisão: quando voltar a olhar. Vale também para concluídas (acompanhamento) |
| `focusDate` | `YYYY-MM-DD` opcional | No foco só nesse dia, expira sozinho |
| `lastDone`, `waitingFor`, `nextAction`, `note` | string opcional | Contexto atual |
| `subtasks` | `Subtask[]` | `id`, `title`, `completed`, `createdAt`, `completedAt?` |
| `updates` | `TaskUpdate[]` | Histórico imutável |
| `createdAt`, `updatedAt`, `completedAt?`, `archivedAt?` | ISO | Instantes |

**TaskUpdate:** `id`, `taskId`, `type` (`progress`, `status_change`, `completed`, `reopened`), `preset?`, `status`, `done?`, `waitingFor?`, `nextAction?`, `note?`, `reviewDate?`, `createdAt`.

**Project:** `id`, `name` (até 60 caracteres), `color` (`lavender`, `periwinkle`, `peach`, `rose`, `sage`, `sand`), `description?`, `archivedAt?`, `createdAt`, `updatedAt`.

**AppSettings:** `theme`, `defaultTaskView` (`list` ou `kanban`), `sidebarCollapsed`, `displayName?`.

## Banco

Supabase, projeto **Dusk** (ref `ylkyznsaribnccdfbpkd`). O schema está em `supabase/migrations/`.

| Tabela | Chave primária | Relações |
| --- | --- | --- |
| `projects` | `(user_id, id)` | |
| `tasks` | `(user_id, id)` | `project_id` → `projects`. Ao apagar o projeto, só `project_id` vira `null` |
| `subtasks` | `(user_id, id)` | `task_id` → `tasks`, cascade. `position` guarda a ordem |
| `task_updates` | `(user_id, id)` | `task_id` → `tasks`, cascade. `position` guarda a ordem |
| `user_settings` | `user_id` | Uma linha por usuário |

- Os ids são texto porque nascem no cliente, o que permite criar itens sem conexão. Por isso a chave inclui `user_id`.
- Toda tabela referencia `auth.users` com `on delete cascade`.
- Datas civis usam `date`, e instantes usam `timestamptz`.
- As colunas têm os mesmos nomes dos campos do domínio, em snake case. O teste "schema do banco" em `rows.test.ts` compara a migration com as linhas geradas e falha se divergirem.

### Segurança

- RLS ligado em todas as tabelas, com uma política `<tabela>_own_rows` para `authenticated`: `auth.uid() = user_id` em leitura e escrita.
- `anon` não tem nenhuma permissão.
- O cliente usa só a chave publishable. A chave secret nunca entra no projeto.

## Chaves no navegador

| Chave | Conteúdo |
| --- | --- |
| `dusk:v2:<uid>:outbox` | Fila de mudanças ainda não enviadas (`RowChanges`) |
| `dusk:v2:<uid>:cache` | Último estado conhecido, para abrir sem conexão. Apagado no logout |
| `dusk:v2:<uid>:rejected` | Mudanças que o banco recusou, guardadas para recuperação manual |
| `dusk:v1` | Formato antigo, antes do banco. Importado uma vez e depois renomeado |
| `dusk:v1:imported:<ts>` | Cópia do que foi importado |
| `dusk:v1:recovery:<ts>` | Cópia de dados antigos que não puderam ser lidos |

A sessão do Supabase Auth também fica no `localStorage`, gerenciada pela biblioteca.

## Validação e versões

- `SCHEMA_VERSION` (`app-data.ts`) versiona o `PersistedAppState`, usado no cache, nos backups e na chave legada.
- `src/lib/persistence/schema.ts` valida de forma tolerante: campo opcional inválido vira `undefined`, enum inválido volta ao padrão e item sem `id` ou título é descartado sozinho.
- `src/lib/persistence/migrations.ts` converte versões antigas do JSON. Versão futura é recusada.

## Migrations

Migrations aplicadas:

- `0001_initial_schema.sql`

Para mudar o banco:

1. Crie `supabase/migrations/NNNN_descricao.sql` e nunca edite uma já aplicada.
2. Aplique no SQL Editor do Supabase, porque o projeto não usa a CLI.
3. Atualize o tipo em `src/domain`, o mapeamento em `rows.ts` e o schema zod.
4. Se o formato do JSON mudar, incremente `SCHEMA_VERSION` e registre em `migrations.ts`.
5. Atualize a lista acima, as tabelas deste documento e o `CHANGELOG.md`.
6. Rode `npm test`: o teste de colunas lê a migration `0001`. Ao adicionar colunas por `alter table`, estenda o teste para considerar as novas migrations.
