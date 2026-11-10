/**
 * Tipos de navegação que escolhem a animação da troca de página. Vão no
 * `transitionTypes` do Link (ou do ButtonLink):
 * - `avanca`: entra num nível mais fundo, como da lista para um projeto.
 * - `volta`: sobe um nível, como do projeto de volta para a lista.
 * Navegação sem tipo (menu, botão voltar do navegador) só troca, sem direção.
 */
export const navegacao = {
  avanca: ["avanca"],
  volta: ["volta"],
};
