import { Anton, DM_Sans, JetBrains_Mono, Space_Grotesk } from "next/font/google";

/**
 * Fontes da marca para os apps Next.js. Cada uma vira uma variável CSS que
 * tokens.css usa em --font-sans, --font-display, --font-mono e --font-meme.
 * Basta pôr `fontVariables` no className do <html>.
 */

/** Títulos. */
export const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

/** Texto corrido. */
export const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

/** Código. */
export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

/** Só nas falas e legendas do Pequi. */
export const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
  display: "swap",
});

export const fontVariables = [
  spaceGrotesk.variable,
  dmSans.variable,
  jetbrainsMono.variable,
  anton.variable,
].join(" ");
