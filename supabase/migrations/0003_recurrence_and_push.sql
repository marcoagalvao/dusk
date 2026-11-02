-- Dusk 1.3: tarefas recorrentes e notificações por aparelho.

alter table public.tasks
  add column recurrence text check (recurrence in ('daily', 'weekdays', 'weekly', 'monthly'));

-- Um registro por navegador ou celular com avisos ligados. O app só grava os da própria conta;
-- quem lê todos é a rota de envio, no servidor, com a chave secreta.
create table public.push_subscriptions (
  user_id    uuid not null references auth.users (id) on delete cascade,
  endpoint   text not null,
  p256dh     text not null,
  auth       text not null,
  time_zone  text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, endpoint)
);

alter table public.push_subscriptions enable row level security;

create policy "push_subscriptions_own_rows" on public.push_subscriptions
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

revoke all on public.push_subscriptions from anon;
grant select, insert, update, delete on public.push_subscriptions to authenticated;
