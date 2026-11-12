"use client";

import { useState } from "react";

import { isPequiMeme, type PequiMeme, pequiMemeNames, pequiMemes } from "@/modules/pequi";

import { Field, inputClass } from "./fields";

type ReactionFieldProps = {
  defaultPose: string;
  defaultCaption: string;
};

/**
 * A reação do Pequi no fim do post: uma das fotos do catálogo, ou nenhuma, com
 * uma legenda própria opcional. Mostra a foto escolhida e a legenda padrão.
 */
export function ReactionField({ defaultPose, defaultCaption }: ReactionFieldProps) {
  const [pose, setPose] = useState(defaultPose);
  const meme: PequiMeme | null = isPequiMeme(pose) ? pequiMemes[pose] : null;
  const standardCaption = meme ? [meme.top, meme.bottom].filter(Boolean).join(" / ") : "";

  return (
    <div className="grid gap-6 md:grid-cols-[10rem_minmax(0,1fr)]">
      <div className="aspect-square overflow-hidden rounded-2xl border border-dashed border-ink/25 bg-ink/5">
        {meme ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={meme.image} alt="" className="size-full object-cover" />
        ) : (
          <p className="grid size-full place-items-center p-3 text-center text-sm text-ink-soft">
            Sem reação
          </p>
        )}
      </div>

      <div className="grid content-start gap-5">
        <fieldset className="grid gap-2">
          <legend className="font-display font-bold">Pose</legend>
          <div className="flex flex-wrap gap-2">
            {[["", "Nenhuma"] as const, ...pequiMemeNames.map((name) => [name, pequiMemes[name].label] as const)].map(
              ([value, label]) => (
                <label
                  key={value || "nenhuma"}
                  className="tinge cursor-pointer rounded-full border border-ink/20 bg-surface px-4 py-2 has-checked:border-ink has-checked:bg-ink/10 has-checked:font-bold has-focus-visible:outline-3 has-focus-visible:outline-ink"
                >
                  <input
                    type="radio"
                    name="pequi_reacao"
                    value={value}
                    checked={pose === value}
                    onChange={() => setPose(value)}
                    className="sr-only"
                  />
                  {label}
                </label>
              ),
            )}
          </div>
        </fieldset>

        <Field
          label="Legenda própria (opcional)"
          hint={
            meme
              ? `Vazia, vale a da pose: “${standardCaption}”.`
              : "Escolha uma pose para a legenda aparecer."
          }
          htmlFor="pequi_legenda"
        >
          <input
            id="pequi_legenda"
            name="pequi_legenda"
            defaultValue={defaultCaption}
            disabled={!meme}
            aria-describedby="pequi_legenda-dica"
            className={`${inputClass} disabled:opacity-50`}
          />
        </Field>
      </div>
    </div>
  );
}
