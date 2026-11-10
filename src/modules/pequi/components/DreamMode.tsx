"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Engine = {
  start: () => void;
  stop: () => void;
};

type EngineFactory = (
  canvas: HTMLCanvasElement,
  options: { onExit: () => void },
) => Engine;

const primaryButton =
  "aperta inline-flex h-12 items-center justify-center rounded-full bg-accent px-6 font-display font-bold text-on-accent shadow-button";

/** Liga o sonho só quando a pessoa pede e mantém o motor fora do React. */
export function DreamMode() {
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const enterRef = useRef<HTMLButtonElement>(null);
  const exitRef = useRef<HTMLButtonElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const factoryRef = useRef<EngineFactory | null>(null);
  const mountedRef = useRef(true);
  const hasEnteredRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const leave = useCallback(() => {
    setActive(false);
    setAnnouncement("Modo sonho desligado.");
  }, []);

  const enter = useCallback(async () => {
    if (loading || active) return;

    setLoading(true);

    try {
      // O motor vira um trecho separado e só baixa quando alguém quer jogar.
      const dream = await import("../dream/engine");
      if (!mountedRef.current) return;

      factoryRef.current = dream.createDreamEngine;
      hasEnteredRef.current = true;
      setActive(true);
      setAnnouncement(
        "Modo sonho ligado. Setas para andar, espaço para pular, Esc para sair.",
      );
    } catch {
      if (mountedRef.current) {
        setAnnouncement("Não foi possível ligar o modo sonho.");
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [active, loading]);

  useEffect(() => {
    if (!active || !canvasRef.current || !factoryRef.current) return;

    const engine = factoryRef.current(canvasRef.current, { onExit: leave });
    engineRef.current = engine;
    engine.start();

    return () => {
      engine.stop();
      if (engineRef.current === engine) engineRef.current = null;
    };
  }, [active, leave]);

  useEffect(() => {
    if (active) {
      exitRef.current?.focus();
    } else if (hasEnteredRef.current) {
      enterRef.current?.focus();
    }
  }, [active]);

  return (
    <div className="my-10">
      {!active ? (
        <div className="rounded-card bg-surface p-6 shadow-soft md:p-8">
          <button
            ref={enterRef}
            type="button"
            onClick={enter}
            disabled={loading}
            className={`${primaryButton} disabled:opacity-60`}
          >
            {loading ? "Preparando o sonho…" : "Entrar no sonho"}
          </button>
          <p className="mt-4 max-w-2xl text-ink-soft">
            Use as setas ou WASD para andar, espaço para pular, seta para baixo
            para atravessar uma plataforma e Esc para sair.
          </p>
        </div>
      ) : (
        <>
          <canvas
            ref={canvasRef}
            aria-hidden="true"
            data-pequi-casa="sonho"
            className="pointer-events-none fixed inset-0 z-40 size-full"
          />

          <aside
            aria-label="Controles do modo sonho"
            className="fixed bottom-5 left-5 z-50 max-w-[calc(100vw-2.5rem)] rounded-card bg-surface p-4 text-ink shadow-soft"
          >
            <p className="mb-3 font-mono text-sm text-ink-soft">
              ← → ou A/D: andar · Espaço/W/↑: pular · S/↓: descer
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
        </>
      )}

      <p aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}
