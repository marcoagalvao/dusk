> **Documento histórico.** Registra a intenção original do produto (V1). A implementação evoluiu: os dados agora ficam no Supabase, com login, e a Home virou um painel visual. O estado atual está em `docs/FEATURES.md`, e as divergências deliberadas em `docs/TECHNICAL_DECISIONS.md`. Em caso de conflito, vale o código.

# PRD — Dusk

> **Personal Task Manager** — gerenciador pessoal de tarefas, projetos e acompanhamentos.

**Versão do documento:** 1.0  
**Status:** Escopo fechado para V1  
**Idioma da interface:** Português (pt-BR)  
**Plataforma:** Web responsiva  
**Uso inicial:** Individual  
**Deploy:** Vercel  
**Persistência V1:** LocalStorage  
**Tema V1:** Pastel Dusk (escuro, suave, com cores pastéis)

---

## 1. Resumo do produto

O **Dusk** é um gerenciador pessoal de tarefas criado para substituir o uso de bloco de notas no acompanhamento diário de trabalhos, projetos e pendências.

O produto não será apenas uma To Do List. Seu objetivo central é responder, de forma imediata, a quatro perguntas:

1. **O que eu preciso fazer?**
2. **Em que ponto cada tarefa está?**
3. **Estou esperando alguma pessoa ou informação?**
4. **Qual é o próximo passo?**

O sistema deve preservar a velocidade e simplicidade de anotar uma linha em um bloco de notas, mas adicionar estrutura, contexto, histórico, filtros, projetos e acompanhamento.

Exemplo de informação que o sistema deve representar facilmente:

```text
Site Institucional da Integradas
Status: Aguardando

Último avanço:
V1 pronta.

Aguardando:
Pedro enviar as informações solicitadas.

Próxima ação:
Aplicar o conteúdo recebido e preparar a V2.

Revisar novamente:
05/10/2026
```

---

# 2. Problema

O fluxo atual baseado em bloco de notas funciona pela velocidade, porém possui limitações:

- não separa tarefas por status;
- não destaca o que está aguardando terceiros;
- não mantém um histórico organizado;
- não existe busca estruturada;
- não existe visão por projeto;
- não diferencia prazo de follow-up;
- tarefas concluídas ficam misturadas com tarefas abertas;
- é difícil recuperar rapidamente o contexto de algo iniciado dias atrás;
- não existe uma visão clara do que merece atenção hoje.

O Dusk deve resolver essas limitações sem criar burocracia adicional.

---

# 3. Objetivo principal

Criar um sistema pessoal tão rápido de utilizar que o usuário naturalmente prefira abrir o Dusk em vez de abrir o bloco de notas.

### Critério principal de sucesso

Após uma semana de uso real, o usuário deve conseguir abandonar o bloco de notas para registrar e acompanhar tarefas.

---

# 4. Princípios do produto

## 4.1. Velocidade acima de completude

Criar ou atualizar uma tarefa deve exigir o mínimo possível de ações.

Uma tarefa nova precisa somente de um título.

```text
N
↓
Digite o título
↓
Enter
↓
Tarefa criada
```

Meta de experiência: operações comuns devem levar aproximadamente **5 a 10 segundos**.

## 4.2. Campos opcionais por padrão

O sistema não deve obrigar o preenchimento de projeto, prazo, prioridade, descrição ou checklist.

Campos adicionais aparecem quando agregam valor.

## 4.3. O sistema organiza; o usuário informa

O usuário informa fatos simples como:

- “V1 concluída”;
- “aguardando Pedro”;
- “revisar na segunda”;
- “próximo passo: publicar”.

O sistema transforma isso em status, histórico, indicadores e agrupamentos.

## 4.4. Informação acionável acima de analytics

A Home deve priorizar tarefas e próximos passos. Gráficos não fazem parte do núcleo da V1.

## 4.5. Ferramenta pessoal, não software corporativo

O Dusk não tentará competir com Jira, ClickUp, Monday ou sistemas de gestão de equipes.

---

# 5. Público-alvo

V1 destinada a **um único usuário**.

Não haverá:

- cadastro de usuários;
- login;
- organizações;
- equipes;
- responsáveis diferentes;
- permissões;
- comentários entre usuários;
- convites.

---

# 6. Escopo funcional da V1

A V1 conterá:

- Dashboard;
- tarefas;
- criação rápida;
- edição;
- exclusão;
- conclusão;
- reabertura;
- arquivamento;
- status;
- prioridades;
- prazo;
- data de revisão/follow-up;
- projetos;
- subtarefas;
- foco de hoje;
- andamento estruturado;
- presets de atualização;
- histórico/timeline;
- próxima ação;
- lista;
- Kanban;
- busca;
- filtros;
- ordenação;
- responsividade;
- persistência em LocalStorage;
- exportação de backup JSON;
- importação de backup JSON;
- feedback visual de ações;
- estados vazios;
- atalhos essenciais de teclado.

---

# 7. O que não entra na V1

Ficam explicitamente fora do escopo:

- autenticação;
- banco de dados remoto;
- sincronização entre dispositivos;
- multiusuário;
- comentários;
- upload de arquivos;
- chat;
- IA;
- integração com e-mail;
- integração com WhatsApp;
- calendário completo;
- timer;
- Pomodoro;
- timesheet;
- story points;
- sprint;
- dependências entre tarefas;
- permissões;
- notificações push;
- anexos;
- recorrência de tarefas;
- analytics avançado;
- tema claro.

Qualquer uma dessas ideias deve ir para backlog e não atrasar a V1.

---

# 8. Navegação principal

## Desktop

Sidebar fixa à esquerda.

```text
DUSK

Visão geral

Tarefas
  Hoje
  Próximas
  Aguardando
  Atrasadas

Projetos
  Integradas
  Enber
  Kleron
  + Novo projeto

Arquivo

──────────────
Configurações
```

### Decisão

A sidebar mostrará no máximo os projetos ativos mais recentes/favoritos. A lista completa ficará na tela de Projetos.

## Mobile

Navegação inferior:

```text
Início   Tarefas   +   Projetos   Mais
```

O botão `+` central abre a criação rápida.

---

# 9. Rotas

Estrutura prevista:

```text
/
/tasks
/tasks/today
/tasks/upcoming
/tasks/waiting
/tasks/overdue
/tasks/[id]
/projects
/projects/[id]
/archive
/settings
```

O Kanban será uma visualização dentro de `/tasks`, não uma rota independente.

---

# 10. Dashboard / Home

Objetivo da Home:

> Mostrar o que precisa da atenção do usuário agora.

A Home terá, nesta ordem:

1. Saudação e data;
2. Foco de hoje;
3. Precisa da sua atenção;
4. Aguardando;
5. Resumo compacto;
6. Projetos recentes.

Exemplo:

```text
Boa tarde, Marco.
Quinta-feira, 2 de outubro

FOCO DE HOJE
○ Finalizar Integradas
○ Ajustar Enber
○ Enviar proposta

PRECISA DA SUA ATENÇÃO

Integradas
Aguardando Pedro · Revisar hoje
→ Aplicar informações e preparar V2

Enber
Em andamento · Prazo amanhã
→ Revisar responsivo

RESUMO
3 em andamento
4 aguardando
1 atrasada
6 concluídas nesta semana
```

## Regras de “Precisa da sua atenção”

Entram automaticamente tarefas que tenham pelo menos uma destas condições:

- prazo vencido;
- prazo hoje;
- `reviewDate` hoje ou anterior;
- prioridade urgente;
- tarefa no foco de hoje com pendência;
- tarefa bloqueada.

Ordenação interna:

1. atrasadas;
2. review vencido;
3. urgentes;
4. vencendo hoje;
5. foco do dia.

---

# 11. Entidade: Tarefa

A tarefa é a principal unidade do sistema.

## Modelo conceitual

```ts
export type TaskStatus =
  | 'todo'
  | 'in_progress'
  | 'waiting'
  | 'blocked'
  | 'completed'

export type TaskPriority =
  | 'urgent'
  | 'high'
  | 'normal'
  | 'low'

export interface Task {
  id: string
  title: string

  status: TaskStatus
  priority: TaskPriority

  projectId?: string

  dueDate?: string
  reviewDate?: string
  focusDate?: string

  lastDone?: string
  waitingFor?: string
  nextAction?: string
  note?: string

  subtasks: Subtask[]
  updates: TaskUpdate[]

  createdAt: string
  updatedAt: string
  completedAt?: string
  archivedAt?: string
}
```

### Decisões

- somente `title` é obrigatório para criação manual;
- `status` padrão = `todo`;
- `priority` padrão = `normal`;
- `focusDate` guarda uma data local (`YYYY-MM-DD`) em vez de booleano;
- uma tarefa pertence a no máximo um projeto na V1;
- tags livres foram retiradas da V1 para reduzir complexidade e duplicação de filtros;
- descrição longa genérica foi substituída por campos de contexto mais úteis.

---

# 12. Status

Existem exatamente cinco status na V1.

## A fazer

Código: `todo`

Significado: tarefa registrada, ainda não iniciada.

## Em andamento

Código: `in_progress`

Significado: existe uma ação ativa do usuário.

## Aguardando

Código: `waiting`

Significado: a continuação depende de uma pessoa, resposta, informação, aprovação ou evento externo.

É um status central do produto.

## Bloqueado

Código: `blocked`

Significado: a tarefa não consegue avançar por um impedimento que não é apenas espera normal.

## Concluído

Código: `completed`

Significado: nenhuma ação adicional é necessária.

Ao concluir:

```text
status = completed
completedAt = agora
```

Ao reabrir:

```text
status = todo
completedAt = undefined
```

---

# 13. Prioridades

Existem quatro níveis:

- Urgente;
- Alta;
- Normal;
- Baixa.

### Regra

Prioridade é opcional para o usuário, mas internamente toda tarefa recebe `normal` por padrão.

A interface não deve pedir prioridade durante criação rápida.

---

# 14. Prazo x Revisar novamente

São conceitos diferentes e devem permanecer separados.

## Prazo (`dueDate`)

Data real em que algo precisa estar concluído.

Exemplo:

> Site precisa ser entregue até 10/10.

## Revisar novamente (`reviewDate`)

Data na qual o usuário quer voltar a olhar uma tarefa.

Exemplo:

> Enviei mensagem hoje. Se não houver resposta, verificar segunda-feira.

A tarefa pode não possuir prazo e possuir `reviewDate`.

---

# 15. Criação rápida

Atalhos:

- botão `+ Nova tarefa`;
- tecla `N`, desde que o foco não esteja em input, textarea ou editor.

Modal compacto:

```text
Nova tarefa

[ O que precisa ser feito? ]

Projeto          Prazo
[ opcional ]     [ opcional ]

[Cancelar]                [Criar ↵]
```

### Regras

- título obrigatório;
- Enter cria;
- Esc fecha;
- criação não exige status, prioridade ou notas;
- ao ser criada, a tarefa entra como `A fazer` e prioridade `Normal`;
- após salvar, mostrar toast discreto: `Tarefa criada`.

---

# 16. Detalhe da tarefa

A tela/drawer de detalhe deve ter esta hierarquia:

```text
[Projeto]                         [...]

Título da tarefa

[Status] [Prioridade] [Prazo]

PRÓXIMA AÇÃO
→ ...

AGUARDANDO
...                          (somente se houver)

ÚLTIMO AVANÇO
...

SUBTAREFAS
...

HISTÓRICO
...
```

A próxima ação deve visualmente ter mais destaque que notas genéricas.

## Ações principais

- Iniciar;
- Atualizar andamento;
- Marcar como aguardando;
- Concluir;
- Reabrir;
- Editar;
- Arquivar;
- Excluir.

---

# 17. Atualização de andamento

Esse fluxo é um dos núcleos do produto.

Não será uma caixa de texto vazia.

Modal:

```text
Atualizar andamento

Status
[ Aguardando ▾ ]

O que foi feito?
[ Primeira versão concluída ]

Aguardando
[ Pedro enviar as informações ]

Próxima ação
[ Aplicar conteúdo e preparar V2 ]

Revisar novamente
[ 05/10/2026 ]

Observação adicional
[ opcional ]

[Cancelar]        [Salvar atualização]
```

### Comportamento

Ao salvar:

1. atualiza os campos atuais da tarefa;
2. atualiza o `status` selecionado;
3. cria automaticamente um item na timeline;
4. atualiza `updatedAt`;
5. fecha o modal;
6. mostra `Atualização salva`.

---

# 18. Presets de atualização

O modal de atualização deve oferecer presets no topo.

Presets V1:

- `V1 concluída`;
- `Enviado ao cliente`;
- `Aguardando cliente`;
- `Ajustes solicitados`;
- `Em revisão`;
- `Resposta recebida`;
- `Finalizado`.

## V1 concluída

Pré-preenche:

```text
Status: Em andamento
O que foi feito: Primeira versão concluída.
```

## Enviado ao cliente

```text
Status: Aguardando
O que foi feito: Material enviado ao cliente.
Aguardando: Retorno do cliente.
```

## Aguardando cliente

```text
Status: Aguardando
Aguardando: [campo em foco]
Revisar novamente: [campo disponível]
```

## Ajustes solicitados

```text
Status: Em andamento
O que foi feito: Ajustes solicitados pelo cliente.
Próxima ação: [campo em foco]
```

## Em revisão

```text
Status: Em andamento
O que foi feito: Versão em revisão.
```

## Resposta recebida

```text
Status: Em andamento
O que foi feito: Resposta recebida.
Aguardando: vazio
Review date: vazio
Próxima ação: [campo em foco]
```

## Finalizado

```text
Status: Concluído
completedAt: agora
```

Os textos são editáveis antes de salvar.

---

# 19. Histórico / Timeline

Toda atualização estruturada gera um registro imutável na timeline.

Modelo:

```ts
export interface TaskUpdate {
  id: string
  taskId: string
  type:
    | 'progress'
    | 'status_change'
    | 'completed'
    | 'reopened'

  preset?: string
  status: TaskStatus

  done?: string
  waitingFor?: string
  nextAction?: string
  note?: string
  reviewDate?: string

  createdAt: string
}
```

Exibição:

```text
02 OUT · 15:40
V1 concluída.
Aguardando Pedro enviar as informações.
Próxima ação: ajustar conteúdo.

30 SET · 17:20
Estrutura inicial concluída.
```

### Regra

A timeline mostra primeiro os itens mais recentes.

---

# 20. Próxima ação

`nextAction` é um campo de primeira classe no produto.

Exemplo:

```text
PRÓXIMA AÇÃO
→ Ajustar conteúdo assim que Pedro responder.
```

Deve aparecer:

- no detalhe da tarefa;
- nos cards mais importantes da Home;
- opcionalmente nos cards expandidos da lista e Kanban.

---

# 21. Aguardando

Ao mudar uma tarefa para `Aguardando`, o sistema deve incentivar o preenchimento de:

- `waitingFor`;
- `reviewDate`.

Nenhum deles será tecnicamente obrigatório para permitir velocidade.

Exemplo de card:

```text
Site Institucional Integradas
Aguardando · Pedro
Revisar em 05/10
→ Aplicar conteúdo recebido
```

---

# 22. Foco de hoje

O foco de hoje é uma seleção manual de tarefas importantes para o dia.

## Decisão de modelagem

Usar `focusDate` e não `focusToday: boolean`.

Exemplo:

```text
focusDate = 2026-10-02
```

A tarefa aparece em “Foco de hoje” somente quando `focusDate` corresponde à data local atual.

Isso faz o foco expirar naturalmente no dia seguinte sem alterar os dados históricos.

### Limite visual

A interface incentiva no máximo **5 tarefas**, mas não bloqueia tecnicamente quantidade maior.

### Ações

- Adicionar ao foco de hoje;
- Remover do foco;
- no futuro, selecionar para amanhã não faz parte da V1.

---

# 23. Projetos

Projetos agrupam tarefas relacionadas.

Exemplos:

- Integradas;
- Enber;
- Kleron;
- Mytrus;
- Pessoal.

Modelo:

```ts
export interface Project {
  id: string
  name: string
  color: ProjectColor
  description?: string
  archivedAt?: string
  createdAt: string
  updatedAt: string
}
```

### Campos

- nome obrigatório;
- cor obrigatória, escolhida entre opções da paleta do sistema;
- descrição opcional;
- arquivamento.

## Tela de projeto

```text
INTEGRADAS
4 abertas · 8 concluídas

Em andamento
Site institucional

Aguardando
Material da graduação
Aprovação da página

A fazer
Revisar SEO

Concluídas
✓ Tags
✓ Migração
✓ Domínio
```

---

# 24. Cores de projeto

O usuário escolherá uma cor entre opções pré-definidas; não haverá color picker livre na V1.

Opções:

- Lavanda `#C4B5FD`;
- Periwinkle `#A9C5EB`;
- Pêssego `#F2C6A0`;
- Rosa `#E7A8B2`;
- Sálvia `#AFC9B5`;
- Areia `#D9C7A8`.

Essa limitação mantém consistência visual.

---

# 25. Subtarefas

Subtarefas funcionam como checklist simples dentro de uma tarefa.

Modelo:

```ts
export interface Subtask {
  id: string
  title: string
  completed: boolean
  createdAt: string
  completedAt?: string
}
```

Exemplo:

```text
Site Institucional

✓ Estrutura
✓ Home
✓ Graduação
○ Revisão mobile
○ Analytics

3 / 5 · 60%
```

### Regra

Subtarefas não possuem status, prioridade, projeto ou prazo próprios na V1.

---

# 26. Visualização em lista

Será a visualização padrão de `/tasks`.

Agrupamento padrão:

1. Hoje;
2. Próximas;
3. Sem data.

Cada linha/card mostra:

- checkbox/conclusão;
- título;
- projeto, se houver;
- status;
- prazo ou review relevante;
- prioridade somente quando Alta ou Urgente.

Exemplo:

```text
○ Ajustar página Integradas
  Integradas · Em andamento · Hoje

○ Aguardar resposta Pedro
  Integradas · Aguardando · Revisar 05/10
```

---

# 27. Kanban

Disponível em `/tasks` por alternância:

```text
[Lista] [Kanban]
```

Colunas:

1. A fazer;
2. Em andamento;
3. Aguardando;
4. Bloqueado;
5. Concluído.

Drag-and-drop com `dnd-kit`.

Mover um card altera o status imediatamente.

### Regra especial

Ao arrastar para `Concluído`:

- definir `completedAt`;
- criar evento simples na timeline.

Ao sair de `Concluído`:

- limpar `completedAt`;
- criar evento `reopened`.

---

# 28. Busca

Busca global textual por:

- título da tarefa;
- nome do projeto;
- `lastDone`;
- `waitingFor`;
- `nextAction`;
- observação atual.

A busca deve responder instantaneamente no front-end.

---

# 29. Filtros

Filtros disponíveis:

- projeto;
- status;
- prioridade;
- prazo;
- foco de hoje;
- com review vencido;
- concluídas / abertas.

Filtros devem ser exibidos em chips/popover compacto.

Nada de painel avançado permanente.

---

# 30. Ordenação

Opções:

- Inteligente (padrão);
- Prazo mais próximo;
- Prioridade;
- Mais recente;
- Mais antiga;
- Alfabética.

## Ordenação inteligente

1. atrasadas;
2. review vencido;
3. urgentes;
4. prazo hoje;
5. prazo futuro;
6. sem prazo;
7. dentro de cada grupo, `updatedAt` mais recente primeiro.

---

# 31. Conclusão

Concluir deve exigir um único clique.

Ao clicar no checkbox:

- status = `completed`;
- `completedAt` = agora;
- criar evento de conclusão;
- feedback visual curto;
- remover das listas ativas após animação.

## Desfazer

Após conclusão, toast:

```text
Tarefa concluída. [Desfazer]
```

O botão fica disponível por alguns segundos.

---

# 32. Arquivamento

Arquivar é diferente de concluir.

## Concluir

O trabalho terminou.

## Arquivar

A entidade não deve mais aparecer no fluxo normal.

Projetos e tarefas podem ser arquivados.

Itens arquivados ficam disponíveis em `/archive`.

---

# 33. Exclusão

Exclusão é permanente.

Para tarefas sem histórico relevante, usar confirmação curta.

Para projetos com tarefas, impedir exclusão direta enquanto houver tarefas associadas.

Opções do projeto:

- arquivar projeto;
- mover tarefas antes de excluir;
- remover associação das tarefas e depois excluir.

Não haverá cascade delete silencioso.

---

# 34. Estados vazios

Estados vazios devem ser humanos e úteis.

Exemplos:

## Foco vazio

```text
Nenhuma tarefa no foco de hoje.
Escolha algumas coisas que realmente precisam avançar.

[Adicionar ao foco]
```

## Aguardando vazio

```text
Nada aguardando resposta.
Você está com o caminho livre por aqui.
```

## Tudo em dia

```text
Tudo certo por aqui.
Nenhuma tarefa precisa da sua atenção agora.
```

---

# 35. Feedback e microinterações

## Toasts

Usar para:

- tarefa criada;
- atualização salva;
- tarefa concluída;
- tarefa restaurada;
- backup exportado;
- backup importado;
- erro de validação/importação.

## Animações

Duração padrão:

- 120 ms para hover;
- 180 ms para abertura/fechamento;
- 220 ms para movimentações maiores.

Ao concluir:

```text
○ → ✓
```

Kanban: card recebe pequena elevação enquanto arrastado.

Nada de animações decorativas demoradas.

---

# 36. Atalhos de teclado — V1

Atalhos essenciais:

```text
N       Nova tarefa
Esc     Fechar modal/drawer
Enter   Confirmar criação rápida quando aplicável
```

Atalhos adicionais ficam para V1.1:

```text
Ctrl+K  Command Palette
F       Foco de hoje
E       Editar
C       Concluir
```

---

# 37. Configurações

Tela simples com seções:

## Aparência

Tema fixo na V1:

`Pastel Dusk`

Não haverá light mode.

## Dados

- Exportar backup;
- Importar backup;
- Apagar todos os dados.

## Sobre

- versão do app;
- versão do schema local;
- aviso sobre armazenamento local.

---

# 38. Backup

## Exportação

Nome do arquivo:

```text
dusk-backup-YYYY-MM-DD-HHmm.json
```

Formato:

```ts
export interface DuskBackup {
  app: 'dusk'
  schemaVersion: 1
  exportedAt: string
  tasks: Task[]
  projects: Project[]
  settings: AppSettings
}
```

## Importação

Fluxo:

1. usuário seleciona `.json`;
2. sistema faz parse;
3. valida `app`;
4. valida `schemaVersion`;
5. valida estrutura mínima;
6. mostra resumo;
7. usuário confirma;
8. dados atuais são substituídos;
9. app recarrega o estado;
10. toast de sucesso.

Resumo antes da confirmação:

```text
Backup encontrado
32 tarefas
5 projetos
Exportado em 02/10/2026 às 18:40

Isso substituirá os dados atuais.

[Cancelar] [Restaurar backup]
```

---

# 39. Apagar dados

A ação “Apagar todos os dados” exige confirmação forte:

```text
Digite APAGAR para confirmar.
```

Não é necessário em exclusões individuais, somente para zerar toda a aplicação.

---

# 40. Persistência local

A V1 não utiliza banco de dados.

Persistência:

```text
Browser
↓
Zustand Store
↓
Persist middleware
↓
LocalStorage
```

### Chave principal

```text
dusk:v1
```

O valor será um objeto versionado.

---

# 41. Limitação conhecida: dispositivos

LocalStorage é local ao navegador.

Consequência:

```text
PC → dados do PC
Celular → dados do celular
```

A mesma URL da Vercel não sincroniza os dados.

Essa limitação é aceita conscientemente na V1.

O backup JSON é a única forma de transportar dados entre dispositivos nesta versão.

Sincronização automática será possível futuramente com Supabase.

---

# 42. Arquitetura de dados

Não acessar `localStorage` diretamente em componentes.

Arquitetura:

```text
UI
↓
Hooks / Actions
↓
Zustand Store
↓
Repository / Persistence Adapter
↓
LocalStorage
```

Interface conceitual:

```ts
export interface AppPersistence {
  load(): PersistedAppState | null
  save(state: PersistedAppState): void
  clear(): void
}
```

Implementação V1:

```text
LocalStoragePersistence
```

Implementação futura:

```text
SupabasePersistence
```

Objetivo: trocar persistência sem reescrever a UI.

---

# 43. Schema versionado

Persistência deve conter:

```ts
interface PersistedAppState {
  schemaVersion: 1
  tasks: Task[]
  projects: Project[]
  settings: AppSettings
}
```

Qualquer alteração futura no formato exige migration explícita.

Exemplo futuro:

```text
schemaVersion 1
↓ migrate
schemaVersion 2
```

---

# 44. Gerenciamento de estado

Biblioteca: **Zustand**.

Stores recomendadas:

```text
useTaskStore
useProjectStore
useSettingsStore
```

Ou um `useAppStore` modularizado internamente.

### Decisão

Usar **um único store persistido**, separado por slices, para simplificar consistência e backup.

```text
useAppStore
  ├─ tasksSlice
  ├─ projectsSlice
  └─ settingsSlice
```

---

# 45. Identificadores

Usar `crypto.randomUUID()` para:

- tarefas;
- projetos;
- subtarefas;
- updates.

Não adicionar biblioteca apenas para IDs.

---

# 46. Datas

Biblioteca: **date-fns**.

Locale: `pt-BR`.

Internamente:

- timestamps completos em ISO 8601;
- datas sem horário (`dueDate`, `reviewDate`, `focusDate`) no formato `YYYY-MM-DD`, interpretadas no fuso local.

Isso evita erros de mudança de dia causados por UTC em campos que representam um dia civil.

---

# 47. Stack técnica

## Core

- Next.js;
- TypeScript;
- Tailwind CSS.

## Estado

- Zustand;
- persist middleware.

## Drag-and-drop

- dnd-kit.

## Datas

- date-fns.

## Ícones

- Lucide React.

## Componentes acessíveis

- Radix UI somente quando necessário;
- shadcn/ui pode ser usado como fonte de componentes-base, mas os componentes devem ser estilizados para a identidade própria do Dusk.

Não manter aparência padrão do shadcn.

---

# 48. Estrutura de pastas sugerida

```text
src/
├─ app/
│  ├─ page.tsx
│  ├─ tasks/
│  ├─ projects/
│  ├─ archive/
│  └─ settings/
│
├─ components/
│  ├─ layout/
│  ├─ tasks/
│  ├─ projects/
│  ├─ dashboard/
│  ├─ forms/
│  └─ ui/
│
├─ store/
│  ├─ app-store.ts
│  └─ slices/
│
├─ domain/
│  ├─ task.ts
│  ├─ project.ts
│  └─ backup.ts
│
├─ lib/
│  ├─ persistence/
│  ├─ dates/
│  ├─ backup/
│  └─ utils/
│
└─ styles/
```

---

# 49. Identidade visual

## Conceito

**Pastel Dusk**

A interface será escura, porém não preta.

O objetivo é combinar:

- conforto visual;
- tons dessaturados;
- superfícies quentes;
- cores pastéis;
- personalidade;
- aparência moderna sem estética gamer/cyberpunk;
- visual diferente da identidade azul/preta usada em outros projetos.

---

# 50. Paleta oficial

## Background principal — Dusk

```text
#242329
```

Uso:

- fundo geral da aplicação.

## Surface 1 — Soft Charcoal

```text
#2D2B32
```

Uso:

- cards;
- sidebar;
- inputs;
- containers.

## Surface 2 — Raised

```text
#37343D
```

Uso:

- hover;
- dropdown;
- elementos elevados;
- cards selecionados.

## Border — Muted

```text
#494550
```

Uso:

- bordas;
- separadores;
- outlines neutros.

## Texto principal — Warm Cream

```text
#F1ECE6
```

Uso:

- títulos;
- texto principal.

Não usar branco puro como cor principal de texto.

## Texto secundário — Dust

```text
#AAA4AE
```

Uso:

- metadata;
- textos secundários;
- placeholders.

## Texto muito sutil

```text
#7F7985
```

Uso:

- timestamps;
- labels de baixa importância.

---

# 51. Cor primária

## Lavender

```text
#C4B5FD
```

Uso:

- botão principal;
- foco;
- item selecionado;
- links internos;
- indicadores de interação;
- focus ring.

Hover do primary:

```text
#D0C4FF
```

Texto sobre primary:

```text
#242329
```

---

# 52. Cores semânticas de status

## A fazer — Soft Lavender

```text
#B8A9D4
```

## Em andamento — Periwinkle

```text
#A9C5EB
```

## Aguardando — Peach

```text
#F2C6A0
```

## Bloqueado — Dusty Rose

```text
#E7A8B2
```

## Concluído — Sage

```text
#AFC9B5
```

Os status devem usar principalmente:

- ponto colorido;
- badge sutil;
- borda/acento.

Evitar pintar cards inteiros com cores fortes.

---

# 53. Cores de prioridade

## Urgente

```text
#E7A8B2
```

## Alta

```text
#F1B89A
```

## Normal

```text
#B8A9D4
```

## Baixa

```text
#9FBDB4
```

Prioridade Normal não precisa aparecer em todos os cards. Mostrar explicitamente somente Alta e Urgente nas listas compactas.

---

# 54. Tipografia

Fonte principal: **Geist**.

Fonte secundária pontual: **Geist Mono**.

## Uso

Geist:

- títulos;
- corpo;
- botões;
- labels;
- inputs.

Geist Mono:

- atalhos de teclado;
- versão do app;
- pequenos timestamps técnicos, quando fizer sentido.

---

# 55. Escala tipográfica

Sugestão base:

```text
12px  Metadata
13px  Labels pequenos
14px  Corpo compacto
15px  Corpo padrão
16px  Corpo destacado
20px  Título de seção
24px  Título de página
30px  Saudação/dashboard
```

Não usar tipografia excessivamente grande.

---

# 56. Bordas e raio

```text
Cards:       12px
Botões:      10px
Inputs:      10px
Dropdowns:   12px
Modal:       16px
Badges:      999px
```

Objetivo: moderno sem parecer excessivamente arredondado.

---

# 57. Sombras

Sombras serão discretas.

A hierarquia visual virá principalmente de:

- diferença entre superfícies;
- bordas;
- espaçamento.

Não usar sombras grandes/glow.

---

# 58. Ícones

Biblioteca: Lucide.

Stroke sugerido:

```text
1.75px
```

Ícones devem acompanhar texto quando o significado isolado não for óbvio.

---

# 59. Layout desktop

Sidebar:

```text
240px a 260px
```

Conteúdo principal:

- largura fluida;
- max-width nas telas de detalhe;
- Kanban pode ocupar toda largura disponível.

Header de página permanece limpo, com ações à direita.

---

# 60. Responsividade

Breakpoints seguem Tailwind.

Prioridades mobile:

- criação rápida fácil;
- leitura de status;
- conclusão com um toque;
- atualização de andamento;
- foco de hoje;
- busca;
- projetos.

Kanban no mobile pode usar scroll horizontal entre colunas.

---

# 61. Acessibilidade

Requisitos mínimos:

- contraste suficiente entre texto e fundo;
- foco visível;
- navegação de modal por teclado;
- Esc fecha modal;
- elementos clicáveis com área confortável;
- labels em inputs;
- status não comunicado somente por cor;
- botões icon-only com `aria-label`;
- drag-and-drop com alternativa acessível quando suportado.

---

# 62. Performance

Como o sistema é local e individual:

- nenhuma chamada de API para fluxo principal;
- interações instantâneas;
- atualizações otimistas locais por padrão;
- evitar bibliotecas grandes sem necessidade.

Objetivo subjetivo: sensação de aplicativo nativo e imediato.

---

# 63. PWA

Não faz parte da V1 obrigatória.

Planejado para V1.1.

Quando implementado:

- manifest;
- ícone;
- instalação no celular/desktop;
- standalone display;
- assets básicos offline.

Persistência continua LocalStorage até V2.

---

# 64. Command Palette

V1.1.

Atalho:

```text
Ctrl + K
```

Ações futuras:

- nova tarefa;
- abrir tarefa;
- abrir projeto;
- ir para Hoje;
- ir para Aguardando;
- exportar backup.

Não entra na V1 para evitar atraso.

---

# 65. Dados preparados para analytics futuro

A V1 já armazenará:

- `createdAt`;
- `updatedAt`;
- `completedAt`;
- timeline.

Isso permite futuramente calcular:

- tarefas concluídas por semana;
- tempo médio até conclusão;
- projetos mais ativos;
- volume de tarefas aguardando;
- evolução por período.

Nenhum dashboard analítico será implementado agora.

---

# 66. Regras de UX importantes

1. Não abrir modal de edição completo ao criar tarefa.
2. Não exigir projeto.
3. Não exigir prioridade.
4. Não exigir prazo.
5. Não exigir notas.
6. Concluir em um clique.
7. Atualização de andamento estruturada, não textarea genérico.
8. Aguardando deve ser extremamente fácil de registrar.
9. Próxima ação deve ficar visualmente evidente.
10. Prazo e review devem ser conceitos independentes.
11. Informações secundárias não devem competir com o título.
12. Listas devem permitir leitura rápida em poucos segundos.
13. Configurações avançadas não devem aparecer no fluxo principal.
14. Evitar confirmações excessivas.
15. Preferir “Desfazer” a modal sempre que a operação for reversível.

---

# 67. Exemplos reais de conversão do fluxo atual

## Exemplo 1

Entrada atual:

```text
Reunião com Pedro / OK
```

No Dusk:

```text
Reunião com Pedro
Status: Concluído
```

## Exemplo 2

Entrada atual:

```text
Site Institucional da Integradas / Aguardando resposta do Pedro, V1 está pronta
```

No Dusk:

```text
Título:
Site Institucional da Integradas

Projeto:
Integradas

Status:
Aguardando

Último avanço:
V1 concluída.

Aguardando:
Resposta do Pedro.

Próxima ação:
Aplicar as informações recebidas e preparar V2.
```

## Exemplo 3

Entrada atual:

```text
Resolver brasilformado.com / OK
```

No Dusk:

```text
Resolver brasilformado.com
Status: Concluído
```

## Exemplo 4

Entrada atual:

```text
Esperar Ozemar preencher o form / OK
```

Durante o processo:

```text
Título:
Formulário Ozemar

Status:
Aguardando

Aguardando:
Ozemar preencher o formulário.
```

Depois:

```text
Status:
Concluído
```

---

# 68. Critérios de aceite — tarefas

A funcionalidade de tarefas está pronta quando:

- é possível criar uma tarefa apenas com título;
- tarefa recebe status A fazer automaticamente;
- tarefa recebe prioridade Normal automaticamente;
- é possível editar o título;
- é possível alterar status;
- é possível alterar prioridade;
- é possível definir projeto;
- é possível definir prazo;
- é possível definir review date;
- é possível adicionar/remover foco de hoje;
- é possível adicionar subtarefas;
- é possível concluir;
- é possível reabrir;
- é possível arquivar;
- é possível excluir;
- dados sobrevivem a refresh da página.

---

# 69. Critérios de aceite — andamento

Está pronto quando:

- existe modal de atualização;
- existem presets;
- preset pré-preenche campos esperados;
- usuário pode editar texto pré-preenchido;
- salvar atualiza os campos atuais da tarefa;
- salvar cria item na timeline;
- Aguardando permite `waitingFor`;
- existe `nextAction`;
- existe `reviewDate`;
- Resposta recebida limpa espera/review quando aplicável;
- Finalizado conclui a tarefa;
- histórico permanece após novas atualizações.

---

# 70. Critérios de aceite — Dashboard

Está pronto quando:

- mostra foco de hoje;
- mostra tarefas que precisam de atenção;
- identifica atrasadas;
- identifica review vencido;
- mostra aguardando;
- exibe resumo numérico;
- permite abrir tarefa clicando no card;
- nenhuma seção vazia ocupa espaço excessivo.

---

# 71. Critérios de aceite — Kanban

Está pronto quando:

- existem cinco colunas;
- cards podem ser arrastados;
- status muda ao trocar de coluna;
- concluir define `completedAt`;
- reabrir limpa `completedAt`;
- estado persiste após reload;
- funciona com mouse e touch de maneira satisfatória.

---

# 72. Critérios de aceite — backup

Está pronto quando:

- exporta arquivo JSON válido;
- inclui tasks, projects e settings;
- inclui schema version;
- possui timestamp de exportação;
- importador rejeita JSON inválido;
- importador rejeita backup de outro app;
- mostra resumo antes de substituir dados;
- restauração atualiza o app corretamente.

---

# 73. Configuração inicial do sistema

Na primeira abertura:

- nenhum onboarding obrigatório;
- mostrar Dashboard vazio;
- CTA principal: `Criar primeira tarefa`;
- opcionalmente criar exemplos somente se o usuário escolher.

Não popular automaticamente dados fictícios.

---

# 74. Settings model

```ts
export interface AppSettings {
  theme: 'pastel-dusk'
  defaultTaskView: 'list' | 'kanban'
  sidebarCollapsed: boolean
}
```

Default:

```ts
{
  theme: 'pastel-dusk',
  defaultTaskView: 'list',
  sidebarCollapsed: false
}
```

---

# 75. Nome e identidade do produto

## Nome definido

**Dusk**

## Descrição curta

> Um gerenciador pessoal para saber o que fazer, onde cada tarefa parou e qual é o próximo passo.

## Personalidade

- calma;
- precisa;
- rápida;
- organizada;
- discreta;
- moderna;
- não corporativa;
- não infantil;
- não gamer.

## Direção de logo

Na V1, usar apenas wordmark tipográfico “Dusk” com um pequeno símbolo abstrato opcional no futuro.

Não é necessário criar uma marca complexa antes do produto.

---

# 76. Roadmap

## V1 — Produto utilizável

- Dashboard;
- tarefas;
- projetos;
- status;
- prioridade;
- prazo;
- review date;
- foco de hoje;
- andamento estruturado;
- presets;
- próxima ação;
- aguardando;
- timeline;
- subtarefas;
- lista;
- Kanban;
- busca;
- filtros;
- ordenação;
- LocalStorage;
- export/import JSON;
- responsividade;
- tema Pastel Dusk;
- atalhos básicos.

## V1.1 — Conveniência

- PWA;
- Command Palette;
- atalhos adicionais;
- melhorias de microinteração;
- refinamentos de UX;
- pequenos indicadores de produtividade.

## V2 — Sincronização

- Supabase;
- autenticação individual;
- sincronização PC ↔ celular;
- migrations da persistência local para cloud;
- estratégia offline-first, se necessário.

---

# 77. Definition of Done da V1

A V1 será considerada pronta quando:

1. o sistema puder substituir o bloco de notas no uso cotidiano;
2. criar tarefa for mais rápido que abrir um formulário complexo;
3. o usuário conseguir saber em segundos o estado de cada projeto;
4. tarefas aguardando terceiros estiverem claramente separadas;
5. cada tarefa puder registrar o último avanço e próximo passo;
6. reviews/follow-ups aparecerem automaticamente quando chegar a data;
7. o histórico for criado sem esforço adicional;
8. lista e Kanban estiverem funcionais;
9. o estado persistir entre sessões;
10. houver mecanismo confiável de backup e restauração;
11. desktop e mobile forem confortáveis;
12. nenhuma funcionalidade fora do escopo for necessária para o uso principal.

---

# 78. Resumo executivo de decisões

| Área | Decisão |
|---|---|
| Nome | Dusk |
| Tipo | Personal Task Manager |
| Usuários | 1 |
| Idioma | pt-BR |
| Deploy | Vercel |
| Front-end | Next.js + TypeScript + Tailwind |
| Estado | Zustand |
| Persistência | LocalStorage |
| Banco V1 | Nenhum |
| Drag-and-drop | dnd-kit |
| Datas | date-fns |
| Ícones | Lucide |
| Tema | Pastel Dusk |
| Light mode | Não entra na V1 |
| Criação | Só título obrigatório |
| Status | A fazer, Em andamento, Aguardando, Bloqueado, Concluído |
| Prioridade | Urgente, Alta, Normal, Baixa |
| Contexto | Último avanço + Aguardando + Próxima ação |
| Histórico | Automático a cada atualização |
| Follow-up | `reviewDate` separado de prazo |
| Foco | `focusDate` por dia |
| Projetos | Sim, um projeto por tarefa |
| Tags | Fora da V1 |
| Subtarefas | Checklist simples |
| Views | Lista + Kanban |
| Backup | Import/export JSON versionado |
| Sync PC/celular | Fora da V1 |
| PWA | V1.1 |
| Supabase | V2 |

---

# 79. Paleta resumida

```css
:root {
  --background: #242329;
  --surface: #2D2B32;
  --surface-raised: #37343D;
  --border: #494550;

  --text: #F1ECE6;
  --text-muted: #AAA4AE;
  --text-subtle: #7F7985;

  --primary: #C4B5FD;
  --primary-hover: #D0C4FF;
  --primary-foreground: #242329;

  --status-todo: #B8A9D4;
  --status-progress: #A9C5EB;
  --status-waiting: #F2C6A0;
  --status-blocked: #E7A8B2;
  --status-completed: #AFC9B5;

  --priority-urgent: #E7A8B2;
  --priority-high: #F1B89A;
  --priority-normal: #B8A9D4;
  --priority-low: #9FBDB4;
}
```

---

# 80. Princípio final

Toda decisão futura deve passar por esta pergunta:

> **Isso deixa mais rápido entender o que tenho para fazer, onde a tarefa parou ou qual é o próximo passo?**

Se a resposta for não, a funcionalidade provavelmente não pertence ao núcleo do Dusk.

