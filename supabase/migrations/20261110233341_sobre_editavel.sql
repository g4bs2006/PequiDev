-- "O humano por trás" (a seção Sobre da home), editável pelo painel.
-- Uma linha só: id é sempre true.

create table public.sobre (
  id boolean primary key default true check (id),
  intro text not null default '',
  trajetoria text not null default '',
  fatos jsonb not null default '[]'::jsonb check (jsonb_typeof(fatos) = 'array'),
  tecnologias text[] not null default '{}',
  updated_at timestamptz not null default now()
);

comment on table public.sobre is 'Seção "O humano por trás" da home. Uma linha só.';
comment on column public.sobre.intro is 'Parágrafo de apresentação.';
comment on column public.sobre.trajetoria is 'Como o Gabriel chegou até aqui. Vazio: o bloco não aparece.';
comment on column public.sobre.fatos is 'Ficha ao lado do texto: lista de {rotulo, valor}, na ordem.';
comment on column public.sobre.tecnologias is 'Tecnologias, na ordem em que aparecem.';

create trigger sobre_set_updated_at
  before update on public.sobre
  for each row execute function private.set_updated_at();

alter table public.sobre enable row level security;

create policy "Todos leem o sobre"
  on public.sobre for select to anon, authenticated
  using (true);

create policy "Admin cria o sobre"
  on public.sobre for insert to authenticated
  with check ((select private.is_admin()));

create policy "Admin edita o sobre"
  on public.sobre for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

insert into public.sobre (intro, trajetoria, fatos, tecnologias) values (
  'O Gabriel estuda Engenharia de Computação na UFG e trabalha com inteligência artificial e desenvolvimento fullstack. O PequiDev é onde ele publica o que constrói e o que aprende no caminho.',
  '',
  '[{"rotulo":"Curso","valor":"Engenharia de Computação"},{"rotulo":"Universidade","valor":"UFG"},{"rotulo":"Foco","valor":"Inteligência artificial e desenvolvimento fullstack"}]'::jsonb,
  array['TypeScript','Next.js','React','Tailwind CSS','TanStack Query','Hono','Zod','OpenAPI','PostgreSQL','Drizzle','Supabase','pg-boss','Vitest','GitHub Actions','Docker','nginx']
);
