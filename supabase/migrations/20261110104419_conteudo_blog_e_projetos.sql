-- PequiDev, fase 2: conteúdo do blog e dos projetos.
-- Visitantes só leem o que está publicado. Só quem está em private.admins escreve.

-- ---------------------------------------------------------------------------
-- Esquema private: fica fora da API. Guarda quem é admin e funções de apoio.
-- ---------------------------------------------------------------------------
create schema if not exists private;
grant usage on schema private to authenticated;

create table private.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
comment on table private.admins is 'Contas que podem publicar. Hoje, só o Gabriel.';
alter table private.admins enable row level security;

create function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from private.admins where user_id = (select auth.uid())
  );
$$;
revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to authenticated;

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function private.set_updated_at() from public;

-- ---------------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------------
create type public.content_status as enum ('draft', 'published');

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (btrim(name) <> ''),
  created_at timestamptz not null default now()
);
comment on table public.tags is 'Tags dos posts do blog.';

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (btrim(title) <> ''),
  summary text not null default '',
  content text not null default '',
  cover_image_url text,
  cover_image_alt text,
  status public.content_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint posts_published_has_date check (status = 'draft' or published_at is not null)
);
comment on table public.posts is 'Posts do blog, escritos pelo Gabriel.';
comment on column public.posts.summary is 'Resumo curto: aparece nos cards e na descrição para buscadores.';
comment on column public.posts.content is 'Texto do post em Markdown.';

create table public.post_tags (
  post_id uuid not null references public.posts (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (post_id, tag_id)
);
create index post_tags_tag_id_idx on public.post_tags (tag_id);
comment on table public.post_tags is 'Liga cada post às suas tags.';

create table public.project_categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.project_categories (id) on delete restrict,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (btrim(name) <> ''),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint project_categories_not_own_parent check (parent_id is distinct from id)
);
create index project_categories_parent_id_idx on public.project_categories (parent_id);
comment on table public.project_categories is 'Guias e subguias da barra lateral de /projetos. Sem parent_id é guia; com parent_id é subguia.';

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (btrim(name) <> ''),
  summary text not null default '',
  problem text not null default '',
  result text not null default '',
  stack text[] not null default '{}',
  category_id uuid references public.project_categories (id) on delete set null,
  repo_url text,
  live_url text,
  video_url text,
  cover_image_url text,
  cover_image_alt text,
  featured boolean not null default false,
  sort_order integer not null default 0,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index projects_category_id_idx on public.projects (category_id);
comment on table public.projects is 'Projetos do portfólio.';
comment on column public.projects.problem is 'O problema que o projeto resolve, em Markdown.';
comment on column public.projects.result is 'O resultado alcançado, em Markdown.';
comment on column public.projects.stack is 'Tecnologias usadas, na ordem em que devem aparecer.';
comment on column public.projects.video_url is 'Link do vídeo de demonstração. Hospedar fora do Supabase Storage por causa do limite de banda.';
comment on column public.projects.featured is 'Aparece entre os destaques da home.';

create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function private.set_updated_at();

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Permissões: leitura para todos, escrita só para quem está logado.
-- As políticas abaixo é que decidem quais linhas cada um alcança.
-- ---------------------------------------------------------------------------
revoke all on public.tags, public.posts, public.post_tags, public.project_categories, public.projects
  from anon, authenticated;

grant select on public.tags, public.posts, public.post_tags, public.project_categories, public.projects
  to anon, authenticated;

grant insert, update, delete on public.tags, public.posts, public.post_tags, public.project_categories, public.projects
  to authenticated;

alter table public.tags enable row level security;
alter table public.posts enable row level security;
alter table public.post_tags enable row level security;
alter table public.project_categories enable row level security;
alter table public.projects enable row level security;

-- posts
create policy "Visitantes leem posts publicados" on public.posts
  for select to anon using (status = 'published');
create policy "Admin lê todos os posts" on public.posts
  for select to authenticated using (status = 'published' or (select private.is_admin()));
create policy "Admin cria posts" on public.posts
  for insert to authenticated with check ((select private.is_admin()));
create policy "Admin edita posts" on public.posts
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admin apaga posts" on public.posts
  for delete to authenticated using ((select private.is_admin()));

-- projects
create policy "Visitantes leem projetos publicados" on public.projects
  for select to anon using (status = 'published');
create policy "Admin lê todos os projetos" on public.projects
  for select to authenticated using (status = 'published' or (select private.is_admin()));
create policy "Admin cria projetos" on public.projects
  for insert to authenticated with check ((select private.is_admin()));
create policy "Admin edita projetos" on public.projects
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admin apaga projetos" on public.projects
  for delete to authenticated using ((select private.is_admin()));

-- tags
create policy "Todos leem tags" on public.tags
  for select to anon, authenticated using (true);
create policy "Admin cria tags" on public.tags
  for insert to authenticated with check ((select private.is_admin()));
create policy "Admin edita tags" on public.tags
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admin apaga tags" on public.tags
  for delete to authenticated using ((select private.is_admin()));

-- post_tags: só aparece a ligação de posts que a pessoa consegue ler.
create policy "Leitura segue a visibilidade do post" on public.post_tags
  for select to anon, authenticated
  using (exists (select 1 from public.posts p where p.id = post_id));
create policy "Admin liga tags a posts" on public.post_tags
  for insert to authenticated with check ((select private.is_admin()));
create policy "Admin troca tags de posts" on public.post_tags
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admin desliga tags de posts" on public.post_tags
  for delete to authenticated using ((select private.is_admin()));

-- project_categories
create policy "Todos leem categorias de projeto" on public.project_categories
  for select to anon, authenticated using (true);
create policy "Admin cria categorias de projeto" on public.project_categories
  for insert to authenticated with check ((select private.is_admin()));
create policy "Admin edita categorias de projeto" on public.project_categories
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admin apaga categorias de projeto" on public.project_categories
  for delete to authenticated using ((select private.is_admin()));
