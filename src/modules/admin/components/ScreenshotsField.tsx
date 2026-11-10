"use client";

import { useState } from "react";

import type { ProjectScreenshotRow } from "../data";
import { uploadImage } from "../upload";
import { inputClass } from "./fields";

/**
 * As telas de um projeto: cada uma com imagem, texto alternativo e legenda, na
 * ordem em que aparecem na página. Vai para o formulário como JSON num campo
 * escondido (`screenshots`).
 */
export function ScreenshotsField({ defaultValue }: { defaultValue: ProjectScreenshotRow[] }) {
  const [shots, setShots] = useState(defaultValue);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function update(index: number, change: Partial<ProjectScreenshotRow>) {
    setShots((list) => list.map((shot, i) => (i === index ? { ...shot, ...change } : shot)));
  }

  function move(index: number, by: -1 | 1) {
    setShots((list) => {
      const next = [...list];
      const [item] = next.splice(index, 1);
      next.splice(index + by, 0, item);
      return next;
    });
  }

  async function addFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError("");
    try {
      for (const file of Array.from(files)) {
        const url = await uploadImage(file, "projetos");
        setShots((list) => [...list, { url, alt: "", caption: "" }]);
      }
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "O envio falhou.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-4">
      <input type="hidden" name="screenshots" value={JSON.stringify(shots)} />

      {shots.length === 0 ? <p className="text-ink-soft">Nenhuma tela ainda.</p> : null}

      <ol className="grid gap-4">
        {shots.map((shot, index) => (
          <li
            key={`${shot.url}-${index}`}
            className="grid gap-4 rounded-2xl border border-ink/15 bg-surface p-4 md:grid-cols-[10rem_minmax(0,1fr)]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shot.url} alt="" className="aspect-[16/10] w-full rounded-xl object-cover" />
            <div className="grid gap-3">
              <label className="grid gap-1 text-sm text-ink-soft">
                Texto alternativo
                <input
                  value={shot.alt}
                  onChange={(event) => update(index, { alt: event.target.value })}
                  className={inputClass}
                />
              </label>
              <label className="grid gap-1 text-sm text-ink-soft">
                Legenda
                <input
                  value={shot.caption}
                  onChange={(event) => update(index, { caption: event.target.value })}
                  className={inputClass}
                />
              </label>
              <div className="flex flex-wrap gap-2 text-sm">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  className="tinge cursor-pointer rounded-full bg-ink/5 px-3 py-1.5 hover:bg-ink/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Subir
                </button>
                <button
                  type="button"
                  disabled={index === shots.length - 1}
                  onClick={() => move(index, 1)}
                  className="tinge cursor-pointer rounded-full bg-ink/5 px-3 py-1.5 hover:bg-ink/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Descer
                </button>
                <button
                  type="button"
                  onClick={() => setShots((list) => list.filter((_, i) => i !== index))}
                  className="tinge cursor-pointer rounded-full px-3 py-1.5 text-danger hover:bg-danger/10"
                >
                  Tirar
                </button>
              </div>
            </div>
          </li>
        ))}
      </ol>

      <div>
        <label className="aperta inline-flex h-11 cursor-pointer items-center rounded-full bg-surface px-5 font-display font-bold shadow-soft has-focus-visible:outline-3 has-focus-visible:outline-ink">
          {busy ? "Enviando…" : "Adicionar telas"}
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/avif"
            disabled={busy}
            onChange={(event) => addFiles(event.target.files)}
            className="sr-only"
          />
        </label>
        {error ? (
          <p role="alert" className="mt-2 text-sm text-danger">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
