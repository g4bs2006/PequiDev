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
  /** Quando alguém copia um bloco de código de um post. */
  copiou: ["ctrl+c aprovado", "pode levar", "testa antes, hein", "copiado"],
  /** Quando um card passa sob o mouse (às vezes). */
  card: ["esse é bom", "clica, clica", "já vi esse", "hmm, interessante"],
  /** Quando a rolagem fica rápida demais (às vezes). */
  correndo: ["espera!", "calma aí", "tô indo, tô indo"],
  /** Quando a página chega ao fim. */
  fim: ["fim da linha", "acabou? lê de novo", "chegamos", "e agora?"],
} satisfies Record<string, string[]>;

export type Situacao = keyof typeof falas;

export function sorteiaFala(situacao: Situacao) {
  const lista = falas[situacao];
  return lista[Math.floor(Math.random() * lista.length)];
}
