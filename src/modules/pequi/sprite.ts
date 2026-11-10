import sprite from "./data/sprite.json";

/**
 * Peças comuns para tocar a folha de sprites do Pequi (public/pequi/sprite/).
 * A folha tem uma animação por linha e um quadro por coluna; a base da célula
 * é o chão. O desenho olha para a direita: para a esquerda, espelhe o elemento.
 */

export type AnimationName = keyof typeof sprite.animacoes;

export const SPRITE_URL = sprite.imagem;
export const CELL_W = sprite.celula.largura;
export const CELL_H = sprite.celula.altura;

export function animation(name: AnimationName) {
  return sprite.animacoes[name];
}

/** Mostra um quadro da folha no elemento (que tem a folha como fundo). */
export function showFrame(cat: HTMLElement, name: AnimationName, frame: number) {
  const row = sprite.animacoes[name].linha;
  cat.style.backgroundPosition = `${-frame * CELL_W}px ${-row * CELL_H}px`;
}

type PlayOptions = {
  /** Ordem dos quadros (a partir de 0). Padrão: todos, em ordem. */
  frames?: number[];
  /** Quadros por segundo. Padrão: o da animação no sprite.json. */
  fps?: number;
  /** Repetir sem parar. Padrão: o da animação no sprite.json. */
  loop?: boolean;
  /** Chamado ao fim de uma animação que não repete. */
  onEnd?: () => void;
};

/**
 * Toca animações da folha num elemento, uma de cada vez: tocar outra corta a
 * que estava tocando. Fica fora do React porque troca de quadro várias vezes
 * por segundo e não precisa renderizar nada para isso.
 */
export function createSpritePlayer(cat: HTMLElement) {
  let timer = 0;

  function stop() {
    window.clearTimeout(timer);
  }

  function play(name: AnimationName, options: PlayOptions = {}) {
    stop();
    const anim = sprite.animacoes[name];
    const frames = options.frames ?? Array.from({ length: anim.quadros }, (_, i) => i);
    const frameMs = 1000 / (options.fps ?? anim.fps);
    const loop = options.loop ?? anim.repete;

    const step = (index: number) => {
      showFrame(cat, name, frames[index]);
      const next = index + 1;

      if (next < frames.length) {
        timer = window.setTimeout(() => step(next), frameMs);
      } else if (loop) {
        timer = window.setTimeout(() => step(0), frameMs);
      } else if (options.onEnd) {
        timer = window.setTimeout(options.onEnd, frameMs);
      }
    };

    step(0);
  }

  /** Um quadro parado, sem animação. */
  function still(name: AnimationName, frame: number) {
    stop();
    showFrame(cat, name, frame);
  }

  return { play, still, stop };
}

export type SpritePlayer = ReturnType<typeof createSpritePlayer>;
