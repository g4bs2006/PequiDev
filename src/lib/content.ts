/** Imagem de capa de um post ou de um projeto. */
export type CoverImage = {
  url: string;
  /** Texto alternativo. Vazio quando a imagem é só decorativa. */
  alt: string;
};

export function toCover(url: string | null, alt: string | null): CoverImage | null {
  return url ? { url, alt: alt ?? "" } : null;
}
