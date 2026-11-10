import type { Metadata } from "next";
import Link from "next/link";
import { PageTransition } from "@/components/motion/PageTransition";
import { SpritePreview } from "@/modules/pequi";

export const metadata: Metadata = {
  title: "Pequi em pixel art",
  description: "Prévia das animações do Pequi para o modo sonho.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/brincar" },
};

/** Bancada do modo sonho. Por enquanto só a prévia do sprite; o jogo vem depois. */
export default function BrincarPage() {
  return (
    <PageTransition>
      <section
        aria-labelledby="brincar-titulo"
        className="mx-auto w-full max-w-[84rem] px-5 py-14 md:px-10 md:py-20"
      >
        <header className="mb-10">
          <h1
            id="brincar-titulo"
            className="font-display text-4xl font-bold tracking-tight text-balance md:text-5xl"
          >
            O Pequi em pixel art
          </h1>
          <p className="mt-3 max-w-xl text-lg text-pretty text-ink-soft">
            Prévia das animações do modo sonho. Ainda não dá para jogar.
          </p>
          <p className="mt-3 text-lg">
            <Link
              href="/brincar/leitura"
              className="font-medium underline decoration-accent decoration-2 underline-offset-4 hover:decoration-4"
            >
              Ver o Pequi acompanhando a leitura de um post
            </Link>
          </p>
          <p className="mt-2 text-lg">
            <Link
              href="/brincar/sonho"
              className="font-medium underline decoration-accent decoration-2 underline-offset-4 hover:decoration-4"
            >
              Entrar no modo sonho (teste do motor)
            </Link>
          </p>
        </header>
        <SpritePreview />
      </section>
    </PageTransition>
  );
}
