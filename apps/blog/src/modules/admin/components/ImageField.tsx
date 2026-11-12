"use client";

import { useId, useState } from "react";

import { uploadImage } from "../upload";
import { inputClass } from "./fields";

type ImageFieldProps = {
  /** Nome do campo com o endereço da imagem. */
  name: string;
  /** Nome do campo com o texto alternativo. */
  altName: string;
  label: string;
  defaultUrl: string;
  defaultAlt: string;
  /** Pasta no bucket: "posts", "projetos". */
  folder: string;
};

/**
 * Imagem com texto alternativo: envia um arquivo (convertido para WebP) ou
 * aceita um endereço colado. Mostra a prévia de como está.
 */
export function ImageField({ name, altName, label, defaultUrl, defaultAlt, folder }: ImageFieldProps) {
  const id = useId();
  const [url, setUrl] = useState(defaultUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      setUrl(await uploadImage(file, folder));
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "O envio falhou.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-[12rem_minmax(0,1fr)]">
      <div className="aspect-[16/10] overflow-hidden rounded-2xl border border-dashed border-ink/25 bg-ink/5">
        {url ? (
          // Prévia de uma imagem recém-enviada: o endereço muda a todo envio.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="size-full object-cover" />
        ) : (
          <p className="grid size-full place-items-center p-3 text-center text-sm text-ink-soft">
            Sem imagem
          </p>
        )}
      </div>

      <div className="grid content-start gap-3">
        <p className="font-display font-bold">{label}</p>
        <div className="flex flex-wrap items-center gap-3">
          <label className="aperta inline-flex h-11 cursor-pointer items-center rounded-full bg-surface px-5 font-display font-bold shadow-soft has-focus-visible:outline-3 has-focus-visible:outline-ink">
            {busy ? "Enviando…" : url ? "Trocar imagem" : "Enviar imagem"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              disabled={busy}
              onChange={(event) => onFile(event.target.files?.[0])}
              className="sr-only"
            />
          </label>
          {url ? (
            <button
              type="button"
              onClick={() => setUrl("")}
              className="tinge cursor-pointer rounded-full px-3 py-2 text-sm text-ink-soft underline-offset-4 hover:text-ink hover:underline"
            >
              Tirar a imagem
            </button>
          ) : null}
        </div>
        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}

        <label htmlFor={`${id}-url`} className="text-sm text-ink-soft">
          Ou cole o endereço
        </label>
        <input
          id={`${id}-url`}
          name={name}
          type="url"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://…"
          className={inputClass}
        />

        <label htmlFor={`${id}-alt`} className="text-sm text-ink-soft">
          Texto alternativo: descreva a imagem para quem não vê
        </label>
        <input
          id={`${id}-alt`}
          name={altName}
          defaultValue={defaultAlt}
          className={inputClass}
        />
      </div>
    </div>
  );
}
