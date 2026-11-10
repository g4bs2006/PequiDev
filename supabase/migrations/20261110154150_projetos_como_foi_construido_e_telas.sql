-- Página de projeto: a parte "como foi construído" e as telas do sistema.

alter table public.projects
  add column approach text not null default '',
  add column screenshots jsonb not null default '[]'::jsonb,
  add constraint projects_screenshots_is_array check (jsonb_typeof(screenshots) = 'array');

comment on column public.projects.approach is 'Como o projeto foi construído, em Markdown.';
comment on column public.projects.screenshots is
  'Telas do projeto, na ordem em que aparecem: lista de {url, alt, caption}.';
