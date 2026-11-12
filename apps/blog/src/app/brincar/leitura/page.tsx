import type { Metadata } from "next";

import { PageTransition } from "@/components/motion/PageTransition";
import { ReadingPreview } from "@/modules/blog";

export const metadata: Metadata = {
  title: "O Pequi no índice",
  description: "Prévia do Pequi acompanhando a leitura de um post pelo índice lateral.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/brincar/leitura" },
};

export default function LeituraPage() {
  return (
    <PageTransition>
      <ReadingPreview />
    </PageTransition>
  );
}
