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
| Caixa de papelão (brincadeira 5) | `objetos.ts` (caixa, plataforma de objeto, desenho em duas camadas) e `engine.ts` (plataformas de objeto, sono na caixa); entrou com quatro correções minhas: o tempo de sono parado no primeiro quadro, a caixa caindo quando o card se mexe, entrar na caixa só com o meio do corpo, e a caixa esperando a página nova |
| Objetos do mundo e novelo (brincadeira 4) | `dream/objetos.ts` (novo), `engine.ts` e `DreamHost.tsx`; entrou com ajustes meus: a patada desce até os pés, chuta já no começo e alcança mais longe, o novelo cai perto do gato, o desenho usa pixels de 2 px, e as plataformas tombando guardam a posição de antes |
| Patada que derruba (brincadeira 3) | `engine.ts` (busca do alvo e animação); entrou com dois ajustes meus: `tagName` de SVG em minúsculas e giro proporcional à largura, para os títulos largos também tombarem |
| Ponteiro laser do sonho (brincadeira 2) | `engine.ts` (alvo, piloto automático, desenho) e `DreamHost.tsx` (botão e anúncios); entrou com um ajuste meu: o botão mantém o nome "Laser" e mostra o estado com `aria-pressed` e um ponto visual |
| Sitemap, robots e feed RSS | `src/app/sitemap.ts`, `robots.ts`, `feed.xml/route.ts` e o feed anunciado no layout; entrou sem ajustes |
| Blog: páginas por tag, "Leia também", imagem de compartilhamento por post, JSON-LD | 16 arquivos; entrou com dois ajustes meus (a imagem tinha texto alternativo por post, que mudava o endereço dela, e um erro de tipo escondido) |
| "O humano por trás" editável no painel | `home/queries.ts`, `About` lendo o banco, `AboutForm`, `salvarSobre`, `/admin/sobre`; entrou sem ajustes |
| Interações do sonho e entrada pelo hero (etapas 2 e 3) | `engine.ts` evoluído, `DreamHost`, `DreamDock`, `DreamTrigger`, `TitleBand`; entrou com ajustes meus: chão pela borda de baixo no menu, ignorar links de âncora, reaparecer no alto, foco padrão no gatilho |
| Motor do modo sonho (etapa 1) | `engine.ts`, `DreamMode.tsx` e `/brincar/sonho`; entrou com um ajuste (tirar um `<main>` aninhado) |

Fora do Sol: a correção da queda sem fim do sonho na página de projeto mexeu em
poucas linhas. Escrever a especificação daria mais trabalho que a correção,
então foi feita direto (ver docs/modo-sonho.md).
