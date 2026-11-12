"use client";

import dynamic from "next/dynamic";

/**
 * Lugar do Pequi do canto no layout. O código dele só é baixado no navegador,
 * depois que a página abre: quem chega não espera pelo gato.
 */
const PequiCompanion = dynamic(
  () => import("./PequiCompanion").then((module) => module.PequiCompanion),
  { ssr: false },
);

export function PequiDock() {
  return <PequiCompanion />;
}
