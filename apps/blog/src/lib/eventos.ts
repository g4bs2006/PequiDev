/**
 * Avisos do site: coisas que acontecem na página e que outras partes podem
 * querer saber. Quem avisa não sabe quem ouve. Hoje quem ouve é o Pequi, que
 * reage a cada um (src/modules/pequi). Ver docs/pequi.md.
 *
 * Para um aviso novo: acrescente o tipo aqui, chame `avisar` onde ele acontece
 * e decida a reação no Pequi. O componente que avisa não muda mais.
 */
export type AvisoDoSite = {
  /** O tema acabou de trocar. */
  tema: { tema: "light" | "dark" };
  /** Alguém copiou um bloco de código de um post. */
  "codigo-copiado": { linguagem: string | null };
  /**
   * Alguém pediu para entrar no modo sonho. `origem` é o ponto da página
   * (coordenadas do documento) onde o Pequi do sonho aparece; sem ela, ele cai
   * do alto da tela.
   */
  "sonho-entrar": { origem: { x: number; y: number } | null };
};

export type TipoDeAviso = keyof AvisoDoSite;

const EVENTO = "pequidev:aviso";

type Detalhe<T extends TipoDeAviso = TipoDeAviso> = { tipo: T; dados: AvisoDoSite[T] };

export function avisar<T extends TipoDeAviso>(tipo: T, dados: AvisoDoSite[T]) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<Detalhe<T>>(EVENTO, { detail: { tipo, dados } }));
}

/** Ouve todos os avisos. Devolve a função que para de ouvir. */
export function ouvir(callback: (aviso: Detalhe) => void) {
  const handler = (event: Event) => callback((event as CustomEvent<Detalhe>).detail);
  window.addEventListener(EVENTO, handler);
  return () => window.removeEventListener(EVENTO, handler);
}
