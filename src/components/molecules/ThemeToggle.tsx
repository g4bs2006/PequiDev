"use client";

import { MoonIcon, SunIcon } from "@/components/atoms/icons";
import { toggleTheme } from "@/lib/theme";

/**
 * Botão de tema. Os dois ícones já vêm no HTML e o CSS mostra o certo conforme
 * o data-theme, então o botão não depende de estado nem pisca ao carregar.
 */
export function ThemeToggle() {
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Alternar entre tema claro e escuro"
      title="Alternar tema"
      className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full bg-surface text-xl text-ink shadow-soft transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-px"
    >
      <MoonIcon className="dark:hidden" />
      <SunIcon className="hidden dark:block" />
    </button>
  );
}
