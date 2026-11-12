# PequiDev

Monorepo do PequiDev: o blog e portfólio do Gabriel e o **PequiDev Vagas**, um PWA privado que
coleta, ranqueia e ajuda a se candidatar a vagas. O plano completo do módulo de vagas, com as fases
e as regras para quem trabalha nele, está em [docs/PLANO.md](docs/PLANO.md).

## Estrutura

```
apps/
  blog/         Blog e portfólio (público). Guia próprio em apps/blog/README.md
  vagas/        PWA privado de vagas (vagas.<dominio>)
packages/
  config/       tsconfig, ESLint e Prettier compartilhados
  ui/           Tokens da marca (paleta, fontes, sombras, movimento)
workers/        Coleta e ranqueamento de vagas, rodando no GitHub Actions
supabase/       Migrations do banco (um só banco para tudo)
docs/           Plano, decisões (ADRs), fichas de fontes e perguntas em aberto
```

Os pacotes `packages/db`, `packages/core` e `packages/ai` chegam nas próximas fases do plano.

## Rodar no computador

Precisa de Node 22 e pnpm 10 (`corepack enable` já instala a versão certa).

```bash
pnpm install
cp apps/blog/.env.example apps/blog/.env.local    # preencha com o Supabase
pnpm --filter blog dev                            # http://localhost:3000
pnpm --filter vagas dev                           # http://localhost:3001
```

| Comando                            | O que faz                                            |
| ---------------------------------- | ---------------------------------------------------- |
| `pnpm dev`                         | Sobe todos os apps                                   |
| `pnpm --filter <app> dev`          | Sobe só um app (`blog` ou `vagas`)                   |
| `pnpm build`                       | Build de tudo (com cache do Turborepo)               |
| `pnpm check`                       | Lint, typecheck e testes de todos os pacotes (o CI)  |
| `pnpm lint` / `typecheck` / `test` | Cada verificação separada                            |
| `pnpm format`                      | Formata com o Prettier (o blog fica de fora por ora) |
| `pnpm worker <tarefa>`             | Roda uma tarefa dos workers (`pnpm worker --help`)   |

Para adicionar uma dependência a um pacote: `pnpm --filter <pacote> add <dep>`.

## Deploy

Dois projetos na Vercel, apontando para o mesmo repositório:

| Projeto | Root Directory | Domínio           |
| ------- | -------------- | ----------------- |
| Blog    | `apps/blog`    | domínio principal |
| Vagas   | `apps/vagas`   | `vagas.<dominio>` |

Cada app tem um `vercel.json` com `turbo-ignore`: a Vercel só builda o app quando ele ou um pacote
de que ele depende mudou. Detalhes em [docs/decisions/0001-monorepo.md](docs/decisions/0001-monorepo.md).

## Para agentes

Leia as seções 1 a 4 do [plano](docs/PLANO.md) antes de qualquer tarefa e siga as regras da seção 2.
Dúvidas de produto vão para [docs/open-questions.md](docs/open-questions.md).
