<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Dusk: comece por aqui

Dusk é um gerenciador pessoal de tarefas em pt-BR, tema escuro, para desktop e celular. Responde a três perguntas: o que fazer, onde cada tarefa parou e qual é o próximo passo. Tem um único tipo de usuário, o dono da conta, e os dados ficam no Supabase, com fila local para funcionar sem conexão.

## Onde está cada informação

| Preciso saber... | Leia |
| --- | --- |
| O que o app faz hoje, tela por tela, e o que está pendente | [`docs/FEATURES.md`](docs/FEATURES.md) |
| Camadas, fluxo de dados, login e sincronização | [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) |
| Tipos, tabelas, RLS, chaves do navegador e como criar migration | [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) |
| Blocos e métricas do painel, regras de leitura e ideias futuras | [`docs/DASHBOARD.md`](docs/DASHBOARD.md) |
| Rodar localmente, variáveis de ambiente, Supabase e Vercel | [`docs/SETUP.md`](docs/SETUP.md) |
| Por que algo foi feito de um jeito não óbvio | [`docs/TECHNICAL_DECISIONS.md`](docs/TECHNICAL_DECISIONS.md) |
| O que mudou e quando | [`CHANGELOG.md`](CHANGELOG.md) |
| A intenção original do produto (histórico) | [`PRD_Dusk_Task_Manager.md`](PRD_Dusk_Task_Manager.md) |
| Como a V1 foi construída (histórico) | [`docs/PROJECT_LOG.md`](docs/PROJECT_LOG.md) |

Se o PRD ou o Project Log divergirem do código, vale o código. Os documentos vivos acima descrevem o estado atual.

## Toda mudança atualiza a documentação

Uma tarefa só termina quando os documentos estão de acordo com o código, na mesma entrega:

1. **Sempre:** adicione uma entrada em `CHANGELOG.md`, sob a versão e a data da mudança, dizendo o que mudou e por quê, em linguagem de usuário quando couber.
2. **Procure as referências:** busque no repositório o nome da função, tela, tabela ou comportamento alterado e corrija cada documento que falar dele.
3. **Use a tabela abaixo** para saber o mínimo a revisar.

| Se você mudou... | Revise também |
| --- | --- |
| Comportamento de tela ou funcionalidade | `docs/FEATURES.md` |
| Bloco ou métrica do painel | `docs/DASHBOARD.md`, `docs/FEATURES.md` |
| Tipo do domínio, coluna, tabela ou RLS | `docs/DATA_MODEL.md`, nova migration, `rows.ts` |
| Sincronização, login ou persistência | `docs/ARCHITECTURE.md` |
| Variável de ambiente, deploy ou passo manual | `docs/SETUP.md`, `.env.example` |
| Decisão que alguém poderia questionar depois | `docs/TECHNICAL_DECISIONS.md` |
| Versão do app | `package.json`, `APP_VERSION` em `src/domain/app-data.ts`, `CHANGELOG.md` |
| Arquivo citado em um documento (movido ou removido) | Todo documento que o cita |

`src/lib/docs.test.ts` falha quando a versão, o changelog, os links deste arquivo ou a lista de migrations ficam fora de sincronia.

## Comandos

```bash
npm run dev        # desenvolvimento em http://localhost:3000
npm test           # Vitest
npm run typecheck  # gera os tipos das rotas e roda o TypeScript
npm run lint       # ESLint
npm run build      # build de produção
```

Antes de dizer que terminou, rode `npm test`, `npm run typecheck` e `npm run lint`. Se a mudança aparece na tela, confira no navegador, em desktop e em 375 px.

## Regras do código

- **Stack:** Next.js 16 (App Router), React 19, TypeScript strict, Tailwind 4, Zustand 5, zod, Supabase JS, Radix, dnd-kit, date-fns, Lucide e Vitest.
- **Camadas:** `app` → `components` → `actions` → `store` → `lib/persistence`. `domain` é puro: sem React, sem store e sem acesso ao navegador. A UI nunca acessa `localStorage` nem o Supabase diretamente.
- **Mutações com feedback** passam por `src/actions/*`, que disparam toast e desfazer.
- **Datas:** `YYYY-MM-DD` para datas civis no fuso local e ISO para instantes. Use `src/lib/dates`.
- **Estilo:** tokens de `src/app/globals.css` (`@theme`), nunca cor solta. `cn` só concatena, então o `className` passado a um componente-base só acrescenta classes (ver `TECHNICAL_DECISIONS.md`).
- **Texto de interface:** pt-BR, frases curtas, sem exclamação e sem jargão.
- **Status nunca só por cor:** sempre com glifo, ícone ou rótulo.
- **Banco:** só a chave publishable no cliente. Mudança de schema é sempre uma nova migration em `supabase/migrations/`, com RLS em toda tabela nova.
- **Git:** faça commit ou push só quando o usuário pedir. Em `main`, crie uma branch primeiro.
