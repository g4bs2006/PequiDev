export const THEME_STORAGE_KEY = "pequidev-tema";

/**
 * Roda no <head>, antes da primeira pintura, para o tema certo já vir aplicado.
 * Sem escolha salva, segue a preferência do sistema.
 */
export const themeScript = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t!=="dark"&&t!=="light"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

/** Alterna o tema e guarda a escolha para as próximas visitas. */
export function toggleTheme() {
  const root = document.documentElement;
  const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
  root.setAttribute("data-theme", next);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {
    // Sem localStorage (aba privada, por exemplo) o tema vale só para esta visita.
  }
}
