"use client";

import { useEffect, useRef, useState } from "react";

import { ouvir } from "@/lib/eventos";

import { type Situacao, sorteiaFala } from "../falas";
import { CELL_H, CELL_W, SPRITE_URL, createSpritePlayer } from "../sprite";

/** Onde fica guardado se a pessoa escondeu o Pequi. */
const STORAGE_KEY = "pequidev-pequi";
/** Seletor dos lugares onde já mora um Pequi (o hero, o índice do post...). */
const CASA = "[data-pequi-casa]";

/** De quão longe, à direita, ele entra andando (px). */
const ENTRADA = 140;
/** Ritmo da caminhada: milissegundos por pixel. */
const PASSO_MS = 10;
/** Espera antes de entrar quando a página abre, para não roubar a cena. */
const ESPERA_AO_ABRIR = 1200;
/** Em pé sem nada acontecer, ele senta. */
const SENTA_DEPOIS = 4000;
/** Sentado, ele se lambe de vez em quando (entre um e outro, ms). */
const LAMBE_ENTRE: [number, number] = [12_000, 22_000];
/** Sem ninguém mexer na página, ele dorme. */
const DORME_DEPOIS = 35_000;
/** Quanto tempo um balão fica na tela. */
const FALA_MS = 2600;
/** Depois de um carinho, o botão de esconder fica à mostra (para quem usa toque). */
const MENU_MS = 4000;
/** Falas espontâneas (card, rolagem) respeitam este intervalo, para ele não tagarelar. */
const FALA_PAUSA = 10_000;
/** Rolagem mais rápida que isto (px por segundo) faz ele correr. */
const CORRIDA_PX_S = 2500;
/** Seletor dos blocos que chamam a atenção dele sob o mouse. */
const CARD = '[data-pequi="card"]';

type Modo = "fora" | "andando" | "em-pe" | "sentado" | "dormindo" | "ocupado" | "correndo";

/** Como ele sai de cena: andando para a direita, ou pulando para cima (para o índice). */
type Saida = "andando" | "pulando";

const sorteio = ([min, max]: [number, number]) => min + Math.random() * (max - min);

type Partes = { box: HTMLElement; cat: HTMLElement; balloon: HTMLElement };

/**
 * O comportamento do Pequi do canto: onde ele está, o que está fazendo e como
 * reage. Fica fora do React; o componente só liga os eventos. Ver docs/pequi.md.
 */
function createCompanion({ box, cat, balloon }: Partes) {
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reduced = motion.matches;
  const player = createSpritePlayer(cat);

  let mode: Modo = "fora";
  let walk: Animation | null = null;
  let idleTimer = 0;
  let groomTimer = 0;
  let sleepTimer = 0;
  let speechTimer = 0;
  let snoreTimer = 0;

  function clearRoutine() {
    window.clearTimeout(idleTimer);
    window.clearTimeout(groomTimer);
    window.clearTimeout(sleepTimer);
    window.clearInterval(snoreTimer);
  }

  /** O desenho olha para a direita; no canto ele olha para a página. */
  function face(left: boolean) {
    cat.style.transform = left ? "scaleX(-1)" : "";
  }

  function speak(situacao: Situacao, ms = FALA_MS) {
    balloon.textContent = sorteiaFala(situacao);
    balloon.dataset.visivel = "sim";
    window.clearTimeout(speechTimer);
    speechTimer = window.setTimeout(hush, ms);
  }

  function hush() {
    window.clearTimeout(speechTimer);
    delete balloon.dataset.visivel;
  }

  let lastChatter = -Infinity;

  /** Fala espontânea: só às vezes, e nunca duas seguidas em pouco tempo. */
  function chatter(situacao: Situacao, chance: number) {
    const now = performance.now();
    if (now - lastChatter < FALA_PAUSA || Math.random() > chance) return;
    lastChatter = now;
    speak(situacao);
  }

  function armSleep() {
    window.clearTimeout(sleepTimer);
    sleepTimer = window.setTimeout(sleep, DORME_DEPOIS);
  }

  // --- Rotina: em pé, senta, se lambe, dorme -------------------------------

  function stand() {
    mode = "em-pe";
    face(true);
    if (reduced) player.still("parado", 0);
    else player.play("parado");
    window.clearTimeout(idleTimer);
    idleTimer = window.setTimeout(sit, SENTA_DEPOIS);
    armSleep();
  }

  function sit() {
    if (mode !== "em-pe") return;
    mode = "ocupado";
    if (reduced) seated();
    else player.play("sentar", { onEnd: seated });
  }

  function seated() {
    mode = "sentado";
    player.still("sentar", 5);
    window.clearTimeout(groomTimer);
    if (reduced) return;
    groomTimer = window.setTimeout(() => {
      if (mode !== "sentado") return;
      mode = "ocupado";
      player.play("lamber", { onEnd: seated });
    }, sorteio(LAMBE_ENTRE));
  }

  function sleep() {
    if (mode !== "em-pe" && mode !== "sentado") {
      armSleep();
      return;
    }
    clearRoutine();
    mode = "dormindo";
    if (reduced) player.still("dormir", 5);
    else
      player.play("dormir", {
        frames: [0, 1, 2, 3, 4],
        onEnd: () => player.play("dormir", { frames: [4, 5], fps: 1.4, loop: true }),
      });
    speak("dormindo", 2000);
    snoreTimer = window.setInterval(() => speak("dormindo", 2000), 9000);
  }

  function wake(then: () => void) {
    clearRoutine();
    hush();
    mode = "ocupado";
    if (reduced) then();
    else player.play("dormir", { frames: [3, 2, 1, 0], fps: 10, onEnd: then });
  }

  // --- Reações ------------------------------------------------------------

  /** Patada. Se estiver sentado, levanta antes e senta de novo depois. */
  function swat(situacao: Situacao) {
    const wasSitting = mode === "sentado";
    clearRoutine();
    mode = "ocupado";
    speak(situacao);

    const after = () => {
      if (!wasSitting) return stand();
      mode = "em-pe";
      sit();
      armSleep();
    };

    if (reduced) return after();
    const doSwat = () => player.play("patada", { onEnd: after });
    if (wasSitting) player.play("sentar", { frames: [5, 4, 3, 2, 1, 0], fps: 14, onEnd: doSwat });
    else doSwat();
  }

  function pet() {
    if (mode === "dormindo") {
      wake(() => {
        seated();
        armSleep();
        speak("acordou");
      });
    } else if (mode === "sentado" && !reduced) {
      clearRoutine();
      mode = "ocupado";
      speak("carinho");
      player.play("lamber", {
        onEnd: () => {
          seated();
          armSleep();
        },
      });
    } else if (mode === "em-pe" || mode === "sentado") {
      swat("carinho");
    } else {
      speak("carinho");
    }
  }

  /** Alguém mexeu na página: acorda se estiver dormindo e adia o sono. */
  function poke() {
    if (mode === "dormindo") {
      wake(() => {
        seated();
        armSleep();
        if (Math.random() < 0.5) speak("acordou");
      });
    } else if (mode === "em-pe" || mode === "sentado") {
      armSleep();
    }
  }

  // --- Entrar e sair de cena ---------------------------------------------

  /** Para onde ele está indo: para o canto ("dentro") ou para fora da tela. */
  let heading: "dentro" | "fora" = "fora";

  function arrive() {
    stand();
    speak("chegou");
  }

  function gone() {
    mode = "fora";
    player.stop();
    box.style.visibility = "hidden";
    box.style.transform = `translateX(${ENTRADA}px)`;
  }

  /** Anda até o canto ou para fora. Se mudar de ideia no meio, vira ali mesmo. */
  function walkTo(inside: boolean) {
    heading = inside ? "dentro" : "fora";
    const from = mode === "fora" ? ENTRADA : new DOMMatrix(getComputedStyle(box).transform).m41;
    const to = inside ? 0 : ENTRADA;

    walk?.cancel();
    clearRoutine();
    hush();
    box.style.visibility = "visible";
    box.style.transform = `translateX(${to}px)`;

    if (reduced || from === to) {
      if (inside) arrive();
      else gone();
      return;
    }

    mode = "andando";
    face(inside);
    player.play("caminhada");
    walk = box.animate(
      [{ transform: `translateX(${from}px)` }, { transform: `translateX(${to}px)` }],
      { duration: Math.abs(to - from) * PASSO_MS, easing: "linear" },
    );
    walk.onfinish = inside ? arrive : gone;
  }

  /** Pula para cima e some: é como ele vai para o índice do post. */
  function jumpAway() {
    heading = "fora";
    walk?.cancel();
    clearRoutine();
    hush();

    if (reduced || mode === "fora") return gone();

    mode = "andando";
    face(true);
    player.play("pulo", { frames: [0, 1, 2] });
    walk = box.animate(
      [
        { translate: "0 0", easing: "ease-out" },
        { translate: "0 -24px", offset: 0.25, easing: "ease-in" },
        { translate: "0 -110vh" },
      ],
      { duration: 700 },
    );
    walk.onfinish = gone;
  }

  function show() {
    if (heading !== "dentro") walkTo(true);
  }

  function hide(saida: Saida = "andando") {
    if (heading === "fora") return;
    if (saida === "pulando") jumpAway();
    else walkTo(false);
  }

  // --- Reações ao que acontece na página ----------------------------------

  /** Pulinho no lugar, quando a página troca. Volta para o que estava fazendo. */
  function hop() {
    if (mode !== "em-pe" && mode !== "sentado") return;
    const wasSitting = mode === "sentado";
    clearRoutine();
    mode = "ocupado";

    const after = () => {
      if (!wasSitting) return stand();
      mode = "em-pe";
      sit();
      armSleep();
    };

    if (reduced) return after();
    player.play("pulo", { onEnd: after });
    box.animate(
      [
        { translate: "0 0", easing: "ease-out" },
        { translate: "0 -16px", easing: "ease-in" },
        { translate: "0 0" },
      ],
      { duration: 380, delay: 80 },
    );
  }

  /** Um card passou sob o mouse: ele se levanta para olhar. */
  function interest() {
    if (mode === "sentado") {
      clearRoutine();
      mode = "ocupado";
      if (reduced) stand();
      else player.play("sentar", { frames: [5, 4, 3, 2, 1, 0], fps: 12, onEnd: stand });
      chatter("card", 0.4);
    } else if (mode === "em-pe") {
      stand();
      chatter("card", 0.4);
    }
  }

  /** Rolagem rápida: ele corre para acompanhar enquanto ela durar. */
  function startRunning() {
    // Corre de qualquer jeito que esteja no canto, menos dormindo ou entrando/saindo.
    if (reduced || mode === "fora" || mode === "andando" || mode === "dormindo") return;
    if (mode === "correndo") return;
    clearRoutine();
    mode = "correndo";
    face(true);
    player.play("caminhada", { fps: 18 });
    chatter("correndo", 0.6);
  }

  function stopRunning() {
    if (mode === "correndo") stand();
  }

  /** Chegou ao fim da página. */
  function reachedEnd() {
    if (mode !== "em-pe" && mode !== "sentado") return;
    speak("fim");
    if (mode === "em-pe") sit();
  }

  const onMotionChange = (event: MediaQueryListEvent) => {
    reduced = event.matches;
    if (mode === "em-pe") stand();
    if (mode === "sentado") seated();
  };
  motion.addEventListener("change", onMotionChange);

  return {
    show,
    hide,
    pet,
    poke,
    hop,
    interest,
    startRunning,
    stopRunning,
    reachedEnd,
    /** O tema trocou: ele leva o crédito, com uma patada. */
    themeChanged() {
      if (mode === "em-pe" || mode === "sentado") swat("tema");
    },
    /** Alguém copiou código: ele aprova (ou dá um conselho). */
    codeCopied() {
      if (mode === "em-pe" || mode === "sentado") swat("copiou");
      else if (mode !== "fora" && mode !== "andando") speak("copiou");
    },
    destroy() {
      walk?.cancel();
      clearRoutine();
      hush();
      player.stop();
      motion.removeEventListener("change", onMotionChange);
    },
  };
}

function readHidden() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "escondido";
  } catch {
    return false;
  }
}

function saveHidden(hidden: boolean) {
  try {
    if (hidden) localStorage.setItem(STORAGE_KEY, "escondido");
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Sem localStorage, a escolha vale só para esta visita.
  }
}

/**
 * O Pequi do canto: acompanha a visita no canto da tela, em pixel art. Sai de
 * cena quando a página já tem um Pequi à vista (elementos com
 * `data-pequi-casa`, como o hero) e volta quando ele some. Pode ser escondido,
 * e a escolha fica guardada.
 */
export function PequiCompanion() {
  const boxRef = useRef<HTMLDivElement>(null);
  const catRef = useRef<HTMLDivElement>(null);
  const balloonRef = useRef<HTMLParagraphElement>(null);
  const companion = useRef<ReturnType<typeof createCompanion> | null>(null);
  const [hidden, setHidden] = useState(readHidden);
  const [menuOpen, setMenuOpen] = useState(false);
  const hiddenRef = useRef(hidden);
  /** Decide se ele entra ou sai de cena; criado junto com o comportamento. */
  const decideRef = useRef<(() => void) | null>(null);

  // Liga o comportamento, os avisos do site e a vigia das casas do Pequi.
  useEffect(() => {
    const box = boxRef.current;
    const cat = catRef.current;
    const balloon = balloonRef.current;
    if (!box || !cat || !balloon) return;

    const instance = createCompanion({ box, cat, balloon });
    companion.current = instance;

    const homes = new Set<Element>();
    const openedAt = performance.now();
    let enterTimer = 0;

    const decide = () => {
      window.clearTimeout(enterTimer);
      if (hiddenRef.current) {
        instance.hide();
        return;
      }
      if (homes.size > 0) {
        // Se a casa à vista é o índice de um post, ele pula para lá.
        const toIndex = [...homes].some(
          (home) => (home as HTMLElement).dataset.pequiCasa === "indice",
        );
        instance.hide(toIndex ? "pulando" : "andando");
        return;
      }
      const wait = Math.max(0, openedAt + ESPERA_AO_ABRIR - performance.now());
      enterTimer = window.setTimeout(instance.show, wait);
    };
    decideRef.current = decide;

    const intersection = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) homes.add(entry.target);
        else homes.delete(entry.target);
      }
      decide();
    });

    // O rodapé à vista é o fim da página: ele comenta uma vez por página.
    let endSeen = false;
    const footerWatch = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting) && !endSeen) {
        endSeen = true;
        instance.reachedEnd();
      }
    });
    const footer = document.querySelector("body > footer, footer");
    if (footer) footerWatch.observe(footer);

    // As casas mudam quando a página troca: procura de novo a cada mudança.
    // A troca de página também ganha um pulinho.
    let scanFrame = 0;
    let lastPath = location.pathname;
    const watched = new Set<Element>();
    const scan = () => {
      scanFrame = 0;
      if (location.pathname !== lastPath) {
        lastPath = location.pathname;
        endSeen = false;
        instance.hop();
      }
      const current = new Set(document.querySelectorAll(CASA));
      for (const element of watched) {
        if (!current.has(element)) {
          intersection.unobserve(element);
          watched.delete(element);
          homes.delete(element);
        }
      }
      for (const element of current) {
        if (!watched.has(element)) {
          intersection.observe(element);
          watched.add(element);
        }
      }
      if (current.size === 0) decide();
    };
    const mutation = new MutationObserver(() => {
      if (!scanFrame) scanFrame = window.requestAnimationFrame(scan);
    });
    mutation.observe(document.body, { childList: true, subtree: true });
    scan();

    // Movimento na página conta como "tem alguém aqui".
    let lastPoke = 0;
    const onActivity = () => {
      const now = performance.now();
      if (now - lastPoke < 1000) return;
      lastPoke = now;
      instance.poke();
    };
    window.addEventListener("scroll", onActivity, { passive: true });
    window.addEventListener("pointermove", onActivity, { passive: true });
    window.addEventListener("keydown", onActivity);

    // Rolagem rápida: mede a velocidade e para a corrida quando ela cai.
    let lastY = window.scrollY;
    let lastT = performance.now();
    let runTimer = 0;
    const onScrollSpeed = () => {
      const now = performance.now();
      const speed = (Math.abs(window.scrollY - lastY) / Math.max(now - lastT, 1)) * 1000;
      lastY = window.scrollY;
      lastT = now;
      if (speed < CORRIDA_PX_S) return;
      instance.startRunning();
      window.clearTimeout(runTimer);
      runTimer = window.setTimeout(instance.stopRunning, 300);
    };
    window.addEventListener("scroll", onScrollSpeed, { passive: true });

    // Um card sob o mouse chama a atenção dele (uma vez por card).
    let lastCard: Element | null = null;
    const onPointerOver = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const card = (event.target as Element | null)?.closest?.(CARD) ?? null;
      if (card && card !== lastCard) instance.interest();
      lastCard = card;
    };
    document.addEventListener("pointerover", onPointerOver);

    const stopListening = ouvir((aviso) => {
      if (aviso.tipo === "tema") instance.themeChanged();
      if (aviso.tipo === "codigo-copiado") instance.codeCopied();
    });

    return () => {
      window.clearTimeout(enterTimer);
      window.clearTimeout(runTimer);
      window.cancelAnimationFrame(scanFrame);
      intersection.disconnect();
      footerWatch.disconnect();
      mutation.disconnect();
      window.removeEventListener("scroll", onActivity);
      window.removeEventListener("scroll", onScrollSpeed);
      window.removeEventListener("pointermove", onActivity);
      window.removeEventListener("keydown", onActivity);
      document.removeEventListener("pointerover", onPointerOver);
      stopListening();
      instance.destroy();
      companion.current = null;
      decideRef.current = null;
    };
  }, []);

  // Esconder e chamar de volta.
  useEffect(() => {
    hiddenRef.current = hidden;
    saveHidden(hidden);
    decideRef.current?.();
  }, [hidden]);

  useEffect(() => {
    if (!menuOpen) return;
    const timer = window.setTimeout(() => setMenuOpen(false), MENU_MS);
    return () => window.clearTimeout(timer);
  }, [menuOpen]);

  return (
    <div className="pointer-events-none fixed right-3 bottom-2 z-40 md:right-5 md:bottom-3 print:hidden">
      <div
        className="group relative"
        data-menu={menuOpen ? "aberto" : undefined}
        style={{ width: CELL_W, height: CELL_H }}
      >
        <p
          ref={balloonRef}
          aria-hidden="true"
          className="pointer-events-none absolute right-10 bottom-[calc(100%-0.5rem)] translate-y-1 rounded-2xl bg-surface px-3 py-1 font-meme text-base leading-tight tracking-wide whitespace-nowrap text-ink opacity-0 shadow-soft transition-[opacity,translate] data-[visivel=sim]:translate-y-0 data-[visivel=sim]:opacity-100"
        />

        <div
          ref={boxRef}
          className="invisible absolute inset-0 will-change-transform"
          style={{ transform: `translateX(${ENTRADA}px)` }}
        >
          <button
            type="button"
            onClick={() => {
              companion.current?.pet();
              setMenuOpen(true);
            }}
            aria-label="Fazer carinho no Pequi"
            className="pointer-events-auto absolute inset-0 cursor-pointer rounded-2xl"
          >
            <div
              ref={catRef}
              className="size-full bg-no-repeat [image-rendering:pixelated]"
              style={{ backgroundImage: `url("${SPRITE_URL}")`, backgroundPosition: "0 0" }}
            />
          </button>

          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              setHidden(true);
            }}
            className="pointer-events-auto absolute right-full bottom-1 mr-1 rounded-full bg-surface px-2.5 py-1 font-mono text-xs whitespace-nowrap text-ink-soft opacity-0 shadow-soft transition-[opacity,color] group-hover:opacity-100 group-data-[menu=aberto]:opacity-100 hover:text-ink focus-visible:opacity-100"
          >
            esconder o Pequi
          </button>
        </div>

        {hidden ? (
          <button
            type="button"
            onClick={() => setHidden(false)}
            className="aperta pointer-events-auto absolute right-0 bottom-1 rounded-full bg-surface px-3 py-1.5 font-mono text-xs whitespace-nowrap text-ink-soft shadow-soft hover:text-ink"
          >
            chamar o Pequi
          </button>
        ) : null}
      </div>
    </div>
  );
}
