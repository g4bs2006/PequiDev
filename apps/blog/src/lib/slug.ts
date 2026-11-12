/**
 * Texto em formato de endereço: minúsculas, sem acento, palavras ligadas por
 * hífen. "Meu Primeiro Agente!" vira "meu-primeiro-agente". É o formato que o
 * banco aceita em slugs de posts, projetos, tags e categorias.
 */
export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** O slug está no formato que o banco aceita? */
export function isSlug(text: string) {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(text);
}
