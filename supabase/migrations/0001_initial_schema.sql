-- Dusk: schema inicial. Cada linha pertence a um usuário e o RLS garante o isolamento.
-- Os ids são gerados pelo cliente (createId), então a chave é (user_id, id).

create table public.projects (
  user_id     uuid not null references auth.users (id) on delete cascade,
  id          text not null,
  name        text not null check (char_length(name) between 1 and 60),
  color       text not null check (color in ('lavender', 'periwinkle', 'peach', 'rose', 'sage', 'sand')),
  description text,
  archived_at timestamptz,
  created_at  timestamptz not null,
  updated_at  timestamptz not null,
  primary key (user_id, id)
);

create table public.tasks (
  user_id      uuid not null references auth.users (id) on delete cascade,
  id           text not null,
  title        text not null check (char_length(title) > 0),
  status       text not null check (status in ('todo', 'in_progress', 'waiting', 'blocked', 'completed')),
  priority     text not null check (priority in ('urgent', 'high', 'normal', 'low')),
  project_id   text,
  due_date     date,
  review_date  date,
  focus_date   date,
  last_done    text,
  waiting_for  text,
  next_action  text,
  note         text,
  created_at   timestamptz not null,
  updated_at   timestamptz not null,
  completed_at timestamptz,
  archived_at  timestamptz,
  primary key (user_id, id),
  foreign key (user_id, project_id) references public.projects (user_id, id) on delete set null (project_id)
);

create table public.subtasks (
  user_id      uuid not null references auth.users (id) on delete cascade,
  id           text not null,
  task_id      text not null,
  title        text not null check (char_length(title) > 0),
  completed    boolean not null default false,
  position     integer not null,
  created_at   timestamptz not null,
  completed_at timestamptz,
  primary key (user_id, id),
  foreign key (user_id, task_id) references public.tasks (user_id, id) on delete cascade
);

create table public.task_updates (
  user_id     uuid not null references auth.users (id) on delete cascade,
  id          text not null,
  task_id     text not null,
  type        text not null check (type in ('progress', 'status_change', 'completed', 'reopened')),
  preset      text,
  status      text not null check (status in ('todo', 'in_progress', 'waiting', 'blocked', 'completed')),
  done        text,
  waiting_for text,
  next_action text,
  note        text,
  review_date date,
  position    integer not null,
  created_at  timestamptz not null,
  primary key (user_id, id),
  foreign key (user_id, task_id) references public.tasks (user_id, id) on delete cascade
);

create table public.user_settings (
  user_id           uuid primary key references auth.users (id) on delete cascade,
  theme             text not null default 'pastel-dusk',
  default_task_view text not null default 'list' check (default_task_view in ('list', 'kanban')),
  sidebar_collapsed boolean not null default false,
  display_name      text
);

create index tasks_user_project_idx on public.tasks (user_id, project_id);
create index tasks_user_due_date_idx on public.tasks (user_id, due_date);
create index tasks_user_completed_at_idx on public.tasks (user_id, completed_at);
create index subtasks_user_task_idx on public.subtasks (user_id, task_id);
create index task_updates_user_task_idx on public.task_updates (user_id, task_id);

alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.subtasks enable row level security;
alter table public.task_updates enable row level security;
alter table public.user_settings enable row level security;

create policy "projects_own_rows" on public.projects
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "tasks_own_rows" on public.tasks
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "subtasks_own_rows" on public.subtasks
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "task_updates_own_rows" on public.task_updates
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "user_settings_own_rows" on public.user_settings
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

revoke all on public.projects, public.tasks, public.subtasks, public.task_updates, public.user_settings from anon;
grant select, insert, update, delete on public.projects, public.tasks, public.subtasks, public.task_updates, public.user_settings to authenticated;
