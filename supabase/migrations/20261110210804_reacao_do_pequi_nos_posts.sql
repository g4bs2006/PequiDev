-- Fim de cada post: uma reação do Pequi em foto, escolhida no painel.
-- As poses são as fotos de public/pequi/poses (catálogo em docs/poses-do-pequi.md).

alter table public.posts
  add column pequi_reacao text,
  add column pequi_legenda text,
  add constraint posts_pequi_reacao_check
    check (pequi_reacao in ('bravo', 'hang-loose', 'soldado', 'pensativo', 'na-verdade'));

comment on column public.posts.pequi_reacao is 'Pose do Pequi no fim do post. Vazio: sem reação.';
comment on column public.posts.pequi_legenda is 'Legenda da reação. Vazio: a legenda padrão da pose.';
