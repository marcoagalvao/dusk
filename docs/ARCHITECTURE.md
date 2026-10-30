# Arquitetura

Como o Dusk é organizado e como um dado vai da tela ao banco e volta.

## Visão geral

O Dusk é um app Next.js que roda quase todo no navegador. Não há API própria nem Server Actions: o navegador fala direto com o Supabase, e o RLS garante que cada usuário só alcance as próprias linhas.

```text
Componente ─► actions/* ─► store Zustand ─► persist (store/persistence.ts)
                               ▲                     │
                               │                     ▼
                         load() devolve       SyncedPersistence ──► localStorage
                         estado validado             │              (fila e cache)
                                                     ▼
                                              SupabaseRemote ──► Supabase (Postgres + RLS)
```

## Pastas

| Caminho | Papel |
| --- | --- |
| `src/app/` | Rotas. Páginas finas que renderizam as views |
| `src/components/layout/` | `AppShell` (portão de login e estados de carga), sidebar, navegação mobile, `PageContainer` |
| `src/components/auth/` | `LoginView`, `useAuthUser` |
| `src/components/dashboard/` | Painel da visão geral (ver `DASHBOARD.md`) |
| `src/components/tasks/`, `projects/`, `archive/`, `settings/` | Telas de cada área |
| `src/components/ui/` | Componentes-base, incluindo `SyncBadge` |
| `src/actions/` | Mutações com feedback: tarefas, projetos, dados e login |
| `src/store/` | `app-store` (dados, com slices), `ui-store` (estado de interface, em memória), `persistence` (ponte com o `persist`) |
| `src/domain/` | Tipos, regras e consultas puras, incluindo `dashboard-metrics.ts` |
| `src/hooks/` | `use-store-hydration`, `use-clock`, `use-hotkey`, `use-review-reminder` |
| `src/lib/persistence/` | Sincronização, mapeamento para linhas, schema zod, migrations e leitor legado |
| `src/lib/supabase/client.ts` | Cliente Supabase único e checagem das variáveis de ambiente |
| `src/lib/backup/`, `src/lib/dates/`, `src/lib/utils/` | Backup JSON, datas pt-BR e utilitários |
| `supabase/migrations/` | SQL versionado do banco |

## Rotas

| Rota | Tela |
| --- | --- |
| `/` | Visão geral (painel) |
| `/tasks` | Lista ou Kanban. `?view=list\|kanban` força a visualização sem mudar a preferência |
| `/tasks/today`, `/tasks/upcoming`, `/tasks/waiting`, `/tasks/overdue` | Vistas filtradas |
| `/tasks/[id]` | Detalhe da tarefa |
| `/projects`, `/projects/[id]` | Projetos |
| `/archive` | Arquivo |
| `/settings` | Configurações, backup e conta |

## Abertura do app

`AppShell` decide o que mostrar, nesta ordem:

1. **Variáveis ausentes:** tela `ConfigMissing`.
2. **Sessão ainda sendo lida:** placeholder.
3. **Sem sessão:** `LoginView`.
4. **Com sessão:** `AuthenticatedShell`, que chama `useStoreHydration(userId)`. Enquanto carrega, mostra um placeholder. Se a primeira carga falhar e não houver cache, mostra `LoadFailed` com "Tentar de novo".

A store usa `skipHydration`, então só é carregada depois da montagem e do login. Isso evita diferença entre servidor e cliente e o flash de estado vazio.

## Login

- Só e-mail e senha, via Supabase Auth. A sessão fica no `localStorage`, e não há middleware nem cookies.
- A interface não tem cadastro: o usuário é criado no painel do Supabase (ver `SETUP.md`).
- `signOut` (`src/actions/auth-actions.ts`) tenta enviar a fila. Se ainda houver pendências, cancela a saída e avisa, para não perder alterações. Se o Supabase não confirmar a saída (sem rede, por exemplo), o usuário continua logado e conectado. Ao sair, o cache local é apagado.
- A limpeza da store acontece depois de `disconnect()`. Por isso zerar a memória no logout não vira `DELETE` no banco.

## Sincronização

Implementada em `src/lib/persistence/synced-persistence.ts`.

**Ao salvar** (qualquer mudança no store):

1. `stateToRows` transforma o estado em linhas.
2. `diffRows` compara com a última base conhecida e gera só as linhas alteradas. `null` significa removida.
3. As mudanças entram na fila em `localStorage` antes de qualquer envio, e o cache é atualizado.
4. Depois de 400 ms, `flush` envia a fila: `SupabaseRemote.apply` faz upsert e delete em lotes.

**Em caso de falha:**

| Falha | O que acontece |
| --- | --- |
| Temporária (rede, 5xx) | Fica na fila, o status vira `offline`, tenta de novo com espera crescente de 2 s até 60 s e também quando o navegador volta a ficar online |
| Permanente (Postgres 22xxx e 23xxx) | O lote é reenviado linha a linha. Só a linha recusada vai para `dusk:v2:<uid>:rejected` e o usuário é avisado. Na próxima leitura, a tela volta ao que está no banco |
| Navegador não aceita gravar a fila (cheio ou bloqueado) | A fila fica na memória, continua sendo enviada e o usuário é avisado para manter a aba aberta |

**Ao ler** (`load`): envia a fila, busca tudo com paginação de 1000 linhas, aplica o que ainda estiver pendente por cima, valida com zod e só troca o estado se houver novidade. Sem conexão, usa o cache. Se o usuário editou durante a leitura, o resultado é descartado por já estar velho.

**Quando atualiza sozinho:** ao focar a janela, ao voltar a ficar visível, ao voltar a conexão e a cada 60 s com a aba visível. Leituras simultâneas compartilham a mesma consulta. Ao esconder a aba, envia a fila.

**Enquanto não carregou:** `save` ignora tudo, para um estado vazio não apagar o banco. Por isso a criação de tarefas e de projetos fica indisponível até a primeira carga terminar.

**Conflitos:** como só as linhas alteradas viajam, dois dispositivos só colidem se editarem o mesmo item. Nesse caso, vence a última gravação.

**Status na interface:** `SyncBadge` mostra `saving`, `saved` ou `offline` a partir de `ui-store.syncStatus`.

## Dados antigos do navegador

Na primeira carga de cada navegador depois do login, `importLegacy` procura a chave antiga `dusk:v1`. Se existir, une os dados com os do banco: nenhum item se perde e, no mesmo id, fica a versão com `updatedAt` mais recente. As configurações antigas só valem se o banco ainda não tiver as suas. A chave é renomeada para `dusk:v1:imported:<timestamp>`, sem ser apagada, e o usuário vê um aviso. Conteúdo ilegível vai para `dusk:v1:recovery:<timestamp>`, sai da chave ativa e gera um único aviso.

## Apagar e restaurar

"Apagar todos os dados" e "Importar backup" só alteram o store. O diff transforma isso nos `DELETE` e `upsert` necessários, sem caminho especial até o banco.
