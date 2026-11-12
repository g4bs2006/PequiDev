/**
 * As reações do Pequi em formato de meme. As imagens estão em
 * public/pequi/poses/ e o catálogo, com a inspiração de cada uma, em
 * docs/poses-do-pequi.md. Legenda e emoji ficam fora da imagem, como texto.
 */
export type PequiMeme = {
  /** Nome curto, para escolher no painel. */
  label: string;
  image: string;
  /** Descreve a foto. A legenda é lida à parte. */
  alt: string;
  /** Legenda no alto da imagem. */
  top?: string;
  /** Legenda na base da imagem. */
  bottom?: string;
  /** Emoji no canto de baixo, à esquerda, como nos memes originais. */
  emoji?: string;
};

export const pequiMemes = {
  bravo: {
    label: "Bravo",
    image: "/pequi/poses/bravo.webp",
    alt: "O Pequi em close, de cara fechada, prestes a reclamar.",
    top: "eu irei",
    bottom: "falar palavras feias",
  },
  "hang-loose": {
    label: "Hang loose",
    image: "/pequi/poses/hang-loose.webp",
    alt: "O Pequi de olhos arregalados e língua de fora, fazendo cara de feliz.",
    top: "valeu por ler",
    emoji: "🤙",
  },
  soldado: {
    label: "Soldado",
    image: "/pequi/poses/soldado.webp",
    alt: "O Pequi com uma panela na cabeça, de olhar cansado, num campo enevoado.",
    bottom: "sobrevivi a mais um deploy",
  },
  pensativo: {
    label: "Pensativo",
    image: "/pequi/poses/pensativo.webp",
    alt: "O Pequi de perfil, com a pata no queixo, olhando o pôr do sol.",
    bottom: "e se o problema for o cache?",
  },
  "na-verdade": {
    label: "Na verdade",
    image: "/pequi/poses/na-verdade.webp",
    alt: "O Pequi de óculos e dentinhos de fora, com cara de quem vai explicar uma coisa.",
    top: "na verdade...",
    emoji: "☝️",
  },
} satisfies Record<string, PequiMeme>;

export type PequiMemeName = keyof typeof pequiMemes;

/** As poses, na ordem do catálogo. */
export const pequiMemeNames = Object.keys(pequiMemes) as PequiMemeName[];

/** O texto é o nome de uma pose? (O banco também confere.) */
export function isPequiMeme(name: unknown): name is PequiMemeName {
  return typeof name === "string" && name in pequiMemes;
}
