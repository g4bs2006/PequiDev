import { type ReactNode, ViewTransition } from "react";

/**
 * Marca um elemento que existe em duas páginas, como a capa de um projeto no
 * card e na página dele. Com o mesmo `name` nas duas pontas, a troca de página
 * leva o elemento de um lugar para o outro em vez de sumir e aparecer.
 *
 * O `name` precisa ser único na página. Use `morphName` para montar.
 */
export function Morph({ name, children }: { name: string; children: ReactNode }) {
  return (
    <ViewTransition name={name} share="morfa" default="none">
      {children}
    </ViewTransition>
  );
}

/** Nomes dos morphs, num lugar só, para as duas pontas baterem. */
export const morphName = {
  capaDoProjeto: (slug: string) => `capa-${slug}`,
};
