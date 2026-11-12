# PequiDev Vagas — Plano de Projeto

> Módulo privado do ecossistema PequiDev para descobrir vagas, ranqueá-las por aderência ao perfil do Gabriel, adaptar o currículo com IA e apoiar a candidatura.
> Este documento é a fonte de verdade para os agentes que trabalham no projeto. Leia as seções 1 a 4 antes de qualquer tarefa.

---

## 1. Visão geral

### 1.1 Objetivo
Construir um PWA privado (`vagas.<dominio>`) que:
1. coleta vagas de várias fontes (ATS, agregadores, repositórios) de forma contínua;
2. normaliza e deduplica as vagas;
3. ranqueia cada vaga contra o perfil do Gabriel (filtro → embeddings → LLM);
4. gera um currículo adaptado (PDF) e uma mensagem/carta curta por vaga;
5. notifica vagas com score alto e permite candidatura assistida (e automática só onde for seguro).

### 1.2 Fora de escopo (não fazer)
- **Scraping ou automação do LinkedIn**, logado ou não. Proibido pelos termos e arrisca a conta do usuário.
- Automação de Easy Apply ou de qualquer formulário que exija login do usuário em terceiros.
- Inventar, exagerar ou criar experiências, cursos ou habilidades no currículo.
- Tornar qualquer parte deste módulo pública ou linkada a partir do blog.

### 1.3 Métrica de sucesso (MVP)
- ≥ 1.000 vagas novas/semana coletadas de ≥ 5 fontes.
- Top 10 diário com precisão percebida ≥ 70% ("eu aplicaria").
- Currículo adaptado gerado em < 30 s por vaga.
- Custo mensal: R$0 (exceto domínio).

---

## 2. Regras para agentes

1. **Escopo da tarefa:** trabalhe apenas na fase/tarefa atribuída. Se precisar alterar algo fora dela, registre em `docs/decisions/` e peça aprovação.
2. **Privacidade:**
   - O currículo completo fica só no bucket privado do Supabase.
   - **Nunca** envie telefone, e-mail, endereço, CPF ou links pessoais para LLMs. Use o perfil redigido (`profile_redacted`). Dados de contato só entram na renderização final do PDF.
   - Nunca logue dados pessoais nem conteúdo de currículo.
3. **Scraping responsável:**
   - Respeite o `robots.txt` e os termos de cada fonte; se uma fonte proibir explicitamente, não implemente o adapter e registre isso.
   - Rate limit padrão: 1 requisição/segundo por host, com backoff exponencial em 429/5xx.
   - User-Agent identificável. Sem rotação de IP, proxies residenciais ou bypass de captcha.
   - Prefira APIs oficiais/JSON a HTML; use Playwright só quando inevitável.
4. **IA:** o LLM pode reordenar, reescrever e enfatizar o que existe em `profile.master`; nunca adicionar fatos. Toda saída de currículo passa pelo validador de fatos (Fase 7).
5. **Código:** TypeScript estrito, sem `any` sem justificativa. Testes para adapters (com fixtures salvas) e para funções puras. Lint e typecheck passando antes de abrir PR.
6. **Git:** Conventional Commits (`feat(scraper-gupy): ...`). Branch por tarefa: `fase-XX/descricao-curta`. PR pequeno, com descrição e checklist de critérios de aceite.
7. **Segredos:** apenas em variáveis de ambiente (Vercel, GitHub Secrets). Nunca commitar `.env`.
8. **Dúvida de produto:** não invente requisito. Deixe `TODO(gabriel):` e registre em `docs/open-questions.md`.

---

## 3. Stack e custos

| Camada | Tecnologia | Plano | Custo |
|---|---|---|---|
| Monorepo | pnpm workspaces + Turborepo | — | R$0 |
| Blog | `apps/blog` (PequiDev, já existente) | Vercel Hobby | R$0 |
| PWA de vagas | Next.js (App Router) + Tailwind + `next-pwa` ou Serwist | Vercel Hobby | R$0 |
| Banco/Auth/Storage | Supabase (Postgres + pgvector + Auth + Storage) | Free | R$0 |
| Workers de scraping | Node/TS + `undici`/fetch, Playwright quando necessário | GitHub Actions (cron) | R$0* |
| LLM | Gemini Flash / Flash-Lite (free tier); fallback Groq ou OpenRouter | Free | R$0 |
| Embeddings | Modelo de embedding do Gemini (confirmar nome e dimensão atuais) | Free | R$0 |
| PDF | `@react-pdf/renderer` | — | R$0 |
| Push | Web Push (VAPID) | — | R$0 |

\* Em repositório privado, o GitHub Actions tem cota mensal de minutos; monitorar o uso na Fase 11. Plano B: VPS de ~US$5/mês.

**Limitações conhecidas:**
- Cron da Vercel no Hobby roda no máximo 1x/dia. Por isso o agendamento frequente fica no GitHub Actions.
- O free tier do Gemini tem limites por projeto e pode usar o conteúdo enviado para melhorar produtos do Google. Daí a regra de redação de dados pessoais.
- Para usar o schema `jobs` via supabase-js, é preciso expor o schema em *Settings → API → Exposed schemas*.

---

## 4. Arquitetura

### 4.1 Estrutura do monorepo

```
pequidev/
├─ apps/
│  ├─ blog/                    # PequiDev (público)
│  └─ vagas/                   # PWA privado (vagas.<dominio>)
│     ├─ app/
│     │  ├─ (auth)/login/
│     │  ├─ (app)/feed/        # vagas ranqueadas
│     │  ├─ (app)/vaga/[id]/   # detalhe + currículo adaptado
│     │  ├─ (app)/candidaturas/
│     │  ├─ (app)/perfil/      # perfil mestre, preferências, filtros
│     │  ├─ (app)/fontes/      # status dos scrapers
│     │  └─ api/
│     │     ├─ resume/generate/
│     │     ├─ push/subscribe/
│     │     └─ internal/notify/   # chamado pelos workers (protegido)
│     ├─ public/manifest.webmanifest
│     └─ ...
├─ packages/
│  ├─ ui/                      # tokens (paleta, fontes), componentes compartilhados
│  ├─ db/                      # tipos gerados do Supabase + client + queries
│  ├─ core/                    # tipos de domínio, normalização, dedup, hashing
│  ├─ ai/                      # wrappers de LLM/embeddings, prompts, validador de fatos
│  └─ config/                  # eslint, tsconfig, prettier
├─ workers/
│  ├─ src/
│  │  ├─ adapters/             # um arquivo/pasta por fonte
│  │  │  ├─ gupy/
│  │  │  ├─ greenhouse/
│  │  │  ├─ lever/
│  │  │  ├─ ashby/
│  │  │  ├─ inhire/
│  │  │  ├─ solides/
│  │  │  ├─ adzuna/
│  │  │  └─ github-issues/
│  │  ├─ discovery/            # descoberta de empresas/boards (crt.sh etc.)
│  │  ├─ pipeline/             # normalize → dedup → embed → score
│  │  ├─ lib/                  # http client com rate limit, logger, retry
│  │  └─ cli.ts                # entrypoint: `pnpm worker run <tarefa>`
│  └─ fixtures/                # respostas salvas para testes
├─ supabase/
│  ├─ migrations/
│  └─ seed.sql
├─ .github/workflows/
│  ├─ ci.yml
│  ├─ scrape.yml               # cron horário
│  ├─ discovery.yml            # cron semanal
│  └─ score.yml                # cron após scrape
├─ docs/
│  ├─ PLANO.md                 # este arquivo
│  ├─ decisions/               # ADRs
│  ├─ sources/                 # 1 ficha por fonte (endpoint, limites, termos)
│  └─ open-questions.md
└─ turbo.json
```

### 4.2 Fluxo de dados

```
[GitHub Actions cron]
   │
   ├─ discovery (semanal) ──► jobs.boards (empresas/ATS descobertos)
   │
   └─ scrape (horário)
        │  para cada board ativo → adapter.fetch()
        ▼
   jobs.postings (raw + normalizado, dedup por hash)
        │
   score (após scrape)
        │  1) filtro determinístico (palavras, local, senioridade, exclusões)
        │  2) embedding da vaga × embedding do perfil (pgvector)
        │  3) LLM só no top N/dia → score 0–100 + justificativa
        ▼
   jobs.matches ──► se score ≥ limiar → POST /api/internal/notify → Web Push
        │
[PWA] feed → detalhe → "gerar currículo" → jobs.resume_versions (PDF no Storage)
        │
        └─ candidatura assistida (link + material pronto) ou e-mail → jobs.applications
```

### 4.3 Contrato do adapter

```ts
// packages/core/src/source.ts
export interface RawJob {
  externalId: string;
  url: string;
  title: string;
  companyName: string;
  location?: string;
  remote?: 'remote' | 'hybrid' | 'onsite' | 'unknown';
  descriptionHtml?: string;
  descriptionText?: string;
  postedAt?: string;            // ISO
  salaryText?: string;
  applyMethod?: 'ats_form' | 'email' | 'external' | 'unknown';
  applyEmail?: string;
  raw: unknown;                 // payload original, para depuração
}

export interface Board {
  id: string;
  source: SourceKey;
  slug: string;                 // ex.: "empresa" em empresa.gupy.io
  companyName?: string;
}

export interface SourceAdapter {
  key: SourceKey;               // 'gupy' | 'greenhouse' | ...
  kind: 'per_board' | 'global'; // ATS por empresa ou agregador global
  rateLimitPerSec: number;
  listJobs(board?: Board, since?: Date): AsyncIterable<RawJob>;
  healthCheck(): Promise<{ ok: boolean; detail?: string }>;
}
```

---

## 5. Schema do banco (`jobs`)

```sql
create schema if not exists jobs;
create extension if not exists vector;

-- Usuários autorizados (allowlist: só o Gabriel)
create table jobs.app_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

create or replace function jobs.is_app_user() returns boolean
language sql stable security definer set search_path = jobs as $$
  select exists (select 1 from jobs.app_users where user_id = auth.uid());
$$;

-- Fontes
create table jobs.sources (
  key text primary key,                 -- 'gupy', 'greenhouse', ...
  name text not null,
  kind text not null check (kind in ('per_board','global')),
  enabled boolean default true,
  notes text
);

-- Boards (página de carreiras de uma empresa num ATS)
create table jobs.boards (
  id uuid primary key default gen_random_uuid(),
  source_key text references jobs.sources(key),
  slug text not null,
  company_name text,
  active boolean default true,
  last_scraped_at timestamptz,
  last_status text,
  consecutive_failures int default 0,
  discovered_via text,                  -- 'crt.sh', 'manual', 'search'
  created_at timestamptz default now(),
  unique (source_key, slug)
);

-- Vagas
create table jobs.postings (
  id uuid primary key default gen_random_uuid(),
  source_key text references jobs.sources(key),
  board_id uuid references jobs.boards(id),
  external_id text not null,
  url text not null,
  title text not null,
  title_norm text not null,
  company_name text,
  company_norm text,
  location text,
  remote text default 'unknown',
  seniority text,                       -- inferido: estagio/junior/pleno/senior
  description_text text,
  salary_text text,
  apply_method text default 'unknown',
  apply_email text,
  posted_at timestamptz,
  first_seen_at timestamptz default now(),
  last_seen_at timestamptz default now(),
  closed_at timestamptz,
  dedup_hash text not null,             -- hash(company_norm + title_norm + location_norm)
  canonical_id uuid references jobs.postings(id), -- aponta para a vaga "principal" se duplicada
  embedding vector(768),                -- ajustar à dimensão do modelo escolhido
  raw jsonb,
  unique (source_key, external_id)
);
create index on jobs.postings (dedup_hash);
create index on jobs.postings (first_seen_at desc);
create index on jobs.postings using hnsw (embedding vector_cosine_ops);

-- Perfil (mestre e redigido)
create table jobs.profile (
  user_id uuid primary key references auth.users(id),
  master jsonb not null,                -- perfil completo estruturado (experiências, skills...)
  redacted jsonb not null,              -- sem dados de contato; é o que vai para a IA
  preferences jsonb not null default '{}', -- cidades, remoto, senioridade, salário mín., palavras proibidas
  embedding vector(768),
  updated_at timestamptz default now()
);

-- Score de aderência
create table jobs.matches (
  posting_id uuid references jobs.postings(id) on delete cascade,
  user_id uuid references auth.users(id),
  stage text not null check (stage in ('filtered_out','embedded','llm_scored')),
  similarity real,
  score int check (score between 0 and 100),
  reasons jsonb,                        -- pontos fortes, lacunas, alertas
  status text default 'new' check (status in ('new','saved','dismissed','applied')),
  notified_at timestamptz,
  created_at timestamptz default now(),
  primary key (posting_id, user_id)
);

-- Currículos adaptados
create table jobs.resume_versions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  posting_id uuid references jobs.postings(id),
  content jsonb not null,               -- currículo estruturado adaptado
  cover_note text,
  fact_check jsonb,                     -- resultado do validador
  pdf_path text,                        -- caminho no bucket privado 'resumes'
  model text,
  created_at timestamptz default now()
);

-- Candidaturas
create table jobs.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  posting_id uuid references jobs.postings(id),
  resume_version_id uuid references jobs.resume_versions(id),
  method text check (method in ('manual','email','ats_form')),
  status text default 'sent' check (status in ('draft','sent','viewed','interview','rejected','offer','ghosted')),
  sent_at timestamptz,
  notes text,
  updated_at timestamptz default now()
);

-- Execuções dos workers (observabilidade)
create table jobs.scrape_runs (
  id uuid primary key default gen_random_uuid(),
  task text not null,                   -- 'scrape','discovery','score'
  source_key text,
  started_at timestamptz default now(),
  finished_at timestamptz,
  status text,                          -- 'ok','partial','error'
  stats jsonb,                          -- {fetched, new, updated, errors}
  error text
);

-- Fila simples de tarefas (FOR UPDATE SKIP LOCKED)
create table jobs.tasks (
  id bigserial primary key,
  type text not null,
  payload jsonb not null,
  status text default 'pending' check (status in ('pending','running','done','failed')),
  attempts int default 0,
  run_after timestamptz default now(),
  last_error text,
  created_at timestamptz default now()
);
create index on jobs.tasks (status, run_after);

-- Push
create table jobs.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  endpoint text unique not null,
  keys jsonb not null,
  created_at timestamptz default now()
);

-- RLS: tudo fechado; leitura/escrita só para app_users. Workers usam service_role.
do $$
declare t text;
begin
  foreach t in array array['sources','boards','postings','profile','matches',
                           'resume_versions','applications','scrape_runs','tasks','push_subscriptions']
  loop
    execute format('alter table jobs.%I enable row level security', t);
    execute format('create policy app_users_all on jobs.%I for all using (jobs.is_app_user()) with check (jobs.is_app_user())', t);
  end loop;
end $$;
```

**Storage:** bucket `resumes` privado, com URLs assinadas de curta duração (≤ 10 min).

---

## 6. Fases e entregáveis

Cada fase tem: objetivo, tarefas, entregáveis, critérios de aceite (CA) e dependências. Uma fase só é concluída quando todos os CAs passam.

---

### Fase 0 — Fundação do monorepo
**Objetivo:** migrar o PequiDev para um monorepo sem quebrar o blog.
**Dependências:** nenhuma.

**Tarefas**
- Criar workspace pnpm + Turborepo; mover o blog para `apps/blog`.
- Criar `packages/config` (tsconfig, eslint, prettier) e `packages/ui` com os tokens da marca (Creme #FFF4DC, Tinta #2A2118, Polpa #F2A413, Céu #7CC8BF, Casca #4E7A2E, Focinho #E8697A; Space Grotesk, DM Sans, JetBrains Mono, Anton).
- Criar `apps/vagas` vazio (Next.js) e `workers/` (Node/TS).
- Configurar dois projetos na Vercel (raiz `apps/blog` e `apps/vagas`), com o subdomínio `vagas.<dominio>`.
- CI: `ci.yml` com lint, typecheck e testes em PR.

**Entregáveis**
- Repositório monorepo funcionando.
- `README.md` com comandos (`pnpm dev --filter vagas`, etc.).
- `docs/decisions/0001-monorepo.md`.

**CA**
- [ ] Blog deploya com o mesmo resultado de antes (sem regressão visual).
- [ ] `apps/vagas` responde em `vagas.<dominio>` com página placeholder.
- [ ] Build do blog não roda quando só `apps/vagas` muda (filtro do Turborepo/Vercel "ignored build step").
- [ ] CI verde.

---

### Fase 1 — Banco, auth e perfil
**Objetivo:** schema `jobs` no ar, login privado e perfil do Gabriel cadastrado.
**Dependências:** Fase 0.

**Tarefas**
- Migrations da seção 5 em `supabase/migrations/`.
- Expor o schema `jobs` na API do Supabase.
- `packages/db`: tipos gerados (`supabase gen types`), clients (browser, server e service).
- Login no `apps/vagas` com Supabase Auth (magic link) + middleware que bloqueia quem não está em `app_users`.
- Página `/perfil`: editar `master` (experiências, projetos, skills, formação) e `preferences`.
- Função `buildRedactedProfile(master)` em `packages/core`, que remove contatos e identificadores.
- Seed com as fontes iniciais em `jobs.sources`.

**Entregáveis**
- Migrations versionadas.
- Login funcional restrito por allowlist.
- Perfil mestre preenchido (o Gabriel preenche; o agente entrega o formulário e um importador de JSON).

**CA**
- [ ] Usuário fora da allowlist não lê nenhuma linha (teste de RLS automatizado).
- [ ] `redacted` não contém e-mail, telefone, links pessoais nem endereço (teste unitário com regex/PII).
- [ ] Bucket `resumes` privado, acessível só por URL assinada.

---

### Fase 2 — Framework de scraping + primeira fonte (Gupy)
**Objetivo:** infraestrutura de workers e uma fonte ponta a ponta.
**Dependências:** Fase 1.

**Tarefas**
- `workers/src/lib/http.ts`: client com rate limit por host, retry com backoff, timeout e User-Agent.
- Logger estruturado (JSON) sem dados pessoais.
- CLI: `pnpm worker scrape --source gupy [--board slug]`.
- Registro de execução em `jobs.scrape_runs`.
- Adapter Gupy: investigar o endpoint JSON usado pelo portal de vagas/páginas de carreira; documentar em `docs/sources/gupy.md` (endpoint, paginação, campos, limites, termos).
- Upsert em `jobs.postings` (`unique source_key + external_id`) e atualização de `last_seen_at`.
- Marcação de vagas fechadas (não vistas em N execuções → `closed_at`).
- Workflow `scrape.yml` (cron horário) com secrets do Supabase.

**Entregáveis**
- Pacote de workers com testes usando fixtures.
- Ficha da fonte Gupy.
- Workflow agendado rodando.

**CA**
- [ ] Execução completa sem erro em 10 boards de teste.
- [ ] Reexecução não duplica vagas.
- [ ] Testes do adapter passam offline (fixtures).
- [ ] Rate limit verificado (≤ 1 req/s por host).

---

### Fase 3 — Descoberta de empresas (boards)
**Objetivo:** escalar de dezenas para milhares de boards automaticamente.
**Dependências:** Fase 2.

**Tarefas**
- `discovery/crtsh.ts`: consultar Certificate Transparency (`crt.sh`) por subdomínios de ATS (ex.: `%.gupy.io`); extrair slugs, deduplicar e filtrar subdomínios técnicos.
- `discovery/validate.ts`: validar se o slug tem página de vagas ativa antes de inserir.
- Entrada manual de boards pela página `/fontes`.
- Política de saúde: `consecutive_failures ≥ 5` → `active = false`.
- Workflow `discovery.yml` (semanal).

**Entregáveis**
- Script de descoberta reutilizável por ATS (parâmetro: domínio base).
- Relatório da execução em `scrape_runs.stats` (encontrados, válidos, novos).

**CA**
- [ ] ≥ 500 boards válidos da Gupy descobertos.
- [ ] Boards inválidos não entram; boards mortos são desativados automaticamente.

---

### Fase 4 — Novas fontes
**Objetivo:** ampliar a cobertura, uma fonte por PR.
**Dependências:** Fase 2 (Fase 3 para descoberta dos boards de cada ATS).

**Ordem sugerida** (custo/benefício):
1. **Greenhouse, Lever, Ashby:** APIs públicas oficiais de job board (vagas internacionais/remotas).
2. **InHire:** investigar o padrão de URL das páginas de carreira e o JSON interno.
3. **Solides, Quickin, Abler, Pandapé:** mesma abordagem.
4. **Agregadores com API:** Adzuna, Jooble (exigem chave gratuita).
5. **GitHub Issues:** repositórios de vagas (ex.: frontendbr/vagas, backend-br/vagas) via API do GitHub.
6. **Nichos tech:** Programathor, Remotar, Remotive (verificar se há API/feed antes de scraping).

**Para cada fonte**
- Ficha em `docs/sources/<fonte>.md` (endpoint, termos/robots, limites, campos).
- Adapter + fixtures + testes.
- Inclusão no workflow.

**Entregáveis**
- ≥ 5 fontes ativas ao fim da fase.
- Página `/fontes` mostrando status, última execução e volume por fonte.

**CA**
- [ ] Cada adapter respeita o contrato da seção 4.3.
- [ ] Fonte que proíbe coleta nos termos/robots não é implementada (registrada na ficha como "descartada").
- [ ] ≥ 1.000 vagas novas/semana somando todas as fontes.

---

### Fase 5 — Normalização e deduplicação
**Objetivo:** uma vaga = uma linha canônica, mesmo vinda de várias fontes.
**Dependências:** Fase 4 (pode começar em paralelo após a Fase 2).

**Tarefas**
- `packages/core/normalize.ts`: título (remove "Vaga:", gênero "(a)", códigos), empresa (Ltda, S.A., acentos), local (cidade/UF, remoto).
- Inferência de senioridade e modelo de trabalho por regras.
- `dedup_hash` + preenchimento de `canonical_id`; o feed mostra só canônicas, com links de todas as fontes.
- Conversão de HTML para texto limpo da descrição.

**Entregáveis**
- Funções puras com testes de tabela (≥ 50 casos reais).

**CA**
- [ ] Taxa de duplicatas no feed < 5% numa amostra manual de 100 vagas.

---

### Fase 6 — Matching e ranqueamento
**Objetivo:** priorizar as vagas certas gastando o mínimo de IA.
**Dependências:** Fases 1 e 5.

**Tarefas**
- **Etapa 1 (determinística):** filtros de `preferences` (local, remoto, senioridade, palavras obrigatórias/proibidas, idade máxima da vaga).
- **Etapa 2 (embeddings):** embed do perfil redigido e das vagas aprovadas na etapa 1; similaridade via pgvector; envio em lote respeitando os limites do free tier.
- **Etapa 3 (LLM):** top N/dia (padrão 30, configurável) → prompt que retorna JSON `{score, strengths[], gaps[], red_flags[], summary}`; validar com Zod.
- `packages/ai`: wrapper de provedores (Gemini principal, fallback configurável), retry em 429, controle de cota diária.
- Workflow `score.yml` encadeado após o scrape.
- Notificação: score ≥ limiar (padrão 75) → `POST /api/internal/notify` (protegido por segredo).

**Entregáveis**
- Pipeline de score rodando automaticamente.
- Prompts versionados em `packages/ai/prompts/` com exemplos.

**CA**
- [ ] Nenhuma chamada de LLM contém dados pessoais (teste que inspeciona o payload).
- [ ] Execução diária cabe no free tier (log de chamadas por dia).
- [ ] Precisão percebida do top 10 ≥ 70% numa avaliação manual de uma semana.

---

### Fase 7 — Currículo adaptado e validador de fatos
**Objetivo:** gerar currículo e mensagem por vaga, sem inventar nada.
**Dependências:** Fase 6.

**Tarefas**
- Prompt de adaptação: recebe `profile.redacted` + vaga → JSON de currículo (ordem das seções, bullets reescritos, skills priorizadas) + `cover_note` curta.
- **Validador de fatos:** cada bullet/skill gerado precisa mapear para um item de `profile.master` (match por ID de origem que o LLM devolve + checagem por similaridade); itens sem origem são removidos e registrados em `fact_check`.
- Template PDF com `@react-pdf/renderer` (limpo e compatível com ATS: uma coluna, sem tabelas complexas, fontes padrão).
- Inserção dos dados de contato **somente** na renderização do PDF, no servidor.
- Rota `POST /api/resume/generate` → salva em `resume_versions` e no bucket `resumes`.

**Entregáveis**
- Geração sob demanda pela tela da vaga.
- Template PDF aprovado pelo Gabriel.

**CA**
- [ ] 0 fatos não rastreáveis em 20 currículos gerados (relatório do validador).
- [ ] PDF passa num parser de ATS (texto extraível na ordem correta).
- [ ] Geração em < 30 s.

---

### Fase 8 — PWA (interface)
**Objetivo:** app instalável, rápido no celular, com a identidade do PequiDev.
**Dependências:** Fases 1 e 6 (telas podem começar com dados mock após a Fase 1).

**Telas**
- **Feed:** cards ordenados por score, com filtros, ações rápidas (salvar, descartar, abrir) e swipe no mobile.
- **Detalhe da vaga:** descrição, score, pontos fortes/lacunas, links das fontes, botão "gerar currículo", prévia do PDF e mensagem copiável.
- **Candidaturas:** kanban por status (enviada → entrevista → oferta/recusa/sem resposta).
- **Perfil e preferências.**
- **Fontes:** saúde dos scrapers.

**Tarefas**
- Manifest, service worker (cache do shell + feed offline) e ícones.
- Design com `packages/ui` no visual "3D suave" do PequiDev.
- Pequi como mascote de estados vazios/carregamento e mensagens ("achei 3 vagas boas pra você").

**Entregáveis**
- PWA instalável em Android e iOS.

**CA**
- [ ] Lighthouse PWA/performance ≥ 90 no mobile.
- [ ] Feed abre offline com os últimos dados.
- [ ] Todas as telas funcionam com 380 px de largura.

---

### Fase 9 — Notificações push
**Objetivo:** avisar as vagas boas na hora certa.
**Dependências:** Fases 6 e 8.

**Tarefas**
- Web Push com chaves VAPID; inscrição em `/api/push/subscribe`.
- `/api/internal/notify` agrupa vagas (no máximo 1 push por hora, com resumo).
- Digest diário via cron da Vercel (1x/dia, compatível com o Hobby).
- Preferências: horário silencioso e limiar de score.

**Entregáveis**
- Push funcionando no PWA instalado.

**CA**
- [ ] Push recebido em Android e em iOS (PWA instalado na tela inicial).
- [ ] Sem notificações duplicadas para a mesma vaga (`matches.notified_at`).

---

### Fase 10 — Candidatura assistida e envio por e-mail
**Objetivo:** reduzir a candidatura a poucos toques, com controle humano.
**Dependências:** Fases 7 e 8.

**Tarefas**
- **Modo assistido (padrão):** botão "Aplicar" abre a página da vaga; material pronto (PDF para baixar, mensagem copiável, respostas sugeridas para perguntas comuns) e registro automático em `applications` ao confirmar.
- **Modo e-mail:** quando `apply_method = 'email'`, montar o rascunho (assunto, corpo, PDF anexo); envio só após confirmação explícita na UI. Implementar via Gmail API/SMTP do próprio Gabriel.
- Limite diário de envios configurável (padrão 10) para manter a qualidade.
- **Não implementar** preenchimento automático de formulários de ATS nesta versão (registrar como possível fase futura, com nova análise de termos).

**Entregáveis**
- Fluxo assistido completo.
- Envio por e-mail com confirmação.

**CA**
- [ ] Nenhum envio acontece sem clique de confirmação.
- [ ] Toda candidatura fica registrada com a versão de currículo usada.

---

### Fase 11 — Observabilidade, custos e hardening
**Objetivo:** rodar sozinho sem surpresas.
**Dependências:** Fases 2 a 10.

**Tarefas**
- Painel em `/fontes`: execuções, erros, vagas/dia, chamadas de IA/dia e minutos do Actions no mês.
- Alertas (push para o próprio Gabriel) quando: fonte falha 3x seguidas, cota de IA > 80% ou Actions > 80% da cota.
- Limpeza: vagas fechadas há > 60 dias perdem `raw` e `embedding`.
- Revisão de segurança: RLS, segredos, rotas internas, URLs assinadas.
- Backup: dump semanal do schema `jobs` (sem currículos) para um artefato privado.

**Entregáveis**
- Checklist de segurança assinado em `docs/decisions/`.
- Runbook `docs/runbook.md` (o que fazer quando uma fonte quebra, cota estoura, etc.).

**CA**
- [ ] 14 dias rodando sem intervenção manual.
- [ ] Custo mensal = R$0 (ou documentado o motivo e o valor).

---

### Fase 12 — Case no PequiDev
**Objetivo:** transformar o projeto em conteúdo de portfólio.
**Dependências:** Fase 11.

**Tarefas**
- Post no blog: problema, arquitetura (diagrama), decisões (por que não LinkedIn, por que ATS + CT logs, funil de IA barato, validador de fatos), números agregados.
- Página de projeto com prints usando **dados fictícios**.
- Revisão para garantir que não há dados pessoais, links para o subdomínio privado nem detalhes que facilitem abuso das fontes.

**Entregáveis**
- Post publicado + página de projeto.

**CA**
- [ ] Nenhum dado real de candidatura ou currículo exposto.
- [ ] Gabriel aprovou o texto final.

---

## 7. Mapa de dependências

```
F0 ─► F1 ─► F2 ─► F3
             │     │
             └─► F4 ◄┘
             └─► F5 ─► F6 ─► F7 ─► F10
F1 ─► F8 (mock) ──────► F8 (real, após F6) ─► F9
F2..F10 ─► F11 ─► F12
```

**Paralelizável entre agentes:** F3/F4/F5 (após F2); F8 com mocks (após F1); adapters da F4 (um agente por fonte).

---

## 8. Variáveis de ambiente

| Variável | Onde | Uso |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel (vagas) | client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel (vagas) | client |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel (server) + GitHub Secrets | workers e rotas internas |
| `GEMINI_API_KEY` | Vercel + GitHub Secrets | LLM e embeddings |
| `LLM_FALLBACK_PROVIDER` / `LLM_FALLBACK_API_KEY` | idem | fallback |
| `ADZUNA_APP_ID` / `ADZUNA_APP_KEY` | GitHub Secrets | fonte Adzuna |
| `JOOBLE_API_KEY` | GitHub Secrets | fonte Jooble |
| `GITHUB_TOKEN` | GitHub Actions (automático) | fonte GitHub Issues |
| `INTERNAL_NOTIFY_SECRET` | Vercel + GitHub Secrets | protege `/api/internal/*` |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Vercel | Web Push |
| `CRON_SECRET` | Vercel | protege o cron do digest |
| `DAILY_LLM_BUDGET` | Vercel + GitHub Secrets | teto de chamadas/dia |

---

## 9. Riscos e mitigação

| Risco | Impacto | Mitigação |
|---|---|---|
| Fonte muda o JSON/HTML | Adapter quebra | Fixtures + testes de contrato, alerta após 3 falhas, ficha da fonte atualizada |
| Bloqueio por excesso de requisições | Perda da fonte | Rate limit conservador, cache, coleta incremental (`since`) |
| Free tier de IA muda ou fica menor | Score para | Funil com filtro + embeddings, teto diário, fallback de provedor |
| Vazamento de dados pessoais | Alto | Perfil redigido para IA, RLS, bucket privado, sem logs de PII |
| IA inventa experiência | Reputação | Validador de fatos obrigatório (Fase 7) |
| Cota do GitHub Actions estoura | Coleta para | Monitoramento (Fase 11), reduzir frequência, plano B com VPS |
| Termos de uma fonte proíbem coleta | Legal/ética | Checagem obrigatória na ficha antes de implementar |

---

## 10. Definition of Done (todas as tarefas)

- [ ] Critérios de aceite da tarefa atendidos.
- [ ] Lint, typecheck e testes passando no CI.
- [ ] Sem segredos ou dados pessoais em código/logs.
- [ ] Documentação atualizada (ficha da fonte, ADR ou runbook, quando aplicável).
- [ ] PR descrito, com checklist e prints (para UI).

---

## 11. Perguntas em aberto (preencher em `docs/open-questions.md`)

- Domínio final do subdomínio (`vagas.<dominio>`)?
- Limiar de score para push e N diário de vagas para o LLM?
- Preferências iniciais: cidades, remoto/híbrido, senioridade, faixa salarial, stacks prioritárias, empresas a excluir.
- Idiomas do currículo (PT e EN?) e se haverá template separado para vagas internacionais.
- Repositório público ou privado (impacta a cota do Actions e a exposição do código dos scrapers)?
