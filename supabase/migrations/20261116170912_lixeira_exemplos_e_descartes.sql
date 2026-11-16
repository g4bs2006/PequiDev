-- Lixeira do Pequi, etapa 2: o que o KNN aprendeu e o histórico de descartes.
-- Ver docs/lixeira.md, seção Banco de dados. Nada do blog muda.
--
-- Quem usa a lixeira entra com login anônimo (papel authenticated, sem e-mail).
-- Os exemplos de origem 'base' (ensinados pelo admin) e 'claude' (validados
-- pelo Claude, etapa 3) valem para todo mundo. Os de origem 'usuario' só valem
-- para quem ensinou, para um visitante não ensinar besteira ao Pequi dos outros.

create extension if not exists vector with schema extensions;

create type public.lixeira_classe as enum ('metal', 'plastico', 'papel', 'vidro', 'rejeito', 'vazio');
create type public.lixeira_origem as enum ('base', 'claude', 'usuario');
create type public.lixeira_status as enum ('ok', 'pendente', 'revisar');

-- ---------------------------------------------------------------------------
-- Exemplos: o conhecimento do KNN
-- ---------------------------------------------------------------------------
create table public.lixeira_exemplos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  classe public.lixeira_classe not null,
  -- Embedding do MobileNet, sem normalizar. Se o modelo mudar, a coluna
  -- modelo diz quais regerar a partir da foto.
  embedding extensions.vector(1280) not null,
  modelo text not null default 'mobilenet_v2_100',
  foto_path text,
  origem public.lixeira_origem not null default 'usuario',
  -- Desativar em vez de apagar: o app baixa só o que mudou, e um exemplo
  -- desativado precisa chegar como mudança para sair do KNN.
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.lixeira_exemplos is 'Lixeira do Pequi: exemplos do classificador KNN (embeddings do MobileNet).';

create index lixeira_exemplos_updated_at_idx on public.lixeira_exemplos (updated_at);
create index lixeira_exemplos_user_id_idx on public.lixeira_exemplos (user_id);

create trigger lixeira_exemplos_updated_at
  before update on public.lixeira_exemplos
  for each row execute function private.set_updated_at();

-- Teto por pessoa: o login anônimo é aberto, então ninguém enche o banco.
create function private.lixeira_limita_exemplos()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.origem = 'usuario' and (
    select count(*) from public.lixeira_exemplos
    where user_id = new.user_id and classe = new.classe and origem = 'usuario'
  ) >= 300 then
    raise exception 'Limite de exemplos desta classe atingido.' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;
revoke all on function private.lixeira_limita_exemplos() from public;

create trigger lixeira_exemplos_limite
  before insert on public.lixeira_exemplos
  for each row execute function private.lixeira_limita_exemplos();

alter table public.lixeira_exemplos enable row level security;

create policy "Lê exemplos compartilhados e os próprios"
  on public.lixeira_exemplos for select to authenticated
  using (
    origem <> 'usuario'
    or user_id = (select auth.uid())
    or (select private.is_admin())
  );

-- Visitante ensina só para si. Admin ensina a base. 'claude' só pela Edge
-- Function, com a chave de serviço (etapa 3).
create policy "Ensina com o próprio usuário"
  on public.lixeira_exemplos for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (origem = 'usuario' or (origem = 'base' and (select private.is_admin())))
  );

-- Desativar: cada um os próprios exemplos de usuário; o admin, qualquer um.
create policy "Desativa os próprios exemplos"
  on public.lixeira_exemplos for update to authenticated
  using (
    (user_id = (select auth.uid()) and origem = 'usuario')
    or (select private.is_admin())
  )
  with check (
    (user_id = (select auth.uid()) and origem = 'usuario')
    or (select private.is_admin())
  );

-- ---------------------------------------------------------------------------
-- Descartes: o histórico de uso
-- ---------------------------------------------------------------------------
create table public.lixeira_descartes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  classe_local public.lixeira_classe,
  confianca_local real check (confianca_local between 0 and 1),
  classe_final public.lixeira_classe not null,
  fonte text not null default 'local' check (fonte in ('local', 'claude', 'usuario')),
  certeza_claude real check (certeza_claude between 0 and 1),
  frase text check (char_length(frase) <= 200),
  humor text,
  status public.lixeira_status not null default 'ok',
  foto_path text,
  created_at timestamptz not null default now()
);
comment on table public.lixeira_descartes is 'Lixeira do Pequi: cada objeto analisado, com a classe local e a final.';

create index lixeira_descartes_user_created_idx on public.lixeira_descartes (user_id, created_at desc);

alter table public.lixeira_descartes enable row level security;

create policy "Lê os próprios descartes"
  on public.lixeira_descartes for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));

create policy "Registra os próprios descartes"
  on public.lixeira_descartes for insert to authenticated
  with check (user_id = (select auth.uid()));

-- Privacidade: cada um pode apagar o próprio histórico.
create policy "Apaga os próprios descartes"
  on public.lixeira_descartes for delete to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Fotos: bucket privado, uma pasta por usuário (<user_id>/<arquivo>.jpg)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('lixeira-fotos', 'lixeira-fotos', false, 524288, array['image/jpeg']);

create policy "Lixeira: envia na própria pasta"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'lixeira-fotos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Lixeira: vê a própria pasta, admin vê tudo"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'lixeira-fotos'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (select private.is_admin())
    )
  );

create policy "Lixeira: apaga da própria pasta"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'lixeira-fotos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
