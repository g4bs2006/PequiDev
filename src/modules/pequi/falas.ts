/**
 * O que o Pequi fala, por situação. Cada vez ele sorteia uma da lista. Falas
 * curtas, em minúscula, no jeito de gato: aparecem num balão, na fonte Anton,
 * e somem sozinhas. Provisórias, a confirmar com o Gabriel.
 */
export const falas = {
  /** Quando ele chega ao canto da tela. */
  chegou: ["cheguei", "tô de olho", "vim junto", "deixa eu ver isso"],
  /** Quando alguém clica nele. */
  carinho: ["prrr", "miau", "mais um pouco", "carinho aceito", "só mais um"],
  /** Quando o tema troca. */
  tema: ["derrubei", "assim tá melhor", "ops", "foi sem querer"],
  /** Quando ele acorda com a página mexendo. */
  acordou: ["hm?", "eu não tava dormindo", "oi", "já acordei"],
  /** Enquanto dorme. */
  dormindo: ["zzz"],
} satisfies Record<string, string[]>;

export type Situacao = keyof typeof falas;

export function sorteiaFala(situacao: Situacao) {
  const lista = falas[situacao];
  return lista[Math.floor(Math.random() * lista.length)];
}
