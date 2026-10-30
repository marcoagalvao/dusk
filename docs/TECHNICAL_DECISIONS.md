# Decisões técnicas — Dusk

Decisões relevantes que não ficam óbvias só lendo o código. Quando uma decisão mudar, reescreva a seção e registre a mudança no `CHANGELOG.md`.

## Persistência: adapter próprio sob o `persist` do Zustand

**Contexto:**
O PRD pede Zustand + persist middleware (§40) e, ao mesmo tempo, uma interface `AppPersistence` trocável (§42) com estado versionado (§43).

**Escolha:**
O `persist` recebe um `PersistStorage` customizado (`src/store/persistence.ts`) que delega para `AppPersistence`, com `load`, `save` e `subscribe` opcional. A implementação em uso é `SyncedPersistence`.

**Motivo:**
A UI e o store não sabem onde os dados ficam. A troca do `localStorage` pelo Supabase não exigiu mudar telas nem slices.

**Alternativas consideradas:**
`createJSONStorage(() => localStorage)` padrão (acopla o formato à biblioteca); persistência manual com `subscribe` (abandona o middleware pedido no PRD).

## Banco relacional em vez de um documento JSON

**Contexto:**
A forma mais simples de levar os dados ao Supabase seria guardar todo o estado numa coluna `jsonb`.

**Escolha:**
Tabelas `projects`, `tasks`, `subtasks`, `task_updates` e `user_settings`, com chave `(user_id, id)`, constraints e RLS.

**Motivo:**
Um documento único faria dois dispositivos se sobrescreverem por inteiro. Com linhas, só o item alterado viaja. O banco também valida os dados e permite consultas e relatórios futuros.

**Alternativas consideradas:**
`jsonb` único (conflitos e sem validação); ids `uuid` (os ids existentes não são todos uuid e nascem no cliente).

## Sincronização por diferença com fila local

**Contexto:**
O app precisa continuar instantâneo e não pode perder alterações com a rede caída ou a aba fechada.

**Escolha:**
A tela altera a memória na hora. `SyncedPersistence` calcula a diferença de linhas, grava numa fila em `localStorage` antes de enviar e reenvia até conseguir. Último a gravar vence, por linha. Detalhes em `ARCHITECTURE.md`.

**Motivo:**
A fila durável é o que torna o app seguro sem conexão. Última gravação por linha é suficiente para um único usuário.

**Alternativas consideradas:**
Gravar direto e esperar a resposta (lento e frágil sem rede); CRDT ou motor de sync dedicado (complexidade sem retorno para uso pessoal); Supabase Realtime (pode ser adicionado depois; hoje, a leitura ao focar a janela e a cada 60 s basta).

## Login só no cliente, sem cadastro

**Contexto:**
App pessoal, sem dados no servidor Next e sem rotas de API.

**Escolha:**
Supabase Auth com sessão em `localStorage`, sem middleware. Só e-mail e senha, e a conta é criada no painel do Supabase.

**Motivo:**
Como toda leitura e escrita passa pelo RLS, proteger rotas no servidor não acrescentaria segurança. Sem tela de cadastro, não há o que manter.

**Alternativas consideradas:**
`@supabase/ssr` com cookies (necessário só com renderização de dados no servidor); magic link (depende de e-mail a cada login).

## Importação automática dos dados antigos

**Contexto:**
Cada navegador pode ter dados diferentes em `dusk:v1`, e o usuário não deve fazer nada para não perdê-los.

**Escolha:**
Na primeira carga depois do login, uma união por id, com o `updatedAt` mais recente vencendo. A chave antiga é renomeada, nunca apagada.

**Motivo:**
Abrir o PC e depois o celular soma os dados dos dois sem duplicar. Se algo der errado, a cópia continua no navegador.

## Validação tolerante com zod

**Contexto:**
Dados do localStorage e de backups importados não são confiáveis.

**Escolha:**
Schemas zod em `src/lib/persistence/schema.ts` com estratégia tolerante: campo opcional inválido vira `undefined`, enum inválido volta ao padrão, item sem `id`/título é descartado individualmente, ids duplicados são removidos, `projectId` órfão é limpo, `completedAt` é coerente com o status.

**Motivo:**
Um registro corrompido não deve apagar todos os outros. Validação manual equivalente seria mais código para manter.

**Alternativas consideradas:**
Validação manual (sem dependência, porém mais extensa e propensa a lacunas); rejeitar o arquivo inteiro ao primeiro erro (perde dados à toa).

## Dados ilegíveis são preservados, nunca descartados em silêncio

**Contexto:**
Se o conteúdo salvo não puder ser lido (JSON quebrado, versão mais nova, itens inválidos), o app precisa continuar funcionando.

**Escolha:**
Dados antigos ilegíveis são copiados para `dusk:v1:recovery:<timestamp>`, e o usuário recebe um aviso. Mudanças recusadas pelo banco vão para `dusk:v2:<uid>:rejected`.

**Motivo:**
Evita perda definitiva de dados por um bug ou por abrir uma versão antiga do app.

## Migrations explícitas

**Contexto:**
§43 exige migration explícita para qualquer mudança de formato.

**Escolha:**
`MIGRATIONS[n]` converte o JSON do schema `n` para `n + 1`, e `migrateState` aplica a cadeia, em dados legados e em backups. Versão futura desconhecida é recusada. O banco tem migrations SQL próprias, em `supabase/migrations/`.

## Hidratação manual

**Contexto:**
Componentes client também renderizam no servidor, onde não há sessão nem `localStorage`, e os dados dependem do usuário logado.

**Escolha:**
`skipHydration: true` e `useStoreHydration(userId)` conecta a persistência ao usuário e chama `rehydrate()` depois da montagem. Até lá o conteúdo mostra um placeholder breve.

**Motivo:**
Evita mismatch de hidratação e o flash do estado vazio ("Criar primeira tarefa") para quem já tem dados.

## Camada de ações entre UI e store

**Contexto:**
A mesma mutação (concluir, arquivar, salvar andamento) é disparada de várias telas e precisa do mesmo feedback.

**Escolha:**
`src/actions/*` chamam o store e disparam toasts/desfazer. Componentes usam essas funções para mutações com feedback. Mutações silenciosas e locais (subtarefas) usam o store diretamente.

**Motivo:**
Comportamento consistente sem colocar regra de UI dentro do store nem duplicar toasts nos componentes.

## Status com forma própria (glifo)

**Contexto:**
§61 exige que status não seja comunicado só por cor; §31 pede conclusão em um clique.

**Escolha:**
`StatusGlyph`: anel (A fazer), meio preenchido (Em andamento), anel tracejado (Aguardando), anel cortado (Bloqueado), disco com check (Concluído). O mesmo glifo é o botão de concluir nas listas.

**Motivo:**
Identidade visual própria e acessível, alinhada ao conceito "Dusk" (fases), sem precisar de um checkbox separado.

## Campo "Aguardando" condicionado ao status

**Contexto:**
`waitingFor` só faz sentido em Aguardando/Bloqueado, mas apagar dados implicitamente surpreende.

**Escolha:**
No modal de andamento o campo só aparece para Aguardando ("Aguardando") e Bloqueado ("Bloqueado por"). Se o status escolhido for outro, o valor atual é mantido, não apagado. O detalhe só mostra a seção quando o status é Aguardando/Bloqueado. Limpar é explícito (preset "Resposta recebida" ou editar o campo).

## Observação do andamento fica só no histórico

**Contexto:**
O modal de andamento tem "Observação adicional" e a tarefa tem `note` ("observação atual").

**Escolha:**
A observação do andamento é gravada apenas no item da timeline. `note` da tarefa é editado no diálogo de edição.

**Motivo:**
Uma observação pontual não deve sobrescrever o contexto permanente da tarefa.

## Timeline registra só o que mudou

**Escolha:**
Cada atualização grava `done` e `note` quando preenchidos, e `waitingFor`/`nextAction`/`reviewDate` apenas quando diferentes do valor anterior.

**Motivo:**
O modal vem pré-preenchido com o estado atual; repetir a mesma próxima ação em todo registro poluiria o histórico.

## "Foco de hoje com pendência"

**Contexto:**
§10 inclui nas tarefas que pedem atenção a "tarefa no foco de hoje com pendência", mas o foco já aparece no que fazer hoje.

**Escolha:**
Interpretado como tarefa do foco que está em Aguardando (depende de terceiros). Bloqueadas já entram por regra própria.

**Motivo:**
Evita repetir todo o foco entre as tarefas que pedem atenção.

## Filtro de status tem precedência sobre Abertas/Concluídas

**Escolha:**
Se um status específico for escolhido, o filtro de situação é ignorado (escolher "Concluído" mostra concluídas mesmo com "Abertas").

**Motivo:**
Evita combinações sem resultado que parecem bug.

## Agrupamento só na ordenação inteligente

**Escolha:**
`/tasks` agrupa em Hoje / Próximas / Sem data apenas com a ordenação "Inteligente". Outras ordenações mostram lista plana.

**Motivo:**
Agrupar por data e ordenar alfabeticamente ao mesmo tempo produz uma lista difícil de ler.

## Detalhe da tarefa como página

**Contexto:**
§16 permite "tela/drawer".

**Escolha:**
Página `/tasks/[id]` com largura máxima de leitura. O "voltar" leva à última tela de lista visitada (Home, projeto ou vista filtrada), guardada no ui-store.

**Motivo:**
Funciona igual no desktop e no mobile, tem URL própria e evita a complexidade de rotas interceptadas.

## Diálogos no mobile

**Escolha:**
Diálogos com campos de texto ficam ancorados no topo no mobile; menus e confirmações viram bottom sheet. Campos usam 16px no mobile.

**Motivo:**
No iOS o teclado virtual cobre elementos fixos na base e fontes menores que 16px disparam zoom ao focar. `interactive-widget=resizes-content` ajuda no Android.

## IDs com fallback

**Escolha:**
`createId()` usa `crypto.randomUUID()` e cai para `crypto.getRandomValues()` quando indisponível.

**Motivo:**
`randomUUID` só existe em contexto seguro; abrir o dev server pelo IP da rede (http) no celular quebraria a criação de tarefas.

## Kanban: sensores e coluna Concluído

**Contexto:**
§27 pede dnd-kit com mouse e touch; §61 pede alternativa acessível; a coluna Concluído cresceria sem limite.

**Escolha:**
`MouseSensor` (distância de 6 px, para o clique abrir a tarefa), `TouchSensor` (atraso de 220 ms, para não brigar com a rolagem horizontal das colunas) e `KeyboardSensor` com um `coordinateGetter` em que ←/→ saltam de coluna. A coluna Concluído mostra só o que terminou nos últimos 7 dias; o restante continua na lista com o filtro de concluídas. Ordem dentro da coluna não é persistida (o PRD não define ordenação manual).

**Alternativas consideradas:**
`PointerSensor` único (conflita com scroll no toque); `@dnd-kit/sortable` (desnecessário sem ordenação manual).

## Sem tailwind-merge

**Contexto:**
Componentes-base aceitam `className`; sem merge, utilitários concorrentes dependem da ordem do CSS gerado.

**Escolha:**
`cn` apenas concatena. Regra: o `className` passado a um componente-base só acrescenta (posição, margem, largura); variações de estado usam variantes (`aria-pressed:`, `data-[state=…]:`) e visibilidade responsiva fica em um wrapper.

**Motivo:**
`tailwind-merge` precisaria de configuração para os tokens próprios (ex.: distinguir `text-label`, tamanho, de `text-ink`, cor), senão descartaria classes válidas. A regra simples evita a dependência e o problema.

## Dados de exemplo opcionais

**Escolha:**
`src/lib/sample-data.ts` gera projetos e tarefas com datas relativas a hoje usando as próprias regras de domínio, e só é carregado quando o usuário clica em "Ver com dados de exemplo" (§73).

**Motivo:**
Garante dados sempre válidos e coerentes com o schema, e permite avaliar o app sem digitar tudo.

## Sincronização entre abas

**Escolha:**
Não há canal direto entre abas. Cada aba grava só as próprias diferenças e lê o banco ao ganhar foco, ao voltar a ficar visível e a cada 60 s.

**Motivo:**
O mesmo mecanismo serve para abas e dispositivos, e uma aba antiga não sobrescreve nem ressuscita o que outra alterou, pois só envia o que ela mesma mudou.

## Lembrete de revisão dentro do app

**Contexto:**
O usuário pediu para ser avisado quando chega o dia de revisar. Notificação push está fora da V1 (PRD §7).

**Escolha:**
Seção "Para revisar em breve" na Home (vencidas, hoje e próximos 7 dias) e um toast ao abrir o app quando há revisões vencidas ou de hoje. O dia do aviso fica no ui-store (memória), então ele aparece uma vez por dia em cada sessão e também quando o dia vira com o app aberto.

Tarefas **concluídas com data de revisão também geram lembrete** (decisão do usuário após uso real): a revisão pode ser um acompanhamento depois da entrega, como confirmar com o cliente. Elas aparecem nessa seção marcadas como "Concluída", contam no aviso, entram no filtro "Revisão vencida" e o chip de revisão no detalhe é destacado. Já "Também pedem atenção" e a ordenação inteligente continuam considerando só tarefas abertas (`isReviewDue`), seguindo o §10; a regra ampla é `isReviewReached`. Em linhas de tarefas concluídas, a data mostrada é a de revisão (o prazo deixa de importar).

**Alternativas consideradas:**
Gravar o "último aviso" no estado persistido (exigiria campo novo no schema para um detalhe de UI); Notification API do navegador (pede permissão e equivale a push, fora do escopo).

## Acompanhamento pós-entrega

**Contexto:**
Uso real: a entrega é concluída e "Revisar novamente" marca quando perguntar ao cliente se ficou tudo certo. Uma tarefa concluída só oferecia "Reabrir", o que distorce o status e o histórico.

**Escolha:**
Diálogo próprio "Registrar acompanhamento" (`follow-up-dialog.tsx`) que reaproveita `applyProgressUpdate` com o status atual (concluída) e o marcador `preset: "follow-up"`. `completedAt` é preservado, `lastDone` recebe o texto, `reviewDate` é limpo por padrão ou reagendado. A timeline rotula o registro como "Acompanhamento". Não houve mudança de schema.

**Alternativas consideradas:**
Reutilizar o modal de andamento com flags de modo (mais campos irrelevantes e lógica condicional); exigir reabrir a tarefa (muda o status de algo que já foi entregue).

## Criação rápida abre a tarefa criada

**Contexto:**
O §15 define a criação rápida (título → Enter → toast), mas não diz para onde ir depois. Na prática, o usuário quer completar o contexto (próxima ação, aguardando, revisão) logo em seguida.

**Escolha:**
Depois de criar, o app navega para `/tasks/[id]`. O "voltar" usa a última tela de lista visitada, então quem criou a partir de um projeto volta ao projeto.

**Alternativas consideradas:**
Ficar na tela atual com um botão "Abrir" no toast (exige um clique a mais para o caso mais comum, segundo o usuário).

## Forçar visualização pela URL

**Escolha:**
`/tasks?view=list|kanban` sobrepõe a visualização padrão sem alterá-la. Usado pelos links do resumo e do aviso de revisão, que precisam mostrar a lista filtrada mesmo para quem usa o Kanban.

**Motivo:**
Estado na URL não "vaza" para a próxima visita a `/tasks`; uma sobreposição em memória ou trocar a preferência salva surpreenderia o usuário.

## Nome na saudação

**Contexto:**
O exemplo da Home (§10) usa "Boa tarde, Marco.", mas o `AppSettings` do PRD não tem nome.

**Escolha:**
Campo opcional `displayName` em `AppSettings`, editável em Configurações. Sem nome, a saudação é só "Boa tarde."

**Motivo:**
Atende o exemplo do PRD com uma adição mínima e compatível (campo opcional não exige migration).

## Painel sem biblioteca de gráficos

**Contexto:**
A visão geral passou a ter gráficos de barras, anel, mapa de calor e barra empilhada.

**Escolha:**
HTML e SVG feitos à mão em `src/components/dashboard/charts.tsx`, com tokens próprios (`--color-chart-*`) validados contra daltonismo.

**Motivo:**
São formas simples, e uma biblioteca aumentaria o bundle e exigiria sobrescrever quase todo o visual.

**Alternativas consideradas:**
Recharts ou Chart.js (peso e estilo difícil de alinhar ao tema).

## "Para fazer hoje" reúne foco e atenção

**Contexto:**
A Home tinha seções separadas de foco, atenção e resumo. O número do resumo não batia com a lista.

**Escolha:**
A lista se divide em "Para fazer hoje", com o mesmo recorte de `/tasks/today` e do número grande, e "Também pedem atenção", com o restante de `getTodayAgenda`.

**Motivo:**
O número em destaque precisa coincidir com o que está na lista logo ao lado.

## Relatório em períodos móveis

**Escolha:**
Semana, Quinzena e Mês são os últimos 7, 15 e 30 dias, comparados aos N dias anteriores, e não semana ou mês de calendário.

**Motivo:**
Um período de calendário fica quase vazio no começo e distorce a comparação. Períodos móveis sempre comparam a mesma quantidade de dias.
