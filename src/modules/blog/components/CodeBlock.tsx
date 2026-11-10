"use client";

import { type ReactNode, useEffect, useState } from "react";

import { avisar } from "@/lib/eventos";

import { postCopy } from "../content";

type CodeBlockProps = {
  /** O código puro, para copiar. */
  code: string;
  /** Linguagem do bloco, se o post disse qual é. */
  language?: string;
  /** O <pre> já colorido pelo Shiki. */
  children: ReactNode;
};

/** Bloco de código do post: a linguagem no alto e um botão de copiar. */
export function CodeBlock({ code, language, children }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      avisar("codigo-copiado", { linguagem: language ?? null });
    } catch {
      // Sem permissão para a área de transferência: o botão só não confirma.
    }
  }

  return (
    <div className="code-block relative">
      <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
        {language && language !== "text" ? (
          <span className="font-mono text-xs text-[var(--code-dim)] select-none">{language}</span>
        ) : null}
        <button
          type="button"
          onClick={copy}
          className="tinge cursor-pointer rounded-full bg-[var(--code-ink)]/10 px-3 py-1 font-mono text-xs text-[var(--code-ink)] hover:bg-[var(--code-ink)]/20"
        >
          {copied ? postCopy.copied : postCopy.copy}
          <span className="sr-only" aria-live="polite">
            {copied ? ` ${postCopy.copiedAnnouncement}` : ""}
          </span>
        </button>
      </div>
      {children}
    </div>
  );
}
