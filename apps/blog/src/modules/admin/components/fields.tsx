"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

import type { FormState } from "../actions";

/** Classe dos campos de texto do painel. */
export const inputClass =
  "w-full rounded-2xl border border-ink/20 bg-surface px-4 py-3 text-ink tinge placeholder:text-ink-soft/70 focus-visible:border-ink";

type FieldProps = {
  label: string;
  /** Explicação curta embaixo do rótulo. */
  hint?: string;
  htmlFor: string;
  children: ReactNode;
  className?: string;
};

/** Rótulo, dica e o campo, empilhados. */
export function Field({ label, hint, htmlFor, children, className = "" }: FieldProps) {
  return (
    <div className={`grid gap-2 ${className}`}>
      <label htmlFor={htmlFor} className="font-display font-bold">
        {label}
      </label>
      {hint ? (
        <p id={`${htmlFor}-dica`} className="-mt-1 text-sm text-ink-soft">
          {hint}
        </p>
      ) : null}
      {children}
    </div>
  );
}

/** Bloco de campos com título, como "Texto" ou "Imagens". */
export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="grid gap-6 rounded-card bg-surface/60 p-6 shadow-soft md:p-8">
      <legend className="sr-only">{title}</legend>
      <h2 aria-hidden="true" className="font-display text-2xl font-bold tracking-tight">
        {title}
      </h2>
      {children}
    </fieldset>
  );
}

/** Botão de enviar que avisa enquanto salva. */
export function SubmitButton({ children, pending }: { children: ReactNode; pending: string }) {
  const { pending: saving } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={saving}
      className="aperta inline-flex h-12 cursor-pointer items-center justify-center rounded-full bg-accent px-6 font-display font-bold text-on-accent shadow-button disabled:cursor-wait disabled:opacity-70"
    >
      {saving ? pending : children}
    </button>
  );
}

/** A resposta da última ação, lida também por leitor de tela. */
export function FormMessage({ state }: { state: FormState }) {
  return (
    <p role="status" aria-live="polite" className="min-h-6 font-medium">
      {state.erro ? <span className="text-danger">{state.erro}</span> : null}
      {state.ok ? <span className="text-tag">{state.ok}</span> : null}
    </p>
  );
}

/** Escolha entre rascunho e publicado. */
export function StatusField({ defaultValue }: { defaultValue: "draft" | "published" }) {
  return (
    <fieldset className="grid gap-2">
      <legend className="font-display font-bold">Situação</legend>
      <div className="flex flex-wrap gap-3">
        {(
          [
            ["draft", "Rascunho", "Só aparece aqui no painel."],
            ["published", "Publicado", "Vai para o site."],
          ] as const
        ).map(([value, label, hint]) => (
          <label
            key={value}
            className="tinge flex cursor-pointer items-start gap-3 rounded-2xl border border-ink/20 bg-surface px-4 py-3 has-checked:border-ink has-checked:bg-ink/5"
          >
            <input
              type="radio"
              name="status"
              value={value}
              defaultChecked={defaultValue === value}
              className="mt-1.5 accent-[var(--tinta)]"
            />
            <span>
              <span className="block font-bold">{label}</span>
              <span className="block text-sm text-ink-soft">{hint}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
