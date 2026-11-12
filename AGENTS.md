# Agentes no monorepo PequiDev

- Leia as seções 1 a 4 de [docs/PLANO.md](docs/PLANO.md) antes de qualquer tarefa e siga as regras da seção 2
  (escopo por fase, privacidade, scraping responsável, IA sem inventar fatos, Conventional Commits).
- Gerenciador de pacotes: **pnpm** (nunca npm ou yarn). Antes de abrir PR: `pnpm check` e `pnpm format:check`.
- Next.js 16 com mudanças grandes: antes de mexer em `apps/blog` ou `apps/vagas`, leia o `AGENTS.md`
  do app e a documentação em `apps/<app>/node_modules/next/dist/docs/`.
- O blog (`apps/blog`) tem regras próprias de arquitetura no `apps/blog/README.md`.
- Decisões de arquitetura viram ADR em `docs/decisions/`; dúvidas de produto vão para `docs/open-questions.md`.
