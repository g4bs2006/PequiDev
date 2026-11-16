-- Lixeira do Pequi, etapa 4: aprendizado contínuo.
-- Ver docs/lixeira.md, seção Aprendizado contínuo.

-- ---------------------------------------------------------------------------
-- O que o GPT ensina fica com quem fotografou até o admin aprovar.
-- O embedding é calculado no celular, então um exemplo de origem 'gpt' não
-- prova que a foto e os números combinam. Compartilhado, ele deixaria um
-- visitante envenenar o Pequi de todo mundo. Só a base vale para todos.
-- ---------------------------------------------------------------------------
drop policy "Lê exemplos compartilhados e os próprios" on public.lixeira_exemplos;

create policy "Lê a base e os próprios exemplos"
  on public.lixeira_exemplos for select to authenticated
  using (
    origem = 'base'
    or user_id = (select auth.uid())
    or (select private.is_admin())
  );

-- ---------------------------------------------------------------------------
-- Limites: 150 exemplos aprendidos ativos por pessoa e classe (o mais antigo
-- sai), e no máximo 500 exemplos novos por pessoa por dia, para o login
-- anônimo aberto não encher o banco. A base do admin fica de fora.
-- ---------------------------------------------------------------------------
drop trigger lixeira_exemplos_limite on public.lixeira_exemplos;
drop function private.lixeira_limita_exemplos();

create function private.lixeira_teto_diario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.origem <> 'base' and (
    select count(*) from public.lixeira_exemplos
    where user_id = new.user_id
      and origem <> 'base'
      and created_at > now() - interval '1 day'
  ) >= 500 then
    raise exception 'Limite diário de exemplos atingido.' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;
revoke all on function private.lixeira_teto_diario() from public;

create trigger lixeira_exemplos_teto_diario
  before insert on public.lixeira_exemplos
  for each row execute function private.lixeira_teto_diario();

create function private.lixeira_desativa_antigos()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.origem <> 'base' then
    update public.lixeira_exemplos
    set ativo = false
    where id in (
      select id from public.lixeira_exemplos
      where user_id = new.user_id
        and classe = new.classe
        and origem <> 'base'
        and ativo
      order by created_at desc
      offset 150
    );
  end if;
  return null;
end;
$$;
revoke all on function private.lixeira_desativa_antigos() from public;

create trigger lixeira_exemplos_desativa_antigos
  after insert on public.lixeira_exemplos
  for each row execute function private.lixeira_desativa_antigos();

-- ---------------------------------------------------------------------------
-- Descartes: a pessoa confirma (Acertou) ou corrige (Errou) o que analisou.
-- Só estas três colunas podem mudar, e só nas próprias linhas.
-- ---------------------------------------------------------------------------
alter table public.lixeira_descartes add column confirmado boolean;
comment on column public.lixeira_descartes.confirmado is
  'true: a pessoa disse que acertou. false: disse que errou (classe_final vira a dela). null: não respondeu.';

revoke update on public.lixeira_descartes from anon, authenticated;
grant update (confirmado, classe_final, status) on public.lixeira_descartes to authenticated;

create policy "Confirma ou corrige os próprios descartes"
  on public.lixeira_descartes for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
