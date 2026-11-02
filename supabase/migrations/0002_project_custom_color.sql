-- Projetos passam a aceitar, além da paleta, uma cor livre no formato #rrggbb.
alter table public.projects drop constraint projects_color_check;

alter table public.projects add constraint projects_color_check check (
  color in ('lavender', 'periwinkle', 'peach', 'rose', 'sage', 'sand')
  or color ~ '^#[0-9a-f]{6}$'
);
