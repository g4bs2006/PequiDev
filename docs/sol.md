# Delegando para o Sol

O Sol é o modelo `gpt-5.6-sol` da OpenAI, acessado pela chave que o Gabriel
liberou. Ele escreve código a partir de uma especificação fechada; o Claude
cuida da especificação, dos tokens, das integrações, da revisão, dos testes e
da publicação.

## Como funciona

```bash
OPENAI_API_KEY=... node scripts/sol.mjs <tarefa.md> <pasta-de-rascunho> [arquivos de contexto...]
```

- **A tarefa** é um Markdown com o objetivo, a lista exata de arquivos a
  entregar e as regras.
- **O contexto** são os arquivos que ele precisa ler: o código do projeto que a
  tarefa toca e os trechos da documentação do Next 16 em
  `node_modules/next/dist/docs/` (o Next 16 mudou APIs que o modelo pode não
  conhecer).
- **A resposta** vem em JSON (arquivos inteiros e notas) e é gravada numa
  pasta de rascunho, nunca direto no projeto. Ele grava também
  `_notas-do-sol.md`.
- O script recusa arquivos `.env` como contexto. A chave fica só na variável do
  terminal.
- `SOL_MODEL` e `SOL_EFFORT` trocam o modelo e o esforço de raciocínio (padrão
  `high`).

## Antes de entrar no projeto

1. Ler cada arquivo entregue e comparar com o que existia (`diff`).
2. Copiar para o projeto e rodar `tsc`, `eslint` e `npm run build`.
3. Testar no navegador o que for visível.
4. Commit dizendo que o rascunho veio do Sol.

## O que já passou pelo Sol

| Tarefa | Resultado |
| --- | --- |
| Sitemap, robots e feed RSS | `src/app/sitemap.ts`, `robots.ts`, `feed.xml/route.ts` e o feed anunciado no layout; entrou sem ajustes |
