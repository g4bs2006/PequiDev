# 0001 — Monorepo pnpm + Turborepo

- **Status:** aceito
- **Data:** 2026-11-12
- **Fase:** 0

## Contexto

O PequiDev era um único app Next.js na raiz do repositório, instalado com npm. O módulo de vagas
([plano](../PLANO.md)) precisa de um segundo app (PWA privado), de workers Node que rodam no GitHub
Actions e de pacotes compartilhados (tipos do banco, regras de domínio, wrappers de IA, tokens de UI).
O banco Supabase é o mesmo para tudo.

## Decisão

1. **pnpm workspaces + Turborepo.** Pacotes: `apps/blog`, `apps/vagas`, `packages/*`, `workers`.
   Nomes com escopo `@pequidev/*`; o pnpm aceita o nome curto no filtro (`pnpm --filter vagas dev`).
2. **O blog foi movido inteiro para `apps/blog`**, com `scripts/`, `referencias/` e os guias em
   `docs/`, porque todos usam caminhos relativos à raiz do blog (os scripts Python calculam a raiz
   como `parent.parent`). Nada no código do blog mudou.
3. **`supabase/` fica na raiz**: um banco, um histórico de migrations para os dois apps.
4. **`docs/` da raiz** guarda o que é do projeto todo: plano, ADRs, fichas de fontes e perguntas.
5. **`packages/config`** exporta tsconfig (`base`, `nextjs`, `node`), ESLint (`next`, `node`) e
   Prettier. A base liga `strict` e `noUncheckedIndexedAccess`; o ESLint proíbe `any` explícito.
6. **`packages/ui`** exporta `tokens.css` (paleta, papéis, tema escuro, sombras, movimento e o
   `@theme` do Tailwind 4), `tokens.ts` (a paleta em TS) e `fonts.ts` (as quatro fontes via
   `next/font`). Um teste garante que o CSS e o TS têm os mesmos valores.
7. **O blog ainda não consome `@pequidev/ui` nem `@pequidev/config`.** Ele mantém o próprio
   `globals.css`, `eslint.config.mjs` e `tsconfig.json`, idênticos aos de antes, e fica fora do
   Prettier (`.prettierignore`). Assim a Fase 0 não muda nada no que o blog entrega. A migração
   do blog fica como pergunta aberta (#6 em `open-questions.md`).
8. **Ignored build step:** `apps/blog/vercel.json` e `apps/vagas/vercel.json` usam
   `npx turbo-ignore`, que pula o deploy quando nem o app nem as dependências dele mudaram.
   Como o blog não depende de nenhum pacote do workspace, mudanças em `apps/vagas`, `packages/*`
   ou `workers/` não disparam build do blog.
9. **CI** (`.github/workflows/ci.yml`): `pnpm install --frozen-lockfile`, `format:check` e
   `pnpm check` (lint + typecheck + testes de todos os pacotes). O CI não roda `build` porque o
   build do blog busca dados no Supabase e precisaria de segredos; a Vercel faz esse papel nos
   previews.

## Alternativas descartadas

- **Repositório separado para vagas:** duplicaria tokens, tipos do banco e configs, e o plano já
  prevê pacotes compartilhados.
- **npm workspaces:** funciona, mas o pnpm é mais estrito (cada pacote só enxerga o que declara) e
  mais rápido no CI. A troca expôs duas dependências que o blog usava sem declarar
  (`@types/hast`, `@types/mdast`); agora estão no `package.json` dele.
- **Nx:** mais poderoso do que o necessário para quatro pacotes.

## Consequências

- **Configuração manual na Vercel (antes do merge):** o projeto atual do blog precisa de
  _Root Directory = `apps/blog`_. Sem isso, o deploy de produção quebra depois do merge. O projeto
  novo de vagas usa _Root Directory = `apps/vagas`_ e o domínio `vagas.<dominio>` (pergunta #1).
  Nos dois, a Vercel detecta o pnpm pelo `pnpm-lock.yaml` da raiz e instala o workspace.
- **Verificação de regressão feita na migração:** lint e typecheck do blog iguais aos de antes
  (1 warning pré-existente); build compila igual; o CSS gerado é idêntico ao de antes, exceto pelos
  hashes dos CSS Modules, que dependem do caminho do arquivo. A coleta de dados do build não pôde
  rodar no ambiente da migração (sem acesso ao Supabase); a confirmação final é o preview da Vercel.
- Comandos mudam de `npm run x` para `pnpm --filter blog x` (ver README da raiz).
