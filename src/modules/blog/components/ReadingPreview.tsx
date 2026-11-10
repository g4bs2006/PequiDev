import type { Post } from "../types";
import { PostArticle } from "./PostArticle";

/**
 * Um post de mentira, montado pelos mesmos componentes da página de post de
 * verdade (/blog/[slug]). Serve para ver a tipografia, o código e o Pequi no
 * índice sem precisar publicar nada no banco. O texto explica o que observar;
 * nenhum trecho fala pelo Gabriel.
 */
const content = `Este é um post de exemplo. Ele passa pelos mesmos componentes de um post de verdade: o Markdown vira a página, os títulos montam o índice ao lado e os blocos de código ganham cor e um botão de copiar.

Repare no índice: o Pequi fica junto da seção que está na tela. Quando a leitura passa para a próxima, ele pula até lá. Se ninguém rolar a página por trinta segundos, ele deita e dorme.

## Texto corrido

Parágrafos ficam numa coluna estreita, com letra grande e linhas espaçadas, para ler sem cansar. Dá para usar **negrito**, *itálico*, \`código no meio da frase\` e [links para outras páginas](/projetos).

> Uma citação fica assim, com a barra na cor Polpa. Serve para destacar uma ideia ou trazer a fala de alguém.

## Listas

Uma lista simples:

- primeiro item
- segundo item, um pouco mais comprido, para ver como a linha quebra quando o texto não cabe
- terceiro item

E uma lista numerada:

1. instalar as dependências
2. rodar o projeto
3. conferir no navegador

### Uma subseção

Subseções aparecem recuadas no índice. Este parágrafo só está aqui para dar altura à página.

## Blocos de código

O código é colorido no servidor, com as cores do site, e o botão no canto copia o bloco inteiro:

\`\`\`ts
// Toca uma animação do sprite do Pequi.
export function showFrame(cat: HTMLElement, name: AnimationName, frame: number) {
  const row = sprite.animacoes[name].linha;
  cat.style.backgroundPosition = \`\${-frame * CELL_W}px \${-row * CELL_H}px\`;
}
\`\`\`

Também funciona com outras linguagens:

\`\`\`bash
npm install
npm run dev
\`\`\`

## Tabelas

| Comando | O que faz |
| --- | --- |
| \`npm run dev\` | Sobe o site em modo de desenvolvimento |
| \`npm run build\` | Gera a versão de produção |
| \`npm run lint\` | Confere o código |

## Fim do post

No fim ficam as tags e o caminho de volta para a lista de posts.`;

const examplePost: Post = {
  slug: "exemplo",
  title: "Como fica um post",
  summary: "Um post de mentira para ver a tipografia, o código e o Pequi acompanhando a leitura.",
  publishedAt: "2026-11-10T12:00:00-03:00",
  updatedAt: "2026-11-10T12:00:00-03:00",
  cover: null,
  tags: [
    { slug: "exemplo", name: "exemplo" },
    { slug: "pequi", name: "pequi" },
  ],
  content,
};

export function ReadingPreview() {
  return <PostArticle post={examplePost} />;
}
