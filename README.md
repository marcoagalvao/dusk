# Dusk

Um gerenciador pessoal para saber **o que fazer**, **onde cada tarefa parou** e **qual é o próximo passo**.

O Dusk substitui o bloco de notas no acompanhamento diário de trabalhos e pendências. Criar uma tarefa continua tão rápido quanto escrever uma linha, mas cada tarefa ganha status, quem você está aguardando, próxima ação, data para revisar e um histórico que se monta sozinho.

Interface em pt-BR, tema escuro **Pastel Dusk**, para desktop e celular. Os dados ficam no Supabase, com fila local para funcionar sem conexão.

## Principais funcionalidades

- **Painel do dia:** situação em uma frase, o que fazer hoje, mapa de urgência, calendário de duas semanas e relatórios de semana, quinzena e mês.
- **Criação rápida:** tecla `N`, título e Enter.
- **Andamento estruturado:** status, o que foi feito, aguardando quem, próxima ação e revisão, com histórico automático.
- **Lista e Kanban**, busca, filtros e ordenação inteligente.
- **Projetos, subtarefas, foco de hoje e arquivo.**
- **Sincronização entre dispositivos** e backup em JSON.

## Começando

```bash
npm install
```

```bash
cp .env.example .env.local
```

Preencha `.env.local` com a URL e a chave publishable do Supabase.

```bash
npm run dev
```

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript |
| `npm test` | Testes (Vitest) |

## Documentação

Comece por [`AGENTS.md`](AGENTS.md), que indica onde está cada informação e as regras para manter os documentos em dia.

- [`docs/FEATURES.md`](docs/FEATURES.md): o que o app faz hoje
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md): como funciona por dentro
- [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md): dados e banco
- [`docs/DASHBOARD.md`](docs/DASHBOARD.md): painel, métricas e ideias
- [`docs/SETUP.md`](docs/SETUP.md): configuração, Supabase e Vercel
- [`docs/TECHNICAL_DECISIONS.md`](docs/TECHNICAL_DECISIONS.md): decisões técnicas
- [`CHANGELOG.md`](CHANGELOG.md): o que mudou e quando
