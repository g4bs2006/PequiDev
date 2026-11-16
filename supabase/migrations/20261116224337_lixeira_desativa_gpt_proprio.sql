-- Lixeira do Pequi, etapa 4: quem diz "Errou" para algo que o GPT aprendeu
-- sozinho precisa poder desativar aquele exemplo. Cada um desativa (ou mexe
-- em) os próprios exemplos que não são da base; a base continua só do admin.

drop policy "Desativa os próprios exemplos" on public.lixeira_exemplos;

create policy "Desativa os próprios exemplos"
  on public.lixeira_exemplos for update to authenticated
  using (
    (user_id = (select auth.uid()) and origem <> 'base')
    or (select private.is_admin())
  )
  with check (
    (user_id = (select auth.uid()) and origem <> 'base')
    or (select private.is_admin())
  );
