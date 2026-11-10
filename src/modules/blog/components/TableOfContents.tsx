"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { TocCompanion } from "@/modules/pequi";

import type { PostHeading } from "../types";

/** Uma seção vira a atual quando o título dela passa deste ponto da tela. */
const ACTIVE_LINE = 0.25;
/** De quanto em quanto tempo a rolagem conta como "a pessoa ainda está aqui". */
const ACTIVITY_EVERY_MS = 1000;
/** O chão do Pequi fica um pouco acima da base do item, na linha do texto. */
const FEET_INSET = 6;

type TableOfContentsProps = {
  headings: PostHeading[];
  label?: string;
};

/** Qual título já passou da linha de leitura. No fim da página, o último. */
function findActive(headings: PostHeading[]) {
  const line = window.innerHeight * ACTIVE_LINE;
  let active = 0;

  headings.forEach((heading, index) => {
    const element = document.getElementById(heading.id);
    if (element && element.getBoundingClientRect().top <= line) active = index;
  });

  const { scrollHeight } = document.documentElement;
  if (window.innerHeight + window.scrollY >= scrollHeight - 4) active = headings.length - 1;

  return active;
}

/**
 * Índice lateral do post. Marca a seção que está na tela e leva o Pequi, que
 * mora na margem esquerda dele, até ela.
 */
export function TableOfContents({ headings, label = "Neste post" }: TableOfContentsProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [activity, setActivity] = useState(0);
  const [targetY, setTargetY] = useState<number | null>(null);

  // Seção atual e sinal de que alguém está rolando a página.
  useEffect(() => {
    let frame = 0;
    let lastActivity = 0;

    const update = () => {
      frame = 0;
      setActive(findActive(headings));
    };

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);

      const now = performance.now();
      if (now - lastActivity > ACTIVITY_EVERY_MS) {
        lastActivity = now;
        setActivity((count) => count + 1);
      }
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [headings]);

  // Onde fica o chão do item ativo. Muda também quando a fonte carrega e
  // quando o índice muda de largura e quebra linhas diferentes.
  const measure = useCallback(() => {
    const link = listRef.current?.querySelectorAll<HTMLElement>("a")[active];
    if (link) setTargetY(link.offsetTop + link.offsetHeight - FEET_INSET);
  }, [active]);

  useEffect(() => {
    measure();

    const list = listRef.current;
    if (!list) return;

    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, [measure]);

  if (headings.length === 0) return null;

  return (
    <nav aria-label={label}>
      <p className="pl-[5.5rem] font-mono text-xs font-bold tracking-widest text-ink-soft uppercase">
        {label}
      </p>

      {/* A margem da esquerda é o lugar do Pequi: nada de texto ali. */}
      <div ref={listRef} className="relative mt-3 pl-[4.75rem]">
        <ol className="grid gap-1">
          {headings.map((heading, index) => {
            const current = index === active;

            return (
              <li key={heading.id} className={heading.level > 2 ? "pl-3" : ""}>
                <a
                  href={`#${heading.id}`}
                  aria-current={current ? "location" : undefined}
                  className={`block rounded-xl px-3 py-1.5 text-[0.9375rem] leading-snug text-pretty tinge ${
                    current
                      ? "bg-ink/10 font-bold text-ink"
                      : "text-ink-soft hover:bg-ink/5 hover:text-ink"
                  }`}
                >
                  {heading.text}
                </a>
              </li>
            );
          })}
        </ol>

        <TocCompanion targetY={targetY} activity={activity} className="-left-1" />
      </div>
    </nav>
  );
}
