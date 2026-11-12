import Image from "next/image";

import { type PequiMeme, type PequiMemeName, pequiMemes } from "../memes";

type MemeCardProps = {
  name: PequiMemeName;
  /** Largura que a imagem ocupa na tela, no formato do atributo sizes. */
  sizes: string;
  /** Legenda no lugar da padrão da pose. Vai na base da imagem. */
  caption?: string | null;
  /** Para a imagem que aparece logo na abertura da página. */
  preload?: boolean;
  /** Nome da casa do Pequi (data-pequi-casa): o do canto sai de cena enquanto ela está à vista. */
  home: string;
  className?: string;
};

/** Letra de meme: Anton clara com contorno escuro, legível em cima de qualquer foto. */
const captionClass =
  "absolute inset-x-0 px-[6%] text-center font-meme text-[10cqw] leading-[1.05] text-balance text-creme [-webkit-text-stroke:0.06em_var(--tinta)] [paint-order:stroke_fill]";

/**
 * Uma reação do Pequi em foto, com a legenda de meme por cima. A legenda é
 * texto de verdade: o leitor de tela lê a descrição da foto e depois a legenda.
 */
export function MemeCard({ name, sizes, caption, preload, home, className = "" }: MemeCardProps) {
  const meme: PequiMeme = pequiMemes[name];
  const top = caption ? undefined : meme.top;
  const bottom = caption || meme.bottom;

  return (
    <figure data-pequi-casa={home} className={className}>
      <div className="@container relative aspect-square overflow-hidden rounded-card bg-surface shadow-soft">
        <Image
          src={meme.image}
          alt={meme.alt}
          fill
          sizes={sizes}
          preload={preload}
          className="object-cover"
        />
        <figcaption>
          {top ? <span className={`${captionClass} top-[4%]`}>{top}</span> : null}
          {bottom ? <span className={`${captionClass} bottom-[5%]`}>{bottom}</span> : null}
        </figcaption>
        {meme.emoji && !caption ? (
          <span aria-hidden="true" className="absolute bottom-[4%] left-[5%] text-[20cqw] leading-none">
            {meme.emoji}
          </span>
        ) : null}
      </div>
    </figure>
  );
}
