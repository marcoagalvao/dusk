# Dusk

Um gerenciador pessoal para saber **o que fazer**, **onde cada tarefa parou** e **qual é o próximo passo**.

O Dusk nasceu para substituir o bloco de notas no acompanhamento diário de trabalhos e pendências: criar uma tarefa continua tão rápido quanto escrever uma linha, mas cada tarefa ganha status, quem você está aguardando, próxima ação, data para revisar e um histórico que se monta sozinho.

Interface em pt-BR, tema escuro **Pastel Dusk**, funciona no desktop e no celular. Os dados ficam no próprio navegador (sem login, sem servidor).

## Funcionalidades

- **Criação rápida**: tecla `N` (ou o `+` no celular), digite o título e Enter. Projeto e prazo são opcionais.
- **Visão geral**: foco de hoje, o que precisa da sua atenção (atrasadas, revisões que chegaram, urgentes, prazo hoje, bloqueadas), o que está aguardando, resumo e projetos recentes.
- **Atualização de andamento estruturada**: status, o que foi feito, aguardando quem, próxima ação e quando revisar, com atalhos como "Enviado ao cliente" e "Resposta recebida". Cada atualização entra no histórico automaticamente.
- **Prazo e revisão separados**: o prazo é quando precisa estar pronto; a revisão é quando voltar a olhar (ex.: cobrar uma resposta na segunda).
- **Foco de hoje** que expira sozinho no dia seguinte.
- **Lista** agrupada (Hoje / Próximas / Sem data) e **Kanban** com arrastar e soltar (mouse, toque e teclado).
- Vistas **Hoje**, **Próximas**, **Aguardando** e **Atrasadas**.
- **Busca** instantânea (ignora acentos), **filtros** em chips e **ordenação** inteligente.
- **Projetos** com cor da paleta, tela agrupada por status e exclusão segura (sem apagar tarefas em cascata).
- **Subtarefas** com progresso, **arquivo**, conclusão em um clique com **desfazer**.
- **Backup**: exporta e importa um `.json` versionado, com resumo antes de restaurar.

## Rodando localmente

Requisitos: **Node.js 20.9+** (desenvolvido com Node 24) e npm.

```bash
npm install
```

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). Na primeira abertura o app começa vazio; use "Ver com dados de exemplo" para explorar com dados fictícios (dá para apagar em Configurações).

### Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento (Turbopack) |
| `npm run build` | Build de produção |
| `npm run start` | Serve o build de produção |
| `npm run lint` | ESLint |
| `npm run typecheck` | Gera os tipos das rotas e roda o TypeScript |
| `npm test` | Testes de domínio, datas, persistência e backup (Vitest) |

## Deploy na Vercel

O projeto é um app Next.js padrão, sem variáveis de ambiente nem banco de dados. Importe o repositório na Vercel e mantenha as configurações detectadas (framework Next.js, `npm run build`).

## Seus dados

Tudo é salvo no `localStorage` do navegador, na chave `dusk:v1`, em um formato versionado (`schemaVersion`).

- Cada navegador tem seus próprios dados: o PC e o celular **não sincronizam**, mesmo usando a mesma URL.
- Para levar os dados de um lugar para outro, use **Configurações → Exportar backup** e depois **Importar backup** no outro dispositivo.
- Limpar os dados do site no navegador apaga tudo. Exporte backups com frequência.
- Se o conteúdo salvo estiver corrompido ou for de uma versão mais nova do app, o Dusk preserva uma cópia em `dusk:v1:recovery:<data>` antes de começar vazio, e avisa.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Zustand (persist) · dnd-kit · date-fns · Radix UI · Lucide · zod · Vitest.

## Estrutura

```text
src/
├─ app/            Rotas (páginas finas que renderizam as views)
├─ components/
│  ├─ layout/      Shell, sidebar, navegação mobile, header de página
│  ├─ dashboard/   Visão geral
│  ├─ tasks/       Lista, Kanban, detalhe, criação rápida, andamento
│  ├─ projects/    Lista, detalhe, formulário e exclusão de projetos
│  ├─ archive/     Arquivo
│  ├─ settings/    Configurações e backup
│  └─ ui/          Componentes-base com a identidade do Dusk
├─ actions/        Ações de UI (store + feedback/desfazer)
├─ store/          Store Zustand único com slices, adapter de persistência, estado de UI
├─ domain/         Tipos, regras puras e consultas (sem React)
├─ hooks/          Data atual reativa, atalhos de teclado
└─ lib/
   ├─ persistence/ AppPersistence, LocalStoragePersistence, schema e migrations
   ├─ backup/      Exportação e validação de backup
   ├─ dates/       Datas civis e formatação pt-BR
   └─ utils/
```

A UI nunca acessa o `localStorage` diretamente: o store persiste por meio da interface `AppPersistence` (`src/lib/persistence/types.ts`). Trocar por outra persistência (ex.: Supabase) significa implementar `load`, `save` e `clear`.

## Documentação do projeto

- [`PRD_Dusk_Task_Manager.md`](PRD_Dusk_Task_Manager.md) — requisitos do produto
- [`docs/FEATURE_STATUS.md`](docs/FEATURE_STATUS.md) — checklist de implementação
- [`docs/TECHNICAL_DECISIONS.md`](docs/TECHNICAL_DECISIONS.md) — decisões técnicas
- [`docs/PROJECT_LOG.md`](docs/PROJECT_LOG.md) — diário de desenvolvimento
- [`CHANGELOG.md`](CHANGELOG.md)

## Atalhos

| Tecla | Ação |
| --- | --- |
| `N` | Nova tarefa (fora de campos de texto) |
| `Enter` | Confirma a criação rápida |
| `Ctrl` + `Enter` | Salva a atualização de andamento |
| `Esc` | Fecha diálogo, menu ou cancela edição |
| `Espaço` no Kanban | Pega/solta o card; setas trocam de coluna |
