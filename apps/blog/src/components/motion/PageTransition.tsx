import { type ReactNode, ViewTransition } from "react";

/** Animação de cada tipo de navegação (ver navegacao.ts). Sem tipo: "troca". */
const porTipo = { avanca: "avanca", volta: "volta", default: "troca" };

/**
 * Envolve o conteúdo de cada page.tsx para a troca de página animar. Precisa
 * ficar na página, não no layout: o layout continua na tela entre uma página e
 * outra, então nunca "entra" nem "sai". As animações estão no globals.css.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter={porTipo} exit={porTipo} default="none">
      {children}
    </ViewTransition>
  );
}
