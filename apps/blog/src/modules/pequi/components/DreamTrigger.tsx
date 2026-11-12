"use client";

import type { ReactNode } from "react";

import { avisar } from "@/lib/eventos";

type DreamTriggerProps = {
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
};

/** Pede o sonho sem precisar conhecer quem hospeda o motor. */
export function DreamTrigger({
  children,
  className,
  ariaLabel,
}: DreamTriggerProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className={className}
      onClick={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        avisar("sonho-entrar", {
          origem: {
            x: rect.left + rect.width / 2 + window.scrollX,
            y: rect.top + rect.height / 2 + window.scrollY,
          },
        });
      }}
    >
      {children}
    </button>
  );
}
