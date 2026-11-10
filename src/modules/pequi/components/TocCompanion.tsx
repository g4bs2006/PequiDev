"use client";

import { useEffect, useRef } from "react";

import sprite from "../data/sprite.json";

type AnimationName = keyof typeof sprite.animacoes;

const CELL_W = sprite.celula.largura;
const CELL_H = sprite.celula.altura;

/** Tempo sem rolar a página até ele deitar para dormir. */
const SLEEP_AFTER_MS = 30_000;
/** Ritmo da respiração dormindo: alterna os dois últimos quadros de "dormir". */
const BREATH_MS = 700;
/** Quanto ele sobe acima do ponto mais alto do salto, em px. */
const ARC = 18;
/** Duração do voo: cresce com a distância, dentro destes limites (ms). */
const FLIGHT_MIN = 280;
const FLIGHT_MAX = 560;

type Mode = "parado" | "ocupado" | "dormir";

function showFrame(cat: HTMLElement, name: AnimationName, frame: number) {
  const row = sprite.animacoes[name].linha;
  cat.style.backgroundPosition = `${-frame * CELL_W}px ${-row * CELL_H}px`;
}

/**
 * O "cérebro" do Pequi: em que lugar ele está e o que está fazendo. Fica fora
 * do React porque troca de quadro várias vezes por segundo e não precisa
 * renderizar nada para isso.
 */
function createCompanion(box: HTMLElement, cat: HTMLElement) {
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reduced = motion.matches;

  /** Linha do chão onde ele está, em px a partir do topo do índice. */
  let y: number | null = null;
  /** Para onde ele vai assim que terminar o que está fazendo. */
  let pending: number | null = null;
  let mode: Mode = "parado";

  let timers: number[] = [];
  let sleepTimer = 0;
  let flight: Animation | null = null;

  const later = (ms: number, fn: () => void) => {
    timers.push(window.setTimeout(fn, ms));
  };
  const clearTimers = () => {
    timers.forEach((id) => window.clearTimeout(id));
    timers = [];
  };

  /** Posição de repouso: a base da célula do sprite é o chão. */
  const groundAt = (to: number) => `translateY(${to - CELL_H}px)`;

  function place(to: number) {
    y = to;
    box.style.transform = groundAt(to);
    box.style.visibility = "visible";
  }

  /** Toca os quadros em sequência e chama `done` no fim. */
  function sequence(name: AnimationName, frames: number[], frameMs: number, done: () => void) {
    frames.forEach((frame, i) => later(i * frameMs, () => showFrame(cat, name, frame)));
    later(frames.length * frameMs, done);
  }

  function armSleep() {
    window.clearTimeout(sleepTimer);
    sleepTimer = window.setTimeout(sleep, SLEEP_AFTER_MS);
  }

  function stand() {
    mode = "parado";
    clearTimers();

    if (reduced) {
      showFrame(cat, "parado", 0);
      return;
    }

    const { quadros, fps } = sprite.animacoes.parado;
    const loop = (frame: number) => {
      showFrame(cat, "parado", frame);
      later(1000 / fps, () => loop((frame + 1) % quadros));
    };
    loop(0);
  }

  /** Terminou de pular ou de acordar: segue para o destino guardado ou fica parado. */
  function settle() {
    const next = pending;
    pending = null;

    if (next !== null && next !== y) {
      jump(next);
    } else {
      stand();
      armSleep();
    }
  }

  function jump(to: number) {
    const from = y;

    if (reduced || from === null) {
      place(to);
      stand();
      armSleep();
      return;
    }

    mode = "ocupado";
    clearTimers();
    flight?.cancel();

    const frameMs = 1000 / sprite.animacoes.pulo.fps;
    const flightMs = Math.min(FLIGHT_MAX, Math.max(FLIGHT_MIN, Math.abs(to - from) * 1.1));
    const peak = Math.min(from, to) - ARC;
    const goingDown = to > from;

    // Quadro 0: agacha. 1 a 3: no ar. 4: aterrissa. 5: recompõe.
    showFrame(cat, "pulo", 0);
    later(frameMs, () => {
      showFrame(cat, "pulo", 1);
      // O estilo já fica no destino; a animação cobre o caminho até lá.
      y = to;
      box.style.transform = groundAt(to);
      flight = box.animate(
        [
          { transform: groundAt(from), easing: "ease-out" },
          { transform: groundAt(peak), offset: goingDown ? 0.3 : 0.7, easing: "ease-in" },
          { transform: groundAt(to) },
        ],
        { duration: flightMs },
      );
    });
    later(frameMs + flightMs * 0.35, () => showFrame(cat, "pulo", 2));
    later(frameMs + flightMs * 0.7, () => showFrame(cat, "pulo", 3));
    later(frameMs + flightMs, () => showFrame(cat, "pulo", 4));
    later(frameMs * 2 + flightMs, () => showFrame(cat, "pulo", 5));
    later(frameMs * 3 + flightMs, settle);
  }

  function sleep() {
    if (mode !== "parado") return;

    mode = "dormir";
    clearTimers();

    if (reduced) {
      showFrame(cat, "dormir", 5);
      return;
    }

    const { fps } = sprite.animacoes.dormir;
    sequence("dormir", [0, 1, 2, 3, 4], 1000 / fps, () => {
      const breathe = (frame: number) => {
        showFrame(cat, "dormir", frame);
        later(BREATH_MS, () => breathe(frame === 4 ? 5 : 4));
      };
      breathe(5);
    });
  }

  function wake() {
    mode = "ocupado";
    clearTimers();

    if (reduced) {
      settle();
      return;
    }

    // "Dormir" de trás para frente: ele se levanta.
    sequence("dormir", [3, 2, 1, 0], 100, settle);
  }

  const onMotionChange = (event: MediaQueryListEvent) => {
    reduced = event.matches;
    if (mode === "parado") stand();
  };
  motion.addEventListener("change", onMotionChange);

  return {
    /** Leva o Pequi até a linha do chão `to`. Na primeira vez, aparece direto lá. */
    moveTo(to: number) {
      if (y === null) {
        place(to);
        stand();
        armSleep();
      } else if (mode === "ocupado") {
        pending = to;
      } else if (mode === "dormir") {
        pending = to;
        wake();
      } else if (to !== y) {
        jump(to);
      }
    },
    /** Alguém rolou a página: acorda se estiver dormindo e adia o sono. */
    poke() {
      if (mode === "dormir") wake();
      else armSleep();
    },
    destroy() {
      clearTimers();
      window.clearTimeout(sleepTimer);
      flight?.cancel();
      motion.removeEventListener("change", onMotionChange);
    },
  };
}

type TocCompanionProps = {
  /** Linha do chão do item ativo, em px a partir do topo do bloco posicionado. */
  targetY: number | null;
  /** Muda toda vez que a pessoa rola a página. */
  activity: number;
  className?: string;
};

/**
 * O Pequi em pixel art que acompanha a leitura ao lado do índice: fica junto
 * da seção que está na tela, pula quando ela muda e dorme se ninguém rolar a
 * página por um tempo. É enfeite: leitor de tela não vê, e ele não recebe
 * clique nem cobre texto.
 */
export function TocCompanion({ targetY, activity, className = "" }: TocCompanionProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const catRef = useRef<HTMLDivElement>(null);
  const companion = useRef<ReturnType<typeof createCompanion> | null>(null);

  useEffect(() => {
    if (!boxRef.current || !catRef.current) return;

    const instance = createCompanion(boxRef.current, catRef.current);
    companion.current = instance;

    return () => {
      instance.destroy();
      companion.current = null;
    };
  }, []);

  useEffect(() => {
    if (targetY !== null) companion.current?.moveTo(targetY);
  }, [targetY]);

  useEffect(() => {
    if (activity > 0) companion.current?.poke();
  }, [activity]);

  return (
    <div
      ref={boxRef}
      aria-hidden="true"
      className={`pointer-events-none invisible absolute top-0 will-change-transform ${className}`}
      style={{ width: CELL_W, height: CELL_H }}
    >
      <div
        ref={catRef}
        className="size-full bg-no-repeat [image-rendering:pixelated]"
        style={{ backgroundImage: `url("${sprite.imagem}")`, backgroundPosition: "0 0" }}
      />
    </div>
  );
}
