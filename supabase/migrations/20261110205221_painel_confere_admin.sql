-- Painel admin: o site pergunta ao banco se quem está logado é admin.
-- private.is_admin() fica fora da API; esta função só repassa a resposta.

create function public.sou_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select private.is_admin();
$$;

comment on function public.sou_admin() is 'Se a conta logada pode publicar. Usada pelo painel admin.';

revoke all on function public.sou_admin() from public, anon;
grant execute on function public.sou_admin() to authenticated;
