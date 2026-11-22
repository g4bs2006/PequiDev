import { LixeiraCamera } from "./LixeiraCamera";

/**
 * A /lixeira é um app de celular (etapa 8 de docs/lixeira.md): tela cheia, sem
 * o menu e o rodapé do site (data-app-lixeira, ver globals.css). No desktop,
 * a mesma tela fica centralizada.
 */
export function LixeiraOla() {
  return (
    <div data-app-lixeira className="mx-auto w-full max-w-md">
      <LixeiraCamera />
    </div>
  );
}
