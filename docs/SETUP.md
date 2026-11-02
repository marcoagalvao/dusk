# Configuração e deploy

## Requisitos

Node.js 20.9 ou mais novo e npm.

## Variáveis de ambiente

| Variável | Valor | Onde encontrar |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_...` | Supabase → Project Settings → API Keys |

Elas vão para o navegador e são públicas por natureza: quem protege os dados é o RLS. **Nunca use a chave secret.** Sem elas, o app mostra uma tela explicando o que falta.

## Rodar localmente

```bash
npm install
```

```bash
cp .env.example .env.local
```

Preencha `.env.local`, que é ignorado pelo git.

```bash
npm run dev
```

Abra `http://localhost:3000`. O ambiente local usa o mesmo banco que a produção, então os dados são os reais.

## Supabase

Projeto: **Dusk**, ref `ylkyznsaribnccdfbpkd`. Confira se as migrations `0002_project_custom_color.sql` e `0003_recurrence_and_push.sql` foram executadas no SQL Editor **antes** de publicar a versão 1.3: sem elas, o banco recusa as tarefas e os projetos salvos pela versão nova.

### Banco novo

Execute os arquivos de `supabase/migrations/` em ordem, no SQL Editor. Veja como criar novas migrations em `DATA_MODEL.md`.

### Criar sua conta

A interface não tem cadastro. Em **Authentication → Users → Add user → Create new user**, informe e-mail e senha e marque **Auto Confirm User**.

### Bloquear novos cadastros (recomendado)

A chave publishable é pública e permite chamar a API de cadastro diretamente. Em **Authentication → Sign In / Providers**, desligue **Allow new users to sign up**. Mesmo sem isso, o RLS impede qualquer acesso aos seus dados, mas uma pessoa estranha poderia criar uma conta vazia.

## Vercel

1. Em **Project → Settings → Environment Variables**, adicione as duas variáveis do Supabase para Production, Preview e Development.
2. Faça o deploy pelo push na branch de produção, ou use Redeploy se o código já estiver lá. As variáveis `NEXT_PUBLIC_*` entram no build, então **adicionar a variável não atualiza um deploy existente**.
3. Abra o site, entre com a sua conta e confira.

Framework e comando de build são os detectados automaticamente: Next.js e `npm run build`.

## Avisos (opcional)

Sem estes passos o app funciona normalmente, e Configurações mostra que os avisos não estão configurados.

1. Gere as chaves:

```bash
npx web-push generate-vapid-keys
```

2. Na Vercel, adicione em Production: `NEXT_PUBLIC_VAPID_PUBLIC_KEY` e `VAPID_PRIVATE_KEY` (as duas geradas), `VAPID_SUBJECT` (`mailto:` com o seu e-mail), `SUPABASE_SERVICE_ROLE_KEY` (a chave secret do Supabase, em Project Settings → API Keys) e `CRON_SECRET` (um texto longo e aleatório). Nunca coloque a chave secret em uma variável com prefixo `NEXT_PUBLIC_`.
3. Faça um novo deploy. O agendamento vem de `vercel.json`: todo dia às 11:00 UTC, 08:00 em Brasília. No plano Hobby, a Vercel pode disparar em qualquer momento dentro dessa hora.
4. Abra o site em cada aparelho e ligue em **Configurações → Avisos neste aparelho**. No iPhone, adicione o Dusk à tela de início e abra por lá primeiro.

## Primeira entrada depois da migração

Abra o app em cada navegador que já usava o Dusk e entre na conta. Os dados daquele navegador vão para o banco automaticamente e um aviso mostra quantos itens foram levados. A cópia antiga continua em `dusk:v1:imported:<data>`.

## Problemas comuns

| Sintoma | Causa provável |
| --- | --- |
| "Banco de dados não configurado" no site | Variáveis ausentes, ou adicionadas sem novo deploy |
| Login recusado | Usuário sem Auto Confirm, ou senha errada |
| Aviso "Sem conexão com o banco" persistente | Rede, ou projeto pausado no plano gratuito do Supabase |
| "O banco recusou uma alteração" | Violação de constraint. A cópia fica em `dusk:v2:<uid>:rejected` |
| Tarefa não salva depois de atualizar o app, com aviso "O banco recusou uma alteração" | Migration ainda não executada (ver "Supabase") |
| "Ainda não foram configurados" nos avisos | `NEXT_PUBLIC_VAPID_PUBLIC_KEY` ausente, ou adicionada sem novo deploy |
| Nenhum aviso chega | Veja os logs do Cron na Vercel: 401 indica `CRON_SECRET` errado, e 503 indica variável faltando |
| Dado de outro dispositivo não aparece | A atualização ocorre ao focar a janela ou a cada 60 s |

No plano gratuito, o Supabase pausa projetos sem atividade. Reative pelo painel. Exporte um backup de vez em quando, em **Configurações**.
