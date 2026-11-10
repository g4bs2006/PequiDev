import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: { default: "Painel", template: "%s · Painel · PequiDev" },
  robots: { index: false, follow: false },
};

/**
 * O painel depende da sessão de quem está logado, então nada aqui é
 * pré-renderizado: a página espera o servidor em vez de mostrar um esqueleto.
 */
export const instant = false;

/** Moldura do painel. O Pequi do canto não entra aqui (data-pequi-casa). */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div data-pequi-casa="admin">
      <Suspense
        fallback={
          <p className="mx-auto max-w-[64rem] px-5 pt-[calc(var(--nav-h)+3rem)] text-ink-soft md:px-10">
            Abrindo o painel…
          </p>
        }
      >
        {children}
      </Suspense>
    </div>
  );
}
