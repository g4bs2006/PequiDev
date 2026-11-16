import type { Metadata } from "next";
import { PageTransition } from "@/components/motion/PageTransition";
import { LixeiraOla } from "@/modules/lixeira";

export const metadata: Metadata = {
  title: "Lixeira do Pequi",
  description: "Aponte a câmera para um lixo e o Pequi diz em qual lixeira ele vai.",
  // Fora da busca enquanto está em construção (ver docs/lixeira.md).
  robots: { index: false, follow: false },
  alternates: { canonical: "/lixeira" },
};

export default function LixeiraPage() {
  return (
    <PageTransition>
      <LixeiraOla />
    </PageTransition>
  );
}
