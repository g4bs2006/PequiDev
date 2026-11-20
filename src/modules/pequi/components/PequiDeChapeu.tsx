"use client";

import { useEffect, useRef } from "react";

import {
  type AnimationName,
  CELL_H,
  CELL_W,
  cabeca,
  createSpritePlayer,
  SPRITE_URL,
  type SpritePlayer,
} from "../sprite";

/** Chapéus em pixel art (public/pequi/chapeus/), com o tamanho em pixels do sprite. */
const CHAPEUS = {
  lixeira: { src: "/pequi/chapeus/lixeira.png", largura: 12, altura: 10 },
} as const;

export type Chapeu = keyof typeof CHAPEUS;

/** Quanto o chapéu desce abaixo da ponta das orelhas, para assentar na cabeça. */
const ASSENTO = 5;

type Props = {
  /** Animação a tocar. Trocar a prop toca a nova do começo. */
  animacao: AnimationName;
  /** Repetir sem parar. Padrão: o da animação no sprite.json. */
  repetir?: boolean;
  /** Sem chapéu, o Pequi de sempre. */
  chapeu?: Chapeu | null;
  /** Ampliação em pixels inteiros (o desenho não é suavizado). */
  escala?: number;
  /** Chamado quando uma animação que não repete termina. */
  aoTerminar?: () => void;
  /** Com menos movimento pedido, fica no primeiro quadro. */
  parado?: boolean;
  className?: string;
};

/**
 * O Pequi do sprite com um chapéu que acompanha a cabeça quadro a quadro
 * (Lixeira do Pequi; os chapéus do blog usam a mesma peça na etapa 7). O
 * chapéu é uma imagem por cima, posicionada pelas marcas de data/cabeca.json.
 */
export function PequiDeChapeu({
  animacao,
  repetir,
  chapeu = "lixeira",
  escala = 2,
  aoTerminar,
  parado = false,
  className = "",
}: Props) {
  const gatoRef = useRef<HTMLDivElement | null>(null);
  const chapeuRef = useRef<HTMLImageElement | null>(null);
  const playerRef = useRef<SpritePlayer | null>(null);
  const aoTerminarRef = useRef(aoTerminar);

  useEffect(() => {
    aoTerminarRef.current = aoTerminar;
  }, [aoTerminar]);

  useEffect(() => {
    const gato = gatoRef.current;
    if (!gato) return;
    const player = createSpritePlayer(gato, (nome, quadro) => {
      const img = chapeuRef.current;
      if (!img || !chapeu) return;
      const [x, y] = cabeca(nome, quadro);
      const { largura, altura } = CHAPEUS[chapeu];
      img.style.transform = `translate(${x - largura / 2}px, ${y + ASSENTO - altura}px)`;
    });
    playerRef.current = player;
    return () => player.stop();
  }, [chapeu]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    if (parado) {
      player.still(animacao, 0);
      return;
    }
    player.play(animacao, { loop: repetir, onEnd: () => aoTerminarRef.current?.() });
  }, [animacao, repetir, parado, chapeu]);

  const info = chapeu ? CHAPEUS[chapeu] : null;

  return (
    <div
      aria-hidden="true"
      className={className}
      style={{ width: CELL_W * escala, height: CELL_H * escala }}
    >
      <div
        className="relative origin-top-left"
        style={{ width: CELL_W, height: CELL_H, transform: `scale(${escala})` }}
      >
        <div
          ref={gatoRef}
          className="size-full bg-no-repeat [image-rendering:pixelated]"
          style={{ backgroundImage: `url("${SPRITE_URL}")`, backgroundPosition: "0 0" }}
        />
        {info ? (
          // eslint-disable-next-line @next/next/no-img-element -- 12×10 px em pixel art: o otimizador de imagens não ajuda aqui
          <img
            ref={chapeuRef}
            src={info.src}
            alt=""
            width={info.largura}
            height={info.altura}
            className="absolute top-0 left-0 [image-rendering:pixelated]"
          />
        ) : null}
      </div>
    </div>
  );
}
