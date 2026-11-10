import Image from "next/image";

import { projectCopy } from "../content";
import type { ProjectScreenshot } from "../types";

const SHOT_SIZES = "(min-width: 1024px) 34vw, (min-width: 768px) 50vw, 100vw";

/** As telas do projeto, em grade. Cada uma abre a imagem inteira em outra aba. */
export function ScreenshotGallery({ screenshots }: { screenshots: ProjectScreenshot[] }) {
  if (screenshots.length === 0) return null;

  return (
    <section aria-labelledby="telas" className="mt-16 md:mt-24">
      <h2 id="telas" className="font-display text-3xl font-bold tracking-tight md:text-4xl">
        {projectCopy.screenshots}
      </h2>
      <p className="mt-2 text-ink-soft">{projectCopy.screenshotsNote}</p>

      <ul className="mt-8 grid gap-x-6 gap-y-10 md:grid-cols-2">
        {screenshots.map((shot) => (
          <li key={shot.url}>
            <figure>
              <a
                href={shot.url}
                target="_blank"
                rel="noopener noreferrer"
                className="relative block aspect-[16/10] overflow-hidden rounded-2xl bg-surface shadow-soft transition-transform duration-200 hover:-translate-y-1"
              >
                <Image
                  src={shot.url}
                  alt={shot.alt}
                  fill
                  sizes={SHOT_SIZES}
                  className="object-cover object-top"
                />
                <span className="sr-only">({projectCopy.openImage})</span>
              </a>
              {shot.caption ? (
                <figcaption className="mt-3 text-pretty text-ink-soft">{shot.caption}</figcaption>
              ) : null}
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}
