import type { ReactNode } from "react";

/** Etiqueta na cor Casca: categorias, tags de post e avisos de status. */
export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-tag/15 px-3 py-1 text-sm font-medium text-tag">
      {children}
    </span>
  );
}
