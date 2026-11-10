import type { Metadata } from "next";
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
      </header>
      <SpritePreview />
    </section>
  );
}
