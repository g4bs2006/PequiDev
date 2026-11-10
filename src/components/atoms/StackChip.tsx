import type { ReactNode } from "react";

/**
 * Etiqueta de tecnologia, em fonte de código. Herda a cor do texto em volta,
 * por isso funciona tanto no cartão claro quanto em cima da faixa Céu.
 */
export function StackChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-current/25 px-3 py-1 font-mono text-[0.8125rem] leading-5">
      {children}
    </span>
  );
}
