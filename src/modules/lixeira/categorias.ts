/**
 * As classes que a lixeira reconhece e em qual lixeira cada uma vai, pela cor
 * da coleta seletiva. As cores são tokens de globals.css (--lixeira-*). Ver
 * docs/lixeira.md, seção Categorias.
 */
export type Categoria = {
  /** Nome que aparece na tela. */
  nome: string;
  /** Qual lixeira recebe. */
  lixeira: "Reciclável" | "Não reciclável";
  /** Nome da cor, sempre escrito junto dela para quem não distingue cores. */
  cor: string;
  /** Token do fundo e do texto por cima. */
  fundo: string;
  texto: string;
};

export const categorias = {
  metal: {
    nome: "Metal",
    lixeira: "Reciclável",
    cor: "Amarelo",
    fundo: "var(--lixeira-amarelo)",
    texto: "var(--on-lixeira-amarelo)",
  },
  plastico: {
    nome: "Plástico",
    lixeira: "Reciclável",
    cor: "Vermelho",
    fundo: "var(--lixeira-vermelho)",
    texto: "var(--on-lixeira-vermelho)",
  },
  papel: {
    nome: "Papel",
    lixeira: "Reciclável",
    cor: "Azul",
    fundo: "var(--lixeira-azul)",
    texto: "var(--on-lixeira-azul)",
  },
  vidro: {
    nome: "Vidro",
    lixeira: "Reciclável",
    cor: "Verde",
    fundo: "var(--lixeira-verde)",
    texto: "var(--on-lixeira-verde)",
  },
  rejeito: {
    nome: "Rejeito",
    lixeira: "Não reciclável",
    cor: "Cinza",
    fundo: "var(--lixeira-cinza)",
    texto: "var(--on-lixeira-cinza)",
  },
} satisfies Record<string, Categoria>;

/**
 * Tudo o que o classificador pode responder. "vazio" é quando não há nada na
 * frente da câmera e não tem lixeira.
 */
export type Classe = keyof typeof categorias | "vazio";

export type CategoriaId = keyof typeof categorias;

/** As lixeiras na ordem em que aparecem na tela. */
export const categoriaIds = Object.keys(categorias) as CategoriaId[];
