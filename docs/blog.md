# Como escrever um post

Os posts ficam na tabela `posts` do Supabase e o texto é Markdown. A página
`/blog/[slug]` monta tudo sozinha: abertura, índice lateral, código colorido,
tags e a reação do Pequi. O jeito de publicar é o painel (`/admin`).

Uma prévia com todos os recursos está em `/brincar/leitura` (um post de mentira
que passa pelos mesmos componentes).

## Os campos

| Campo | O que é |
| --- | --- |
| `slug` | O endereço: `/blog/<slug>`. Minúsculas, números e hífen (`meu-primeiro-agente`). |
| `title` | O título, que vira o h1 da página e o título do link compartilhado |
| `summary` | Uma ou duas frases. Aparece na lista, abaixo do título e no link compartilhado |
| `content` | O texto, em Markdown |
| `cover_image_url` e `cover_image_alt` | Capa opcional (16:9). Vira a imagem do link compartilhado. Envie para o bucket `imagens` do Storage. |
| `status` | `draft` enquanto escreve, `published` para ir ao ar |
| `pequi_reacao` e `pequi_legenda` | A foto do Pequi no fim do post (uma das poses de docs/poses-do-pequi.md) e uma legenda própria opcional |
| `published_at` | A data que aparece no post e define a ordem da lista |
| Tags | Na tabela `tags`, ligadas ao post em `post_tags` |

O site guarda os posts em cache por algumas horas. Publicando pelo painel
(`/admin`, ver docs/painel.md), o site atualiza na hora; publicando direto no
banco, o post novo pode levar até uma hora para aparecer.

## O Markdown

O título do post já é o h1. Dentro do texto:

- `##` abre uma seção e `###` uma subseção. As duas entram no índice lateral.
  Um `#` solto vira seção também.
- **Negrito**, *itálico*, `código no meio da frase`, links, listas, citações
  (`>`), linha (`---`) e tabelas funcionam como no GitHub.
- Links para fora do site abrem em outra aba; links internos (`/projetos`)
  trocam de página com a transição do site.

### Código

Bloco de código com a linguagem logo depois das crases:

````md
```ts
const pequi = "gato";
```
````

- A cor sai no servidor, com as cores do site, e funciona com qualquer
  linguagem que o Shiki conhece (`ts`, `tsx`, `js`, `py`, `bash`, `sql`,
  `json`, `css`, `html`...). Sem linguagem ou com uma desconhecida, o bloco sai
  sem cor.
- Todo bloco ganha o nome da linguagem e um botão "copiar" no canto. Quando
  alguém copia, o Pequi reage.

### Imagens

```md
![Texto alternativo descrevendo a imagem](https://.../imagem.webp "Legenda opcional")
```

- O texto alternativo é obrigatório: descreve a imagem para quem não vê.
- O texto entre aspas, se houver, vira a legenda embaixo da imagem.
- Imagens do bucket `imagens` (ou de `/public`) passam pelo otimizador do Next.
  Imagens de outros sites aparecem como estão.
- Prefira WebP, com no máximo 1600 px de largura.

## Do jeito do site

- O post é escrito pelo Gabriel, em primeira pessoa. O Pequi só ilustra.
- O resumo e o título são o que aparece quando o link é compartilhado: vale
  caprichar.
- O tempo de leitura é calculado sozinho (200 palavras por minuto).
- Se o post for editado mais de um dia depois de publicado, aparece
  "Atualizado em" no fim.

## Onde mora o código

| O quê | Onde |
| --- | --- |
| Lista `/blog` | `src/modules/blog/components/BlogIndex.tsx` |
| Página do post | `PostArticle` (abertura e fim), `PostLayout` (coluna e índice), `PostBody` (o Markdown) |
| Tipografia do texto | `src/modules/blog/components/PostBody.module.css` |
| Cores do código | Tokens `--shiki-*` no `globals.css`, apontando para os `--code-*` |
| Índice | `extractHeadings` em `src/modules/blog/headings.ts` (mesmos ids do `rehype-slug`) |
| Textos fixos | `src/modules/blog/content.ts` |
