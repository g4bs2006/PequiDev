"use client";

import { useActionState, useState } from "react";

import { StackChip } from "@/components/atoms/StackChip";

import { type FormState, salvarSobre } from "../actions";
import type { AboutRow } from "../data";
import { Field, FormMessage, inputClass, Section, SubmitButton } from "./fields";

/** Edita os textos e a ficha da seção sobre. */
export function AboutForm({ about }: { about: AboutRow }) {
  const [state, action] = useActionState<FormState, FormData>(salvarSobre, {});
  const [facts, setFacts] = useState(about.facts);
  const [technologies, setTechnologies] = useState(about.technologies.join(", "));

  const technologyList = technologies
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  function updateFact(index: number, change: Partial<AboutRow["facts"][number]>) {
    setFacts((list) => list.map((fact, itemIndex) => (itemIndex === index ? { ...fact, ...change } : fact)));
  }

  function moveFact(index: number, by: -1 | 1) {
    setFacts((list) => {
      const next = [...list];
      const [item] = next.splice(index, 1);
      next.splice(index + by, 0, item);
      return next;
    });
  }

  return (
    <form action={action} className="grid gap-8">
      <Section title="Apresentação">
        <Field label="Introdução" htmlFor="intro">
          <textarea
            id="intro"
            name="intro"
            rows={4}
            defaultValue={about.intro}
            className={inputClass}
          />
        </Field>

        <Field
          label="Trajetória"
          hint="Vazia, o bloco não aparece no site."
          htmlFor="trajetoria"
        >
          <textarea
            id="trajetoria"
            name="trajetoria"
            rows={6}
            defaultValue={about.trajectory}
            aria-describedby="trajetoria-dica"
            className={inputClass}
          />
        </Field>
      </Section>

      <Section title="Ficha">
        <input type="hidden" name="fatos" value={JSON.stringify(facts)} />

        {facts.length === 0 ? <p className="text-ink-soft">Nenhuma linha ainda.</p> : null}

        <ol className="grid gap-4">
          {facts.map((fact, index) => (
            <li
              key={index}
              className="grid gap-4 rounded-2xl border border-ink/15 bg-surface p-4"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-1 text-sm text-ink-soft">
                  Rótulo
                  <input
                    value={fact.label}
                    onChange={(event) => updateFact(index, { label: event.target.value })}
                    className={inputClass}
                  />
                </label>
                <label className="grid gap-1 text-sm text-ink-soft">
                  Valor
                  <input
                    value={fact.value}
                    onChange={(event) => updateFact(index, { value: event.target.value })}
                    className={inputClass}
                  />
                </label>
              </div>

              <div className="flex flex-wrap gap-2 text-sm">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => moveFact(index, -1)}
                  className="tinge cursor-pointer rounded-full bg-ink/5 px-3 py-1.5 hover:bg-ink/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Subir
                </button>
                <button
                  type="button"
                  disabled={index === facts.length - 1}
                  onClick={() => moveFact(index, 1)}
                  className="tinge cursor-pointer rounded-full bg-ink/5 px-3 py-1.5 hover:bg-ink/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Descer
                </button>
                <button
                  type="button"
                  onClick={() => setFacts((list) => list.filter((_, itemIndex) => itemIndex !== index))}
                  className="tinge cursor-pointer rounded-full px-3 py-1.5 text-danger hover:bg-danger/10"
                >
                  Tirar
                </button>
              </div>
            </li>
          ))}
        </ol>

        <div>
          <button
            type="button"
            onClick={() => setFacts((list) => [...list, { label: "", value: "" }])}
            className="aperta inline-flex h-11 cursor-pointer items-center rounded-full bg-surface px-5 font-display font-bold shadow-soft"
          >
            Adicionar linha
          </button>
        </div>
      </Section>

      <Section title="Tecnologias">
        <Field
          label="Lista"
          hint="Separe as tecnologias por vírgula, na ordem em que devem aparecer."
          htmlFor="tecnologias"
        >
          <input
            id="tecnologias"
            name="tecnologias"
            value={technologies}
            onChange={(event) => setTechnologies(event.target.value)}
            placeholder="TypeScript, Next.js, PostgreSQL"
            aria-describedby="tecnologias-dica"
            className={inputClass}
          />
        </Field>

        <div className="grid gap-2">
          <p className="font-display font-bold">Prévia</p>
          {technologyList.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {technologyList.map((technology, index) => (
                <li key={`${technology}-${index}`}>
                  <StackChip>{technology}</StackChip>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-soft">Nenhuma tecnologia.</p>
          )}
        </div>
      </Section>

      <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-4 rounded-card bg-surface p-4 shadow-soft">
        <SubmitButton pending="Salvando…">Salvar</SubmitButton>
        <a
          href="/#sobre"
          target="_blank"
          rel="noopener noreferrer"
          className="tinge font-medium underline decoration-accent decoration-2 underline-offset-4 hover:decoration-4"
        >
          Ver no site
        </a>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
