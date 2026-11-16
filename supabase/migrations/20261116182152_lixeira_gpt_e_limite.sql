-- Lixeira do Pequi, etapa 3: os casos duvidosos vão para o GPT (OpenAI), não
-- para o Claude, como o plano original previa. Os nomes acompanham a troca, e
-- entra a tabela que limita as chamadas por pessoa.

alter type public.lixeira_origem rename value 'claude' to 'gpt';

alter table public.lixeira_descartes rename column certeza_claude to certeza_gpt;
alter table public.lixeira_descartes drop constraint lixeira_descartes_fonte_check;
alter table public.lixeira_descartes
  add constraint lixeira_descartes_fonte_check check (fonte in ('local', 'gpt', 'usuario'));

comment on table public.lixeira_exemplos is
  'Lixeira do Pequi: exemplos do classificador KNN (embeddings do MobileNet). Origem gpt: validados pelo GPT.';

-- ---------------------------------------------------------------------------
-- Chamadas à API: no máximo 30 por pessoa por hora (conferido pela Edge
-- Function lixeira-validar). Sem acesso pelo app: só a chave de serviço lê e
-- escreve, por isso RLS ligado e nenhuma regra.
-- ---------------------------------------------------------------------------
create table public.lixeira_chamadas_api (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
comment on table public.lixeira_chamadas_api is 'Lixeira do Pequi: cada chamada ao GPT, para o limite por pessoa.';

create index lixeira_chamadas_api_user_created_idx on public.lixeira_chamadas_api (user_id, created_at desc);

alter table public.lixeira_chamadas_api enable row level security;
