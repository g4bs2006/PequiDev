export const THEME_STORAGE_KEY = "pequidev-tema";

/**
 * Roda no <head>, antes da primeira pintura, para o tema certo já vir aplicado.
 * Sem escolha salva, segue a preferência do sistema.
 */
export const themeScript = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t!=="dark"&&t!=="light"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

function applyTheme(next: "light" | "dark") {
  document.documentElement.setAttribute("data-theme", next);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {
    // Sem localStorage (aba privada, por exemplo) o tema vale só para esta visita.
  }
}

/**
 * Alterna o tema e guarda a escolha para as próximas visitas. Com `origin`
 * (o centro do botão), o tema novo se abre num círculo a partir dali, onde o
 * navegador tiver View Transitions e ninguém tiver pedido menos movimento.
 */
export function toggleTheme(origin?: { x: number; y: number }) {
  const root = document.documentElement;
  const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!origin || reduced || !document.startViewTransition) {
    applyTheme(next);
    return;
  }

  root.style.setProperty("--tema-x", `${origin.x}px`);
  root.style.setProperty("--tema-y", `${origin.y}px`);
  root.dataset.transicao = "tema";

  const transition = document.startViewTransition(() => applyTheme(next));
  transition.finished.finally(() => {
    delete root.dataset.transicao;
  });
}
