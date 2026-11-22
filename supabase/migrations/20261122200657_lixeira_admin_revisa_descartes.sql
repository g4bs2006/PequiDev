-- Lixeira do Pequi, etapa 6: na Revisão do painel, o admin marca como
-- revisados os descartes de qualquer pessoa. As colunas que podem mudar
-- continuam limitadas (confirmado, classe_final, status) pela permissão.

create policy "Admin revisa descartes"
  on public.lixeira_descartes for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));
