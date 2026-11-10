"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

import { ouvir } from "@/lib/eventos";
import type {
  DreamAction,
  DreamEngine,
  DreamOrigin,
} from "../dream/engine";

type EngineFactory = (
  canvas: HTMLCanvasElement,
  options: {
    onExit: () => void;
    onOpen: (href: string) => void;
    onHint: (hint: string | null) => void;
  },
) => DreamEngine;

const primaryButton =
  "aperta inline-flex h-12 items-center justify-center rounded-full bg-accent px-6 font-display font-bold text-on-accent shadow-button";

const touchButton =
  "aperta inline-flex min-h-14 min-w-14 touch-none select-none items-center justify-center rounded-full bg-accent px-5 font-display font-bold text-on-accent shadow-button";

type TouchButtonProps = {
  action: DreamAction;
  label: string;
  children: ReactNode;
  onAction: (action: DreamAction, pressed: boolean) => void;
};

function TouchButton({ action, label, children, onAction }: TouchButtonProps) {
  const press = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    onAction(action, true);
  };

  const release = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    onAction(action, false);
  };

  return (
    <button
      type="button"
      aria-label={label}
      className={touchButton}
      onPointerDown={press}
      onPointerUp={release}
      onPointerCancel={release}
      onPointerLeave={release}
    >
      {children}
    </button>
  );
}

/** Mantém o sonho vivo no layout, inclusive durante trocas de página. */
export function DreamHost() {
  const router = useRouter();
  const pathname = usePathname();

  const [active, setActive] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const exitRef = useRef<HTMLButtonElement>(null);
  const engineRef = useRef<DreamEngine | null>(null);
  const factoryRef = useRef<EngineFactory | null>(null);
  const originRef = useRef<DreamOrigin | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const previousPathRef = useRef(pathname);
  const mountedRef = useRef(true);
  const activeRef = useRef(false);
  const loadingRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      engineRef.current?.stop();
      engineRef.current = null;
    };
  }, []);

  const leave = useCallback(() => {
    if (!activeRef.current && !engineRef.current) return;

    engineRef.current?.stop();
    engineRef.current = null;
    activeRef.current = false;
    setActive(false);
    setHint(null);
    setAnnouncement("Modo sonho desligado.");

    const previousFocus = previousFocusRef.current;
    previousFocusRef.current = null;

    window.requestAnimationFrame(() => {
      if (previousFocus?.isConnected) previousFocus.focus();
    });
  }, []);

  const open = useCallback(
    (href: string) => {
      router.push(href, { transitionTypes: ["avanca"] });
    },
    [router],
  );

  const updateHint = useCallback((nextHint: string | null) => {
    setHint(nextHint);
  }, []);

  const enter = useCallback(async (origem: DreamOrigin | null) => {
    if (activeRef.current || loadingRef.current) return;

    loadingRef.current = true;
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    try {
      let factory = factoryRef.current;

      if (!factory) {
        // O motor só entra no pacote quando alguém pede o sonho.
        const dream = await import("../dream/engine");
        factory = dream.createDreamEngine;
        factoryRef.current = factory;
      }

      if (!mountedRef.current) return;

      originRef.current = origem;
      activeRef.current = true;
      setHint(null);
      setActive(true);
      setAnnouncement(
        "Modo sonho ligado. Setas para andar, espaço para pular, X para patada, Enter para abrir, Esc para sair.",
      );
    } catch {
      if (mountedRef.current) {
        previousFocusRef.current = null;
        setAnnouncement("Não foi possível ligar o modo sonho.");
      }
    } finally {
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    return ouvir((aviso) => {
      if (aviso.tipo !== "sonho-entrar" || !("origem" in aviso.dados)) return;
      void enter(aviso.dados.origem);
    });
  }, [enter]);

  useEffect(() => {
    if (!active || !canvasRef.current || !factoryRef.current) return;

    const engine = factoryRef.current(canvasRef.current, {
      onExit: leave,
      onOpen: open,
      onHint: updateHint,
    });

    engineRef.current = engine;
    engine.start(originRef.current);
    exitRef.current?.focus();

    return () => {
      engine.stop();
      if (engineRef.current === engine) engineRef.current = null;
    };
  }, [active, leave, open, updateHint]);

  useEffect(() => {
    const changed = previousPathRef.current !== pathname;
    previousPathRef.current = pathname;

    if (active && changed) engineRef.current?.respawn();
  }, [active, pathname]);

  const setAction = useCallback((action: DreamAction, pressed: boolean) => {
    engineRef.current?.setAction(action, pressed);
  }, []);

  return (
    <>
      {active ? (
        <>
          <canvas
            ref={canvasRef}
            aria-hidden="true"
            data-pequi-casa="sonho"
            className="pointer-events-none fixed inset-0 z-40 size-full"
          />

          <aside
            aria-label="Controles do modo sonho"
            className="fixed bottom-5 left-5 z-50 max-w-[calc(100vw-2.5rem)] rounded-card bg-surface p-4 text-ink shadow-soft [@media(hover:none)_and_(pointer:coarse)]:bottom-44"
          >
            <p className="mb-3 max-w-2xl font-mono text-sm text-ink-soft">
              ← → ou A/D: andar · Espaço/W/↑: pular · X/J: patada · Enter:
              abrir · S/↓: descer
            </p>

            <p
              aria-live="polite"
              aria-atomic="true"
              className={hint ? "mb-3 font-display font-bold text-ink" : "sr-only"}
            >
              {hint ?? ""}
            </p>

            <button
              ref={exitRef}
              type="button"
              onClick={leave}
              className={primaryButton}
            >
              Sair do sonho (Esc)
            </button>
          </aside>

          <div
            aria-label="Controles de toque do modo sonho"
            className="fixed inset-x-5 bottom-5 z-50 hidden flex-wrap justify-end gap-3 [@media(hover:none)_and_(pointer:coarse)]:flex"
          >
            <TouchButton action="esquerda" label="Andar para a esquerda" onAction={setAction}>
              <span aria-hidden="true">◀</span>
            </TouchButton>
            <TouchButton action="direita" label="Andar para a direita" onAction={setAction}>
              <span aria-hidden="true">▶</span>
            </TouchButton>
            <TouchButton action="pular" label="Pular" onAction={setAction}>
              Pular
            </TouchButton>
            <TouchButton action="patada" label="Dar uma patada" onAction={setAction}>
              Patada
            </TouchButton>
            {hint ? (
              <TouchButton action="abrir" label="Abrir item" onAction={setAction}>
                Abrir
              </TouchButton>
            ) : null}
          </div>
        </>
      ) : null}

      <p aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </p>
    </>
  );
}
