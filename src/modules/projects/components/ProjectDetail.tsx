import Image from "next/image";
import Link from "next/link";

import { ButtonLink } from "@/components/atoms/ButtonLink";
import { GitHubIcon } from "@/components/atoms/icons";
import { StackChip } from "@/components/atoms/StackChip";
import { Markdown } from "@/components/molecules/Markdown";
import { site } from "@/lib/site";

import { projectCopy } from "../content";
import type { Project } from "../types";
import { ScreenshotGallery } from "./ScreenshotGallery";

const MEDIA_SIZES = "(min-width: 1024px) 60vw, 100vw";

/** Vídeo que o navegador toca direto. Qualquer outro endereço vira link. */
function isVideoFile(url: string) {
  return /\.(mp4|webm)(\?|#|$)/i.test(url);
}

function Label({ children }: { children: string }) {
  return (
    <h2 className="font-mono text-xs font-bold tracking-widest text-ink-soft uppercase">
      {children}
    </h2>
  );
}

/** A demo do projeto, apoiada numa faixa Céu: o vídeo, ou a capa se não houver. */
function ProjectMedia({ project }: { project: Project }) {
  const { cover, videoUrl } = project;
  const video = videoUrl && isVideoFile(videoUrl) ? videoUrl : null;

  if (!video && !cover) return null;

  return (
    <div className="mt-10 rounded-card bg-band p-3 sm:p-5 md:mt-12 md:p-8">
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-surface shadow-soft">
        {video ? (
          <video
            src={video}
            poster={cover?.url}
            controls
            preload="metadata"
            aria-label={`Demo em vídeo: ${project.name}`}
            className="absolute inset-0 size-full object-cover"
          />
        ) : cover ? (
          <Image
            src={cover.url}
            alt={cover.alt}
            fill
            preload
            sizes={MEDIA_SIZES}
            className="object-cover object-top"
          />
        ) : null}
      </div>
    </div>
  );
}

/** Ficha do projeto: stack, quem fez e os links. */
function ProjectFacts({ project }: { project: Project }) {
  const { stack, repoUrl, liveUrl, videoUrl } = project;
  const videoLink = videoUrl && !isVideoFile(videoUrl) ? videoUrl : null;
  const hasLinks = Boolean(repoUrl || liveUrl || videoLink);

  return (
    <aside className="grid content-start gap-7 rounded-card bg-surface p-7 shadow-soft xl:sticky xl:top-8">
      {stack.length > 0 ? (
        <div>
          <Label>{projectCopy.stack}</Label>
          <ul className="mt-3 flex flex-wrap gap-2 text-ink-soft">
            {stack.map((tech, index) => (
              <li key={`${tech}-${index}`}>
                <StackChip>{tech}</StackChip>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div>
        <Label>{projectCopy.author}</Label>
        <p className="mt-3 font-display text-xl font-bold">{site.author.name}</p>
        <a
          href={site.author.github}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex items-center gap-2 rounded-full font-medium underline decoration-accent decoration-2 underline-offset-4 hover:decoration-4"
        >
          <GitHubIcon className="text-lg" />
          GitHub
        </a>
      </div>

      {hasLinks ? (
        <div>
          <Label>{projectCopy.links}</Label>
          <div className="mt-3 flex flex-wrap gap-3">
            {liveUrl ? <ButtonLink href={liveUrl}>{projectCopy.live}</ButtonLink> : null}
            {repoUrl ? (
              <ButtonLink href={repoUrl} variant={liveUrl ? "soft" : "primary"}>
                {projectCopy.repo}
              </ButtonLink>
            ) : null}
            {videoLink ? (
              <ButtonLink href={videoLink} variant="soft">
                {projectCopy.video}
              </ButtonLink>
            ) : null}
          </div>
        </div>
      ) : null}
    </aside>
  );
}

function TextSection({ id, title, children }: { id: string; title: string; children: string }) {
  if (!children.trim()) return null;

  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="font-display text-3xl font-bold tracking-tight md:text-4xl">
        {title}
      </h2>
      <div className="mt-5">
        <Markdown>{children}</Markdown>
      </div>
    </section>
  );
}

/** Página de um projeto: abertura, demo, problema, resultado, como foi feito e telas. */
export function ProjectDetail({ project }: { project: Project }) {
  const { name, summary, category, problem, result, approach, screenshots } = project;

  return (
    <article>
      <header>
        <p className="font-mono text-[0.8125rem] font-bold tracking-wide uppercase">
          <Link
            href={category ? `/projetos#${category.slug}` : "/projetos"}
            className="rounded-full text-tag underline-offset-4 hover:underline"
          >
            {category ? category.name : projectCopy.back}
          </Link>
        </p>
        <h1 className="mt-3 font-display text-[clamp(2.75rem,8vw,5.5rem)] leading-[0.95] font-bold tracking-tighter text-balance">
          {name}
        </h1>
        <p className="mt-5 max-w-3xl text-xl text-pretty text-ink-soft md:text-2xl">{summary}</p>
      </header>

      <ProjectMedia project={project} />

      <div className="mt-12 grid gap-12 md:mt-16 xl:grid-cols-[minmax(0,1fr)_17rem] xl:gap-14">
        <div className="grid max-w-[44rem] content-start gap-14 xl:order-first">
          <TextSection id="problema" title={projectCopy.problem}>
            {problem}
          </TextSection>
          <TextSection id="resultado" title={projectCopy.result}>
            {result}
          </TextSection>
          <TextSection id="como-foi-construido" title={projectCopy.approach}>
            {approach}
          </TextSection>
        </div>
        <div className="-order-1 xl:order-last">
          <ProjectFacts project={project} />
        </div>
      </div>

      <ScreenshotGallery screenshots={screenshots} />
    </article>
  );
}
