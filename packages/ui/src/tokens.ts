/**
 * Paleta do Pequi, com os nomes do brief. Para usar em código (manifest do PWA,
 * imagens geradas, PDF). Na interface, prefira as classes do Tailwind que saem
 * de tokens.css (bg-page, text-ink...), que já trocam com o tema.
 *
 * Os valores precisam bater com tokens.css; o teste de tokens confere isso.
 */
export const palette = {
  creme: "#FFF4DC",
  tinta: "#2A2118",
  polpa: "#F2A413",
  ceu: "#7CC8BF",
  casca: "#4E7A2E",
  focinho: "#E8697A",
} as const;

export type PaletteColor = keyof typeof palette;

/** Fontes da marca e o papel de cada uma. */
export const fontFamilies = {
  display: "Space Grotesk",
  sans: "DM Sans",
  mono: "JetBrains Mono",
  meme: "Anton",
} as const;
