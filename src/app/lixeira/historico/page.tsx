import type { Metadata } from "next";
import { PageTransition } from "@/components/motion/PageTransition";
import { LixeiraHistorico } from "@/modules/lixeira";

export const metadata: Metadata = {
  title: "Meu histórico · Lixeira do Pequi",
  robots: { index: false, follow: false },
};

export default function HistoricoPage() {
  return (
    <PageTransition>
      <LixeiraHistorico />
    </PageTransition>
  );
}
